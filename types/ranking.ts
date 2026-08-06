import type { AthleteRankMovement } from "@/types/athlete";

export type RankingCategorySlug = string;

export type StandingPublicationStatus =
  | "draft"
  | "published"
  | "retired"
  | "prototype"
  | "unofficial";

export type StandingMethodologyStatus = "draft" | "approved";

export type StandingScope = "competition" | "country";

export type StandingResultSource = {
  readonly competitionSlug: string;
  readonly competitionName: string;
  readonly resultKey: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly verificationStatus: "verified";
};

export type RankingEntry = {
  readonly rank: number;
  readonly athleteSlug: string;
  readonly athleteName: string;
  readonly region: string;
  readonly points: number;
  readonly movement: AthleteRankMovement;
  readonly previousRank?: number;
  readonly statusLabel: string;
  readonly sources: readonly StandingResultSource[];
};

/**
 * The Sanity document keeps its historical `rankingCategory` type name for
 * dataset compatibility. Public interfaces treat it as a standings board and
 * publish it only after the methodology and every entry source pass review.
 */
export type RankingCategory = {
  readonly slug: RankingCategorySlug;
  readonly title: string;
  readonly subtitle: string;
  readonly discipline: string;
  readonly division: string;
  readonly region: string;
  readonly scope: StandingScope;
  readonly status: StandingPublicationStatus;
  readonly methodologyStatus: StandingMethodologyStatus;
  readonly seasonLabel: string;
  readonly seasonStart?: string;
  readonly seasonEnd?: string;
  readonly updatedLabel: string;
  readonly description: string;
  readonly disclaimer: string;
  readonly entries: readonly RankingEntry[];
};

export type AthleteRanking = {
  readonly category: RankingCategory;
  readonly entry: RankingEntry;
};
