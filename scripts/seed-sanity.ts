/**
 * Guarded local-content migration.
 *
 * Preview: npx sanity exec scripts/seed-sanity.ts -- --dry-run
 * Inspect: npx sanity exec scripts/seed-sanity.ts -- --ndjson
 * Write:   CONFIRM_SANITY_SEED=YES npx sanity exec scripts/seed-sanity.ts -- --write
 *
 * The write mode also requires SANITY_API_WRITE_TOKEN in the server-side
 * environment. This script never deletes documents.
 */
import { createClient } from "next-sanity";

import { articles } from "../data/articles";
import { athletes } from "../data/athletes";
import { competitions } from "../data/competitions";
import {
  featuredStory,
  heroContent,
  supportingStories,
} from "../data/homepage";
import { rankingCategories } from "../data/rankings";
import { videoSeries, videos } from "../data/videos";
import type { ArticleBlock } from "../types/article";
import type { Athlete } from "../types/athlete";
import type { MediaFeature } from "../types/video";

type SeedDocument = {
  readonly _id: string;
  readonly _type: string;
  readonly [field: string]: unknown;
};

type PortableTextNode = {
  readonly _key: string;
  readonly _type: string;
  readonly [field: string]: unknown;
};

type Reference = {
  readonly _type: "reference";
  readonly _ref: string;
  readonly _key?: string;
};

type DocumentPrefix =
  | "author"
  | "story"
  | "athlete"
  | "competition"
  | "videoSeries"
  | "video"
  | "ranking";

const API_VERSION_FALLBACK = "2026-07-01";
const FICTIONAL_PROTOTYPE = "fictional-prototype";
const SAMPLE_RECORD = "sample-record";
const NOT_OFFICIAL = "not-official";
const athleteRecords: readonly Athlete[] = athletes;
const videoRecords: readonly MediaFeature[] = videos;
// Homepage preview copy supplies selection only. Persisted story fields always
// come from canonical article records, so duplicate preview metadata cannot
// overwrite CMS content.
const homepageStorySlugs = new Set<string>([
  featuredStory.id,
  ...supportingStories.map((story) => story.id),
]);

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableKey(...parts: readonly (string | number)[]) {
  return slugify(parts.join("-")).slice(0, 96);
}

function documentId(prefix: DocumentPrefix, slug: string) {
  return `${prefix}.${slug}`;
}

function reference(
  id: string,
  key?: string,
): Reference {
  return key
    ? { _type: "reference", _ref: id, _key: stableKey(key) }
    : { _type: "reference", _ref: id };
}

function references(
  prefix: DocumentPrefix,
  slugs: readonly string[],
) {
  return slugs.map((slug) =>
    reference(documentId(prefix, slug), `${prefix}-${slug}`),
  );
}

function truncate(value: string, maximumLength: number) {
  if (value.length <= maximumLength) {
    return value;
  }

  return `${value.slice(0, maximumLength - 1).trimEnd()}…`;
}

function seo(metaTitle: string, metaDescription: string) {
  return {
    _type: "seo",
    metaTitle: truncate(metaTitle, 60),
    metaDescription: truncate(metaDescription, 160),
    noIndex: false,
  };
}

function publishedAt(date: string) {
  return `${date}T12:00:00.000Z`;
}

function parseDuration(value: string) {
  const [minutes, seconds] = value.split(":").map(Number);

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds > 59
  ) {
    throw new Error(`Invalid MM:SS value: ${value}`);
  }

  return minutes * 60 + seconds;
}

function parseYear(value: string) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new Error(`Invalid year value: ${value}`);
  }

  return year;
}

function parseReadTime(value: string) {
  const match = /^(\d+)\s+min read$/i.exec(value.trim());
  const minutes = match ? Number(match[1]) : Number.NaN;

  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error(`Invalid read-time value: ${value}`);
  }

  return minutes;
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = /^\d+$/.test(value) ? Number(value) : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }

  return parsed;
}

