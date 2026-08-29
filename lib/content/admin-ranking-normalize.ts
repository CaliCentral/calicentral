import { stegaClean } from "next-sanity";

import type {
  AdminAthlete,
  AdminAthleteDetail,
  AdminAthleteDirectory,
  AdminAthleteRankingSnapshot,
  AdminExternalAthleteIdentity,
  AdminRankingOverview,
  AdminRankingProvider,
  AdminRankingSnapshotDirectory,
  AdminRankingSystem,
} from "@/types/admin-ranking";
import type { RankingIntegrationMethod, RankingKind } from "@/types/ranking-source";
import type {
  ProvenanceSourceType,
  ProvenanceVerificationStatus,
} from "@/types/provenance";

type JsonRecord = Record<string, unknown>;

const integrationMethods: readonly RankingIntegrationMethod[] = [
  "manual",
  "editorial",
  "structured-import",
  "authorized-api",
  "licensed-feed",
];
const rankingKinds: readonly RankingKind[] = [
  "ordinal-position",
  "points",
  "rating",
  "season-standings",
  "qualification-ranking",
  "record-leaderboard",
  "relative-strength",
];
const provenanceTypes: readonly ProvenanceSourceType[] = [
  "official-results-page",
  "organization-ranking-page",
  "official-result-sheet",
  "organizer-source",
  "athlete-submitted",
  "editor-confirmed",
  "other",
];
const verificationStatuses: readonly ProvenanceVerificationStatus[] = [
  "unverified",
  "submitted",
  "source-confirmed",
  "official",
  "disputed",
  "superseded",
];

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown): string {
  return typeof value === "string" ? stegaClean(value).trim() : "";
}

