import { stegaClean } from "next-sanity";

import type {
  Article,
  ArticleCategory,
  ArticleHeroVariant,
  ArticlePortableTextBlock,
} from "@/types/article";
import type {
  Athlete,
  AthleteAchievement,
  AthleteDiscipline,
  AthleteRankMovement,
  AthleteStatistic,
  AthleteTimelineEntry,
} from "@/types/athlete";
import type {
  Competition,
  CompetitionDiscipline,
  CompetitionDivision,
  CompetitionNotice,
  CompetitionParticipant,
  CompetitionResult,
  CompetitionScheduleItem,
  CompetitionStatus,
  CompetitionTimelineEntry,
} from "@/types/competition";
import type {
  EditorialImage,
  HeroContent,
  SeoData,
  StoryPreview,
} from "@/types/content";
import type {
  RankingCategory,
  RankingCategorySlug,
  RankingEntry,
} from "@/types/ranking";
import type {
  MediaFeature,
  VideoCategory,
  VideoChapter,
  VideoCredit,
  VideoEditorialNote,
  VideoFormat,
  VideoSeries,
  VideoSeriesSlug,
  VideoStatus,
  VideoTranscriptBlock,
  VideoVisualVariant,
} from "@/types/video";
import type {
  AthletePageData,
  CompetitionPageData,
  HomepageContent,
  SiteSettings,
  StoryPageData,
  VideoPageData,
  VideosPageData,
} from "@/lib/content/types";
import { normalizeSanityImage } from "@/sanity/lib/image";

type JsonRecord = Record<string, unknown>;

const navigation = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Athletes", href: "/athletes" },
  { label: "Competitions", href: "/competitions" },
  { label: "Videos", href: "/videos" },
  { label: "Rankings", href: "/rankings" },
] as const;

const footerGroups = [
  {
    title: "Explore",
    links: navigation.slice(1),
  },
  {
    title: "Field",
    links: [
      { label: "Athlete spotlight", href: "/#athlete-spotlight" },
      { label: "Back to top", href: "#top" },
    ],
  },
] as const;

const cmsDefaultDescription = "Independent calisthenics media.";

const cmsEmptyHero: HeroContent = {
  eyebrow: "Cali Central / Publication desk",
  title: {
    lead: "A new issue",
    emphasis: "is in",
    tail: "motion.",
  },
  description:
    "The public homepage is being prepared. Published stories and field records will appear as the next issue takes shape.",
  primaryAction: { label: "Browse stories", href: "/stories" },
  secondaryAction: {
    label: "Browse athletes",
    href: "/athletes",
  },
  signals: [],
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function structuralString(value: unknown, fallback = ""): string {
  const normalized = string(value);
  const clean = normalized ? stegaClean(normalized).trim() : "";

  return clean || fallback;
}

function optionalString(value: unknown): string | undefined {
  const normalized = string(value);
  return normalized || undefined;
}

function optionalStructuralString(value: unknown): string | undefined {
  const normalized = structuralString(value);
  return normalized || undefined;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function numericDisplayString(
  value: unknown,
  fallback = "",
  minimumLength = 0,
): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value)).padStart(minimumLength, "0");
  }

  const normalized = structuralString(value);
  return normalized
    ? normalized.padStart(minimumLength, "0")
    : fallback;
}

function boolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return array(value)
    .map((item) => structuralString(item))
    .filter(Boolean);
}

function oneOf<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  const clean = structuralString(value);

  return clean && options.includes(clean as T)
    ? (clean as T)
    : fallback;
}

function uniqueBySlug<T extends { readonly slug: string }>(
  values: readonly T[],
  currentSlug?: string,
): T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    if (
      !value.slug ||
      value.slug === currentSlug ||
      seen.has(value.slug)
    ) {
      return false;
    }

    seen.add(value.slug);
    return true;
  });
}

function prototypeLabel(value: unknown, fallback: string): string {
  switch (structuralString(value)) {
    case "fictional-prototype":
      return "Fictional prototype editorial content.";
    case "sample-record":
      return "Fictional sample record.";
    case "not-official":
      return "Prototype content / Not official.";
    default:
      return string(value, fallback);
  }
}

function formatDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function dateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    return { monthCode: "TBD", day: "--", year: "----" };
  }

  const monthCode = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ][Number(match[2]) - 1];

  return {
    monthCode: monthCode ?? "TBD",
    day: match[3],
    year: match[1],
  };
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function portableText(value: unknown): ArticlePortableTextBlock[] {
  return array(value).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const type = structuralString(item._type);

    if (!type) {
      return [];
    }

    if (type === "editorialImage" || type === "accessibleImage") {
      const image = normalizeImage(item.image ?? item);

      return image
        ? [
            {
              _type: "editorialImage" as const,
              _key: optionalStructuralString(item._key),
              image,
            },
          ]
        : [];
    }

    if (type === "block") {
      const markDefs = array(item.markDefs).flatMap((mark) => {
        if (!isRecord(mark)) {
          return [];
        }

        const markType = structuralString(mark._type);

        if (markType === "internalLink") {
          const storySlug = structuralString(mark.storySlug);

          if (!storySlug) {
            return [];
          }

          return [
            {
              _key: optionalStructuralString(mark._key),
              _type: "internalLink",
              href: `/stories/${encodeURIComponent(storySlug)}`,
            },
          ];
        }

        if (markType === "externalLink") {
          return [
            {
              _key: optionalStructuralString(mark._key),
              _type: "externalLink",
              href: structuralString(mark.href),
              blank: boolean(mark.blank),
            },
          ];
        }

        return markType
          ? [
              {
                _key: optionalStructuralString(mark._key),
                _type: markType,
              },
            ]
          : [];
      });

      return [
        {
          ...item,
          _type: "block",
          markDefs,
        } as unknown as ArticlePortableTextBlock,
      ];
    }

    if (type === "factBox") {
      return [
        {
          ...item,
          _type: "factBox",
          title: string(item.heading, string(item.title)),
          items: stringArray(item.items),
        } as unknown as ArticlePortableTextBlock,
      ];
    }

    return [
      {
        ...item,
        _type: type,
      } as unknown as ArticlePortableTextBlock,
    ];
  });
}

function portableParagraphs(value: unknown): string[] {
  return array(value).flatMap((item) => {
    if (!isRecord(item) || item._type !== "block") {
      return [];
    }

    const text = array(item.children)
      .map((child) => (isRecord(child) ? string(child.text) : ""))
      .filter(Boolean)
      .join("");

    return text ? [text] : [];
  });
}

function normalizeImage(value: unknown): EditorialImage | undefined {
  return normalizeSanityImage(value);
}

function normalizeSeo(value: unknown): SeoData | undefined {
  const seo = record(value);
  const title = optionalString(seo.title) ?? optionalString(seo.metaTitle);
  const description =
    optionalString(seo.description) ?? optionalString(seo.metaDescription);
  const image = normalizeImage(seo.image ?? seo.socialImage);
  const noIndex =
    typeof seo.noIndex === "boolean" ? seo.noIndex : undefined;

  if (!title && !description && !image && noIndex === undefined) {
    return undefined;
  }

  return { title, description, image, noIndex };
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const settings = record(value);
  const hasSettings = string(settings.siteTitle) || string(settings.shortTitle);

  return {
    siteTitle: string(
      settings.siteTitle,
      "Cali Central",
    ),
    shortTitle: string(settings.shortTitle, "Cali Central"),
    siteDescription: string(settings.siteDescription, cmsDefaultDescription),
    prototypeNotice: string(
      settings.prototypeNotice,
      hasSettings
        ? "Content status has not been published."
        : "Publication settings are being prepared.",
    ),
    footerStatement: string(
      settings.footerStatement,
      hasSettings
        ? "Built for the movement."
        : "Content is awaiting publication.",
    ),
    navigation,
    footerGroups,
    defaultSeo: normalizeSeo(settings.defaultSeo) ?? {
      title: "Cali Central",
      description: cmsDefaultDescription,
      noIndex: false,
    },
  };
}

function normalizeStory(value: unknown): Article | null {
  const story = record(value);
  const slug = structuralString(story.slug);
  const title = string(story.title);

  if (!slug || !title) {
    return null;
  }

  const category = oneOf<ArticleCategory>(
    story.category,
    [
      "Culture",
      "Training",
      "Competition",
      "Athlete Journal",
      "Field Note",
      "Analysis",
    ],
    "Field Note",
  );
  const heroVariant = oneOf<ArticleHeroVariant>(
    story.heroVisualVariant ?? story.heroVariant,
    ["signal", "field", "frame"],
    "field",
  );
  const publicationDate = string(
    structuralString(story.publishedAt),
    structuralString(story.publicationDate),
  );
  const relatedStories = array(story.relatedStories)
    .map((item) => structuralString(record(item).slug))
    .filter(Boolean);

  return {
    slug,
    title,
    dek: string(story.excerpt, string(story.dek)),
    category,
    author: string(story.authorName, "Cali Central Editorial"),
    publicationDate,
    displayDate: formatDate(publicationDate),
    readTime: `${Math.max(1, number(story.readTimeMinutes, 5))} min read`,
    location: structuralString(story.location, "California"),
    featured: boolean(story.featured),
    homepageFeatured: boolean(story.homepageFeatured),
    issueNumber: string(story.issueNumber, "TBD"),
    tags: stringArray(story.tags),
    heroVariant,
    heroLabel: string(story.eyebrow, `${category} / Editorial`),
    prototypeNotice: prototypeLabel(
      story.prototypeStatus,
      "Fictional prototype editorial content.",
    ),
    body: [],
    portableBody: portableText(story.portableBody),
    relatedSlugs: relatedStories,
    image: normalizeImage(story.heroImage ?? story.image),
    seo: normalizeSeo(story.seo),
  };
}

