import type {
  FooterGroup,
  HeroContent,
  NavigationItem,
  StoryPreview,
} from "@/types/content";

export const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Athletes", href: "/athletes" },
  { label: "Competitions", href: "/competitions" },
  { label: "Videos", href: "/videos" },
  { label: "Standings", href: "/standings" },
] as const satisfies readonly NavigationItem[];

export const heroContent = {
  eyebrow: "Independent calisthenics media / Worldwide",
  title: {
    lead: "Where the world of",
    emphasis: "CALISTHENICS",
    tail: "comes into focus.",
  },
  description:
    "Original stories, competition coverage, athlete profiles, published results, and the movement shaping calisthenics worldwide.",
  primaryAction: { label: "Explore the stories", href: "/stories" },
  secondaryAction: { label: "See upcoming events", href: "/competitions" },
  signals: [
    { label: "Desk", value: "Independent" },
    { label: "Field", value: "Worldwide" },
    { label: "Status", value: "Prototype" },
  ],
} as const satisfies HeroContent;

export const featuredStory = {
  id: "built-on-the-bars",
  href: "/stories/built-on-the-bars",
  category: "Culture",
  title: "Built on the bars: the ritual behind a neighborhood training crew",
  summary:
    "A fictional field note on shared practice, hard-earned progress, and the people giving an overlooked corner of the city a new rhythm.",
  publishedAt: "2026-07-28",
  publishedLabel: "July 28, 2026",
  readingTime: "6 min read",
  location: "Los Angeles, California",
  tone: "signal",
} as const satisfies StoryPreview;

export const supportingStories = [
  {
    id: "language-of-control",
    href: "/stories/language-of-control",
    category: "Training",
    title: "The quiet language of control",
    summary:
      "Three coaches unpack why patience—not spectacle—is the foundation of advanced static strength.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "4 min read",
    location: "Oakland, California",
    tone: "field",
  },
  {
    id: "judging-the-line",
    href: "/stories/judging-the-line",
    category: "Competition",
    title: "Judging the line between difficulty and execution",
    summary:
      "A prototype roundtable on building competition standards athletes and audiences can understand.",
    publishedAt: "2026-07-19",
    publishedLabel: "July 19, 2026",
    readingTime: "5 min read",
    location: "San Diego, California",
    tone: "frame",
  },
] as const satisfies readonly StoryPreview[];

export const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Stories", href: "/stories" },
      { label: "Athletes", href: "/athletes" },
      { label: "Competitions", href: "/competitions" },
      { label: "Videos", href: "/videos" },
      { label: "Standings", href: "/standings" },
    ],
  },
  {
    title: "Field",
    links: [
      { label: "Search", href: "/search" },
      { label: "Athlete spotlight", href: "/#athlete-spotlight" },
      { label: "Back to top", href: "#top" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Verification", href: "/verification" },
      { label: "Corrections", href: "/corrections" },
      { label: "Editorial standards", href: "/editorial-standards" },
    ],
  },
] as const satisfies readonly FooterGroup[];
