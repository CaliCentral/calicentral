import {
  applyMigrationPlan,
  countBy,
  emitReport,
  fetchExistingMembersByEmail,
  getArgument,
  isRecord,
  readJsonRecords,
  referenceId,
  slug,
  stableUuid,
  stringArray,
  text,
  type MigrationReport,
  type PlannedRow,
} from "./common";

type SanityDocument = Record<string, unknown> & { _id: string; _type: string };

const sourceUuid = (id: string) => stableUuid("calicentral:sanity", id.replace(/^drafts\./, ""));

// Populated once per run in main(), only for an actual --write attempt: maps
// a contributorProfile's canonical Sanity id to a real, already-existing
// member's actual id in the target, for every contributorProfile whose
// email matches a real member (see fetchExistingMembersByEmail in
// common.ts). Any *other* document's reference to that same contributor --
// a submission's submitter, an auditEvent's actor -- must resolve to that
// real id too, not the Sanity-derived id the (correctly never created)
// duplicate member row would otherwise have had. Checked universally inside
// refUuid() rather than only where a contributor reference is expected,
// since it can only ever match a contributorProfile id and is harmless for
// every other reference type.
const contributorIdRemap = new Map<string, string>();
const refUuid = (value: unknown) => {
  const id = referenceId(value);
  if (!id) return null;
  const canonicalId = id.replace(/^drafts\./, "");
  return contributorIdRemap.get(canonicalId) ?? sourceUuid(id);
};

// rankingSnapshot.source.provider, sportingResult.source.provider, and
// externalAthleteIdentity.provider are all references to a rankingProvider
// document (confirmed against the live schema and a real export), but their
// Supabase target columns are plain text -- resolved here to that
// provider's slug, populated once per run in main() before any document is
// transformed.
const providerLabelsById = new Map<string, string>();
const resolveProviderLabel = (value: unknown): string | null => {
  const refId = referenceId(value);
  return refId ? (providerLabelsById.get(refId) ?? null) : null;
};

function isDocument(value: unknown): value is SanityDocument {
  return isRecord(value) && Boolean(text(value._id)) && Boolean(text(value._type));
}

function base(document: SanityDocument) {
  return { legacy_sanity_id: document._id };
}

function editorialOperations(document: SanityDocument): PlannedRow[] {
  const contentId = sourceUuid(document._id);
  const contentType = document._type === "story" ? "story" : "video";
  const operations: PlannedRow[] = [{
    sourceKey: document._id,
    table: "editorial_content",
    onConflict: "legacy_sanity_id",
    row: {
      id: contentId,
      ...base(document),
      content_type: contentType,
      slug: slug(document.slug) ?? `migration-missing-${contentId}`,
      title: text(document.title) ?? "Untitled migrated content",
      excerpt: text(document.excerpt) ?? text(document.summary) ?? "",
      body: Array.isArray(document.body) ? document.body : [],
      author_id: refUuid(document.author),
      seo: isRecord(document.seo) ? document.seo : {},
      prototype_status: text(document.prototypeStatus),
      created_at: text(document._createdAt) ?? new Date(0).toISOString(),
    },
  }];

  if (contentType === "story") {
    operations.push({ sourceKey: document._id, table: "stories", row: {
      editorial_content_id: contentId,
      category: text(document.category), eyebrow: text(document.eyebrow),
      published_at: text(document.publishedAt), read_time_minutes: document.readTimeMinutes ?? null,
      location: text(document.location), featured: document.featured === true,
      issue_number: document.issueNumber ?? null,
      related_story_ids: Array.isArray(document.relatedStories) ? document.relatedStories.map(refUuid).filter(Boolean) : [],
    }});
  } else {
    const source = isRecord(document.sourceAttribution) ? document.sourceAttribution : {};
    operations.push({ sourceKey: document._id, table: "videos", row: {
      editorial_content_id: contentId, video_series_id: refUuid(document.series),
      ownership_status: text(document.ownershipStatus) ?? "source-unavailable",
      source_platform: text(source.platform) ?? text(document.platform),
      source_account: text(source.account), original_post_url: text(source.originalPostUrl) ?? text(document.sourceUrl),
      duration_seconds: document.durationSeconds ?? null,
      chapters: Array.isArray(document.chapters) ? document.chapters : [],
      credits: Array.isArray(document.credits) ? document.credits : [],
      platform_metrics: Array.isArray(document.platformMetrics) ? document.platformMetrics : [],
    }});
  }

  operations.push({ sourceKey: document._id, table: "editorial_publication_state", row: {
    id: stableUuid("calicentral:sanity-publication", document._id), editorial_content_id: contentId,
    state: document._id.startsWith("drafts.") ? "draft" : "published", is_current: true,
    changed_at: text(document._updatedAt) ?? new Date(0).toISOString(),
  }});
  return operations;
}

