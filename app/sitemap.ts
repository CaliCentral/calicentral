import type { MetadataRoute } from "next";

import {
  getAthletes,
  getCompetitions,
  getSiteSettings,
  getStories,
  getVideosPageData,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  absoluteSiteUrl,
  isPublicIndexingEnabled,
} from "@/lib/site/config";

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticEntries = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/stories", changeFrequency: "daily", priority: 0.9 },
  { path: "/athletes", changeFrequency: "weekly", priority: 0.8 },
  { path: "/rankings", changeFrequency: "weekly", priority: 0.8 },
  { path: "/competitions", changeFrequency: "daily", priority: 0.9 },
  { path: "/videos", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.2 },
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
    competitionEntries(),
    videoEntries(),
  ]);

  return uniqueEntries([
    ...staticEntries.map((entry) => ({
      url: absoluteSiteUrl(entry.path),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...dynamicEntries.flat(),
  ]);
}
