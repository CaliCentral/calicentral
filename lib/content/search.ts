import "server-only";

import {
  getAthletes,
  getCompetitions,
  getStories,
  getVideosPageData,
} from "@/lib/content";
import type {
  PublicSearchCategory,
  PublicSearchFilter,
  PublicSearchResult,
} from "@/lib/search/contracts";
import {
  MIN_PUBLIC_SEARCH_QUERY_LENGTH,
  normalizePublicSearchQuery,
} from "@/lib/search/contracts";

const MAX_RESULTS_PER_CATEGORY = 12;

function searchableText(values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ").toLocaleLowerCase();
}

function matchesQuery(searchable: string, terms: readonly string[]): boolean {
  return terms.every((term) => searchable.includes(term));
}

function includeCategory(
  filter: PublicSearchFilter,
  category: PublicSearchCategory,
): boolean {
  return filter === "all" || filter === category;
}

export async function searchPublicContent(input: {
  readonly query: string;
  readonly filter: PublicSearchFilter;
}): Promise<readonly PublicSearchResult[]> {
  const query = normalizePublicSearchQuery(input.query).toLocaleLowerCase();

  if (query.length < MIN_PUBLIC_SEARCH_QUERY_LENGTH) {
    return [];
  }

  const terms = query.split(" ").filter(Boolean);
  const [stories, athletes, competitions, videoData] = await Promise.all([
    includeCategory(input.filter, "stories")
      ? getStories({ publishedOnly: true, stega: false })
      : Promise.resolve([]),
    includeCategory(input.filter, "athletes")
      ? getAthletes({ publishedOnly: true, stega: false })
      : Promise.resolve([]),
    includeCategory(input.filter, "competitions")
      ? getCompetitions({ publishedOnly: true, stega: false })
      : Promise.resolve([]),
    includeCategory(input.filter, "videos")
      ? getVideosPageData({ publishedOnly: true, stega: false })
      : Promise.resolve({ videos: [], series: [], featuredVideo: null }),
  ]);

  const storyResults = stories
    .filter(
      (story) =>
        !story.seo?.noIndex &&
        matchesQuery(
          searchableText([
            story.title,
            story.dek,
            story.category,
            story.author,
            story.location,
            ...story.tags,
          ]),
          terms,
        ),
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((story): PublicSearchResult => ({
      category: "stories",
      href: `/stories/${story.slug}`,
      title: story.title,
      description: story.dek,
      context: `${story.category} · ${story.displayDate}`,
    }));

  const athleteResults = athletes
    .filter(
      (athlete) =>
        !athlete.seo?.noIndex &&
        matchesQuery(
          searchableText([
            athlete.name,
            athlete.shortBio,
            athlete.city,
            athlete.state,
            athlete.administrativeArea,
            athlete.country,
            athlete.region,
            athlete.primaryCategory,
            ...athlete.disciplines,
            ...athlete.specialties,
          ]),
          terms,
        ),
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((athlete): PublicSearchResult => ({
      category: "athletes",
      href: `/athletes/${athlete.slug}`,
      title: athlete.name,
      description: athlete.shortBio,
      context: [
        athlete.city,
        athlete.administrativeArea || athlete.state,
        athlete.country,
      ]
        .filter(Boolean)
        .join(" · "),
    }));

  const competitionResults = competitions
    .filter(
      (competition) =>
        !competition.seo?.noIndex &&
        matchesQuery(
          searchableText([
            competition.name,
            competition.shortName,
            competition.summary,
            competition.city,
            competition.state,
            competition.administrativeArea,
            competition.country,
            competition.region,
            competition.organizerName,
            ...competition.disciplines,
          ]),
          terms,
        ),
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((competition): PublicSearchResult => ({
      category: "competitions",
      href: `/competitions/${competition.slug}`,
      title: competition.name,
      description: competition.summary,
      context: `${competition.dateDisplay} · ${[
        competition.city,
        competition.country,
      ]
        .filter(Boolean)
        .join(", ")}`,
    }));

  const videoResults = videoData.videos
    .filter(
      (video) =>
        !video.seo?.noIndex &&
        matchesQuery(
          searchableText([
            video.title,
            video.shortTitle,
            video.summary,
            video.seriesTitle,
            video.category,
            video.format,
            video.location,
            video.source?.platform,
            video.source?.account,
            video.discoverContext,
            ...video.tags,
          ]),
          terms,
        ),
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((video): PublicSearchResult => ({
      category: "videos",
      href: `/videos/${video.slug}`,
      title: video.title,
      description: video.summary,
      context: `${video.seriesTitle} · ${video.publishedDateDisplay}`,
    }));

  return [
    ...storyResults,
    ...athleteResults,
    ...competitionResults,
    ...videoResults,
  ];
}
