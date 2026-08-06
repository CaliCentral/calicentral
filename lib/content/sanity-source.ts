import "server-only";

import type { ClientReturn, QueryParams } from "next-sanity";

import {
  normalizeAthletePage,
  normalizeAthletes,
  normalizeCompetitionPage,
  normalizeCompetitions,
  normalizeHomepageContent,
  normalizeRankingCategories,
  normalizeSiteSettings,
  normalizeSlugs,
  normalizeStories,
  normalizeStoryPage,
  normalizeVideoPage,
  normalizeVideosPageData,
} from "@/lib/content/normalize";
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
import {
  ATHLETE_PAGE_QUERY,
  ATHLETE_SLUGS_QUERY,
  ATHLETES_QUERY,
  COMPETITION_PAGE_QUERY,
  COMPETITION_SLUGS_QUERY,
  COMPETITIONS_QUERY,
  HOMEPAGE_QUERY,
  RANKING_CATEGORIES_QUERY,
  SITE_SETTINGS_QUERY,
  STORIES_QUERY,
  STORY_PAGE_QUERY,
  STORY_SLUGS_QUERY,
  VIDEO_PAGE_QUERY,
  VIDEO_SLUGS_QUERY,
  VIDEOS_PAGE_QUERY,
} from "@/sanity/queries";
import {
  getSanityRequestMode,
  requireSanityFetch,
} from "@/sanity/lib/live";
import type { Article } from "@/types/article";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { RankingCategory } from "@/types/ranking";

async function fetchSanityQuery<const Query extends string>(
  query: Query,
  params?: QueryParams,
  options: ContentFetchOptions = {},
): Promise<ClientReturn<Query, unknown>> {
  const mode = await getSanityRequestMode(options.publishedOnly);
  const result = await requireSanityFetch()({
    query,
    ...(params ? { params } : {}),
    perspective: mode.perspective,
    stega: options.publishedOnly ? false : options.stega ?? mode.stega,
  });

  return result.data;
}

export async function getSanitySiteSettings(
  options?: ContentFetchOptions,
): Promise<SiteSettings> {
  return normalizeSiteSettings(
    await fetchSanityQuery(SITE_SETTINGS_QUERY, undefined, options),
  );
}

export async function getSanityHomepageContent(): Promise<HomepageContent> {
  return normalizeHomepageContent(await fetchSanityQuery(HOMEPAGE_QUERY));
}

export async function getSanityStories(
  options?: ContentFetchOptions,
): Promise<readonly Article[]> {
  return normalizeStories(
    await fetchSanityQuery(STORIES_QUERY, undefined, options),
  );
}

export async function getSanityStorySlugs(): Promise<readonly string[]> {
  return normalizeSlugs(
    await fetchSanityQuery(STORY_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityStoryPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<StoryPageData | null> {
  return normalizeStoryPage(
    await fetchSanityQuery(STORY_PAGE_QUERY, { slug }, options),
  );
}

export async function getSanityAthletes(
  options?: ContentFetchOptions,
): Promise<readonly Athlete[]> {
  return normalizeAthletes(
    await fetchSanityQuery(ATHLETES_QUERY, undefined, options),
  );
}

export async function getSanityAthleteSlugs(): Promise<readonly string[]> {
  return normalizeSlugs(
    await fetchSanityQuery(ATHLETE_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityAthletePage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<AthletePageData | null> {
  return normalizeAthletePage(
    await fetchSanityQuery(ATHLETE_PAGE_QUERY, { slug }, options),
  );
}

export async function getSanityRankingCategories(): Promise<
  readonly RankingCategory[]
> {
  return normalizeRankingCategories(
    await fetchSanityQuery(RANKING_CATEGORIES_QUERY),
  );
}

export async function getSanityCompetitions(
  options?: ContentFetchOptions,
): Promise<
  readonly Competition[]
> {
  return normalizeCompetitions(
    await fetchSanityQuery(COMPETITIONS_QUERY, undefined, options),
  );
}

export async function getSanityCompetitionSlugs(): Promise<
  readonly string[]
> {
  return normalizeSlugs(
    await fetchSanityQuery(COMPETITION_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityCompetitionPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<CompetitionPageData | null> {
  return normalizeCompetitionPage(
    await fetchSanityQuery(COMPETITION_PAGE_QUERY, { slug }, options),
  );
}

export async function getSanityVideosPageData(
  options?: ContentFetchOptions,
): Promise<VideosPageData> {
  return normalizeVideosPageData(
    await fetchSanityQuery(VIDEOS_PAGE_QUERY, undefined, options),
  );
}

export async function getSanityVideoSlugs(): Promise<readonly string[]> {
  return normalizeSlugs(
    await fetchSanityQuery(VIDEO_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityVideoPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<VideoPageData | null> {
  return normalizeVideoPage(
    await fetchSanityQuery(VIDEO_PAGE_QUERY, { slug }, options),
  );
}