function textBlock(
  text: string,
  key: string,
  style: "normal" | "h2" | "h3" | "blockquote" = "normal",
  listItem?: "bullet" | "number",
): PortableTextNode {
  return {
    _key: stableKey(key),
    _type: "block",
    style,
    markDefs: [],
    children: [
      {
        _key: stableKey(key, "span"),
        _type: "span",
        marks: [],
        text,
      },
    ],
    ...(listItem ? { level: 1, listItem } : {}),
  };
}

function paragraphsToPortableText(
  paragraphs: readonly string[],
  ownerKey: string,
) {
  return paragraphs.map((paragraph, index) =>
    textBlock(paragraph, `${ownerKey}-paragraph-${index + 1}`),
  );
}

function articleBodyToPortableText(
  blocks: readonly ArticleBlock[],
  storySlug: string,
) {
  return blocks.flatMap<PortableTextNode>((block, blockIndex) => {
    const key = `${storySlug}-body-${String(blockIndex + 1).padStart(3, "0")}`;

    switch (block.type) {
      case "paragraph":
        return [textBlock(block.text, key)];
      case "heading":
        return [textBlock(block.text, key, "h2")];
      case "subheading":
        return [textBlock(block.text, key, "h3")];
      case "pullQuote":
        return [
          {
            _key: stableKey(key),
            _type: "pullQuote",
            quote: block.quote,
            ...(block.attribution
              ? { attribution: block.attribution }
              : {}),
          },
        ];
      case "factBox":
        return [
          {
            _key: stableKey(key),
            _type: "factBox",
            heading: block.title,
            items: [...block.items],
          },
        ];
      case "list":
        return block.items.map((item, itemIndex) =>
          textBlock(
            item,
            `${key}-item-${itemIndex + 1}`,
            "normal",
            block.style === "ordered" ? "number" : "bullet",
          ),
        );
      case "divider":
        return [
          {
            _key: stableKey(key),
            _type: "divider",
            ...(block.label ? { label: block.label } : {}),
          },
        ];
      case "callout":
        return [
          {
            _key: stableKey(key),
            _type: "factBox",
            heading: block.title
              ? `${block.label} / ${block.title}`
              : block.label,
            items: [block.text],
          },
        ];
    }
  });
}

function initialsForName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
}

function categoriesForVideoSeries(seriesSlug: string) {
  const categories = [
    ...new Set(
      videoRecords
        .filter((video) => video.seriesSlug === seriesSlug)
        .map((video) => video.category),
    ),
  ];

  if (categories.length === 0) {
    throw new Error(`Video series ${seriesSlug} has no canonical videos.`);
  }

  return categories;
}

function makeSiteSettings(): SeedDocument {
  const canonicalFeaturedStory = articles.find(
    (article) => article.slug === featuredStory.id,
  );
  const featuredAthlete =
    athleteRecords.find((athlete) => athlete.featured) ?? athleteRecords[0];
  const featuredCompetition =
    competitions.find((competition) => competition.featured) ??
    competitions[0];
  const featuredVideo =
    videoRecords.find((video) => video.featured) ?? videoRecords[0];
  const featuredRankingCategory = rankingCategories[0];

  if (
    !featuredAthlete ||
    !featuredCompetition ||
    !featuredVideo ||
    !canonicalFeaturedStory
  ) {
    throw new Error("Featured seed references could not be resolved.");
  }

  const homepageHeroTitle = [
    heroContent.title.lead,
    heroContent.title.emphasis,
    heroContent.title.tail,
  ].join(" | ");

  return {
    _id: "siteSettings",
    _type: "siteSettings",
    siteTitle: "Cali Central | Independent Calisthenics Media",
    shortTitle: "Cali Central",
    siteDescription: heroContent.description,
    prototypeNotice: "Public prototype / Fictional sample content",
    prototypeStatus: FICTIONAL_PROTOTYPE,
    footerStatement: "Built for the movement. Published with purpose.",
    defaultSeo: seo(
      "Cali Central | Independent Calisthenics Media",
      heroContent.description,
    ),
    homepageHeroEyebrow: heroContent.eyebrow,
    homepageHeroTitle,
    homepageHeroBody: heroContent.description,
    featuredStory: reference(
      documentId("story", canonicalFeaturedStory.slug),
    ),
    featuredAthlete: reference(
      documentId("athlete", featuredAthlete.slug),
    ),
    featuredCompetition: reference(
      documentId("competition", featuredCompetition.slug),
    ),
    featuredVideo: reference(documentId("video", featuredVideo.slug)),
    ...(featuredRankingCategory
      ? {
          featuredRankingCategory: reference(
            documentId("ranking", featuredRankingCategory.slug),
          ),
        }
      : {}),
  };
}

