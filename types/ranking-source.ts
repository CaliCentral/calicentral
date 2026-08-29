import type { ProvenanceSource } from "@/types/provenance";

export type RankingIntegrationMethod =
  | "manual"
  | "editorial"
  | "structured-import"
  | "authorized-api"
  | "licensed-feed";

export type RankingKind =
  | "ordinal-position"
  | "points"
  | "rating"
  | "season-standings"
  | "qualification-ranking"
  | "record-leaderboard"
  | "relative-strength";

export type RankingProvider = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly organizationId?: string;
  readonly website?: string;
  readonly description: string;
  readonly status: "active" | "inactive" | "under-review";
  readonly disciplines: readonly string[];
  readonly geographicScope: string;
  readonly integrationMethod: RankingIntegrationMethod;
  readonly attributionRequirement: string;
  readonly lastReviewedAt?: string;
};

export type AthleteRankingSnapshotEntry = {
  readonly canonicalId: string;
  readonly athleteId?: string;
  readonly athleteSlug?: string;
  readonly athleteName: string;
  readonly sourceDisplayName?: string;
  readonly position?: number;
  readonly points?: number;
  readonly rating?: number;
  readonly previousPosition?: number;
  readonly status: "ranked" | "provisional" | "inactive" | "unmatched";
};

export type AthleteRankingSnapshot = {
  readonly canonicalId: string;
  readonly provider: RankingProvider;
  readonly systemName: string;
  readonly systemSlug: string;
  readonly rankingKind: RankingKind;
  readonly discipline: string;
  readonly movement?: string;
  readonly category?: string;
  readonly division?: string;
  readonly weightClass?: string;
  readonly sexDivision?: string;
  readonly ageGroup?: string;
  readonly geographicScope: string;
  readonly season?: string;
  readonly methodologyVersion?: string;
  readonly rankingDate: string;
  readonly sourcePublishedAt?: string;
  readonly checkedAt: string;
  readonly entries: readonly AthleteRankingSnapshotEntry[];
  readonly provenance: ProvenanceSource;
};

export type ExternalAthleteIdentity = {
  readonly canonicalId: string;
  readonly providerId: string;
  readonly providerSlug: string;
  readonly providerName: string;
  readonly providerAthleteId: string;
  readonly providerAthleteUrl?: string;
  readonly providerDisplayName: string;
  readonly athleteId?: string;
  readonly athleteSlug?: string;
  readonly athleteName?: string;
  readonly matchingStatus:
    | "unmatched"
    | "candidate"
    | "confirmed"
    | "rejected"
    | "manually-linked"
    | "do-not-auto-match";
  readonly reviewStatus: "not-reviewed" | "in-review" | "reviewed";
};
