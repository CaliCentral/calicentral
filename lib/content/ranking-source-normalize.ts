import {stegaClean} from "next-sanity";

import type {AthleteRankingSnapshot, ExternalAthleteIdentity, RankingIntegrationMethod, RankingKind, RankingProvider} from "@/types/ranking-source";
import type {ProvenanceSourceType, ProvenanceVerificationStatus} from "@/types/provenance";

type JsonRecord = Record<string, unknown>;
const methods: readonly RankingIntegrationMethod[] = ["manual", "editorial", "structured-import", "authorized-api", "licensed-feed"];
const kinds: readonly RankingKind[] = ["ordinal-position", "points", "rating", "season-standings", "qualification-ranking", "record-leaderboard", "relative-strength"];
const sourceTypes: readonly ProvenanceSourceType[] = ["official-results-page", "organization-ranking-page", "official-result-sheet", "organizer-source", "athlete-submitted", "editor-confirmed", "other"];
const verificationStatuses: readonly ProvenanceVerificationStatus[] = ["unverified", "submitted", "source-confirmed", "official", "disputed", "superseded"];

function record(value: unknown): JsonRecord {return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};}
function array(value: unknown): readonly unknown[] {return Array.isArray(value) ? value : [];}
function string(value: unknown, fallback = ""): string {const result = typeof value === "string" ? stegaClean(value).trim() : ""; return result || fallback;}
function optionalString(value: unknown): string | undefined {return string(value) || undefined;}
function number(value: unknown): number | undefined {return typeof value === "number" && Number.isFinite(value) ? value : undefined;}
function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {const candidate = string(value); return options.includes(candidate as T) ? candidate as T : fallback;}
function safeUrl(value: unknown): string | undefined {try {const url = new URL(string(value)); return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password ? url.toString() : undefined;} catch {return undefined;}}

function providerFrom(value: unknown): RankingProvider | null {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const slug = string(source.slug);
  const name = string(source.name);
  if (!canonicalId || !slug || !name) return null;
  return {
    canonicalId,
    slug,
    name,
    organizationId: optionalString(source.organizationId),
    website: safeUrl(source.website),
    description: string(source.description),
    status: oneOf(source.status, ["active", "inactive", "under-review"] as const, "under-review"),
    disciplines: array(source.disciplines).map((item) => string(item)).filter(Boolean),
    geographicScope: string(source.geographicScope),
    integrationMethod: oneOf(source.integrationMethod, methods, "manual"),
    attributionRequirement: string(source.attributionRequirement),
    lastReviewedAt: optionalString(source.lastReviewedAt),
  };
}

export function normalizeAthleteRankingSnapshots(value: unknown): AthleteRankingSnapshot[] {
  return array(value).flatMap((item) => {
    const source = record(item);
    const provider = providerFrom(source.provider);
    const provenance = record(source.provenance);
    const canonicalId = string(source.canonicalId ?? source._id);
    const systemName = string(source.systemName);
    const systemSlug = string(source.systemSlug);
    const rankingDate = string(source.rankingDate);
    const checkedAt = string(source.checkedAt ?? provenance.checkedAt);
    const sourceUrl = safeUrl(provenance.url);
    const verificationStatus = oneOf(provenance.verificationStatus, verificationStatuses, "unverified");
    if (!provider || provider.status !== "active" || !canonicalId || !systemName || !systemSlug || !rankingDate || !checkedAt || !sourceUrl || !["source-confirmed", "official"].includes(verificationStatus)) return [];
    const entries = array(source.entries).flatMap((entryValue) => {
      const entry = record(entryValue);
      const athlete = record(entry.athlete);
      const athleteId = string(athlete.canonicalId ?? athlete._id);
      const athleteName = string(athlete.name ?? entry.sourceDisplayName);
      if (!athleteName) return [];
      return [{
        canonicalId: string(entry.canonicalId ?? entry._key, `${canonicalId}:${athleteId || athleteName}`),
        athleteId: athleteId || undefined,
        athleteSlug: optionalString(athlete.slug),
        athleteName,
        sourceDisplayName: optionalString(entry.sourceDisplayName),
        position: number(entry.position),
        points: number(entry.points),
        rating: number(entry.rating),
        previousPosition: number(entry.previousPosition),
        status: oneOf(entry.status, ["ranked", "provisional", "inactive", "unmatched"] as const, "unmatched"),
      }];
    });
    return [{
      canonicalId,
      provider,
      systemName,
      systemSlug,
      rankingKind: oneOf(source.rankingKind, kinds, "ordinal-position"),
      discipline: string(source.discipline),
      movement: optionalString(source.movement),
      category: optionalString(source.category),
      division: optionalString(source.division),
      weightClass: optionalString(source.weightClass),
      sexDivision: optionalString(source.sexDivision),
      ageGroup: optionalString(source.ageGroup),
      geographicScope: string(source.geographicScope),
      season: optionalString(source.season),
      methodologyVersion: optionalString(source.methodologyVersion),
      rankingDate,
      sourcePublishedAt: optionalString(source.sourcePublishedAt),
      checkedAt,
      entries,
      provenance: {
        providerId: provider.canonicalId,
        providerName: provider.name,
        url: sourceUrl,
        title: string(provenance.title ?? provenance.sourceTitle, provider.name),
        type: oneOf(provenance.type ?? provenance.sourceType, sourceTypes, "organization-ranking-page"),
        externalRecordId: optionalString(provenance.externalRecordId),
        publishedAt: optionalString(provenance.publishedAt),
        checkedAt,
        verificationStatus,
      },
    }];
  });
}

export function normalizeExternalAthleteIdentities(
  value: unknown,
): ExternalAthleteIdentity[] {
  return array(value).flatMap((item) => {
    const source = record(item);
    const provider = providerFrom(source.provider);
    const athlete = record(source.athlete);
    const canonicalId = string(source.canonicalId ?? source._id);
    const providerAthleteId = string(source.providerAthleteId);
    const providerDisplayName = string(source.providerDisplayName);
    if (
      !provider ||
      !canonicalId ||
      !providerAthleteId ||
      !providerDisplayName
    ) {
      return [];
    }

    return [
      {
        canonicalId,
        providerId: provider.canonicalId,
        providerSlug: provider.slug,
        providerName: provider.name,
        providerAthleteId,
        providerAthleteUrl: safeUrl(source.providerAthleteUrl),
        providerDisplayName,
        athleteId: optionalString(athlete.canonicalId ?? athlete._id),
        athleteSlug: optionalString(athlete.slug),
        athleteName: optionalString(athlete.name),
        matchingStatus: oneOf(
          source.matchingStatus,
          [
            "unmatched",
            "candidate",
            "confirmed",
            "rejected",
            "manually-linked",
            "do-not-auto-match",
          ] as const,
          "unmatched",
        ),
        reviewStatus: oneOf(
          source.reviewStatus,
          ["not-reviewed", "in-review", "reviewed"] as const,
          "not-reviewed",
        ),
      },
    ];
  });
}
