import "server-only";

import {
  getFallbackAthletePage,
  getFallbackAthletes,
  getFallbackAthleteSlugs,
  getFallbackCompetitionPage,
  getFallbackCompetitions,
  getFallbackCompetitionSlugs,
  getFallbackHomepageContent,
  getFallbackOrganizationPage,
  getFallbackOrganizations,
  getFallbackOrganizationSlugs,
  getFallbackProductPage,
  getFallbackProducts,
  getFallbackProductSlugs,
  getFallbackRankingCategories,
  getFallbackSiteSettings,
  getFallbackStories,
  getFallbackStoryPage,
  getFallbackStorySlugs,
  getFallbackTeamPage,
  getFallbackTeams,
  getFallbackTeamSlugs,
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
  getSanityOrganizationPage,
  getSanityOrganizations,
  getSanityOrganizationSlugs,
  getSanityProductPage,
  getSanityProducts,
  getSanityProductSlugs,
  getSanityRankingCategories,
  getSanitySiteSettings,
  getSanityStories,
  getSanityStoryPage,
  getSanityStorySlugs,
  getSanityTeamPage,
  getSanityTeams,
  getSanityTeamSlugs,
  getSanityAthleteRankingSnapshots,
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
import type { Team } from "@/types/team";
import type { AthleteRankingSnapshot } from "@/types/ranking-source";
import type { Organization } from "@/types/organization";
import type { Product } from "@/types/product";
import { featureConfig } from "@/lib/features/config";

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

function visibleTeams(records: readonly Team[]): readonly Team[] {
  return records.filter(
    (team) => team.publicStatus !== "approved-prospective" || featureConfig.publicProspectiveTeams,
  );
}

export async function getTeams(
  options?: ContentFetchOptions,
): Promise<readonly Team[]> {
  const records = isSanityConfigured
    ? await getSanityTeams(options)
    : await getFallbackTeams();
  return visibleTeams(records);
}

export async function getTeamPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Team | null> {
  const record = isSanityConfigured
    ? await getSanityTeamPage(slug, options)
    : await getFallbackTeamPage(slug);
  return record && visibleTeams([record]).length ? record : null;
}

export async function getTeamSlugs(): Promise<readonly string[]> {
  const slugs = isSanityConfigured
    ? await getSanityTeamSlugs()
    : await getFallbackTeamSlugs();
  const records = await getTeams({publishedOnly: true, stega: false});
  const visible = new Set(records.map((team) => team.slug));
  return slugs.filter((slug) => visible.has(slug));
}

export async function getAthleteRankingSnapshots(
  options?: ContentFetchOptions,
): Promise<readonly AthleteRankingSnapshot[]> {
  if (!featureConfig.externalRankings || !isSanityConfigured) return [];
  return getSanityAthleteRankingSnapshots(options);
}

export async function getOrganizations(
  options?: ContentFetchOptions,
): Promise<readonly Organization[]> {
  return isSanityConfigured
    ? getSanityOrganizations(options)
    : getFallbackOrganizations();
}

export async function getOrganizationPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Organization | null> {
  return isSanityConfigured
    ? getSanityOrganizationPage(slug, options)
    : getFallbackOrganizationPage(slug);
}

export async function getOrganizationSlugs(): Promise<readonly string[]> {
  return isSanityConfigured
    ? getSanityOrganizationSlugs()
    : getFallbackOrganizationSlugs();
}

export async function getProducts(
  options?: ContentFetchOptions,
): Promise<readonly Product[]> {
  if (!featureConfig.shop) return [];
  return isSanityConfigured
    ? getSanityProducts(options)
    : getFallbackProducts();
}

export async function getProductPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Product | null> {
  if (!featureConfig.shop) return null;
  return isSanityConfigured
    ? getSanityProductPage(slug, options)
    : getFallbackProductPage(slug);
}

export async function getProductSlugs(): Promise<readonly string[]> {
  if (!featureConfig.shop) return [];
  return isSanityConfigured
    ? getSanityProductSlugs()
    : getFallbackProductSlugs();
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