function makeAuthorDocuments(): SeedDocument[] {
  const authorNames = [...new Set(articles.map((article) => article.author))];

  return authorNames.map((name) => {
    const slug = slugify(name);

    return {
      _id: documentId("author", slug),
      _type: "author",
      name,
      slug: { _type: "slug", current: slug },
      role: "Editorial desk",
      initials: initialsForName(name),
      shortBio:
        "A fictional editorial identity used for Cali Central prototype reporting.",
      prototypeStatus: FICTIONAL_PROTOTYPE,
    };
  });
}

function makeStoryDocuments(): SeedDocument[] {
  return articles.map((article) => {
    const authorSlug = slugify(article.author);

    return {
      _id: documentId("story", article.slug),
      _type: "story",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      category: article.category,
      eyebrow: article.heroLabel,
      excerpt: article.dek,
      author: reference(documentId("author", authorSlug)),
      publishedAt: publishedAt(article.publicationDate),
      readTimeMinutes: parseReadTime(article.readTime),
      location: article.location,
      featured: article.featured,
      homepageFeatured: article.homepageFeatured,
      heroVisualVariant: article.heroVariant,
      issueNumber: article.issueNumber,
      body: articleBodyToPortableText(article.body, article.slug),
      tags: [...article.tags],
      relatedStories: references("story", article.relatedSlugs),
      prototypeStatus: FICTIONAL_PROTOTYPE,
      seo: seo(article.title, article.dek),
    };
  });
}

function makeAthleteDocuments(): SeedDocument[] {
  return athleteRecords.map((athlete) => ({
    _id: documentId("athlete", athlete.slug),
    _type: "athlete",
    name: athlete.name,
    slug: { _type: "slug", current: athlete.slug },
    initials: athlete.initials,
    profileNumber: athlete.profileNumber,
    profileStatus: athlete.status,
    city: athlete.city,
    state: athlete.state,
    country: athlete.country,
    administrativeArea: athlete.administrativeArea,
    region: athlete.region,
    primaryDiscipline: athlete.primaryDiscipline,
    primaryCategory: athlete.primaryCategory,
    secondaryDisciplines: athlete.disciplines.filter(
      (discipline) => discipline !== athlete.primaryDiscipline,
    ),
    specialties: [...athlete.specialties],
    profileLabel: athlete.profileLabel,
    disciplineCode: athlete.disciplineCode,
    shortBio: athlete.shortBio,
    fullProfile: paragraphsToPortableText(
      athlete.fullBio,
      `${athlete.slug}-profile`,
    ),
    quote: athlete.quote,
    trainingBase: athlete.trainingBase,
    yearsActive: athlete.yearsActive,
    styleLabel: athlete.style,
    featured: athlete.featured,
    verification: {
      _type: "athleteVerification",
      ...athlete.verification,
    },
    socialLinks: athlete.socialLinks.map((link) => ({
      _key: stableKey(athlete.slug, "social", link.platform),
      _type: "athleteSocialLink",
      ...link,
    })),
    rankingEligible: athlete.rankingEligible,
    visualVariant: athlete.visualVariant,
    statistics: athlete.statistics.map((statistic, index) => ({
      _key: stableKey(
        athlete.slug,
        "statistic",
        statistic.label,
        index + 1,
      ),
      _type: "athleteStatistic",
      label: statistic.label,
      value: statistic.value,
      ...(statistic.detail ? { context: statistic.detail } : {}),
      emphasis: statistic.emphasis ?? false,
    })),
    achievements: athlete.achievements.map((achievement, index) => ({
      _key: stableKey(
        athlete.slug,
        "achievement",
        achievement.year,
        achievement.title,
        index + 1,
      ),
      _type: "athleteAchievement",
      year: parseYear(achievement.year),
      title: achievement.title,
      description: achievement.description,
      status: achievement.status,
    })),
    timeline: athlete.timeline.map((entry, index) => ({
      _key: stableKey(athlete.slug, "timeline", index + 1),
      _type: "timelineEntry",
      dateLabel: entry.dateLabel,
      title: entry.title,
      description: entry.description,
      type: entry.type,
    })),
    competitionHistory: athlete.competitionHistory.map((record, index) => ({
      _key: stableKey(athlete.slug, "competition-history", index + 1),
      _type: "athleteCompetitionRecord",
      ...record,
    })),
    relatedStories: references("story", athlete.relatedStorySlugs),
    relatedAthletes: references("athlete", athlete.relatedAthleteSlugs),
    prototypeStatus: SAMPLE_RECORD,
    seo: seo(
      `${athlete.name} — Fictional athlete profile`,
      athlete.shortBio,
    ),
  }));
}