function normalizeStoryPreview(value: unknown): StoryPreview | null {
  const story = normalizeStory(value);

  if (!story) {
    return null;
  }

  return {
    id: story.slug,
    href: `/stories/${story.slug}`,
    category: story.category,
    title: story.title,
    summary: story.dek,
    publishedAt: story.publicationDate,
    publishedLabel: story.displayDate,
    readingTime: story.readTime,
    location: story.location,
    tone: story.heroVariant,
    image: story.image,
  };
}

export function normalizeStories(value: unknown): Article[] {
  return array(value).flatMap((item) => {
    const story = normalizeStory(item);
    return story ? [story] : [];
  });
}

const athleteDisciplines = [
  "Freestyle",
  "Static strength",
  "Dynamic freestyle",
  "Endurance",
  "Strength",
  "Hand balancing",
] as const satisfies readonly AthleteDiscipline[];

function normalizeMovement(value: unknown): AthleteRankMovement {
  const movement = record(value);
  const direction = oneOf(
    movement.direction ?? movement.movementDirection,
    ["up", "down", "hold", "new"] as const,
    "hold",
  );
  const amount = Math.max(
    0,
    number(movement.amount ?? movement.movementAmount),
  );

  return {
    direction,
    amount,
    label: string(
      movement.label ?? movement.movementLabel,
      direction === "hold"
        ? "Hold"
        : direction === "new"
          ? "New"
          : `${direction === "up" ? "Up" : "Down"} ${amount}`,
    ),
  };
}