function optionalString(value: unknown): string | undefined {
  return string(value) || undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function nonnegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function exact<T extends string>(
  value: unknown,
  values: readonly T[],
): T | undefined {
  const candidate = string(value);
  return values.includes(candidate as T) ? (candidate as T) : undefined;
}

function safeUrl(value: unknown): string | undefined {
  try {
    const url = new URL(string(value));
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeAdminProvider(value: unknown): AdminRankingProvider | undefined {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const name = string(source.name);

  if (!canonicalId || !name) {
    return undefined;
  }

  return {
    canonicalId,
    slug: optionalString(source.slug),
    name,
    website: safeUrl(source.website),
    status: exact(
      source.status,
      ["active", "inactive", "under-review"] as const,
    ),
    disciplines: array(source.disciplines)
      .map((item) => string(item))
      .filter(Boolean),
    geographicScope: optionalString(source.geographicScope),
    integrationMethod: exact(source.integrationMethod, integrationMethods),
    attributionRequirement: optionalString(source.attributionRequirement),
    lastReviewedAt: optionalString(source.lastReviewedAt),
  };
}

function normalizeAdminSystem(value: unknown): AdminRankingSystem | undefined {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const name = string(source.name);

  if (!canonicalId || !name) {
    return undefined;
  }

  return {
    canonicalId,
    name,
    slug: optionalString(source.slug),
    status: exact(source.status, ["draft", "active", "inactive"] as const),
    rankingKind: exact(source.rankingKind, rankingKinds),
    discipline: optionalString(source.discipline),
    movement: optionalString(source.movement),
    category: optionalString(source.category),
    division: optionalString(source.division),
    weightClass: optionalString(source.weightClass),
    sexDivision: optionalString(source.sexDivision),
    ageGroup: optionalString(source.ageGroup),
    geographicScope: optionalString(source.geographicScope),
    methodologyVersion: optionalString(source.methodologyVersion),
    provider: normalizeAdminProvider(source.provider),
  };
}

export function normalizeAdminAthletes(value: unknown): AdminAthlete[] {
  return array(value).flatMap((item) => {
    const source = record(item);
    const canonicalId = string(source.canonicalId ?? source._id);
    const name = string(source.name);

    if (!canonicalId || !name) {
      return [];
    }

    const verification = record(source.verification);

    return [
      {
        canonicalId,
        slug: optionalString(source.slug),
        name,
        country: optionalString(source.country),
        prototypeStatus: optionalString(source.prototypeStatus),
        rankingEligible:
          typeof source.rankingEligible === "boolean"
            ? source.rankingEligible
            : undefined,
        externalIdentityCount: nonnegativeInteger(source.externalIdentityCount),
        rankingSnapshotCount: nonnegativeInteger(source.rankingSnapshotCount),
        verification: {
          identityStatus: exact(
            verification.identityStatus,
            ["unverified", "profile-control-confirmed"] as const,
          ),
          profileStatus: exact(
            verification.profileStatus,
            ["not-reviewed", "approved"] as const,
          ),
        },
      },
    ];
  });
}

export function normalizeAdminAthleteDirectory(
  value: unknown,
): AdminAthleteDirectory {
  const source = record(value);

  return {
    items: normalizeAdminAthletes(source.items),
    total: nonnegativeInteger(source.total),
    awaitingProfileReview: nonnegativeInteger(source.awaitingProfileReview),
    sampleRecords: nonnegativeInteger(source.sampleRecords),
    countries: array(source.countries)
      .map((item) => string(item))
      .filter(Boolean),
  };
}

export function normalizeAdminRankingProviders(
  value: unknown,
): AdminRankingProvider[] {
  return array(value).flatMap((item) => {
    const provider = normalizeAdminProvider(item);
    return provider ? [provider] : [];
  });
}

export function normalizeAdminRankingSystems(
  value: unknown,
): AdminRankingSystem[] {
  return array(value).flatMap((item) => {
    const system = normalizeAdminSystem(item);
    return system ? [system] : [];
  });
}

export function normalizeAdminAthleteRankingSnapshots(
  value: unknown,
): AdminAthleteRankingSnapshot[] {
  return array(value).flatMap((item) => {
    const source = record(item);
    const canonicalId = string(source.canonicalId ?? source._id);

    if (!canonicalId) {
      return [];
    }

    const provenance = record(source.provenance);
    const provenanceProvider = record(provenance.provider);
    const entries = array(source.entries).flatMap((entryValue) => {
      const entry = record(entryValue);
      const entryCanonicalId = string(entry.canonicalId ?? entry._key);

      if (!entryCanonicalId) {
        return [];
      }

      const athlete = record(entry.athlete);

      return [
        {
          canonicalId: entryCanonicalId,
          providerAthleteId: optionalString(entry.providerAthleteId),
          sourceDisplayName: optionalString(entry.sourceDisplayName),
          athleteId: optionalString(athlete.canonicalId ?? athlete._id),
          athleteSlug: optionalString(athlete.slug),
          athleteName: optionalString(athlete.name),
          position: finiteNumber(entry.position),
          points: finiteNumber(entry.points),
          rating: finiteNumber(entry.rating),
          previousPosition: finiteNumber(entry.previousPosition),
          status: exact(
            entry.status,
            ["ranked", "provisional", "inactive", "unmatched"] as const,
          ),
        },
      ];
    });

    return [
      {
        canonicalId,
        publicationStatus: exact(
          source.publicationStatus,
          ["draft", "published", "superseded", "archived"] as const,
        ),
        rankingDate: optionalString(source.rankingDate),
        sourcePublishedAt: optionalString(source.sourcePublishedAt),
        checkedAt: optionalString(source.checkedAt),
        season: optionalString(source.season),
        methodologyVersion: optionalString(source.methodologyVersion),
        entryCount:
          source.entryCount === undefined
            ? undefined
            : nonnegativeInteger(source.entryCount),
        system: normalizeAdminSystem(source.system),
        entries,
        provenance: {
          providerId: optionalString(
            provenanceProvider.canonicalId ?? provenanceProvider._id,
          ),
          providerName: optionalString(provenanceProvider.name),
          title: optionalString(provenance.title ?? provenance.sourceTitle),
          type: exact(
            provenance.type ?? provenance.sourceType,
            provenanceTypes,
          ),
          url: safeUrl(provenance.url),
          externalRecordId: optionalString(provenance.externalRecordId),
          publishedAt: optionalString(provenance.publishedAt),
          checkedAt: optionalString(provenance.checkedAt),
          verificationStatus: exact(
            provenance.verificationStatus,
            verificationStatuses,
          ),
        },
      },
    ];
  });
}

export function normalizeAdminRankingSnapshotDirectory(
  value: unknown,
): AdminRankingSnapshotDirectory {
  const source = record(value);
  return {
    items: normalizeAdminAthleteRankingSnapshots(source.items),
    total: nonnegativeInteger(source.total),
  };
}

export function normalizeAdminRankingOverview(
  value: unknown,
): AdminRankingOverview {
  const source = record(value);
  return {
    canonicalAthletes: nonnegativeInteger(source.canonicalAthletes),
    rankingLinkedAthletes: nonnegativeInteger(source.rankingLinkedAthletes),
    snapshots: nonnegativeInteger(source.snapshots),
    draftSnapshots: nonnegativeInteger(source.draftSnapshots),
    draftSystems: nonnegativeInteger(source.draftSystems),
    providersUnderReview: nonnegativeInteger(source.providersUnderReview),
    candidateIdentities: nonnegativeInteger(source.candidateIdentities),
  };
}

export function normalizeAdminExternalAthleteIdentities(
  value: unknown,
): AdminExternalAthleteIdentity[] {
  return array(value).flatMap((item) => {
    const source = record(item);
    const canonicalId = string(source.canonicalId ?? source._id);
    const providerAthleteId = string(source.providerAthleteId);
    const providerDisplayName = string(source.providerDisplayName);

    if (!canonicalId || !providerAthleteId || !providerDisplayName) {
      return [];
    }

    const athlete = record(source.athlete);

    return [
      {
        canonicalId,
        providerAthleteId,
        providerAthleteUrl: safeUrl(source.providerAthleteUrl),
        providerDisplayName,
        athleteId: optionalString(athlete.canonicalId ?? athlete._id),
        athleteSlug: optionalString(athlete.slug),
        athleteName: optionalString(athlete.name),
        provider: normalizeAdminProvider(source.provider),
        matchingStatus: exact(
          source.matchingStatus,
          [
            "unmatched",
            "candidate",
            "confirmed",
            "rejected",
            "manually-linked",
            "do-not-auto-match",
          ] as const,
        ),
        reviewStatus: exact(
          source.reviewStatus,
          ["not-reviewed", "in-review", "reviewed"] as const,
        ),
      },
    ];
  });
}


export function normalizeAdminAthleteDetail(value: unknown): AdminAthleteDetail {
  const source = record(value);
  return {
    athlete: normalizeAdminAthletes(
      source.athlete === null || source.athlete === undefined
        ? []
        : [source.athlete],
    )[0],
    identities: normalizeAdminExternalAthleteIdentities(source.identities),
    rankings: normalizeAdminAthleteRankingSnapshots(source.rankings),
  };
}