function makeCompetitionDocuments(): SeedDocument[] {
  return competitions.map((competition) => ({
    _id: documentId("competition", competition.slug),
    _type: "competition",
    name: competition.name,
    shortName: competition.shortName,
    slug: { _type: "slug", current: competition.slug },
    eventNumber: competition.eventNumber,
    status: competition.status,
    contentStatus: competition.contentStatus,
    startDate: competition.startDate,
    ...(competition.endDate ? { endDate: competition.endDate } : {}),
    city: competition.city,
    state: competition.state,
    administrativeArea: competition.administrativeArea ?? competition.state,
    country: competition.country,
    region: competition.region,
    venueName: competition.venueName,
    venueType: competition.venueType,
    summary: competition.summary,
    description: paragraphsToPortableText(
      competition.fullDescription,
      `${competition.slug}-description`,
    ),
    disciplines: [...competition.disciplines],
    primaryDiscipline: competition.primaryDiscipline,
    divisions: competition.divisions.map((division) => ({
      _key: stableKey(competition.slug, "division", division.slug),
      _type: "competitionDivision",
      name: division.name,
      slug: { _type: "slug", current: division.slug },
      discipline: division.discipline,
      level: division.level,
      format: division.format,
      participantLimit: division.participantLimit,
      description: division.description,
    })),
    featured: competition.featured,
    registrationStatus: competition.registrationStatus,
    ...(competition.registrationDeadline
      ? { registrationDeadline: competition.registrationDeadline }
      : {}),
    scheduleStatus: competition.scheduleStatus,
    resultsStatus: competition.resultsStatus,
    capacityLabel: competition.capacityLabel,
    organizerName: competition.organizerName,
    organizerVerificationStatus:
      competition.organizerVerificationStatus ?? "sample",
    actionLinks: (competition.actionLinks ?? []).map((action, index) => ({
      _key: stableKey(competition.slug, "action", index + 1, action.linkType),
      _type: "competitionActionLink",
      label: action.label,
      url: action.url,
      linkType: action.linkType,
      affiliate: action.affiliate,
      ...(action.partnerName ? { partnerName: action.partnerName } : {}),
      ...(action.disclosure ? { disclosure: action.disclosure } : {}),
    })),
    competitionFormat: competition.competitionFormat,
    visualVariant: competition.visualVariant,
    schedule: competition.schedule.map((item, index) => ({
      _key: stableKey(competition.slug, "schedule", index + 1),
      _type: "competitionScheduleItem",
      time: item.time,
      title: item.label,
      description: item.description,
      stage: item.stage,
      status: item.status,
    })),
    participants: competition.participants.map((participant, index) => ({
      _key: stableKey(
        competition.slug,
        "participant",
        participant.athleteSlug ?? participant.athleteName,
        index + 1,
      ),
      _type: "competitionParticipant",
      ...(participant.athleteSlug
        ? {
            athlete: reference(
              documentId("athlete", participant.athleteSlug),
            ),
          }
        : { displayName: participant.athleteName }),
      city: participant.city,
      discipline: participant.discipline,
      seed: participant.seed,
      status: participant.status,
    })),
    results: competition.results.map((result) => ({
      _key: stableKey(
        competition.slug,
        "result",
        result.placement,
        result.athleteSlug ?? result.athleteName,
      ),
      _type: "competitionResult",
      placement: result.placement,
      ...(result.athleteSlug
        ? {
            athlete: reference(
              documentId("athlete", result.athleteSlug),
            ),
          }
        : { displayName: result.athleteName }),
      region: result.region,
      ...(result.category ? { category: result.category } : {}),
      ...(result.division ? { division: result.division } : {}),
      ...(result.ruleset ? { ruleset: result.ruleset } : {}),
      ...(result.bodyweightDisplay
        ? { bodyweightDisplay: result.bodyweightDisplay }
        : {}),
      scoreDisplay: result.scoreDisplay,
      resultLabel: result.resultLabel,
      movementNote: result.movementNote,
      verificationStatus:
        result.verificationStatus ??
        (competition.resultsStatus === "sample-results"
          ? "sample"
          : "unverified"),
      ...(result.sourceType ? { sourceType: result.sourceType } : {}),
      ...(result.sourceName ? { sourceName: result.sourceName } : {}),
      ...(result.sourceUrl ? { sourceUrl: result.sourceUrl } : {}),
      ...(result.videoUrl ? { videoUrl: result.videoUrl } : {}),
      ...(result.verifiedAt ? { verifiedAt: result.verifiedAt } : {}),
    })),
    timeline: competition.timeline.map((entry, index) => ({
      _key: stableKey(competition.slug, "timeline", index + 1),
      _type: "timelineEntry",
      dateLabel: entry.dateLabel,
      title: entry.title,
      description: entry.description,
      type: "Competition",
      status: entry.status,
    })),
    notices: competition.notices.map((notice, index) => ({
      _key: stableKey(competition.slug, "notice", index + 1),
      _type: "competitionNotice",
      label: notice.label,
      text: notice.text,
      emphasis: notice.emphasis,
    })),
    relatedStories: references("story", competition.relatedStorySlugs),
    relatedAthletes: references("athlete", competition.relatedAthleteSlugs),
    relatedCompetitions: references(
      "competition",
      competition.relatedCompetitionSlugs,
    ),
    prototypeStatus: SAMPLE_RECORD,
    seo: seo(
      `${competition.name} — Fictional competition`,
      competition.summary,
    ),
  }));
}

