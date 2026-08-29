import type { EditorialImage, SeoData } from "@/types/content";

export type AthleteDiscipline =
  | "Freestyle"
  | "Static strength"
  | "Dynamic freestyle"
  | "Endurance"
  | "Strength"
  | "Hand balancing";

export type AthleteCompetitionCategory =
  | "freestyle"
  | "power-strength"
  | "endurance"
  | "skills-static"
  | "hybrid-all-around";

export type AthleteSpecialty =
  | "dynamic-freestyle"
  | "static-combinations"
  | "hand-balancing"
  | "weighted-calisthenics"
  | "pull-strength"
  | "dip-strength"
  | "muscle-ups"
  | "endurance"
  | "statics"
  | "team-competition"
  | "coaching"
  | "content-creation";

export type AthleteSocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "x"
  | "threads"
  | "website"
  | "sponsor-merch";

export type AthleteSocialLink = {
  readonly platform: AthleteSocialPlatform;
  readonly url: string;
  readonly handle?: string;
  readonly confirmationStatus: "unconfirmed" | "confirmed";
};

export type AthleteVerification = {
  readonly identityStatus: "unverified" | "profile-control-confirmed";
  readonly profileStatus: "not-reviewed" | "approved";
};

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

export type AthleteCompetitionRecord = {
  readonly eventName: string;
  readonly eventSlug?: string;
  readonly date: string;
  readonly country: string;
  readonly administrativeArea: string;
  readonly city: string;
  readonly divisionCategory: string;
  readonly placement: string;
  readonly score: string;
  readonly verificationStatus:
    | "unverified"
    | "source-reviewed"
    | "verified"
    | "disputed"
    | "sample";
  readonly sourceLabel: string;
  readonly sourceUrl?: string;
  readonly videoUrl?: string;
};

export type Athlete = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly initials: string;
  readonly profileNumber: string;
  readonly status: string;
  readonly city: string;
  /** @deprecated Read administrativeArea instead. */
  readonly state: string;
  readonly country: string;
  readonly administrativeArea: string;
  /** @deprecated Legacy editorial subregion retained during content migration. */
  readonly region: string;
  readonly disciplines: readonly AthleteDiscipline[];
  readonly primaryDiscipline: AthleteDiscipline;
  readonly secondaryDiscipline?: AthleteDiscipline;
  readonly primaryCategory: AthleteCompetitionCategory;
  readonly specialties: readonly AthleteSpecialty[];
  readonly profileLabel: string;
  readonly shortBio: string;
  readonly fullBio: readonly string[];
  readonly quote: string;
  readonly trainingBase: string;
  readonly yearsActive: string;
  readonly style: string;
  readonly featured: boolean;
  readonly updatedAt?: string;
  readonly verification: AthleteVerification;
  readonly socialLinks: readonly AthleteSocialLink[];
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
  readonly competitionHistory: readonly AthleteCompetitionRecord[];
  readonly relatedStorySlugs: readonly string[];
  readonly relatedAthleteSlugs: readonly string[];
  readonly visualVariant: AthleteVisualVariant;
  readonly disciplineCode: string;
  readonly image?: EditorialImage;
  readonly coverImage?: EditorialImage;
  readonly seo?: SeoData;
};
