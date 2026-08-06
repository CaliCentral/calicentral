export type NavigationItem = {
  readonly label: string;
  readonly href: string;
};

export type CallToAction = NavigationItem;

export type EditorialTone = "signal" | "field" | "frame" | "paper";

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
  readonly href: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedAt: string;
  readonly publishedLabel: string;
  readonly readingTime: string;
  readonly location: string;
  readonly tone: EditorialTone;
  readonly image?: EditorialImage;
};

export type FooterGroup = {
  readonly title: string;
  readonly links: readonly NavigationItem[];
};

export type EditorialImage = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly decorative: boolean;
  readonly caption?: string;
  readonly credit?: string;
  readonly blurDataURL?: string;
};

export type SeoData = {
  readonly title?: string;
  readonly description?: string;
  readonly noIndex?: boolean;
  readonly image?: EditorialImage;
};