function makeVideoSeriesDocuments(): SeedDocument[] {
  return videoSeries.map((series, index) => ({
    _id: documentId("videoSeries", series.slug),
    _type: "videoSeries",
    title: series.title,
    slug: { _type: "slug", current: series.slug },
    description: series.description,
    categoryFocus: categoriesForVideoSeries(series.slug),
    displayOrder: index + 1,
    prototypeStatus: FICTIONAL_PROTOTYPE,
  }));
}

function makeVideoDocuments(): SeedDocument[] {
  return videoRecords.map((video) => ({
    _id: documentId("video", video.slug),
    _type: "video",
    title: video.title,
    shortTitle: video.shortTitle,
    slug: { _type: "slug", current: video.slug },
    series: reference(documentId("videoSeries", video.seriesSlug)),
    episodeNumber: parsePositiveInteger(
      video.episodeNumber,
      `episode number for ${video.slug}`,
    ),
    category: video.category,
    format: video.format,
    status: video.status,
    durationSeconds: video.durationSeconds,
    publishedAt: video.publishedDate,
    location: video.location,
    summary: video.summary,
    description: paragraphsToPortableText(
      video.description,
      `${video.slug}-description`,
    ),
    editorialNotes: (video.editorialNotes ?? []).map((note, index) => ({
      _key: stableKey(video.slug, "editorial-note", index + 1),
      _type: "editorialNote",
      heading: note.heading,
      text: note.text,
    })),
    featured: video.featured,
    homepageFeatured: video.homepageFeatured,
    visualVariant: video.visualVariant,
    posterLabel: video.posterLabel,
    frameCode: video.frameCode,
    chapters: video.chapters.map((chapter) => ({
      _key: stableKey(
        video.slug,
        "chapter",
        chapter.timestampSeconds,
      ),
      _type: "videoChapter",
      timestampSeconds: chapter.timestampSeconds,
      title: chapter.title,
      description: chapter.description,
    })),
    transcript: (video.transcript ?? []).map((block, index) => ({
      _key: stableKey(video.slug, "transcript", index + 1),
      _type: "transcriptBlock",
      speaker: block.speaker,
      ...(block.timestamp
        ? { timestampSeconds: parseDuration(block.timestamp) }
        : {}),
      text: block.text,
    })),
    credits: video.credits.map((credit, index) => ({
      _key: stableKey(video.slug, "credit", index + 1),
      _type: "videoCredit",
      role: credit.role,
      name: credit.name,
      status: credit.status,
    })),
    tags: [...video.tags],
    availabilityLabel: video.availabilityLabel,
    ownershipStatus: video.source?.ownershipStatus ?? "source-unavailable",
    sourcePlatform: video.source?.platform,
    sourceAccount: video.source?.account,
    originalPostUrl: video.source?.originalPostUrl,
    discoverContext: video.discoverContext,
    platformMetrics: (video.platformMetrics ?? []).map((metric, index) => ({
      _key: stableKey(video.slug, "platform-metric", index + 1),
      _type: "videoPlatformMetric",
      platform: metric.platform,
      label: metric.label,
      value: metric.value,
      observedAt: metric.observedAt,
      sourceUrl: metric.sourceUrl,
    })),
    relatedAthletes: references("athlete", video.relatedAthleteSlugs),
    relatedCompetitions: references(
      "competition",
      video.relatedCompetitionSlugs,
    ),
    relatedStories: references("story", video.relatedStorySlugs),
    relatedVideos: references("video", video.relatedVideoSlugs),
    prototypeStatus: FICTIONAL_PROTOTYPE,
    seo: seo(
      `${video.title} — Fictional media record`,
      `${video.summary} Static preview; no playback is available.`,
    ),
  }));
}

