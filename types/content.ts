export type NavigationItem = {
  readonly label: string;
  readonly href: string;
};

export type CallToAction = NavigationItem;

export type EditorialTone = "sunset" | "ocean" | "clay" | "night";

export type HeroContent = {
  readonly eyebrow: string;
  readonly title: {
    readonly lead: string;
    readonly emphasis: string;
    readonly tail: string;
  };
  readonly description: string;
  readonly primaryAction: CallToAction;
  readonly secondaryAction: CallToAction;
  readonly signals: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

export type StoryPreview = {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedAt: string;
  readonly publishedLabel: string;
  readonly readingTime: string;
  readonly location: string;
  readonly tone: EditorialTone;
};

export type VideoPreview = {
  readonly id: string;
  readonly series: string;
  readonly title: string;
  readonly description: string;
  readonly duration: string;
  readonly episode: string;
  readonly tone: EditorialTone;
};

export type CompetitionPreview = {
  readonly id: string;
  readonly name: string;
  readonly dateTime: string;
  readonly month: string;
  readonly day: string;
  readonly location: string;
  readonly region: string;
  readonly division: string;
  readonly status: "Next event" | "Upcoming";
  readonly featured?: boolean;
};

export type AthleteSpotlight = {
  readonly label: string;
  readonly name: string;
  readonly location: string;
  readonly discipline: string;
  readonly biography: string;
  readonly quote: string;
  readonly initials: string;
  readonly facts: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

export type RankingMovement =
  | { readonly direction: "up"; readonly places: number }
  | { readonly direction: "down"; readonly places: number }
  | { readonly direction: "same"; readonly places: 0 };

export type RankingEntry = {
  readonly rank: number;
  readonly name: string;
  readonly region: string;
  readonly points: number;
  readonly movement: RankingMovement;
};

export type RankingsPreview = {
  readonly category: string;
  readonly description: string;
  readonly entries: readonly RankingEntry[];
};

export type FooterGroup = {
  readonly title: string;
  readonly links: readonly NavigationItem[];
};
