import type {
  CompetitionContentStatus,
  CompetitionDiscipline,
  CompetitionStatus,
  OrganizerVerificationStatus,
} from "@/types/competition";
import type {
  ProvenanceSourceType,
  ProvenanceVerificationStatus,
} from "@/types/provenance";

export type AdminCompetitionPublicStatus = "draft" | "published" | "archived";

export type AdminCompetitionFilters = {
  readonly query?: string;
  readonly status?: CompetitionStatus;
  readonly publicStatus?: AdminCompetitionPublicStatus | "legacy-public";
  readonly verification?: ProvenanceVerificationStatus;
  readonly country?: string;
  readonly dateScope?: "upcoming" | "past";
  readonly recordKind?: "sample" | "real";
  readonly offset?: number;
  readonly limit?: number;
};

export type AdminCompetitionCounts = {
  readonly total: number;
  readonly samples: number;
  readonly real: number;
  readonly sourceConfirmed: number;
  readonly upcoming: number;
  readonly past: number;
};

export type AdminCompetitionSource = {
  readonly title?: string;
  readonly type?: ProvenanceSourceType;
  readonly url?: string;
  readonly externalRecordId?: string;
  readonly checkedAt?: string;
  readonly verificationStatus?: ProvenanceVerificationStatus;
  readonly provider?: {
    readonly canonicalId: string;
    readonly name: string;
    readonly status?: "active" | "inactive" | "under-review";
  };
};

export type AdminCompetitionSummary = {
  readonly canonicalId: string;
  readonly slug?: string;
  readonly name: string;
  readonly eventSeries?: string;
  readonly editorialPriority?:
    | "world-championship"
    | "continental-championship"
    | "national-championship"
    | "major-open"
    | "qualifier"
    | "major-event"
    | "standard";
  readonly featured?: boolean;
  readonly status?: CompetitionStatus;
  readonly publicStatus?: AdminCompetitionPublicStatus;
  readonly legacyPublic: boolean;
  readonly contentStatus?: CompetitionContentStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly city?: string;
  readonly administrativeArea?: string;
  readonly country?: string;
  readonly venueName?: string;
  readonly organizerName?: string;
  readonly organizerVerificationStatus?: OrganizerVerificationStatus;
  readonly disciplines: readonly CompetitionDiscipline[];
  readonly primaryDiscipline?: CompetitionDiscipline;
  readonly competitionFormat?: string;
  readonly externalProviderId?: string;
  readonly externalProviderUrl?: string;
  readonly organization?: {
    readonly canonicalId: string;
    readonly name: string;
  };
  readonly source?: AdminCompetitionSource;
  readonly updatedAt?: string;
};

export type AdminCompetitionList = {
  readonly counts: AdminCompetitionCounts;
  readonly total: number;
  readonly items: readonly AdminCompetitionSummary[];
};