function normalizeDocument(document: SanityDocument, warnings: string[]): PlannedRow[] {
  // Every Sanity dataset carries its own platform-internal documents --
  // access-control groups, retention config -- with _type prefixed
  // "system." and _id prefixed "_." (e.g. "_.groups.administrator",
  // "_.retention._maximum_project"). These are Sanity Studio's own ACL/
  // config records, not authored application content, and were never part
  // of the 24-type content classification; a real dataset export surfaces
  // them where a synthetic fixture never would. They have no Supabase
  // analog and are OBSOLETE/INTENTIONALLY EXCLUDED, not a transformer gap.
  if (document._type.startsWith("system.") || document._id.startsWith("_.")) {
    warnings.push(`INTENTIONALLY EXCLUDED: Sanity platform-internal document ${document._type} (${document._id}); not authored application content.`);
    return [];
  }

  const id = sourceUuid(document._id);
  const op = (table: string, row: Record<string, unknown>, onConflict = "legacy_sanity_id"): PlannedRow[] =>
    [{ sourceKey: document._id, table, onConflict, row: { id, ...base(document), ...row } }];

  switch (document._type) {
    case "athlete": {
      // The live athlete-records schema (sanity/schemaTypes/objects/athlete-records.ts)
      // nests identity/editorial state under `verification`, stores the bio
      // under `shortBio`, and represents disciplines as `primaryDiscipline`
      // (single, required) + `secondaryDisciplines` (array) rather than a
      // flat `disciplines` array. A synthetic fixture never exercised these,
      // so a real export was required to catch it -- confirmed by reading
      // the schema directly rather than guessing from field names alone.
      const verification = isRecord(document.verification) ? document.verification : {};
      const identityState = text(verification.identityStatus) === "profile-control-confirmed" ? "identity-confirmed" : "unconfirmed";
      const editorialState = text(verification.profileStatus) === "approved" ? "approved" : "draft";
      const disciplines = [text(document.primaryDiscipline), ...stringArray(document.secondaryDisciplines)].filter((value): value is string => value !== null);
      return op("athletes", {
        permanent_id: text(document.permanentId) ?? `sanity:${document._id}`,
        slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed athlete",
        display_name: text(document.displayName), biography: text(document.shortBio) ?? "",
        country: text(document.country), administrative_area: text(document.administrativeArea), city: text(document.city),
        disciplines, specialties: stringArray(document.specialties),
        identity_state: identityState, editorial_state: editorialState,
      });
    }
    case "organization": return op("organizations", {
      slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed organization",
      organization_type: text(document.organizationType), website: text(document.website), country: text(document.country),
      description: text(document.description) ?? "", review_state: text(document.status) === "active" ? "approved" : "draft",
    });
    case "team": return op("teams", {
      organization_id: refUuid(document.organization), slug: slug(document.slug) ?? `migration-missing-${id}`,
      name: text(document.name) ?? "Unnamed team", short_name: text(document.shortName), country: text(document.country),
      city: text(document.city), branding: isRecord(document.branding) ? document.branding : {}, status: text(document.status) ?? "draft",
    });
    case "teamSeason": return op("team_seasons", {
      team_id: refUuid(document.team), season_label: text(document.seasonLabel) ?? "Unknown season",
      starts_on: text(document.startsOn), ends_on: text(document.endsOn), roster: Array.isArray(document.roster) ? document.roster : [],
    });
    case "ruleset": return op("rulesets", {
      organization_id: refUuid(document.organization), name: text(document.name) ?? "Unnamed ruleset",
      version: text(document.version) ?? "unknown", status: text(document.status) ?? "draft",
      effective_on: text(document.effectiveOn), rules: document,
    });
    case "competition": {
      const competitionRow = op("competitions", {
        permanent_id: text(document.permanentId) ?? `sanity:${document._id}`,
        organization_id: refUuid(document.organization), ruleset_id: refUuid(document.ruleset),
        slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed competition",
        short_name: text(document.shortName), status: text(document.status) ?? "unknown",
        start_date: text(document.startDate), end_date: text(document.endDate), country: text(document.country),
        administrative_area: text(document.administrativeArea) ?? text(document.state), city: text(document.city),
        venue_name: text(document.venueName), summary: text(document.summary) ?? "",
        disciplines: stringArray(document.disciplines), operations: document,
        public_state: text(document.publicStatus) === "published" ? "published" : "draft",
      });

      // The live competition schema (sanity/schemaTypes/objects/competition-records.ts)
      // embeds results directly as document.results[] -- there is no
      // separate sportingResult document per result in real data at all.
      // The sportingResult document-type case below exists for a shape that
      // may exist elsewhere or in the future, but as of this real export it
      // is entirely unused; embedded results are the actual real shape and
      // were previously not read at all (100% silent data loss, zero
      // warning, since the dry-run only ever iterated top-level documents).
      const embeddedResults = Array.isArray(document.results) ? document.results : [];
      if (!embeddedResults.length) return competitionRow;

      const resultsSourceId = stableUuid("calicentral:sanity-competition-results-source", document._id);
      const resultsSource: PlannedRow = { sourceKey: `${document._id}#results-source`, table: "source_records", row: {
        id: resultsSourceId, provider: text(document.organizerName) ?? "unknown", source_type: "competition-results",
        external_record_id: document._id.replace(/^drafts\./, ""),
        verification_state: text(document.resultsStatus) === "verified-results" ? "source-confirmed" : "unverified",
        // Every column on this row must be present even where not
        // meaningful here: a batched multi-row upsert against a
        // heterogeneous set of source_records rows (this one alongside a
        // rankingSnapshot/sportingResult-sourced one that does set these)
        // sends an explicit null for any column missing from a given row,
        // not that column's own default -- confirmed by a real write
        // failing on exactly this NOT NULL constraint.
        source_payload: {},
      }};

      // Sanity's competitionResult.verificationStatus (unverified/
      // source-reviewed/verified/disputed/sample -- see
      // resultVerificationStatusOptions in sanity/schemaTypes/constants.ts)
      // has no exact match in sporting_results.result_status. This mapping
      // is deliberately conservative: "sample" is explicitly documented as
      // "Fictional sample" and must never look more credible than a raw
      // unverified/imported result, and nothing here is promoted to
      // "official" -- that specifically claims the result came from an
      // official governing body, a claim this generic embedded-result path
      // has no basis to make.
      const resultStatusFor = (status: string | null): string => {
        switch (status) {
          case "source-reviewed": return "provisional";
          case "verified": return "source-confirmed";
          case "disputed": return "disputed";
          default: return "imported"; // unverified, sample, or unset
        }
      };

      const resultRows: PlannedRow[] = embeddedResults.filter(isRecord).flatMap((result, index): PlannedRow[] => {
        const athleteId = refUuid(result.athlete);
        if (!athleteId) {
          // No team concept exists for an embedded competition result --
          // only an athlete reference or a free-text displayName fallback.
          // A displayName-only result has no safe target: sporting_results
          // requires exactly one of athlete_id/team_id, and inventing or
          // matching an athlete from a display name would violate the
          // never-merge-by-name-alone rule. Excluded with a warning, not
          // silently dropped.
          warnings.push(`Competition result ${document._id}#${index} (${text(result.displayName) ?? "unnamed"}) has no athlete reference; unlinked results require manual identity resolution before import.`);
          return [];
        }
        const resultId = stableUuid("calicentral:sanity-embedded-result", `${document._id}:${index}`);
        return [
          { sourceKey: `${document._id}#result-${index}`, table: "sporting_results", onConflict: "legacy_sanity_id", row: {
            id: resultId, legacy_sanity_id: `${document._id}#result-${index}`,
            competition_id: id, athlete_id: athleteId, division: text(result.division) ?? text(result.category) ?? "unknown",
            event: text(result.movementNote) ?? text(result.resultLabel) ?? text(document.primaryDiscipline) ?? "unknown",
            placement: result.placement ?? null, result_status: resultStatusFor(text(result.verificationStatus)),
            source_record_id: resultsSourceId,
          }},
          { sourceKey: `${document._id}#result-${index}#performance`, table: "sporting_result_performances", row: {
            id: stableUuid("calicentral:sanity-embedded-result-performance", `${document._id}:${index}`),
            sporting_result_id: resultId, performance_order: 0,
            movement: text(result.movementNote) ?? text(result.resultLabel) ?? "result",
            status: text(result.verificationStatus), detail: result,
          }},
        ];
      });

      return [...competitionRow, resultsSource, ...resultRows];
    }
    case "rankingProvider": return op("ranking_providers", {
      organization_id: refUuid(document.organization), slug: slug(document.slug) ?? `migration-missing-${id}`,
      name: text(document.name) ?? "Unnamed provider", website: text(document.website), status: text(document.status) ?? "under-review",
      integration_method: text(document.integrationMethod) ?? "manual",
      attribution_requirement: text(document.attributionRequirement) ?? "Attribution required",
      source_policy_notes: text(document.sourcePolicyNotes) ?? "", last_reviewed_at: text(document.lastReviewedAt),
    });
    case "rankingSystem": return op("ranking_systems", {
      provider_id: refUuid(document.provider), slug: slug(document.slug) ?? `migration-missing-${id}`,
      name: text(document.name) ?? "Unnamed ranking system", ranking_kind: text(document.rankingKind) ?? "ordinal-position",
      discipline: text(document.discipline) ?? "unknown", movement: text(document.movement), category: text(document.category),
      division: text(document.division), weight_class: text(document.weightClass), sex_division: text(document.sexDivision),
      age_group: text(document.ageGroup), geographic_scope: text(document.geographicScope) ?? "unknown",
      methodology_version: text(document.methodologyVersion), methodology_notes: text(document.methodologyNotes) ?? "",
      status: text(document.status) ?? "draft",
    });
    case "rankingSnapshot": {
      const sourceId = stableUuid("calicentral:sanity-source", document._id);
      const source = isRecord(document.source) ? document.source : {};
      const snapshot: PlannedRow = { sourceKey: document._id, table: "ranking_snapshots", onConflict: "legacy_sanity_id", row: {
        id, ...base(document), ranking_system_id: refUuid(document.rankingSystem), ranking_date: text(document.rankingDate),
        source_published_at: text(document.sourcePublishedAt), checked_at: text(document.checkedAt) ?? new Date(0).toISOString(),
        season: text(document.season), methodology_version: text(document.methodologyVersion), source_record_id: sourceId,
        publication_status: text(document.publicationStatus) ?? "draft",
      }};
      const entries = Array.isArray(document.entries) ? document.entries : [];
      return [
        { sourceKey: document._id, table: "source_records", row: {
          id: sourceId, provider: resolveProviderLabel(source.provider) ?? text(source.provider) ?? "unknown", source_type: text(source.sourceType) ?? "ranking",
          public_url: text(source.url), title: text(source.title), external_record_id: text(source.externalRecordId) ?? document._id,
          publication_date: text(source.publicationDate), checked_at: text(source.checkedAt) ?? text(document.checkedAt),
          verification_state: text(source.verificationStatus) ?? "unverified", source_payload: source,
        }},
        snapshot,
        ...entries.filter(isRecord).map((entry, index): PlannedRow => ({ sourceKey: `${document._id}#entry-${index}`, table: "ranking_entries", row: {
          id: stableUuid("calicentral:sanity-ranking-entry", `${document._id}:${referenceId(entry.athlete) ?? index}`),
          ranking_snapshot_id: id, athlete_id: refUuid(entry.athlete), rank: entry.rank ?? entry.position ?? null,
          points: entry.points ?? null, rating: entry.rating ?? null, source_value: entry,
          entry_status: text(entry.status) ?? "ranked",
        }})),
      ];
    }
    case "rankingCategory": return op("ranking_categories", {
      slug: slug(document.slug) ?? `migration-missing-${id}`, title: text(document.title) ?? "Untitled standings",
      subtitle: text(document.subtitle), discipline: text(document.discipline) ?? "unknown", division: text(document.division),
      region: text(document.region), scope: text(document.scope) ?? "competition", status: text(document.status) ?? "draft",
      methodology_status: text(document.methodologyStatus) ?? "unapproved", season_label: text(document.seasonLabel),
      season_start: text(document.seasonStart), season_end: text(document.seasonEnd), description: text(document.description) ?? "",
      display_order: document.displayOrder ?? 0, entries: Array.isArray(document.entries) ? document.entries : [],
      methodology_note: text(document.methodologyNote) ?? "", prototype_status: text(document.prototypeStatus),
      seo: isRecord(document.seo) ? document.seo : {}, updated_at: text(document.updatedAt) ?? text(document._updatedAt) ?? new Date(0).toISOString(),
    });
    case "sportingResult": {
      const sourceId = stableUuid("calicentral:sanity-source", document._id);
      const source = isRecord(document.source) ? document.source : {};
      return [
        { sourceKey: document._id, table: "source_records", row: {
          id: sourceId, provider: resolveProviderLabel(source.provider) ?? text(source.provider) ?? "unknown", source_type: text(source.sourceType) ?? "sporting-result",
          public_url: text(source.url), title: text(source.title), external_record_id: text(source.externalRecordId) ?? document._id,
          publication_date: text(source.publicationDate), checked_at: text(source.checkedAt),
          verification_state: text(source.verificationStatus) ?? text(document.resultStatus) ?? "submitted", source_payload: source,
        }},
        { sourceKey: document._id, table: "sporting_results", onConflict: "legacy_sanity_id", row: {
          id, ...base(document), competition_id: refUuid(document.competition), athlete_id: refUuid(document.athlete),
          team_id: refUuid(document.team), ruleset_id: refUuid(document.ruleset), division: text(document.division) ?? "unknown",
          event: text(document.event) ?? "unknown", placement: document.placement ?? null, penalties: document.penalties ?? null,
          result_status: text(document.resultStatus) ?? "submitted", source_record_id: sourceId,
          supersedes_id: refUuid(document.supersedes), equipment_compliance: isRecord(document.equipmentCompliance) ? document.equipmentCompliance : null,
        }},
        ...(Array.isArray(document.performances) ? document.performances.filter(isRecord).map((performance, index): PlannedRow => ({
          sourceKey: `${document._id}#performance-${index}`, table: "sporting_result_performances", row: {
            id: stableUuid("calicentral:sanity-performance", `${document._id}:${index}`), sporting_result_id: id,
            performance_order: index, movement: text(performance.movement) ?? text(performance.label) ?? "unknown",
            value: performance.value ?? null, unit: text(performance.unit), status: text(performance.status), detail: performance,
          },
        })) : []),
      ];
    }
    case "externalAthleteIdentity": {
      // The live schema (external-athlete-identity.ts) has no externalId/
      // externalUrl/verificationStatus fields at all -- it's
      // providerAthleteId/providerAthleteUrl, plus two separate status
      // fields (matchingStatus: is this really the same athlete;
      // reviewStatus: has an editor looked at it). matchingStatus is the
      // closer semantic match for verification_state, which represents
      // confidence in the identity link itself, not editorial workflow
      // state.
      const matchingStatus = text(document.matchingStatus);
      const verificationState = matchingStatus === "confirmed" || matchingStatus === "manually-linked" ? "identity-confirmed"
        : matchingStatus === "rejected" || matchingStatus === "do-not-auto-match" ? "disputed"
        : "unverified";
      // Unlike every other table op() targets, external_athlete_identities
      // has no legacy_sanity_id column at all -- its real unique constraint
      // is (provider, external_id) -- so this is built directly rather than
      // through op(), which unconditionally spreads a legacy_sanity_id field
      // no matter the target table.
      return [{ sourceKey: document._id, table: "external_athlete_identities", onConflict: "provider,external_id", row: {
        id, athlete_id: refUuid(document.athlete), provider: resolveProviderLabel(document.provider) ?? text(document.provider) ?? "unknown",
        external_id: text(document.providerAthleteId) ?? document._id, external_url: text(document.providerAthleteUrl),
        verification_state: verificationState,
      }}];
    }
    case "externalCompetitionIdentity": return op("external_competition_identities", {
      competition_id: refUuid(document.competition), provider: resolveProviderLabel(document.provider) ?? text(document.provider) ?? "unknown",
      // Same providerXId/providerXUrl naming as externalAthleteIdentity's
      // live schema (external-competition-identity.ts), not externalId/
      // externalUrl. No real document of this type exists in this export to
      // verify against, but it's the same sibling schema pattern.
      external_id: text(document.providerCompetitionId) ?? document._id, external_url: text(document.providerCompetitionUrl),
    });
    case "contributorProfile": {
      const canonicalId = document._id.replace(/^drafts\./, "");
      if (contributorIdRemap.has(canonicalId)) {
        // A real member with this email already exists in the target --
        // most likely the project owner's own account, provisioned by an
        // actual Supabase Auth sign-in, not by this migration. That real
        // account is authoritative; creating a second, migration-derived
        // member row for the same email would either collide on the
        // email_normalized unique constraint (hard-failing the whole write)
        // or, had this check not existed, leave a dangling
        // profiles/member_roles row pointing at a member insert skipped
        // out from under it. Excluded, not merged into the existing row --
        // this migration tool has no safe way to decide which fields of an
        // already-live real account should be overwritten by Sanity data.
        // Any other document referencing this same contributor (a
        // submission's submitter, an auditEvent's actor) resolves through
        // refUuid() to the real member id via contributorIdRemap, not to
        // this skipped, never-created row.
        warnings.push(`Contributor profile ${document._id} matches an existing real member in the target by email; skipping member/profile/member_roles creation to avoid a duplicate account. The existing account is left untouched; other references to this contributor are remapped to the real account.`);
        return [];
      }
      const memberId = id;
      const email = text(document.normalizedEmail);
      return [
        { sourceKey: document._id, table: "members", row: {
          // The live schema's field is providerAccountId, not principalId.
          id: memberId, legacy_principal_id: text(document.providerAccountId) ?? document._id,
          email_normalized: email, access_status: text(document.accessStatus) ?? "pending",
          last_signed_in_at: text(document.lastSignedInAt),
        }},
        { sourceKey: document._id, table: "profiles", row: {
          // The live schema has a single combined `location` field, not
          // separate country/city -- stored under country as the closer of
          // the two available columns rather than dropped, since there's no
          // safe way to split free text into the two without guessing.
          member_id: memberId, display_name: text(document.displayName) ?? "Contributor",
          avatar_url: text(document.avatarUrl), biography: text(document.biography) ?? "",
          country: text(document.location) ?? text(document.country), city: text(document.city), interests: stringArray(document.areasOfInterest),
          profile_configured: true,
        }},
        { sourceKey: document._id, table: "member_roles", row: {
          member_id: memberId, role_name: text(document.role) ?? "contributor",
        }},
      ];
    }
    case "story": case "video": return editorialOperations(document);
    case "author": return op("authors", { member_id: null, name: text(document.name) ?? "Unknown author", slug: slug(document.slug), biography: text(document.shortBio) ?? "" });
    case "videoSeries": return op("video_series", { slug: slug(document.slug) ?? `migration-missing-${id}`, title: text(document.title) ?? "Untitled series", description: text(document.description) ?? "" });
    case "product": return op("products", { organization_id: refUuid(document.organization), slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed product", description: text(document.description) ?? "", affiliate_url: text(document.affiliateUrl), disclosure: text(document.disclosure), publication_state: text(document.publicationStatus) ?? "draft" });
    case "submission": {
      // The live schema's reference field is `submitter`, not `contributor`
      // (a real export was needed to catch this -- a synthetic fixture had
      // no reason to get the field name wrong). Falling back to a synthetic
      // "missing-contributor" identity would misattribute a real person's
      // submission, so an unresolved submitter is a warning, not a silent
      // default.
      const submitterId = referenceId(document.submitter);
      if (!submitterId) warnings.push(`Submission ${document._id} has no resolvable submitter reference; ownership defaulted to a synthetic identity.`);
      return op("submissions", {
        owner_member_id: sourceUuid(submitterId ?? "missing-contributor"), submission_type: text(document.submissionType) ?? "storyPitch",
        status: text(document.status) ?? "draft", payload: document, contributor_feedback: text(document.contributorVisibleFeedback) ?? "",
        private_editorial_notes: Array.isArray(document.privateEditorialNotes) ? document.privateEditorialNotes : [],
      });
    }
    case "auditEvent": {
      // `actor` is a reference to contributorProfile and `targetDocumentId`
      // holds the actual affected document's id -- the live schema has no
      // `actorPrincipalId`/`targetId` fields at all, so every real audit
      // event previously fell back to a generic "sanity:migration" actor
      // and the audit event's own id as its target, breaking the audit
      // trail's whole purpose (who did what, to what).
      const actorMemberId = refUuid(document.actor);
      // audit_events is append-only (a database trigger rejects any
      // update), confirmed by a real re-run failing with "audit events are
      // immutable" -- a repeat import must insert-or-skip already-migrated
      // rows, never attempt to update them.
      return [{ sourceKey: document._id, table: "audit_events", ignoreDuplicates: true, row: {
        id, event_type: text(document.eventType) ?? "legacySanityEvent",
        actor_member_id: actorMemberId, actor_principal: actorMemberId ? null : (text(document.actorRole) ?? "sanity:migration"),
        target_type: text(document.targetType) ?? "unknown", target_id: text(document.targetDocumentId) ?? document._id,
        summary: text(document.summary) ?? "Migrated Sanity audit event", metadata: document,
        created_at: text(document.createdAt) ?? text(document._createdAt) ?? new Date(0).toISOString(),
      }}];
    }
    case "siteSettings": return [{ sourceKey: document._id, table: "site_settings", onConflict: "id", row: { id: true, settings: document, updated_at: text(document._updatedAt) ?? new Date(0).toISOString() } }];
    // Both of these are Sanity-internal coordination mechanisms with no
    // content or historical value of their own, and both are already
    // superseded by a real Postgres equivalent in the target schema:
    // - contributorIdentityClaim existed only to guard against duplicate
    //   contributor provisioning, a job Postgres's UNIQUE constraint on
    //   members.auth_user_id plus the provision_auth_user() trigger already
    //   does atomically and natively.
    // - operationalLock existed only to serialize risky admin mutations in a
    //   document store with no real transactions; Postgres has real
    //   transactions and the public.operational_locks table (added in
    //   202608290002_editorial_and_sport.sql) already replaces it.
    // OBSOLETE/INTENTIONALLY EXCLUDED, not a migration gap -- see
    // docs/migration/repository-truth.md for the full classification.
    case "contributorIdentityClaim":
    case "operationalLock":
      warnings.push(`INTENTIONALLY EXCLUDED: Sanity type ${document._type} (${document._id}) has no Supabase migration target by design; it is a Sanity-only coordination mechanism already superseded by a native Postgres equivalent.`);
      return [];
    default:
      warnings.push(`No write transformer yet for Sanity type ${document._type} (${document._id}); retained in the dry-run inventory.`);
      return [];
  }
}

async function main() {
  const input = getArgument("input");
  if (!input) throw new Error("Usage: npm run migrate:sanity -- --input=/path/to/export.ndjson [--report=.tmp/sanity-report.json]");
  const values = await readJsonRecords(input);
  const documents = values.filter(isDocument);
  const warnings: string[] = [];
  const errors: string[] = [];
  const existingMembersByEmail = await fetchExistingMembersByEmail();
  if (documents.length !== values.length) errors.push(`${values.length - documents.length} input records were not valid Sanity documents.`);

  // Draft and published Sanity documents share one canonical id (the "drafts."
  // prefix is stripped when deriving stableUuid), so both would collide on the
  // target table's primary key. Every operation must be planned from exactly
  // one document per canonical id, preferring the published version -- an
  // unpublished draft edit must never silently overwrite live published
  // content, or vice versa via arbitrary NDJSON ordering.
  const resolvedByCanonicalId = new Map<string, SanityDocument>();
  for (const document of documents) {
    const canonical = document._id.replace(/^drafts\./, "");
    const isDraft = document._id.startsWith("drafts.");
    const existing = resolvedByCanonicalId.get(canonical);
    if (!existing) {
      resolvedByCanonicalId.set(canonical, document);
      continue;
    }
    const existingIsDraft = existing._id.startsWith("drafts.");
    const keptIsDraft = existingIsDraft && isDraft;
    const keepIncoming = existingIsDraft && !isDraft;
    warnings.push(
      `Draft/published collision for ${canonical}; keeping the ${keptIsDraft ? "draft" : "published"} version (${(keepIncoming ? document : existing)._id}) and discarding ${(keepIncoming ? existing : document)._id}.`,
    );
    if (keepIncoming) resolvedByCanonicalId.set(canonical, document);
  }
  const resolvedDocuments = [...resolvedByCanonicalId.values()];
  for (const document of resolvedDocuments) {
    if (document._type !== "rankingProvider") continue;
    const canonicalId = document._id.replace(/^drafts\./, "");
    providerLabelsById.set(canonicalId, slug(document.slug) ?? text(document.name) ?? "unknown");
  }
  for (const document of resolvedDocuments) {
    if (document._type !== "contributorProfile") continue;
    const email = text(document.normalizedEmail)?.toLowerCase();
    const realMemberId = email ? existingMembersByEmail.get(email) : undefined;
    if (realMemberId) contributorIdRemap.set(document._id.replace(/^drafts\./, ""), realMemberId);
  }
  const operations = resolvedDocuments.flatMap((document) => normalizeDocument(document, warnings));
  const report: MigrationReport = {
    source: "sanity", mode: process.argv.includes("--write") ? "local-write" : "dry-run",
    generatedAt: new Date().toISOString(), inputCounts: countBy(documents, (document) => document._type),
    outputCounts: countBy(operations, (operation) => operation.table), operations, warnings, errors,
  };
  await applyMigrationPlan(report);
  await emitReport(report);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Unknown migration error"}\n`); process.exitCode = 1; });
