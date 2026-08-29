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
import { normalizeTeamPage, normalizeTeams } from "@/lib/content/team-normalize";
import { normalizeAthleteRankingSnapshots } from "@/lib/content/ranking-source-normalize";
import { normalizeAdminCompetitionList } from "@/lib/content/admin-competition-normalize";
import {
  normalizeAdminAthleteDetail,
  normalizeAdminAthleteDirectory,
  normalizeAdminAthleteRankingSnapshots,
  normalizeAdminAthletes,
  normalizeAdminExternalAthleteIdentities,
  normalizeAdminRankingOverview,
  normalizeAdminRankingProviders,
  normalizeAdminRankingSnapshotDirectory,
  normalizeAdminRankingSystems,
} from "@/lib/content/admin-ranking-normalize";
import {
  normalizeOrganizationPage,
  normalizeOrganizations,
  normalizeProductPage,
  normalizeProducts,
} from "@/lib/content/commerce-normalize";
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
  ADMIN_ATHLETE_DETAIL_QUERY,
  ADMIN_ATHLETE_DIRECTORY_QUERY,
  ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
  ADMIN_ATHLETES_QUERY,
  ADMIN_COMPETITIONS_QUERY,
  ADMIN_EXTERNAL_ATHLETE_IDENTITIES_QUERY,
  ADMIN_RANKING_OVERVIEW_QUERY,
  ADMIN_RANKING_PROVIDERS_QUERY,
  ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY,
  ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY,
  ADMIN_RANKING_SYSTEMS_QUERY,
  ATHLETE_PAGE_QUERY,
  PUBLIC_ATHLETE_PAGE_QUERY,
  ATHLETE_RANKING_SNAPSHOTS_QUERY,
  ATHLETE_SLUGS_QUERY,
  PUBLIC_ATHLETE_SLUGS_QUERY,
  ATHLETES_QUERY,
  PUBLIC_ATHLETES_QUERY,
  COMPETITION_PAGE_QUERY,
  COMPETITION_SLUGS_QUERY,
  COMPETITIONS_QUERY,
  HOMEPAGE_QUERY,
  ORGANIZATION_PAGE_QUERY,
  ORGANIZATION_SLUGS_QUERY,
  ORGANIZATIONS_QUERY,
  PRODUCT_PAGE_QUERY,
  PRODUCT_SLUGS_QUERY,
  PRODUCTS_QUERY,
  RANKING_CATEGORIES_QUERY,
  SITE_SETTINGS_QUERY,
  STORIES_QUERY,
  STORY_PAGE_QUERY,
  STORY_SLUGS_QUERY,
  TEAM_PAGE_QUERY,
  TEAM_SLUGS_QUERY,
  TEAMS_QUERY,
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
import type {
  AdminCompetitionFilters,
  AdminCompetitionList,
} from "@/types/admin-competition";
import type { RankingCategory } from "@/types/ranking";
import type { Team } from "@/types/team";
import type { AthleteRankingSnapshot } from "@/types/ranking-source";
import type { Organization } from "@/types/organization";
import type { Product } from "@/types/product";
import type {
  AdminAthlete,
  AdminAthleteDetail,
  AdminAthleteDirectory,
  AdminAthleteRankingSnapshot,
  AdminExternalAthleteIdentity,
  AdminRankingOverview,
  AdminRankingProvider,
  AdminRankingSnapshotDirectory,
  AdminRankingSystem,
} from "@/types/admin-ranking";

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
  const mode = await getSanityRequestMode(options?.publishedOnly);
  const query = mode.perspective === "published" ? PUBLIC_ATHLETES_QUERY : ATHLETES_QUERY;

  return normalizeAthletes(
    await fetchSanityQuery(query, undefined, options),
  );
}

