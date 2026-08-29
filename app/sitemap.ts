import type { MetadataRoute } from "next";

import {
  getAthletes,
  getCompetitions,
  getOrganizations,
  getProducts,
  getSiteSettings,
  getStories,
  getTeams,
  getVideosPageData,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import { featureConfig } from "@/lib/features/config";
import {
  absoluteSiteUrl,
  isPublicIndexingEnabled,
} from "@/lib/site/config";

type SitemapEntry = MetadataRoute.Sitemap[number];

export const dynamic = "force-dynamic";

const staticEntries = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/stories", changeFrequency: "daily", priority: 0.9 },
  { path: "/athletes", changeFrequency: "weekly", priority: 0.8 },
  { path: "/teams", changeFrequency: "weekly", priority: 0.8 },
  { path: "/rankings", changeFrequency: "weekly", priority: 0.7 },
  { path: "/standings", changeFrequency: "weekly", priority: 0.8 },
  {
    path: "/standings/methodology",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  { path: "/competitions", changeFrequency: "daily", priority: 0.9 },
  {
    path: "/competitions/calendar",
    changeFrequency: "daily",
    priority: 0.7,
  },
  { path: "/videos", changeFrequency: "weekly", priority: 0.8 },
  { path: "/videos/archive", changeFrequency: "weekly", priority: 0.7 },
  { path: "/join", changeFrequency: "monthly", priority: 0.5 },
  { path: "/verification", changeFrequency: "monthly", priority: 0.4 },
  { path: "/corrections", changeFrequency: "monthly", priority: 0.4 },
  {
    path: "/editorial-standards",
    changeFrequency: "monthly",
    priority: 0.4,
  },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.2 },
  { path: "/community-guidelines", changeFrequency: "yearly", priority: 0.2 },
  { path: "/affiliate-disclosure", changeFrequency: "yearly", priority: 0.2 },
  { path: "/copyright", changeFrequency: "yearly", priority: 0.2 },
  { path: "/help", changeFrequency: "monthly", priority: 0.4 },
  { path: "/about", changeFrequency: "yearly", priority: 0.3 },
] as const;

function validDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function uniqueEntries(entries: readonly SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false;
    }

    seen.add(entry.url);
    return true;
  });
}

async function storyEntries(): Promise<SitemapEntry[]> {
  const stories = await getStories({
    publishedOnly: true,
    stega: false,
  });

  return stories.flatMap((story) => {
    if (!isPublicSlug(story.slug) || story.seo?.noIndex) {
      return [];
    }

    return [
      {
        url: absoluteSiteUrl(`/stories/${story.slug}`),
        lastModified: validDate(story.publicationDate),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
    ];
  });
}

async function athleteEntries(): Promise<SitemapEntry[]> {
  const athletes = await getAthletes({
    publishedOnly: true,
    stega: false,
  });

  return athletes.flatMap((athlete) => {
    if (!isPublicSlug(athlete.slug) || athlete.seo?.noIndex) {
      return [];
    }

    return [
      {
        url: absoluteSiteUrl(`/athletes/${athlete.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
    ];
  });
}

async function competitionEntries(): Promise<SitemapEntry[]> {
  const competitions = await getCompetitions({
    publishedOnly: true,
    stega: false,
  });

  return competitions.flatMap((competition) => {
    if (
      !isPublicSlug(competition.slug) ||
      competition.seo?.noIndex
    ) {
      return [];
    }

    return [
      {
        url: absoluteSiteUrl(`/competitions/${competition.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ];
  });
}

async function teamEntries(): Promise<SitemapEntry[]> {
  const teams = await getTeams({publishedOnly: true, stega: false});
  return teams.flatMap((team) =>
    isPublicSlug(team.slug) && !team.seo?.noIndex
      ? [{url: absoluteSiteUrl(`/teams/${team.slug}`), changeFrequency: "monthly" as const, priority: 0.6}]
      : [],
  );
}

async function videoEntries(): Promise<SitemapEntry[]> {
  const { videos } = await getVideosPageData({
    publishedOnly: true,
    stega: false,
  });

  return videos.flatMap((video) => {
    if (!isPublicSlug(video.slug) || video.seo?.noIndex) {
      return [];
    }

    return [
      {
        url: absoluteSiteUrl(`/videos/${video.slug}`),
        lastModified: validDate(video.publishedDate),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
    ];
  });
}

async function organizationEntries(): Promise<SitemapEntry[]> {
  const organizations = await getOrganizations({
    publishedOnly: true,
    stega: false,
  });

  return organizations.flatMap((organization) =>
    isPublicSlug(organization.slug) && !organization.seo?.noIndex
      ? [
          {
            url: absoluteSiteUrl(`/organizations/${organization.slug}`),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          },
        ]
      : [],
  );
}

async function productEntries(): Promise<SitemapEntry[]> {
  if (!featureConfig.shop) {
    return [];
  }

  const products = await getProducts({ publishedOnly: true, stega: false });

  return products.flatMap((product) =>
    isPublicSlug(product.slug) && !product.seo?.noIndex
      ? [
          {
            url: absoluteSiteUrl(`/shop/${product.slug}`),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          },
        ]
      : [],
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isPublicIndexingEnabled) {
    return [];
  }

  const settings = await getSiteSettings({
    publishedOnly: true,
    stega: false,
  });

  if (settings.defaultSeo.noIndex) {
    return [];
  }

  const dynamicEntries = await Promise.all([
    storyEntries(),
    athleteEntries(),
    teamEntries(),
    competitionEntries(),
    videoEntries(),
    organizationEntries(),
    productEntries(),
  ]);

  return uniqueEntries([
    ...[
      ...staticEntries,
      ...(featureConfig.community
        ? [
            { path: "/community", changeFrequency: "daily" as const, priority: 0.7 },
          ]
        : []),
      ...(featureConfig.shop
        ? [{ path: "/shop", changeFrequency: "weekly" as const, priority: 0.6 }]
        : []),
      ...(featureConfig.wcl
        ? [
            { path: "/wcl", changeFrequency: "weekly" as const, priority: 0.6 },
            { path: "/wcl/rules", changeFrequency: "monthly" as const, priority: 0.5 },
          ]
        : []),
    ].map((entry) => ({
      url: absoluteSiteUrl(entry.path),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...dynamicEntries.flat(),
  ]);
}
