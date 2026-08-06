import type { Article } from "@/types/article";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type {
  EditorialImage,
  FooterGroup,
  HeroContent,
  NavigationItem,
  SeoData,
  StoryPreview,
} from "@/types/content";
import type { RankingCategory } from "@/types/ranking";
import type { MediaFeature, VideoSeries } from "@/types/video";

export type ContentFetchOptions = {
  /**
   * Metadata and other non-visual consumers should disable stega encoding.
   * Draft perspective remains available unless `publishedOnly` is also set.
   */
  readonly stega?: boolean;
  /**
   * Static-parameter and other public discovery requests must never include
   * unpublished documents, even while the requesting browser is in Draft Mode.
   */
  readonly publishedOnly?: boolean;
};

export type SiteSettings = {
  readonly siteTitle: string;
  readonly shortTitle: string;
  readonly siteDescription: string;
  readonly prototypeNotice: string;
  readonly footerStatement: string;
  readonly navigation: readonly NavigationItem[];
  readonly footerGroups: readonly FooterGroup[];
  readonly defaultSeo: SeoData;
};

export type StoryContent = Article;

export type AthleteContent = Athlete;

export type CompetitionContent = Competition;

export type VideoContent = MediaFeature;

export type { EditorialImage };

export type HomepageContent = {
  readonly hero: HeroContent;
  readonly featuredStory: StoryPreview | null;
  readonly supportingStories: readonly StoryPreview[];
  readonly videos: readonly MediaFeature[];
  readonly competitions: readonly Competition[];
  readonly athlete: Athlete | null;
  readonly rankingCategory: RankingCategory | null;
};

export type StoryPageData = {
  readonly story: StoryContent;
  readonly relatedStories: readonly Article[];
  readonly relatedAthletes: readonly Athlete[];
  readonly relatedCompetitions: readonly Competition[];
  readonly relatedVideos: readonly MediaFeature[];
};

export type AthletePageData = {
  readonly athlete: AthleteContent;
  readonly relatedStories: readonly Article[];
  readonly relatedAthletes: readonly Athlete[];
  readonly relatedCompetitions: readonly Competition[];
  readonly relatedVideos: readonly MediaFeature[];
};

export type CompetitionPageData = {
  readonly competition: CompetitionContent;
  readonly relatedStories: readonly Article[];
  readonly relatedAthletes: readonly Athlete[];
  readonly relatedCompetitions: readonly Competition[];
  readonly relatedVideos: readonly MediaFeature[];
};

export type VideosPageData = {
  readonly videos: readonly MediaFeature[];
  readonly series: readonly VideoSeries[];
  readonly featuredVideo: MediaFeature | null;
};

export type VideoPageData = {
  readonly video: VideoContent;
  readonly relatedStories: readonly Article[];
  readonly relatedAthletes: readonly Athlete[];
  readonly relatedCompetitions: readonly Competition[];
  readonly relatedVideos: readonly MediaFeature[];
};
