import type {
  AthleteRanking,
  RankingCategory,
} from "@/types/ranking";

/**
 * Public fallback standings are intentionally empty. The previous California
 * point tables were presentation fixtures, not results-derived standings, and
 * must never be promoted as a worldwide competitive record.
 */
export const rankingCategories: readonly RankingCategory[] = [];

export function getRankingCategoryBySlug(_slug: string) {
  void _slug;
  return undefined;
}

export function getRankingsForAthlete(
  _athleteSlug: string,
): readonly AthleteRanking[] {
  void _athleteSlug;
  return [];
}

export function getPrimaryRankingForAthlete(
  _athleteSlug: string,
): AthleteRanking | undefined {
  void _athleteSlug;
  return undefined;
}
