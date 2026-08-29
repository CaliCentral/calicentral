import type {
  RankingIntegrationMethod,
  RankingKind,
} from "@/types/ranking-source";
import type {
  ProvenanceSourceType,
  ProvenanceVerificationStatus,
} from "@/types/provenance";

export type AdminAthlete = {
  readonly canonicalId: string;
  readonly slug?: string;
  readonly name: string;
  readonly country?: string;
  readonly prototypeStatus?: string;
  readonly rankingEligible?: boolean;
  readonly externalIdentityCount?: number;
  readonly rankingSnapshotCount?: number;
  readonly verification: {
    readonly identityStatus?: "unverified" | "profile-control-confirmed";
    readonly profileStatus?: "not-reviewed" | "approved";
  };
};

export type AdminAthleteDirectory = {
  readonly items: readonly AdminAthlete[];
  readonly total: number;
  readonly awaitingProfileReview: number;
  readonly sampleRecords: number;
  readonly countries: readonly string[];
};

export type AdminRankingProvider = {
  readonly canonicalId: string;
  readonly slug?: string;
  readonly name: string;
  readonly website?: string;
  readonly status?: "active" | "inactive" | "under-review";
  readonly disciplines: readonly string[];
  readonly geographicScope?: string;
  readonly integrationMethod?: RankingIntegrationMethod;
  readonly attributionRequirement?: string;
  readonly lastReviewedAt?: string;
};

export type AdminRankingSystem = {
  readonly canonicalId: string;
  readonly name: string;
  readonly slug?: string;
  readonly status?: "draft" | "active" | "inactive";
  readonly rankingKind?: RankingKind;
  readonly discipline?: string;
  readonly movement?: string;
  readonly category?: string;
  readonly division?: string;
  readonly weightClass?: string;
  readonly sexDivision?: string;
  readonly ageGroup?: string;
  readonly geographicScope?: string;
  readonly methodologyVersion?: string;
  readonly provider?: AdminRankingProvider;
};

export type AdminRankingSnapshotEntry = {
  readonly canonicalId: string;
  readonly providerAthleteId?: string;
  readonly sourceDisplayName?: string;
  readonly athleteId?: string;
  readonly athleteSlug?: string;
  readonly athleteName?: string;
  readonly position?: number;
  readonly points?: number;
  readonly rating?: number;
  readonly previousPosition?: number;
  readonly status?: "ranked" | "provisional" | "inactive" | "unmatched";
};

export type AdminRankingProvenance = {
  readonly providerId?: string;
  readonly providerName?: string;
  readonly title?: string;
  readonly type?: ProvenanceSourceType;
  readonly url?: string;
  readonly externalRecordId?: string;
  readonly publishedAt?: string;
  readonly checkedAt?: string;
  readonly verificationStatus?: ProvenanceVerificationStatus;
};

export type AdminAthleteRankingSnapshot = {
  readonly canonicalId: string;
  readonly publicationStatus?:
    | "draft"
    | "published"
    | "superseded"
    | "archived";
  readonly rankingDate?: string;
  readonly sourcePublishedAt?: string;
  readonly checkedAt?: string;
  readonly season?: string;
  readonly methodologyVersion?: string;
  readonly entryCount?: number;
  readonly system?: AdminRankingSystem;
  readonly entries: readonly AdminRankingSnapshotEntry[];
  readonly provenance: AdminRankingProvenance;
};

export type AdminRankingOverview = {
  readonly canonicalAthletes: number;
  readonly rankingLinkedAthletes: number;
  readonly snapshots: number;
  readonly draftSnapshots: number;
  readonly draftSystems: number;
  readonly providersUnderReview: number;
  readonly candidateIdentities: number;
};

export type AdminRankingSnapshotDirectory = {
  readonly items: readonly AdminAthleteRankingSnapshot[];
  readonly total: number;
};

export type AdminExternalAthleteIdentity = {
  readonly canonicalId: string;
  readonly providerAthleteId: string;
  readonly providerAthleteUrl?: string;
  readonly providerDisplayName: string;
  readonly athleteId?: string;
  readonly athleteSlug?: string;
  readonly athleteName?: string;
  readonly provider?: AdminRankingProvider;
  readonly matchingStatus?:
    | "unmatched"
    | "candidate"
    | "confirmed"
    | "rejected"
    | "manually-linked"
    | "do-not-auto-match";
  readonly reviewStatus?: "not-reviewed" | "in-review" | "reviewed";
};

export type AdminAthleteDetail = {
  readonly athlete?: AdminAthlete;
  readonly identities: readonly AdminExternalAthleteIdentity[];
  readonly rankings: readonly AdminAthleteRankingSnapshot[];
};
