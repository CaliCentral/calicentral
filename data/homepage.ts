import type {
  AthleteSpotlight,
  CompetitionPreview,
  FooterGroup,
  HeroContent,
  NavigationItem,
  RankingsPreview,
  StoryPreview,
  VideoPreview,
} from "@/types/content";

export const navigationItems = [
  { label: "Home", href: "/" },
  { label: "News", href: "/#featured" },
  { label: "Videos", href: "/#videos" },
  { label: "Competitions", href: "/#competitions" },
  { label: "Rankings", href: "/#rankings" },
  { label: "Athletes", href: "/#athlete-spotlight" },
] as const satisfies readonly NavigationItem[];

export const heroContent = {
  eyebrow: "Independent calisthenics media · California",
  title: {
    lead: "Where the world of",
    emphasis: "calisthenics",
    tail: "comes into focus.",
  },
  description:
    "Original stories, competition coverage, athlete profiles, and a clearer view of the movement shaping the sport—from California to the global stage.",
  primaryAction: { label: "Explore the coverage", href: "/#featured" },
  secondaryAction: { label: "See upcoming events", href: "/#competitions" },
  signals: [
    { label: "Perspective", value: "Athlete-led" },
    { label: "Coverage", value: "Worldwide" },
    { label: "Home base", value: "California" },
  ],
} as const satisfies HeroContent;

export const featuredStory = {
  id: "built-on-the-bars",
  category: "Culture",
  title: "Built on the bars: the ritual behind a neighborhood training crew",
  summary:
    "A fictional field note on shared practice, hard-earned progress, and the people giving an overlooked corner of the city a new rhythm.",
  publishedAt: "2026-07-28",
  publishedLabel: "July 28, 2026",
  readingTime: "6 min read",
  location: "Los Angeles, California",
  tone: "sunset",
} as const satisfies StoryPreview;

export const supportingStories = [
  {
    id: "language-of-control",
    category: "Training",
    title: "The quiet language of control",
    summary:
      "Three coaches unpack why patience—not spectacle—is the foundation of advanced static strength.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "4 min read",
    location: "Oakland, California",
    tone: "ocean",
  },
  {
    id: "judging-the-line",
    category: "Competition",
    title: "Judging the line between difficulty and execution",
    summary:
      "A prototype roundtable on building competition standards athletes and audiences can understand.",
    publishedAt: "2026-07-19",
    publishedLabel: "July 19, 2026",
    readingTime: "5 min read",
    location: "San Diego, California",
    tone: "night",
  },
] as const satisfies readonly StoryPreview[];

export const videos = [
  {
    id: "frame-by-frame-control",
    series: "Frame by frame",
    title: "Finding control through the handstand line",
    description:
      "A visual study of alignment, tempo, and the small corrections behind a composed hold.",
    duration: "08:42",
    episode: "Episode 01",
    tone: "ocean",
  },
  {
    id: "after-the-last-round",
    series: "Competition diary",
    title: "After the last round",
    description:
      "A fictional athlete reflects on preparation, pressure, and the reset that starts after finals.",
    duration: "12:18",
    episode: "Episode 02",
    tone: "sunset",
  },
  {
    id: "park-session",
    series: "Local motion",
    title: "One evening at Harbor Park",
    description:
      "Community energy, open-air training, and a session shaped by everyone who arrived.",
    duration: "06:35",
    episode: "Episode 03",
    tone: "clay",
  },
] as const satisfies readonly VideoPreview[];

export const competitions = [
  {
    id: "pacific-motion-open",
    name: "Pacific Motion Open",
    dateTime: "2026-08-22",
    month: "Aug",
    day: "22",
    location: "Long Beach",
    region: "California",
    division: "Freestyle · Open",
    status: "Next event",
    featured: true,
  },
  {
    id: "golden-state-strength-classic",
    name: "Golden State Strength Classic",
    dateTime: "2026-09-12",
    month: "Sep",
    day: "12",
    location: "Sacramento",
    region: "California",
    division: "Strength · Mixed",
    status: "Upcoming",
    featured: false,
  },
  {
    id: "coastline-team-cup",
    name: "Coastline Team Cup",
    dateTime: "2026-10-03",
    month: "Oct",
    day: "03",
    location: "San Diego",
    region: "California",
    division: "Team · Invitational",
    status: "Upcoming",
    featured: false,
  },
] as const satisfies readonly CompetitionPreview[];

export const athleteSpotlight = {
  label: "Sample athlete profile",
  name: "Maya Calder",
  location: "Sacramento, California",
  discipline: "Freestyle & static strength",
  biography:
    "Maya is a fictional multidisciplinary athlete whose practice pairs patient strength work with expressive movement. Her sample profile demonstrates how Cali Central will tell the story behind performance—not only record the result.",
  quote:
    "The strongest sessions are the ones where the whole park moves forward.",
  initials: "MC",
  facts: [
    { label: "Training base", value: "Northline Park" },
    { label: "Primary focus", value: "Freestyle" },
    { label: "Signature", value: "Static to dynamic" },
    { label: "Profile status", value: "Prototype" },
  ],
} as const satisfies AthleteSpotlight;

export const rankingsPreview = {
  category: "Open Freestyle · California",
  description:
    "An illustrative view of how verified standings could be presented. These names, positions, and points are fictional.",
  entries: [
    {
      rank: 1,
      name: "Jalen Reyes",
      region: "Los Angeles",
      points: 980,
      movement: { direction: "same", places: 0 },
    },
    {
      rank: 2,
      name: "Noa Bennett",
      region: "Oakland",
      points: 945,
      movement: { direction: "up", places: 1 },
    },
    {
      rank: 3,
      name: "Elian Park",
      region: "San Jose",
      points: 917,
      movement: { direction: "down", places: 1 },
    },
    {
      rank: 4,
      name: "Tessa Marín",
      region: "San Diego",
      points: 884,
      movement: { direction: "up", places: 2 },
    },
    {
      rank: 5,
      name: "Micah Vale",
      region: "Fresno",
      points: 851,
      movement: { direction: "same", places: 0 },
    },
  ],
} as const satisfies RankingsPreview;

export const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Featured", href: "/#featured" },
      { label: "Videos", href: "/#videos" },
      { label: "Competitions", href: "/#competitions" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Athlete spotlight", href: "/#athlete-spotlight" },
      { label: "Rankings preview", href: "/#rankings" },
      { label: "Back to top", href: "/#top" },
    ],
  },
] as const satisfies readonly FooterGroup[];
