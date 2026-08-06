import "server-only";

import {
  getFallbackAthletePage,
  getFallbackAthletes,
  getFallbackAthleteSlugs,
  getFallbackCompetitionPage,
  getFallbackCompetitions,
  getFallbackCompetitionSlugs,
  getFallbackHomepageContent,
  getFallbackRankingCategories,
  getFallbackSiteSettings,
  getFallbackStories,
  getFallbackStoryPage,
  getFallbackStorySlugs,
  getFallbackVideoPage,
  getFallbackVideosPageData,
  getFallbackVideoSlugs,
} from "@/lib/content/fallback";
import {
  getSanityAthletePage,
  getSanityAthletes,
  getSanityAthleteSlugs,
  getSanityCompetitionPage,
  getSanityCompetitions,
  getSanityCompetitionSlugs,
  getSanityHomepageContent,
  getSanityRankingCategories,
  getSanitySiteSettings,
  getSanityStories,
  getSanityStoryPage,
  getSanityStorySlugs,
  getSanityVideoPage,
  getSanityVideosPageData,
  getSanityVideoSlugs,
} from "@/lib/content/sanity-source";
import type {
  AthletePageData,
  CompetitionPageData,
  ContentFetchOptions,
  HomepageContent,
  SiteSettings,
  StoryPageData,
  VideoPageData,
  VideosPageData,
} from "@/lib/content/types";
import { isSanityConfigured } from "@/sanity/env";
import type { Article } from "@/types/article";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { RankingCategory } from "@/types/ranking";

export type {
  AthletePageData,
  CompetitionPageData,
  ContentFetchOptions,
  EditorialImage,
  HomepageContent,
  SiteSettings,
  StoryPageData,
  VideoPageData,
  VideosPageData,
} from "@/lib/content/types";

export async function getSiteSettings(
  options?: ContentFetchOptions,
): Promise<SiteSettings> {
  return isSanityConfigured
    ? getSanitySiteSettings(options)
    : getFallbackSiteSettings();
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return isSanityConfigured
    ? getSanityHomepageContent()
    : getFallbackHomepageContent();
}

export async function getStories(
  options?: ContentFetchOptions,
): Promise<readonly Article[]> {
  return isSanityConfigured
    ? getSanityStories(options)
    : getFallbackStories();
}

export async function getStoryPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<StoryPageData | null> {
  return isSanityConfigured
    ? getSanityStoryPage(slug, options)
    : getFallbackStoryPage(slug);
}

export async function getStorySlugs(): Promise<readonly string[]> {
  return isSanityConfigured
    ? getSanityStorySlugs()
    : getFallbackStorySlugs();
}

export async function getAthletes(
  options?: ContentFetchOptions,
): Promise<readonly Athlete[]> {
  return isSanityConfigured
    ? getSanityAthletes(options)
    : getFallbackAthletes();
}

export async function getAthletePage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<AthletePageData | null> {
  return isSanityConfigured
    ? getSanityAthletePage(slug, options)
    : getFallbackAthletePage(slug);
}

export async function getAthleteSlugs(): Promise<readonly string[]> {
  return isSanityConfigured
    ? getSanityAthleteSlugs()
    : getFallbackAthleteSlugs();
}

export async function getRankingCategories(): Promise<
  readonly RankingCategory[]
> {
  return isSanityConfigured
    ? getSanityRankingCategories()
    : getFallbackRankingCategories();
}

export async function getCompetitions(
  options?: ContentFetchOptions,
): Promise<readonly Competition[]> {
  return isSanityConfigured
    ? getSanityCompetitions(options)
    : getFallbackCompetitions();
}

export async function getCompetitionPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<CompetitionPageData | null> {
  return isSanityConfigured
    ? getSanityCompetitionPage(slug, options)
    : getFallbackCompetitionPage(slug);
}

export async function getCompetitionSlugs(): Promise<readonly string[]> {
  return isSanityConfigured
    ? getSanityCompetitionSlugs()
    : getFallbackCompetitionSlugs();
}

export async function getVideosPageData(
  options?: ContentFetchOptions,
): Promise<VideosPageData> {
  return isSanityConfigured
    ? getSanityVideosPageData(options)
    : getFallbackVideosPageData();
}

export async function getVideoPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<VideoPageData | null> {
  return isSanityConfigured
    ? getSanityVideoPage(slug, options)
    : getFallbackVideoPage(slug);
}

export async function getVideoSlugs(): Promise<readonly string[]> {
  return isSanityConfigured
    ? getSanityVideoSlugs()
    : getFallbackVideoSlugs();
}