function makeRankingDocuments(): SeedDocument[] {
  return rankingCategories.map((category, categoryIndex) => ({
    _id: documentId("ranking", category.slug),
    _type: "rankingCategory",
    title: category.title,
    slug: { _type: "slug", current: category.slug },
    subtitle: category.subtitle,
    discipline: category.discipline,
    division: category.division,
    region: category.region,
    scope: category.scope,
    status: category.status,
    methodologyStatus: category.methodologyStatus,
    seasonLabel: category.seasonLabel,
    seasonStart: category.seasonStart,
    seasonEnd: category.seasonEnd,
    updatedAt: "2026-07-01T12:00:00.000Z",
    description: category.description,
    displayOrder: categoryIndex + 1,
    entries: category.entries.map((entry) => ({
      _key: stableKey(
        category.slug,
        "entry",
        entry.athleteSlug,
      ),
      _type: "rankingEntry",
      rank: entry.rank,
      athlete: reference(documentId("athlete", entry.athleteSlug)),
      points: entry.points,
      movementDirection: entry.movement.direction,
      movementAmount: entry.movement.amount,
      movementLabel: entry.movement.label,
      status: entry.statusLabel,
      sources: entry.sources.map((source) => ({
        _key: stableKey(category.slug, entry.athleteSlug, source.resultKey),
        _type: "standingResultSource",
        competition: reference(
          documentId("competition", source.competitionSlug),
        ),
        resultKey: source.resultKey,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        verificationStatus: source.verificationStatus,
      })),
    })),
    methodologyNote:
      "Publish only after the scoring methodology is approved and every entry is linked to verified public result provenance.",
    prototypeStatus: NOT_OFFICIAL,
    seo: seo(
      `${category.title} — Competition standings`,
      category.description,
    ),
  }));
}

