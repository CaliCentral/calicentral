import "server-only";

import {
  normalizeSupabaseAthlete,
  normalizeSupabaseCompetition,
  normalizeSupabaseCompetitionResult,
  normalizeSupabaseRankingSnapshot,
  type SupabaseAthleteRow,
  type SupabaseCompetitionRow,
} from "@/lib/content/supabase-normalize";
import type { AthletePageData, CompetitionPageData } from "@/lib/content/types";
import { SupabaseContentRepository } from "@/lib/supabase/repository";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { AthleteRankingSnapshot } from "@/types/ranking-source";

const repository = new SupabaseContentRepository();

export async function getSupabaseAthletes(): Promise<readonly Athlete[]> {
  const rows = await repository.listPublishedAthletes();
  return rows.map((row) => normalizeSupabaseAthlete(row as unknown as SupabaseAthleteRow));
}

export async function getSupabaseAthleteSlugs(): Promise<readonly string[]> {
  return repository.listPublishedAthleteSlugs();
}

export async function getSupabaseAthletePage(slug: string): Promise<AthletePageData | null> {
  const row = await repository.getPublishedAthleteBySlug(slug);
  if (!row) return null;
  return {
    athlete: normalizeSupabaseAthlete(row as unknown as SupabaseAthleteRow),
    // No Supabase-backed cross-reference (story/related-athlete/related-
    // competition linkage) exists yet -- an honest empty result, not a
    // fabricated one. See docs/data-provenance.md for the broader gap list.
    relatedStories: [],
    relatedAthletes: [],
    relatedCompetitions: [],
    relatedVideos: [],
  };
}

export async function getSupabaseCompetitions(): Promise<readonly Competition[]> {
  const rows = await repository.listPublishedCompetitions();
  return rows.map((row) => normalizeSupabaseCompetition(row as unknown as SupabaseCompetitionRow));
}

export async function getSupabaseCompetitionSlugs(): Promise<readonly string[]> {
  return repository.listPublishedCompetitionSlugs();
}

export async function getSupabaseCompetitionPage(slug: string): Promise<CompetitionPageData | null> {
  const row = await repository.getPublishedCompetitionBySlug(slug);
  if (!row) return null;
  const resultRows = await repository.listPublishedResultsForCompetition(row.id);
  const results = resultRows.map((resultRow) => normalizeSupabaseCompetitionResult(resultRow as unknown as Parameters<typeof normalizeSupabaseCompetitionResult>[0]));
  return {
    competition: normalizeSupabaseCompetition(row as unknown as SupabaseCompetitionRow, results),
    relatedStories: [],
    relatedAthletes: [],
    relatedCompetitions: [],
    relatedVideos: [],
  };
}

export async function getSupabaseAthleteRankingSnapshots(): Promise<readonly AthleteRankingSnapshot[]> {
  const rows = await repository.listPublishedRankingSnapshots();
  return rows.flatMap((row) => {
    const normalized = normalizeSupabaseRankingSnapshot(row as unknown as Parameters<typeof normalizeSupabaseRankingSnapshot>[0]);
    return normalized ? [normalized] : [];
  });
}
