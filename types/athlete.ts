import type { EditorialImage, SeoData } from "@/types/content";

export type AthleteDiscipline =
  | "Freestyle"
  | "Static strength"
  | "Dynamic freestyle"
  | "Endurance"
  | "Strength"
  | "Hand balancing";

export type AthleteVisualVariant = "signal" | "frame" | "motion";

export type AthleteRankMovement = {
  readonly direction: "up" | "down" | "hold" | "new";
  readonly amount: number;
  readonly label: string;
};

export type AthleteStatistic = {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly emphasis?: boolean;
};

export type AthleteAchievement = {
  readonly year: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
};

export type AthleteTimelineEntry = {
  readonly dateLabel: string;
  readonly title: string;
  readonly description: string;
  readonly type: string;
};

export type Athlete = {
  readonly slug: string;
  readonly name: string;
  readonly initials: string;
  readonly profileNumber: string;
  readonly status: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly region: string;
  readonly disciplines: readonly AthleteDiscipline[];
  readonly primaryDiscipline: AthleteDiscipline;
  readonly secondaryDiscipline?: AthleteDiscipline;
  readonly profileLabel: string;
  readonly shortBio: string;
  readonly fullBio: readonly string[];
  readonly quote: string;
  readonly trainingBase: string;
  readonly yearsActive: string;
  readonly style: string;
  readonly featured: boolean;
  readonly rankingEligible: boolean;
  readonly ranking?: {
    readonly categorySlug: string;
    readonly categoryTitle: string;
    readonly rank: number;
    readonly points: number;
    readonly movement: AthleteRankMovement;
  };
  readonly statistics: readonly AthleteStatistic[];
  readonly achievements: readonly AthleteAchievement[];
  readonly timeline: readonly AthleteTimelineEntry[];
  readonly relatedStorySlugs: readonly string[];
  readonly relatedAthleteSlugs: readonly string[];
  readonly visualVariant: AthleteVisualVariant;
  readonly disciplineCode: string;
  readonly image?: EditorialImage;
  readonly seo?: SeoData;
};