function makeSeedDocuments(): SeedDocument[] {
  return [
    makeSiteSettings(),
    ...makeAuthorDocuments(),
    ...makeStoryDocuments(),
    ...makeAthleteDocuments(),
    ...makeCompetitionDocuments(),
    ...makeVideoSeriesDocuments(),
    ...makeVideoDocuments(),
    ...makeRankingDocuments(),
  ];
}

function walkReferences(value: unknown, visit: (item: Reference) => void) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkReferences(item, visit));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;

  if (
    record._type === "reference" &&
    typeof record._ref === "string"
  ) {
    visit(record as Reference);
  }

  Object.values(record).forEach((item) => walkReferences(item, visit));
}

function validateArrayKeys(value: unknown, path: string) {
  if (Array.isArray(value)) {
    const keyedItems = value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>)._key === "string",
    );
    const keys = keyedItems.map((item) => item._key as string);

    if (new Set(keys).size !== keys.length) {
      throw new Error(`Duplicate array _key at ${path}.`);
    }

    value.forEach((item, index) =>
      validateArrayKeys(item, `${path}[${index}]`),
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([field, item]) =>
      validateArrayKeys(item, `${path}.${field}`),
    );
  }
}

function validateSeedDocuments(documents: readonly SeedDocument[]) {
  const documentIds = documents.map((document) => document._id);
  const knownIds = new Set(documentIds);

  if (knownIds.size !== documentIds.length) {
    throw new Error("Seed contains duplicate document IDs.");
  }

  if (homepageStorySlugs.size !== supportingStories.length + 1) {
    throw new Error("Homepage story previews contain duplicate IDs.");
  }

  homepageStorySlugs.forEach((slug) => {
    if (!articles.some((article) => article.slug === slug)) {
      throw new Error(
        `Homepage story preview ${slug} has no canonical article record.`,
      );
    }
  });

  documents.forEach((document) => {
    walkReferences(document, (item) => {
      if (!knownIds.has(item._ref)) {
        throw new Error(
          `Document ${document._id} has unresolved reference ${item._ref}.`,
        );
      }

      if (item._ref === document._id) {
        throw new Error(
          `Document ${document._id} contains a self-reference.`,
        );
      }
    });

    validateArrayKeys(document, document._id);
  });

  videoRecords.forEach((video) => {
    if (parseDuration(video.duration) !== video.durationSeconds) {
      throw new Error(`Duration mismatch for video ${video.slug}.`);
    }

    video.chapters.forEach((chapter) => {
      if (
        parseDuration(chapter.timestamp) !== chapter.timestampSeconds ||
        chapter.timestampSeconds >= video.durationSeconds
      ) {
        throw new Error(
          `Invalid chapter timestamp for video ${video.slug}.`,
        );
      }
    });

    video.transcript?.forEach((block) => {
      if (
        block.timestamp &&
        parseDuration(block.timestamp) > video.durationSeconds
      ) {
        throw new Error(
          `Invalid transcript timestamp for video ${video.slug}.`,
        );
      }
    });
  });

  competitions.forEach((competition) => {
    if (
      competition.endDate &&
      competition.endDate < competition.startDate
    ) {
      throw new Error(
        `Competition ${competition.slug} ends before it starts.`,
      );
    }

    if (
      competition.results.length > 0 &&
      competition.status !== "completed"
    ) {
      throw new Error(
        `Competition ${competition.slug} has results before completion.`,
      );
    }

    competition.relatedVideoSlugs.forEach((videoSlug) => {
      const owningVideo = videoRecords.find(
        (video) => video.slug === videoSlug,
      );

      if (
        !owningVideo ||
        !owningVideo.relatedCompetitionSlugs.includes(competition.slug)
      ) {
        throw new Error(
          `Competition ${competition.slug} has a video relationship not represented by owning video ${videoSlug}.`,
        );
      }
    });
  });

  rankingCategories.forEach((category) => {
    const ranks = category.entries.map((entry) => entry.rank);
    const athleteSlugs = category.entries.map(
      (entry) => entry.athleteSlug,
    );

    if (
      new Set(ranks).size !== ranks.length ||
      new Set(athleteSlugs).size !== athleteSlugs.length
    ) {
      throw new Error(
        `Ranking category ${category.slug} has duplicate ranks or athletes.`,
      );
    }
  });
}