function normalizeAthlete(value: unknown): Athlete | null {
  const athlete = record(value);
  const slug = structuralString(athlete.slug);
  const name = string(athlete.name);

  if (!slug || !name) {
    return null;
  }

  const primaryDiscipline = oneOf<AthleteDiscipline>(
    athlete.primaryDiscipline,
    athleteDisciplines,
    "Freestyle",
  );
  const secondaryDisciplines = array(athlete.secondaryDisciplines)
    .map((item) =>
      oneOf<AthleteDiscipline>(item, athleteDisciplines, primaryDiscipline),
    )
    .filter((item) => item !== primaryDiscipline);
  const rankingRecord = record(athlete.ranking);
  const rankingEntry = record(rankingRecord.entry);
  const ranking =
    structuralString(rankingRecord.categorySlug) && number(rankingEntry.rank) > 0
      ? {
          categorySlug: structuralString(rankingRecord.categorySlug),
          categoryTitle: string(
            rankingRecord.categoryTitle,
            "Prototype ranking",
          ),
          rank: number(rankingEntry.rank),
          points: number(rankingEntry.points),
          movement: normalizeMovement(rankingEntry),
        }
      : undefined;

  const statistics = array(athlete.statistics).flatMap((item) => {
    const statistic = record(item);
    const label = string(statistic.label);
    const value = string(statistic.value);

    if (!label || !value) {
      return [];
    }

    const normalized: AthleteStatistic = {
      label,
      value,
      detail: optionalString(statistic.detail ?? statistic.context),
      emphasis: boolean(statistic.emphasis),
    };

    return [normalized];
  });
  const achievements = array(athlete.achievements).flatMap((item) => {
    const achievement = record(item);
    const title = string(achievement.title);

    if (!title) {
      return [];
    }

    const normalized: AthleteAchievement = {
      year: numericDisplayString(achievement.year),
      title,
      description: string(achievement.description),
      status: string(achievement.status, "Prototype record"),
    };

    return [normalized];
  });
  const timeline = array(athlete.timeline).flatMap((item) => {
    const entry = record(item);
    const title = string(entry.title);

    if (!title) {
      return [];
    }

    const normalized: AthleteTimelineEntry = {
      dateLabel: string(entry.dateLabel),
      title,
      description: string(entry.description),
      type: string(entry.type, "Profile"),
    };

    return [normalized];
  });
  const relatedStorySlugs = array(athlete.relatedStories)
    .map((item) => structuralString(record(item).slug))
    .filter(Boolean);
  const relatedAthleteSlugs = array(athlete.relatedAthletes)
    .map((item) => structuralString(record(item).slug))
    .filter(Boolean);

  return {
    slug,
    name,
    initials: string(
      athlete.initials,
      name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toLocaleUpperCase(),
    ),
    profileNumber: string(athlete.profileNumber, "TBD"),
    status: string(athlete.profileStatus, "Prototype profile"),
    city: structuralString(athlete.city),
    state: structuralString(athlete.state, "California"),
    country: structuralString(athlete.country, "United States"),
    region: structuralString(athlete.region, "California"),
    disciplines: [primaryDiscipline, ...secondaryDisciplines],
    primaryDiscipline,
    secondaryDiscipline: secondaryDisciplines[0],
    profileLabel: string(
      athlete.profileLabel,
      string(athlete.prototypeStatus, "Fictional athlete profile"),
    ),
    shortBio: string(athlete.shortBio),
    fullBio: portableParagraphs(athlete.portableProfile),
    quote: string(athlete.quote),
    trainingBase: string(athlete.trainingBase, "Fictional training base"),
    yearsActive: string(athlete.yearsActive, "Prototype record"),
    style: string(athlete.styleLabel, "Movement study"),
    featured: boolean(athlete.featured),
    rankingEligible: boolean(athlete.rankingEligible),
    ranking,
    statistics,
    achievements,
    timeline,
    relatedStorySlugs,
    relatedAthleteSlugs,
    visualVariant: oneOf(
      athlete.visualVariant,
      ["signal", "frame", "motion"] as const,
      "signal",
    ),
    disciplineCode: structuralString(athlete.disciplineCode, "FIELD"),
    image: normalizeImage(athlete.profileImage ?? athlete.image),
    seo: normalizeSeo(athlete.seo),
  };
}

export function normalizeAthletes(value: unknown): Athlete[] {
  return array(value).flatMap((item) => {
    const athlete = normalizeAthlete(item);
    return athlete ? [athlete] : [];
  });
}

const competitionDisciplines = [
  "freestyle",
  "static-strength",
  "dynamic",
  "endurance",
  "team",
  "mixed",
] as const satisfies readonly CompetitionDiscipline[];