export async function getSanityAthleteSlugs(): Promise<readonly string[]> {
  const mode = await getSanityRequestMode(true);
  const query = mode.perspective === "published" ? PUBLIC_ATHLETE_SLUGS_QUERY : ATHLETE_SLUGS_QUERY;

  return normalizeSlugs(
    await fetchSanityQuery(query, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityAthletePage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<AthletePageData | null> {
  const mode = await getSanityRequestMode(options?.publishedOnly);
  const query = mode.perspective === "published" ? PUBLIC_ATHLETE_PAGE_QUERY : ATHLETE_PAGE_QUERY;

  return normalizeAthletePage(
    await fetchSanityQuery(query, { slug }, options),
  );
}

export async function getSanityRankingCategories(): Promise<
  readonly RankingCategory[]
> {
  return normalizeRankingCategories(
    await fetchSanityQuery(RANKING_CATEGORIES_QUERY),
  );
}

export async function getSanityTeams(
  options?: ContentFetchOptions,
): Promise<readonly Team[]> {
  return normalizeTeams(await fetchSanityQuery(TEAMS_QUERY, undefined, options));
}

export async function getSanityTeamSlugs(): Promise<readonly string[]> {
  return normalizeSlugs(await fetchSanityQuery(TEAM_SLUGS_QUERY, undefined, {publishedOnly: true, stega: false}));
}

export async function getSanityTeamPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Team | null> {
  return normalizeTeamPage(await fetchSanityQuery(TEAM_PAGE_QUERY, {slug}, options));
}

export async function getSanityAthleteRankingSnapshots(
  options?: ContentFetchOptions,
): Promise<readonly AthleteRankingSnapshot[]> {
  return normalizeAthleteRankingSnapshots(
    await fetchSanityQuery(ATHLETE_RANKING_SNAPSHOTS_QUERY, undefined, options),
  );
}

export async function getSanityOrganizations(
  options?: ContentFetchOptions,
): Promise<readonly Organization[]> {
  return normalizeOrganizations(
    await fetchSanityQuery(ORGANIZATIONS_QUERY, undefined, options),
  );
}

export async function getSanityOrganizationSlugs(): Promise<readonly string[]> {
  return normalizeSlugs(
    await fetchSanityQuery(ORGANIZATION_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityOrganizationPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Organization | null> {
  return normalizeOrganizationPage(
    await fetchSanityQuery(ORGANIZATION_PAGE_QUERY, { slug }, options),
  );
}

export async function getSanityProducts(
  options?: ContentFetchOptions,
): Promise<readonly Product[]> {
  return normalizeProducts(
    await fetchSanityQuery(PRODUCTS_QUERY, undefined, options),
  );
}

export async function getSanityProductSlugs(): Promise<readonly string[]> {
  return normalizeSlugs(
    await fetchSanityQuery(PRODUCT_SLUGS_QUERY, undefined, {
      publishedOnly: true,
      stega: false,
    }),
  );
}

export async function getSanityProductPage(
  slug: string,
  options?: ContentFetchOptions,
): Promise<Product | null> {
  return normalizeProductPage(
    await fetchSanityQuery(PRODUCT_PAGE_QUERY, { slug }, options),
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

export async function getSanityAdminCompetitions(
  options: AdminCompetitionFilters = {},
): Promise<AdminCompetitionList> {
  const page = boundedPage(options.offset, options.limit);
  return normalizeAdminCompetitionList(
    await fetchSanityQuery(
      ADMIN_COMPETITIONS_QUERY,
      {
        q: matchPattern(options.query),
        status: options.status ?? "",
        publicStatus: options.publicStatus ?? "",
        verification: options.verification ?? "",
        country: options.country?.trim().slice(0, 120) ?? "",
        dateScope: options.dateScope ?? "",
        recordKind: options.recordKind ?? "",
        today: new Date().toISOString().slice(0, 10),
        ...page,
      },
      {},
    ),
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

// Admin-only internal data access (bypasses public visibility gates)

export async function getSanityAdminAthletes(): Promise<
  readonly AdminAthlete[]
> {
  return normalizeAdminAthletes(
    await fetchSanityQuery(ADMIN_ATHLETES_QUERY, undefined, {}),
  );
}

type AdminAthleteDirectoryOptions = {
  readonly query?: string;
  readonly profileStatus?: "not-reviewed" | "approved";
  readonly prototypeStatus?: "real" | "sample-record" | "fictional-prototype" | "not-official";
  readonly country?: string;
  readonly rankingStatus?: "all" | "linked" | "unlinked";
  readonly sourceStatus?: "all" | "linked" | "unlinked";
  readonly offset?: number;
  readonly limit?: number;
};

function boundedPage(
  offset: number | undefined,
  limit: number | undefined,
): { readonly offset: number; readonly end: number } {
  const safeOffset = Math.max(0, Math.floor(offset ?? 0));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit ?? 50)));
  return { offset: safeOffset, end: safeOffset + safeLimit };
}

function matchPattern(value: string | undefined): string {
  const query = value?.trim().slice(0, 120) ?? "";
  return query ? `*${query}*` : "";
}

export async function getSanityAdminAthleteDirectory(
  options: AdminAthleteDirectoryOptions = {},
): Promise<AdminAthleteDirectory> {
  const page = boundedPage(options.offset, options.limit);
  return normalizeAdminAthleteDirectory(
    await fetchSanityQuery(
      ADMIN_ATHLETE_DIRECTORY_QUERY,
      {
        q: matchPattern(options.query),
        profileStatus: options.profileStatus ?? "",
        prototypeStatus: options.prototypeStatus ?? "",
        country: options.country?.trim().slice(0, 120) ?? "",
        rankingStatus: options.rankingStatus ?? "all",
        sourceStatus: options.sourceStatus ?? "all",
        ...page,
      },
      {},
    ),
  );
}

export async function getSanityAdminAthleteDetail(
  id: string,
): Promise<AdminAthleteDetail> {
  return normalizeAdminAthleteDetail(
    await fetchSanityQuery(ADMIN_ATHLETE_DETAIL_QUERY, { id }, {}),
  );
}

export async function getSanityAdminRankingProviders(): Promise<
  readonly AdminRankingProvider[]
> {
  return normalizeAdminRankingProviders(
    await fetchSanityQuery(ADMIN_RANKING_PROVIDERS_QUERY, undefined, {}),
  );
}

export async function getSanityAdminRankingSystems(): Promise<
  readonly AdminRankingSystem[]
> {
  return normalizeAdminRankingSystems(
    await fetchSanityQuery(ADMIN_RANKING_SYSTEMS_QUERY, undefined, {}),
  );
}

export async function getSanityAdminAthleteRankingSnapshots(): Promise<
  readonly AdminAthleteRankingSnapshot[]
> {
  return normalizeAdminAthleteRankingSnapshots(
    await fetchSanityQuery(
      ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
      undefined,
      {},
    ),
  );
}

type AdminRankingSnapshotDirectoryOptions = {
  readonly query?: string;
  readonly status?: "draft" | "published" | "superseded" | "archived";
  readonly providerId?: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function getSanityAdminRankingOverview(): Promise<AdminRankingOverview> {
  return normalizeAdminRankingOverview(
    await fetchSanityQuery(ADMIN_RANKING_OVERVIEW_QUERY, undefined, {}),
  );
}

export async function getSanityAdminRankingSnapshotDirectory(
  options: AdminRankingSnapshotDirectoryOptions = {},
): Promise<AdminRankingSnapshotDirectory> {
  const page = boundedPage(options.offset, options.limit);
  return normalizeAdminRankingSnapshotDirectory(
    await fetchSanityQuery(
      ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY,
      {
        q: matchPattern(options.query),
        status: options.status ?? "",
        providerId: options.providerId?.trim().slice(0, 180) ?? "",
        ...page,
      },
      {},
    ),
  );
}

export async function getSanityAdminRankingSnapshot(
  id: string,
): Promise<AdminAthleteRankingSnapshot | null> {
  return (
    normalizeAdminAthleteRankingSnapshots([
      await fetchSanityQuery(
        ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY,
        { id },
        {},
      ),
    ])[0] ?? null
  );
}

export async function getSanityAdminExternalAthleteIdentities(): Promise<
  readonly AdminExternalAthleteIdentity[]
> {
  return normalizeAdminExternalAthleteIdentities(
    await fetchSanityQuery(
      ADMIN_EXTERNAL_ATHLETE_IDENTITIES_QUERY,
      undefined,
      {},
    ),
  );
}