async function writeDocuments(documents: readonly SeedDocument[]) {
  if (process.env.CONFIRM_SANITY_SEED !== "YES") {
    throw new Error(
      "Write refused. Set CONFIRM_SANITY_SEED=YES only after reviewing the dry run.",
    );
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? API_VERSION_FALLBACK;

  if (!token) {
    throw new Error(
      "Write refused. SANITY_API_WRITE_TOKEN is required and must remain server-only.",
    );
  }

  if (!projectId || !dataset) {
    throw new Error(
      "Write refused. NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are required.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
  const transaction = documents.reduce(
    (current, document) => current.createOrReplace(document),
    client.transaction(),
  );

  await transaction.commit({ visibility: "sync" });

  console.log(
    `Seed complete: ${documents.length} deterministic sample documents were created or replaced.`,
  );
  console.log(
    "No delete operations were issued and no unrelated document IDs were touched.",
  );
}

async function main() {
  const argumentsList = process.argv.slice(2);
  const supportedArguments = new Set(["--dry-run", "--ndjson", "--write"]);
  const unsupportedArgument = argumentsList.find(
    (argument) => !supportedArguments.has(argument),
  );

  if (unsupportedArgument) {
    throw new Error(`Unsupported seed argument: ${unsupportedArgument}`);
  }

  const argumentsSet = new Set(argumentsList);
  const selectedModes = ["--dry-run", "--ndjson", "--write"].filter(
    (argument) => argumentsSet.has(argument),
  );
  const shouldWrite = argumentsSet.has("--write");
  const shouldEmitNdjson = argumentsSet.has("--ndjson");

  if (selectedModes.length > 1) {
    throw new Error(
      "Choose exactly one of --dry-run, --ndjson, or --write.",
    );
  }

  const documents = makeSeedDocuments();
  validateSeedDocuments(documents);

  if (shouldEmitNdjson) {
    documents.forEach((document) => {
      console.log(JSON.stringify(document));
    });
    return;
  }

  if (shouldWrite) {
    await writeDocuments(documents);
    return;
  }

  const counts = documents.reduce<Record<string, number>>(
    (result, document) => {
      result[document._type] = (result[document._type] ?? 0) + 1;
      return result;
    },
    {},
  );

  console.log(
    "Dry run only. This script issued no Sanity client request or dataset mutation.",
  );
  console.log(`Validated ${documents.length} deterministic documents:`);
  Object.entries(counts)
    .sort(([first], [second]) => first.localeCompare(second))
    .forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
  console.log(
    "Homepage story selection was validated by ID; canonical article records supply all persisted story fields.",
  );
  console.log("Document IDs:");
  documents.forEach((document) => console.log(`- ${document._id}`));
  console.log(
    "Use --ndjson to emit reviewable NDJSON or --write with the required confirmation guard and write token.",
  );
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown seed failure.";

  console.error(`Sanity seed failed: ${message}`);
  process.exitCode = 1;
});