function normalizeCompetition(value: unknown): Competition | null {
  const competition = record(value);
  const slug = structuralString(competition.slug);
  const name = string(competition.name);
  const startDate = structuralString(competition.startDate);

  if (!slug || !name || !startDate) {
    return null;
  }

  const primaryDiscipline = oneOf<CompetitionDiscipline>(
    competition.primaryDiscipline,
    competitionDisciplines,
    "freestyle",
  );
  const disciplines = array(competition.disciplines)
    .map((item) =>
      oneOf<CompetitionDiscipline>(
        item,
        competitionDisciplines,
        primaryDiscipline,
      ),
    )
    .filter((item, index, all) => all.indexOf(item) === index);
  const parts = dateParts(startDate);
  const status = oneOf<CompetitionStatus>(
    competition.status,
    ["upcoming", "completed", "postponed", "preview"],
    "preview",
  );
  const divisions = array(competition.divisions).flatMap((item, index) => {
    const division = record(item);
    const divisionName = string(division.name);

    if (!divisionName) {
      return [];
    }

    const normalized: CompetitionDivision = {
      slug: structuralString(division.slug, `division-${index + 1}`),
      name: divisionName,
      discipline: oneOf<CompetitionDiscipline>(
        division.discipline,
        competitionDisciplines,
        primaryDiscipline,
      ),
      level: string(division.level, "Open"),
      format: string(division.format),
      participantLimit: Math.max(1, number(division.participantLimit, 1)),
      description: string(division.description),
    };

    return [normalized];
  });
  const schedule = array(competition.schedule).flatMap((item) => {
    const scheduleItem = record(item);
    const label = string(scheduleItem.label);

    if (!label) {
      return [];
    }

    const normalized: CompetitionScheduleItem = {
      time: string(scheduleItem.time, "TBD"),
      label,
      description: string(scheduleItem.description),
      stage: string(scheduleItem.stage, "Field"),
      status: oneOf(
        scheduleItem.status,
        ["planned", "provisional", "complete", "cancelled"] as const,
        "planned",
      ),
    };

    return [normalized];
  });
  const participants = array(competition.participants).flatMap((item) => {
    const participant = record(item);
    const athleteName = string(participant.athleteName);

    if (!athleteName) {
      return [];
    }

    const normalized: CompetitionParticipant = {
      athleteSlug: optionalStructuralString(participant.athleteSlug),
      athleteName,
      city: structuralString(participant.city),
      discipline: oneOf<CompetitionDiscipline>(
        participant.discipline,
        competitionDisciplines,
        primaryDiscipline,
      ),
      seed: string(participant.seed, "--"),
      status: oneOf(
        participant.status,
        ["sample-entry", "invited", "preview", "withdrawn"] as const,
        "preview",
      ),
    };

    return [normalized];
  });
  const results = array(competition.results)
    .flatMap((item) => {
      const result = record(item);
      const athleteName = string(result.athleteName);
      const placement = number(result.placement);

      if (!athleteName || placement <= 0) {
        return [];
      }

      const normalized: CompetitionResult = {
        placement,
        athleteSlug: optionalStructuralString(result.athleteSlug),
        athleteName,
        region: structuralString(
          result.region,
          structuralString(result.athleteRegion),
        ),
        scoreDisplay: string(result.scoreDisplay),
        resultLabel: string(result.resultLabel, "Sample result"),
        movementNote: string(result.movementNote),
      };

      return [normalized];
    })
    .sort((first, second) => first.placement - second.placement);
  const timeline = array(competition.timeline).flatMap((item) => {
    const entry = record(item);
    const title = string(entry.title);

    if (!title) {
      return [];
    }

    const normalized: CompetitionTimelineEntry = {
      dateLabel: string(entry.dateLabel),
      title,
      description: string(entry.description),
      status: oneOf(
        entry.status,
        ["complete", "current", "pending", "paused"] as const,
        "pending",
      ),
    };

    return [normalized];
  });
  const notices = array(competition.notices).flatMap((item) => {
    const notice = record(item);
    const label = string(notice.label);
    const text = string(notice.text);

    if (!label || !text) {
      return [];
    }

    const normalized: CompetitionNotice = {
      label,
      text,
      emphasis: oneOf(
        notice.emphasis,
        ["standard", "signal"] as const,
        "standard",
      ),
    };

    return [normalized];
  });

  return {
    slug,
    name,
    shortName: string(competition.shortName, name),
    eventNumber: string(competition.eventNumber, "TBD"),
    status,
    startDate,
    endDate: optionalStructuralString(competition.endDate),
    dateDisplay:
      status === "postponed" ? "Date under review" : formatDate(startDate),
    ...parts,
    city: structuralString(competition.city),
    state: structuralString(competition.state, "California"),
    country: structuralString(competition.country, "United States"),
    region: structuralString(
      competition.region,
      structuralString(competition.state, "California"),
    ),
    venueName: string(competition.venueName, "Venue pending"),
    venueType: string(competition.venueType, "Prototype venue"),
    summary: string(competition.summary),
    fullDescription: portableParagraphs(competition.portableDescription),
    disciplines: disciplines.length > 0 ? disciplines : [primaryDiscipline],
    primaryDiscipline,
    divisions,
    featured: boolean(competition.featured),
    registrationStatus: oneOf(
      competition.registrationStatus,
      ["not-open", "preview-only", "closed", "unavailable"] as const,
      "unavailable",
    ),
    scheduleStatus: oneOf(
      competition.scheduleStatus,
      ["pending", "provisional", "published", "completed"] as const,
      "pending",
    ),
    resultsStatus: oneOf(
      competition.resultsStatus,
      ["not-available", "pending", "sample-results"] as const,
      "not-available",
    ),
    capacityLabel: string(
      competition.capacityLabel,
      "Capacity not published",
    ),
    organizerName: string(
      competition.organizerName,
      "Fictional event organizer",
    ),
    competitionFormat: string(
      competition.competitionFormat,
      "Prototype format",
    ),
    visualVariant: oneOf(
      competition.visualVariant,
      ["signal", "field", "frame"] as const,
      "field",
    ),
    schedule,
    participants,
    results,
    relatedStorySlugs: array(competition.relatedStories)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedVideoSlugs: array(competition.relatedVideos)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedAthleteSlugs: array(competition.relatedAthletes)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedCompetitionSlugs: array(competition.relatedCompetitions)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    timeline,
    notices,
    image: normalizeImage(competition.heroImage ?? competition.image),
    seo: normalizeSeo(competition.seo),
  };
}

