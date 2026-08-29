import type { EditorialImage, SeoData } from "@/types/content";

export type VideoCategory =
  | "Technique"
  | "Competition"
  | "Culture"
  | "Athlete Profile"
  | "Training"
  | "Interview"
  | "Competition Highlight"
  | "Documentary"
  | "Short Clip"
  | "Cali Central Original";

export type VideoFormat =
  | "Visual Study"
  | "Short Documentary"
  | "Field Report"
  | "Technique Breakdown"
  | "Event Preview"
  | "Interview/Profile Study"
  | "Editorial Breakdown";

export type VideoStatus =
  | "preview"
  | "archive-sample"
  | "published-prototype";

export type VideoSourcePlatform =
  | "Cali Central"
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "Facebook"
  | "X"
  | "Threads"
  | "Website";

export type VideoOwnershipStatus =
  | "cali-central-original"
  | "third-party-attributed"
  | "source-unavailable";

export type VideoOrigin =
  | "cali-central-original"
  | "community-submission"
  | "external-source";

export type VideoSourceAttribution = {
  readonly platform: VideoSourcePlatform;
  readonly account?: string;
  readonly originalPostUrl?: string;
  readonly ownershipStatus: VideoOwnershipStatus;
};

export type VideoPlatformMetric = {
  readonly platform: VideoSourcePlatform;
  readonly label: "Views" | "Plays" | "Engagement";
  readonly value: number;
  readonly observedAt?: string;
  readonly sourceUrl?: string;
};

export type VideoVisualVariant =
  | "handstand"
  | "static"
  | "motion"
  | "team"
  | "field"
  | "portrait"
  | "competition";

export type VideoSeriesSlug =
  | "frame-by-frame"
  | "competition-diary"
  | "local-motion"
  | "athlete-file"
  | "field-notes";

export type VideoSeries = {
  readonly slug: VideoSeriesSlug;
  readonly title: string;
  readonly description: string;
  readonly categoryEmphasis: string;
};

export type VideoChapter = {
  readonly timestamp: string;
  readonly timestampSeconds: number;
  readonly title: string;
  readonly description: string;
};

export type VideoTranscriptBlock = {
  readonly speaker: string;
  readonly timestamp?: string;
  readonly text: string;
};

export type VideoEditorialNote = {
  readonly heading: string;
  readonly text: string;
};

export type VideoCredit = {
  readonly role: string;
  readonly name: string;
  readonly status: string;
};

export type MediaFeature = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly episodeNumber: string;
  readonly seriesSlug: VideoSeriesSlug;
  readonly seriesTitle: string;
  readonly category: VideoCategory;
  readonly format: VideoFormat;
  readonly status: VideoStatus;
  readonly origin: VideoOrigin;
  readonly duration: string;
  readonly durationSeconds: number;
  readonly publishedDate: string;
  readonly publishedDateDisplay: string;
  readonly location: string;
  readonly summary: string;
  readonly description: readonly string[];
  readonly featured: boolean;
  readonly homepageFeatured: boolean;
  readonly visualVariant: VideoVisualVariant;
  readonly posterLabel: string;
  readonly frameCode: string;
  readonly chapters: readonly VideoChapter[];
  readonly transcript?: readonly VideoTranscriptBlock[];
  readonly editorialNotes?: readonly VideoEditorialNote[];
  readonly credits: readonly VideoCredit[];
  readonly relatedAthleteSlugs: readonly string[];
  readonly relatedCompetitionSlugs: readonly string[];
  readonly relatedStorySlugs: readonly string[];
  readonly relatedVideoSlugs: readonly string[];
  readonly tags: readonly string[];
  readonly availabilityLabel: string;
  readonly source?: VideoSourceAttribution;
  readonly platformMetrics?: readonly VideoPlatformMetric[];
  readonly discoverContext?: string;
  readonly image?: EditorialImage;
  readonly seo?: SeoData;
};
