import "server-only";

import {
  articles,
  featuredArticle,
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/articles";
import {
  athletes,
  getAthleteBySlug,
  getFeaturedAthlete,
  getRelatedAthletes,
} from "@/data/athletes";
import {
  competitions,
  getCompetitionBySlug,
  getCompetitionsForAthlete,
  getCompetitionsForStory,
  getRelatedCompetitions,
} from "@/data/competitions";
import {
  featuredStory,
  footerGroups,
  heroContent,
  navigationItems,
  supportingStories,
} from "@/data/homepage";
import { rankingCategories } from "@/data/rankings";
import {
  getFeaturedVideo,
  getHomepageVideos,
  getRelatedVideos,
  getVideoBySlug,
  getVideosForAthlete,
  getVideosForStory,
  videoSeries,
  videos,
} from "@/data/videos";
import type {
  AthletePageData,
  CompetitionPageData,
  HomepageContent,
  SiteSettings,
  StoryPageData,
  VideoPageData,
  VideosPageData,
} from "@/lib/content/types";
import type { Article } from "@/types/article";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { RankingCategory } from "@/types/ranking";
import type { StoryPreview } from "@/types/content";

// This is the sole temporary boundary around the local prototype records.
// Public routes select it only when Sanity project configuration is absent.

const defaultDescription =
  "Independent global calisthenics media covering athletes, competitions, stories, videos, and published results.";

function containsSlug(slugs: readonly string[], slug: string): boolean {
  return slugs.includes(slug);
}

function storyPreviewFromArticle(
  article: Article,
  selection: Pick<StoryPreview, "tone">,
): StoryPreview {
  return {
    id: article.slug,
    href: `/stories/${article.slug}`,
    category: article.category,
    title: article.title,
    summary: article.dek,
    publishedAt: article.publicationDate,
    publishedLabel: article.displayDate,
    readingTime: article.readTime,
    location: article.location,
    tone: selection.tone,
    image: article.image,
  };
}

export async function getFallbackSiteSettings(): Promise<SiteSettings> {
  return {
    siteTitle: "Cali Central | Independent Calisthenics Media",
    shortTitle: "Cali Central",
    siteDescription: defaultDescription,
    prototypeNotice: "Public prototype / Fictional sample content",
    footerStatement: "Built for the movement. Published with purpose.",
    navigation: navigationItems,
    footerGroups,
    defaultSeo: {
      title: "Cali Central | Independent Calisthenics Media",
      description: defaultDescription,
      noIndex: false,
    },
  };
}

export async function getFallbackHomepageContent(): Promise<HomepageContent> {
  const selectedFeaturedArticle =
    getArticleBySlug(featuredStory.id) ?? featuredArticle;
  const selectedSupportingStories = supportingStories.flatMap((selection) => {
    const article = getArticleBySlug(selection.id);

    return article ? [storyPreviewFromArticle(article, selection)] : [];
  });

  return {
    hero: heroContent,
    featuredStory: selectedFeaturedArticle
      ? storyPreviewFromArticle(selectedFeaturedArticle, featuredStory)
      : null,
    supportingStories: selectedSupportingStories,
    videos: getHomepageVideos(3),
    competitions: competitions
      .filter((competition) => competition.status === "upcoming")
      .slice()
      .sort((first, second) => first.startDate.localeCompare(second.startDate))
      .slice(0, 3),
    athlete: getFeaturedAthlete() ?? athletes[0] ?? null,
    rankingCategory: rankingCategories[0] ?? null,
  };
}

export async function getFallbackStories(): Promise<readonly Article[]> {
  return articles;
}

export async function getFallbackStorySlugs(): Promise<readonly string[]> {
  return articles.map((article) => article.slug);
}

export async function getFallbackStoryPage(
  slug: string,
): Promise<StoryPageData | null> {
  const story = getArticleBySlug(slug);

  if (!story) {
    return null;
  }

  return {
    story,
    relatedStories: getRelatedArticles(story.relatedSlugs)
      .filter((related) => related.slug !== story.slug)
      .slice(0, 3),
    relatedAthletes: athletes
      .filter((athlete) =>
        containsSlug(athlete.relatedStorySlugs, story.slug),
      )
      .slice(0, 3),
    relatedCompetitions: getCompetitionsForStory(story.slug).slice(0, 3),
    relatedVideos: getVideosForStory(story.slug).slice(0, 3),
  };
}

export async function getFallbackAthletes(): Promise<readonly Athlete[]> {
  return athletes;
}

export async function getFallbackAthleteSlugs(): Promise<readonly string[]> {
  return athletes.map((athlete) => athlete.slug);
}

export async function getFallbackAthletePage(
  slug: string,
): Promise<AthletePageData | null> {
  const athlete = getAthleteBySlug(slug);

  if (!athlete) {
    return null;
  }

  return {
    athlete,
    relatedStories: getRelatedArticles(athlete.relatedStorySlugs).slice(0, 3),
    relatedAthletes: getRelatedAthletes(athlete.relatedAthleteSlugs)
      .filter((related) => related.slug !== athlete.slug)
      .slice(0, 3),
    relatedCompetitions: getCompetitionsForAthlete(athlete.slug).slice(0, 3),
    relatedVideos: getVideosForAthlete(athlete.slug).slice(0, 3),
  };
}

export async function getFallbackRankingCategories(): Promise<
  readonly RankingCategory[]
> {
  return rankingCategories;
}

export async function getFallbackCompetitions(): Promise<
  readonly Competition[]
> {
  return competitions;
}

export async function getFallbackCompetitionSlugs(): Promise<
  readonly string[]
> {
  return competitions.map((competition) => competition.slug);
}

export async function getFallbackCompetitionPage(
  slug: string,
): Promise<CompetitionPageData | null> {
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    return null;
  }

  return {
    competition,
    relatedStories: getRelatedArticles(
      competition.relatedStorySlugs,
    ).slice(0, 3),
    relatedAthletes: getRelatedAthletes(
      competition.relatedAthleteSlugs,
    ).slice(0, 3),
    relatedCompetitions: getRelatedCompetitions(
      competition.relatedCompetitionSlugs,
    )
      .filter((related) => related.slug !== competition.slug)
      .slice(0, 3),
    relatedVideos: getRelatedVideos(competition.relatedVideoSlugs).slice(0, 3),
  };
}

export async function getFallbackVideosPageData(): Promise<VideosPageData> {
  return {
    videos,
    series: videoSeries,
    featuredVideo: getFeaturedVideo() ?? null,
  };
}

export async function getFallbackVideoSlugs(): Promise<readonly string[]> {
  return videos.map((video) => video.slug);
}

export async function getFallbackVideoPage(
  slug: string,
): Promise<VideoPageData | null> {
  const video = getVideoBySlug(slug);

  if (!video) {
    return null;
  }

  return {
    video,
    relatedStories: getRelatedArticles(video.relatedStorySlugs).slice(0, 3),
    relatedAthletes: getRelatedAthletes(video.relatedAthleteSlugs).slice(0, 3),
    relatedCompetitions: getRelatedCompetitions(
      video.relatedCompetitionSlugs,
    ).slice(0, 3),
    relatedVideos: getRelatedVideos(video.relatedVideoSlugs)
      .filter((related) => related.slug !== video.slug)
      .slice(0, 3),
  };
}