export function normalizeCompetitions(value: unknown): Competition[] {
  return array(value).flatMap((item) => {
    const competition = normalizeCompetition(item);
    return competition ? [competition] : [];
  });
}

const videoCategories = [
  "Technique",
  "Competition",
  "Culture",
  "Athlete Profile",
  "Training",
] as const satisfies readonly VideoCategory[];

const videoFormats = [
  "Visual Study",
  "Short Documentary",
  "Field Report",
  "Technique Breakdown",
  "Event Preview",
  "Interview/Profile Study",
  "Editorial Breakdown",
] as const satisfies readonly VideoFormat[];

const videoStatuses = [
  "preview",
  "archive-sample",
  "published-prototype",
] as const satisfies readonly VideoStatus[];

const videoVariants = [
  "handstand",
  "static",
  "motion",
  "team",
  "field",
  "portrait",
  "competition",
] as const satisfies readonly VideoVisualVariant[];

function videoSeriesSlug(value: unknown): VideoSeriesSlug {
  const slug = structuralString(value, "field-notes");
  return slug as VideoSeriesSlug;
}

function normalizeVideo(value: unknown): MediaFeature | null {
  const video = record(value);
  const slug = structuralString(video.slug);
  const title = string(video.title);

  if (!slug || !title) {
    return null;
  }

  const durationSeconds = Math.max(0, number(video.durationSeconds));
  const publishedDate = structuralString(
    video.publishedAt,
    structuralString(video.publishedDate),
  );
  const chapters = array(video.chapters).flatMap((item) => {
    const chapter = record(item);
    const chapterTitle = string(chapter.title);

    if (!chapterTitle) {
      return [];
    }

    const timestampSeconds = Math.max(
      0,
      number(chapter.timestampSeconds),
    );
    const normalized: VideoChapter = {
      timestamp: formatTime(timestampSeconds),
      timestampSeconds,
      title: chapterTitle,
      description: string(chapter.description),
    };

    return [normalized];
  });
  const transcript = array(video.transcript).flatMap((item) => {
    const block = record(item);
    const text = string(block.text);

    if (!text) {
      return [];
    }

    const seconds =
      typeof block.timestampSeconds === "number"
        ? Math.max(0, block.timestampSeconds)
        : undefined;
    const normalized: VideoTranscriptBlock = {
      speaker: string(block.speaker, "Editorial voice"),
      timestamp: seconds === undefined ? undefined : formatTime(seconds),
      text,
    };

    return [normalized];
  });
  const editorialNotes = array(video.editorialNotes).flatMap((item) => {
    const note = record(item);
    const heading = string(note.heading);
    const text = string(note.text);

    if (!heading || !text) {
      return [];
    }

    const normalized: VideoEditorialNote = { heading, text };
    return [normalized];
  });
  const credits = array(video.credits).flatMap((item) => {
    const credit = record(item);
    const role = string(credit.role);
    const name = string(credit.name);

    if (!role || !name) {
      return [];
    }

    const normalized: VideoCredit = {
      role,
      name,
      status: string(credit.status, "Fictional credit"),
    };

    return [normalized];
  });

  return {
    slug,
    title,
    shortTitle: string(video.shortTitle, title),
    episodeNumber: numericDisplayString(video.episodeNumber, "TBD", 2),
    seriesSlug: videoSeriesSlug(video.seriesSlug),
    seriesTitle: string(video.seriesTitle, "Field Notes"),
    category: oneOf<VideoCategory>(
      video.category,
      videoCategories,
      "Culture",
    ),
    format: oneOf<VideoFormat>(
      video.format,
      videoFormats,
      "Field Report",
    ),
    status: oneOf<VideoStatus>(
      video.status,
      videoStatuses,
      "published-prototype",
    ),
    duration: formatTime(durationSeconds),
    durationSeconds,
    publishedDate,
    publishedDateDisplay: formatDate(publishedDate),
    location: structuralString(video.location, "California"),
    summary: string(video.summary),
    description: portableParagraphs(video.portableDescription),
    featured: boolean(video.featured),
    homepageFeatured: boolean(video.homepageFeatured),
    visualVariant: oneOf<VideoVisualVariant>(
      video.visualVariant,
      videoVariants,
      "field",
    ),
    posterLabel: string(video.posterLabel, "Preview frame"),
    frameCode: string(video.frameCode, "CC / Pending"),
    chapters,
    transcript: transcript.length > 0 ? transcript : undefined,
    editorialNotes:
      editorialNotes.length > 0 ? editorialNotes : undefined,
    credits,
    relatedAthleteSlugs: array(video.relatedAthletes)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedCompetitionSlugs: array(video.relatedCompetitions)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedStorySlugs: array(video.relatedStories)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    relatedVideoSlugs: array(video.relatedVideos)
      .map((item) => structuralString(record(item).slug))
      .filter(Boolean),
    tags: stringArray(video.tags),
    availabilityLabel: string(
      video.availabilityLabel,
      "Static preview / No playback",
    ),
    image: normalizeImage(video.posterImage ?? video.image),
    seo: normalizeSeo(video.seo),
  };
}

