import type { AthleteRankMovement } from "@/types/athlete";

export type RankingCategorySlug =
  | "open-freestyle-california"
  | "static-strength-california"
  | "dynamic-freestyle-california"
  | "emerging-athletes-california";

export type RankingEntry = {
  readonly rank: number;
  readonly athleteSlug: string;
  readonly athleteName: string;
  readonly region: string;
  readonly points: number;
  readonly movement: AthleteRankMovement;
  readonly previousRank?: number;
  readonly statusLabel: string;
};

export type RankingCategory = {
  readonly slug: RankingCategorySlug;
  readonly title: string;
  readonly subtitle: string;
  readonly discipline: string;
  readonly division: string;
  readonly region: string;
  readonly status: "Prototype standings";
  readonly updatedLabel: string;
  readonly description: string;
  readonly disclaimer: string;
  readonly entries: readonly RankingEntry[];
};

export type AthleteRanking = {
  readonly category: RankingCategory;
  readonly entry: RankingEntry;
};
