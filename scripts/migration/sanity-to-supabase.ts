import {
  applyLocalPlan,
  countBy,
  emitReport,
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
const refUuid = (value: unknown) => {
  const id = referenceId(value);
  return id ? sourceUuid(id) : null;
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
  const id = sourceUuid(document._id);
  const op = (table: string, row: Record<string, unknown>, onConflict = "legacy_sanity_id"): PlannedRow[] =>
    [{ sourceKey: document._id, table, onConflict, row: { id, ...base(document), ...row } }];

  switch (document._type) {
    case "athlete": return op("athletes", {
      permanent_id: text(document.permanentId) ?? `sanity:${document._id}`,
      slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed athlete",
      display_name: text(document.displayName), biography: text(document.biography) ?? "",
      country: text(document.country), administrative_area: text(document.administrativeArea), city: text(document.city),
      disciplines: stringArray(document.disciplines), specialties: stringArray(document.specialties),
      identity_state: text(document.identityState) ?? "unconfirmed",
      editorial_state: text(document.publicStatus) === "published" ? "approved" : "draft",
    });
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
    case "competition": return op("competitions", {
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
          id: sourceId, provider: text(source.provider) ?? "unknown", source_type: text(source.sourceType) ?? "ranking",
          public_url: text(source.url), title: text(source.title), external_record_id: text(source.externalRecordId) ?? document._id,
          publication_date: text(source.publicationDate), checked_at: text(source.checkedAt) ?? text(document.checkedAt),
          verification_state: text(source.verificationStatus) ?? "source-confirmed", source_payload: source,
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
          id: sourceId, provider: text(source.provider) ?? "unknown", source_type: text(source.sourceType) ?? "sporting-result",
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
    case "externalAthleteIdentity": return op("external_athlete_identities", {
      athlete_id: refUuid(document.athlete), provider: text(document.provider) ?? "unknown",
      external_id: text(document.externalId) ?? document._id, external_url: text(document.externalUrl),
      verification_state: text(document.verificationStatus) ?? "unverified",
    });
    case "externalCompetitionIdentity": return op("external_competition_identities", {
      competition_id: refUuid(document.competition), provider: text(document.provider) ?? "unknown",
      external_id: text(document.externalId) ?? document._id, external_url: text(document.externalUrl),
    });
    case "contributorProfile": {
      const memberId = id;
      return [
        { sourceKey: document._id, table: "members", row: {
          id: memberId, legacy_principal_id: text(document.principalId) ?? document._id,
          email_normalized: text(document.normalizedEmail), access_status: text(document.accessStatus) ?? "pending",
          last_signed_in_at: text(document.lastSignedInAt),
        }},
        { sourceKey: document._id, table: "profiles", row: {
          member_id: memberId, display_name: text(document.displayName) ?? "Contributor",
          avatar_url: text(document.avatarUrl), biography: text(document.biography) ?? "",
          country: text(document.country), city: text(document.city), interests: stringArray(document.areasOfInterest),
          profile_configured: true,
        }},
        { sourceKey: document._id, table: "member_roles", row: {
          member_id: memberId, role_name: text(document.role) ?? "contributor",
        }},
      ];
    }
    case "story": case "video": return editorialOperations(document);
    case "author": return op("authors", { member_id: null, name: text(document.name) ?? "Unknown author", slug: slug(document.slug), biography: text(document.biography) ?? "" });
    case "videoSeries": return op("video_series", { slug: slug(document.slug) ?? `migration-missing-${id}`, title: text(document.title) ?? "Untitled series", description: text(document.description) ?? "" });
    case "product": return op("products", { organization_id: refUuid(document.organization), slug: slug(document.slug) ?? `migration-missing-${id}`, name: text(document.name) ?? "Unnamed product", description: text(document.description) ?? "", affiliate_url: text(document.affiliateUrl), disclosure: text(document.disclosure), publication_state: text(document.publicationStatus) ?? "draft" });
    case "submission": return op("submissions", { owner_member_id: sourceUuid(referenceId(document.contributor) ?? "missing-contributor"), submission_type: text(document.submissionType) ?? "storyPitch", status: text(document.status) ?? "draft", payload: document, contributor_feedback: text(document.contributorVisibleFeedback) ?? "", private_editorial_notes: Array.isArray(document.privateEditorialNotes) ? document.privateEditorialNotes : [] });
    case "auditEvent": return [{ sourceKey: document._id, table: "audit_events", row: {
      id, event_type: text(document.eventType) ?? "legacySanityEvent", actor_principal: text(document.actorPrincipalId) ?? "sanity:migration",
      target_type: text(document.targetType) ?? "unknown", target_id: text(document.targetId) ?? document._id,
      summary: text(document.summary) ?? "Migrated Sanity audit event", metadata: document,
      created_at: text(document.createdAt) ?? text(document._createdAt) ?? new Date(0).toISOString(),
    }}];
    case "siteSettings": return [{ sourceKey: document._id, table: "site_settings", onConflict: "id", row: { id: true, settings: document, updated_at: text(document._updatedAt) ?? new Date(0).toISOString() } }];
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
  if (documents.length !== values.length) errors.push(`${values.length - documents.length} input records were not valid Sanity documents.`);
  const ids = new Set<string>();
  for (const document of documents) {
    const canonical = document._id.replace(/^drafts\./, "");
    if (ids.has(canonical)) warnings.push(`Draft/published collision for ${canonical}; import order must prefer the intended publication record.`);
    ids.add(canonical);
  }
  const operations = documents.flatMap((document) => normalizeDocument(document, warnings));
  const report: MigrationReport = {
    source: "sanity", mode: process.argv.includes("--write") ? "local-write" : "dry-run",
    generatedAt: new Date().toISOString(), inputCounts: countBy(documents, (document) => document._type),
    outputCounts: countBy(operations, (operation) => operation.table), operations, warnings, errors,
  };
  await applyLocalPlan(report);
  await emitReport(report);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Unknown migration error"}\n`); process.exitCode = 1; });