export function normalizeVideos(value: unknown): MediaFeature[] {
  return array(value).flatMap((item) => {
    const video = normalizeVideo(item);
    return video ? [video] : [];
  });
}

function normalizeVideoSeries(value: unknown): VideoSeries | null {
  const series = record(value);
  const slug = structuralString(series.slug);
  const title = string(series.title);

  if (!slug || !title) {
    return null;
  }

  return {
    slug: videoSeriesSlug(slug),
    title,
    description: string(series.description),
    categoryEmphasis: string(
      series.categoryEmphasis,
      stringArray(series.categoryFocus).join(" / "),
    ),
  };
}

function rankingSlug(value: unknown): RankingCategorySlug {
  return structuralString(
    value,
    "open-freestyle-california",
  ) as RankingCategorySlug;
}

function normalizeRankingCategory(value: unknown): RankingCategory | null {
  const category = record(value);
  const slug = structuralString(category.slug);
  const title = string(category.title);

  if (!slug || !title) {
    return null;
  }

  const entries = array(category.entries)
    .flatMap((item) => {
      const entry = record(item);
      const athleteSlug = structuralString(entry.athleteSlug);
      const rank = number(entry.rank);

      if (!athleteSlug || rank <= 0) {
        return [];
      }

      const normalized: RankingEntry = {
        rank,
        athleteSlug,
        athleteName: string(entry.athleteName),
        region: structuralString(
          entry.athleteRegion,
          structuralString(category.region),
        ),
        points: Math.max(0, number(entry.points)),
        movement: normalizeMovement(entry),
        statusLabel: string(entry.status, "Prototype entry"),
      };

      return [normalized];
    })
    .sort((first, second) => first.rank - second.rank);

  return {
    slug: rankingSlug(slug),
    title,
    subtitle: string(category.subtitle),
    discipline: structuralString(category.discipline),
    division: structuralString(category.division),
    region: structuralString(category.region, "California"),
    status: "Prototype standings",
    updatedLabel: string(
      category.updatedLabel,
      formatDate(structuralString(category.updatedAt)),
    ),
    description: string(category.description),
    disclaimer: string(
      category.methodologyNote,
      string(
        category.prototypeStatus,
        "Fictional prototype standings. Not official.",
      ),
    ),
    entries,
  };
}

export function normalizeRankingCategories(
  value: unknown,
): RankingCategory[] {
  return array(value).flatMap((item) => {
    const category = normalizeRankingCategory(item);
    return category ? [category] : [];
  });
}

export function normalizeHomepageContent(value: unknown): HomepageContent {
  const homepage = record(value);
  const settings = record(homepage.settings);
  const featuredStory = normalizeStoryPreview(homepage.featuredStory);
  const supportingStories = array(homepage.stories)
    .flatMap((item) => {
      const story = normalizeStoryPreview(item);
      return story ? [story] : [];
    })
    .filter((story) => story.id !== featuredStory?.id)
    .slice(0, 2);
  const featuredVideo = normalizeVideo(homepage.featuredVideo);
  const videos = uniqueBySlug(
    [
      ...(featuredVideo ? [featuredVideo] : []),
      ...normalizeVideos(homepage.videos),
    ],
  ).slice(0, 3);
  const athlete = normalizeAthlete(homepage.athlete);
  const rankingCategory = normalizeRankingCategory(homepage.rankingCategory);
  const featuredCompetition = normalizeCompetition(
    homepage.featuredCompetition,
  );
  const competitions = uniqueBySlug([
    ...(featuredCompetition ? [featuredCompetition] : []),
    ...normalizeCompetitions(homepage.competitions),
  ]).slice(0, 3);
  const title = string(settings.homepageHeroTitle);
  const [lead, emphasis, ...tailParts] = title.split(/\s*\|\s*/);
  const hasStructuredTitle = Boolean(emphasis && tailParts.length > 0);
  const hasHomepageSettings = Boolean(
    string(settings.homepageHeroEyebrow) ||
      title ||
      string(settings.homepageHeroBody),
  );

  return {
    hero: {
      ...cmsEmptyHero,
      eyebrow: string(settings.homepageHeroEyebrow, cmsEmptyHero.eyebrow),
      title: hasStructuredTitle
        ? { lead, emphasis, tail: tailParts.join(" | ") }
        : title
          ? { lead: "", emphasis: title, tail: "" }
          : cmsEmptyHero.title,
      description: string(
        settings.homepageHeroBody,
        hasHomepageSettings
          ? cmsDefaultDescription
          : cmsEmptyHero.description,
      ),
    },
    featuredStory,
    supportingStories,
    videos,
    competitions,
    athlete,
    rankingCategory,
  };
}

export function normalizeStoryPage(value: unknown): StoryPageData | null {
  const source = record(value);
  const story = normalizeStory(source);

  if (!story) {
    return null;
  }

  return {
    story,
    relatedStories: uniqueBySlug(
      normalizeStories(source.relatedStories),
      story.slug,
    ).slice(0, 3),
    relatedAthletes: uniqueBySlug(
      normalizeAthletes(source.relatedAthletes),
    ).slice(0, 3),
    relatedCompetitions: uniqueBySlug(
      normalizeCompetitions(source.relatedCompetitions),
    ).slice(0, 3),
    relatedVideos: uniqueBySlug(
      normalizeVideos(source.relatedVideos),
    ).slice(0, 3),
  };
}

export function normalizeAthletePage(
  value: unknown,
): AthletePageData | null {
  const source = record(value);
  const athlete = normalizeAthlete(source);

  if (!athlete) {
    return null;
  }

  return {
    athlete,
    relatedStories: uniqueBySlug(
      normalizeStories(source.relatedStories),
    ).slice(0, 3),
    relatedAthletes: uniqueBySlug(
      normalizeAthletes(source.relatedAthletes),
      athlete.slug,
    ).slice(0, 3),
    relatedCompetitions: uniqueBySlug(
      normalizeCompetitions(source.relatedCompetitions),
    ).slice(0, 3),
    relatedVideos: uniqueBySlug(
      normalizeVideos(source.relatedVideos),
    ).slice(0, 3),
  };
}

export function normalizeCompetitionPage(
  value: unknown,
): CompetitionPageData | null {
  const source = record(value);
  const competition = normalizeCompetition(source);

  if (!competition) {
    return null;
  }

  return {
    competition,
    relatedStories: uniqueBySlug(
      normalizeStories(source.relatedStories),
    ).slice(0, 3),
    relatedAthletes: uniqueBySlug(
      normalizeAthletes(source.relatedAthletes),
    ).slice(0, 3),
    relatedCompetitions: uniqueBySlug(
      normalizeCompetitions(source.relatedCompetitions),
      competition.slug,
    ).slice(0, 3),
    relatedVideos: uniqueBySlug(
      normalizeVideos(source.relatedVideos),
    ).slice(0, 3),
  };
}

export function normalizeVideosPageData(value: unknown): VideosPageData {
  const source = record(value);
  const videos = normalizeVideos(source.videos);

  return {
    videos,
    series: array(source.series).flatMap((item) => {
      const series = normalizeVideoSeries(item);
      return series ? [series] : [];
    }),
    featuredVideo:
      normalizeVideo(source.featuredVideo) ??
      videos.find((video) => video.featured) ??
      videos[0] ??
      null,
  };
}

export function normalizeVideoPage(value: unknown): VideoPageData | null {
  const source = record(value);
  const video = normalizeVideo(source);

  if (!video) {
    return null;
  }

  return {
    video,
    relatedStories: uniqueBySlug(
      normalizeStories(source.relatedStories),
    ).slice(0, 3),
    relatedAthletes: uniqueBySlug(
      normalizeAthletes(source.relatedAthletes),
    ).slice(0, 3),
    relatedCompetitions: uniqueBySlug(
      normalizeCompetitions(source.relatedCompetitions),
    ).slice(0, 3),
    relatedVideos: uniqueBySlug(
      normalizeVideos(source.relatedVideos),
      video.slug,
    ).slice(0, 3),
  };
}

export function normalizeSlugs(value: unknown): string[] {
  return stringArray(value).filter(
    (slug, index, all) => all.indexOf(slug) === index,
  );
}
