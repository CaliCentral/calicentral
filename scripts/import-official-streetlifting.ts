import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SanityClient } from "next-sanity";
import { z } from "zod";

import { countryCodeFor, countryNameFor } from "../lib/geography";
import {
  findRegisteredSource,
  loadSourceRegistry,
  sourceApprovalBlockers,
} from "./lib/source-registry";

type JsonRecord = Record<string, unknown>;
type ImportDocument = {
  readonly _id: string;
  readonly _type: string;
  readonly [field: string]: unknown;
};

const API_VERSION_FALLBACK = "2026-07-01";
const PROVIDER_ID = "rankingProvider.official-streetlifting";
const PROVIDER_SLUG = "official-streetlifting";
const SOURCE_ID = "official-streetlifting";
const ABU_ATHLETE_ID = "athlete.abu-asada";
const ABU_PROVIDER_ATHLETE_ID = "abu-asada";
const DEFAULT_INPUT =
  "data/imports/official-streetlifting/2026-08-11-male-all4-minus-101kg.json";
const TMP_DIRECTORY = ".tmp";
const MANIFEST_FILE = "official-streetlifting-athletes.json";
const IMPORT_REPORT_JSON = "official-streetlifting-import-report.json";
const IMPORT_REPORT_MARKDOWN = "official-streetlifting-import-report.md";
const CLEANUP_REPORT_JSON = "official-streetlifting-sample-cleanup.json";
const CLEANUP_REPORT_MARKDOWN = "official-streetlifting-sample-cleanup.md";
const MAX_INPUT_FILES = 100;
const MAX_INPUT_FILE_BYTES = 5_000_000;
const MAX_UNIQUE_ATHLETES = 10_000;
const MAX_SNAPSHOTS = 500;
const QUERY_ID_BATCH_SIZE = 40;
const QUERY_PAGE_SIZE = 200;
const QUERY_CONCURRENCY = 4;
const CREATE_BATCH_DOCUMENT_LIMIT = 100;
const CREATE_BATCH_BYTE_LIMIT = 750_000;
const REVIEWED_RANKING_SYSTEM_ID =
  "rankingSystem.official-streetlifting-male-all4-world-minus-101kg";
const REVIEWED_RANKING_SYSTEM_SLUG =
  "official-streetlifting-male-all4-world-minus-101kg";
const REVIEWED_RANKING_DATE = "2026-08-11";
const REVIEWED_CHECKED_AT = "2026-08-11T22:24:39Z";
const REVIEWED_SOURCE_URL =
  "https://rankings.officialstreetlifting.com/records/male/classes/-101kg";
const REVIEWED_SOURCE_TITLE =
  "Official Streetlifting — All4 Male -101kg Weight Class";
const REVIEWED_SELECTION =
  "Positions 1 through 8 and position 17 (Abu Asada)";

type ReviewedEntry = {
  readonly displayName: string;
  readonly countryCode: string;
  readonly country: string;
  readonly position: number;
  readonly performanceValue: number;
  readonly canonicalAthleteId?: string;
};

const REVIEWED_ENTRIES = new Map<string, ReviewedEntry>([
  [
    "xavier-macias",
    {
      displayName: "Xavier Macias",
      countryCode: "ITA",
      country: "Italy",
      position: 1,
      performanceValue: 625.25,
    },
  ],
  [
    "mathew-zlat",
    {
      displayName: "Mathew Zlat",
      countryCode: "RUS",
      country: "Russia",
      position: 2,
      performanceValue: 587.5,
    },
  ],
  [
    "bikai-christian-kevin",
    {
      displayName: "Bikai Christian Kevin",
      countryCode: "CMR",
      country: "Cameroon",
      position: 3,
      performanceValue: 547.5,
    },
  ],
  [
    "valerio-naldi",
    {
      displayName: "Valerio Naldi",
      countryCode: "ITA",
      country: "Italy",
      position: 4,
      performanceValue: 526.25,
    },
  ],
  [
    "miguel-tirado",
    {
      displayName: "Miguel Tirado",
      countryCode: "ESP",
      country: "Spain",
      position: 5,
      performanceValue: 525,
    },
  ],
  [
    "albin-gordan",
    {
      displayName: "Albin Gordan",
      countryCode: "SWE",
      country: "Sweden",
      position: 6,
      performanceValue: 522.5,
    },
  ],
  [
    "jermaine-straker",
    {
      displayName: "Jermaine Straker",
      countryCode: "GBR",
      country: "United Kingdom",
      position: 7,
      performanceValue: 520,
    },
  ],
  [
    "christian-kevin-bikai",
    {
      displayName: "Christian Kevin Bikai",
      countryCode: "FRA",
      country: "France",
      position: 8,
      performanceValue: 518.75,
    },
  ],
  [
    ABU_PROVIDER_ATHLETE_ID,
    {
      displayName: "Abu Asada",
      countryCode: "USA",
      country: "United States",
      position: 17,
      performanceValue: 500,
      canonicalAthleteId: ABU_ATHLETE_ID,
    },
  ],
]);

const REVIEWED_PROVIDER_COUNTRY_CODES = new Map<string, string>([
  ["CMR", "CM"],
  ["ESP", "ES"],
  ["FRA", "FR"],
  ["GBR", "GB"],
  ["ITA", "IT"],
  ["RUS", "RU"],
  ["SWE", "SE"],
  ["USA", "US"],
]);

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  }, "Expected a public HTTP(S) URL without embedded credentials.");

const sourceEntrySchema = z
  .object({
    providerAthleteId: z.string().trim().min(1).max(180),
    providerAthleteUrl: httpUrl,
    providerDisplayName: z.string().trim().min(1).max(140),
    countryCode: z.string().trim().regex(/^[A-Z]{2,3}$/),
    country: z.string().trim().min(1).max(80),
    position: z.number().int().positive(),
    performance: z
      .object({
        metric: z.string().trim().min(1).max(100),
        value: z.number().nonnegative(),
        unit: z.literal("kg"),
      })
      .strict()
      .optional(),
    canonicalAthleteId: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

const inputSchema = z
  .object({
    schemaVersion: z.literal(1),
    sourceId: z.literal(SOURCE_ID),
    collectionMethod: z.literal("manual-editorial"),
    provider: z
      .object({
        canonicalId: z.literal(PROVIDER_ID),
        slug: z.literal(PROVIDER_SLUG),
        name: z.literal("Official Streetlifting"),
        website: httpUrl,
        integrationMethod: z.literal("manual"),
        status: z.literal("under-review"),
      })
      .strict(),
    sourceRights: z
      .object({
        reviewStatus: z.enum(["review-pending", "approved"]),
        automatedCollectionAllowed: z.boolean(),
        notes: z.string().trim().min(1).max(2000),
      })
      .strict(),
    rankingSystem: z
      .object({
        canonicalId: z.string().trim().min(1),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(96)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        name: z.string().trim().min(1).max(160),
        rankingKind: z.literal("ordinal-position"),
        discipline: z.literal("Streetlifting"),
        category: z.enum(["All4", "Classic"]),
        sexDivision: z.enum(["Male", "Female"]),
        weightClass: z.string().trim().min(1).max(80),
        geographicScope: z.string().trim().min(1).max(120),
        status: z.literal("draft"),
      })
      .strict(),
    snapshot: z
      .object({
        rankingDate: z.string().date(),
        checkedAt: z.string().datetime({ offset: true }),
        coverage: z.enum(["selected-rows", "complete"]),
        selection: z.string().trim().min(1).max(2000),
        sourceTitle: z.string().trim().min(1).max(180),
        sourceType: z.literal("organization-ranking-page"),
        sourceUrl: httpUrl,
        verificationStatus: z.literal("source-confirmed"),
        entries: z.array(sourceEntrySchema).min(1).max(1000),
      })
      .strict(),
  })
  .strict();

type ImportInput = z.infer<typeof inputSchema>;
type SourceEntry = z.infer<typeof sourceEntrySchema>;

type LoadedInput = {
  readonly inputPath: string;
  readonly relativePath: string;
  readonly input: ImportInput;
};

type ImportBundle = {
  readonly manifests: readonly LoadedInput[];
  readonly athletes: readonly SourceEntry[];
  readonly systemInputs: readonly ImportInput[];
  readonly snapshotInputs: readonly ImportInput[];
  readonly sourceEntryOccurrences: number;
  readonly sourcePages: readonly string[];
};

type VariantDocument = {
  readonly _id: string;
  readonly _type: string;
  readonly _canonicalId?: string;
};

type NonProductionAthleteStatus =
  | "sample-record"
  | "fictional-prototype"
  | "not-official";

type CreateBatch = {
  readonly phase: "systems" | "athletes-and-identities" | "snapshots";
  readonly documents: readonly ImportDocument[];
};

type ExistingDocument = {
  readonly _id: string;
  readonly _type: string;
  readonly _canonicalId?: string;
  readonly variantIds: readonly string[];
};

type ExistingAthlete = ExistingDocument & {
  readonly name?: string;
  readonly slug?: string;
  readonly prototypeStatus?: string;
};

type ExistingIdentity = ExistingDocument & {
  readonly providerAthleteId?: string;
  readonly athleteId?: string;
  readonly matchingStatus?: string;
  readonly reviewStatus?: string;
};

type ExistingProvider = ExistingDocument & {
  readonly name?: string;
  readonly slug?: string;
  readonly status?: string;
  readonly integrationMethod?: string;
};

type ExistingSystem = ExistingDocument & {
  readonly slug?: string;
  readonly name?: string;
  readonly providerId?: string;
  readonly rankingKind?: string;
  readonly discipline?: string;
  readonly category?: string;
  readonly sexDivision?: string;
  readonly weightClass?: string;
  readonly geographicScope?: string;
  readonly status?: string;
};

type ExistingSnapshotEntry = {
  readonly athleteId?: string;
  readonly sourceDisplayName?: string;
  readonly providerAthleteId?: string;
  readonly position?: number;
  readonly points?: number;
  readonly rating?: number;
  readonly previousPosition?: number;
  readonly status?: string;
};

type ExistingSnapshotSource = {
  readonly providerId?: string;
  readonly sourceTitle?: string;
  readonly sourceType?: string;
  readonly url?: string;
  readonly externalRecordId?: string;
  readonly publishedAt?: string;
  readonly checkedAt?: string;
  readonly verificationStatus?: string;
};

type ExistingSnapshot = ExistingDocument & {
  readonly systemId?: string;
  readonly rankingDate?: string;
  readonly sourcePublishedAt?: string;
  readonly checkedAt?: string;
  readonly entries?: readonly ExistingSnapshotEntry[];
  readonly source?: ExistingSnapshotSource;
  readonly publicationStatus?: string;
};

type SampleAthlete = ExistingDocument & {
  readonly name?: string;
  readonly prototypeStatus?: string;
  readonly variantStatusConflict: boolean;
};

type ExistingState = {
  readonly provider?: ExistingProvider;
  readonly athletes: readonly ExistingAthlete[];
  readonly identities: readonly ExistingIdentity[];
  readonly systems: readonly ExistingSystem[];
  readonly snapshots: readonly ExistingSnapshot[];
  readonly samples: readonly SampleAthlete[];
};

type RawAthlete = Omit<ExistingAthlete, "variantIds">;
type RawIdentity = Omit<ExistingIdentity, "variantIds">;
type RawProvider = Omit<ExistingProvider, "variantIds">;
type RawSystem = Omit<ExistingSystem, "variantIds">;
type RawSnapshot = Omit<ExistingSnapshot, "variantIds">;

type PlannedAthlete = {
  readonly source: SourceEntry;
  readonly canonicalAthleteId: string;
  readonly matchMethod:
    | "existing-provider-identity"
    | "explicit-editorial-mapping"
    | "new-canonical-athlete";
  readonly athleteDocument?: ImportDocument;
  readonly identityDocument?: ImportDocument;
};

type CleanupReference = {
  readonly documentId: string;
  readonly documentType: string;
  readonly label: string;
  readonly paths: readonly string[];
  readonly classification:
    | "SAMPLE/PROTOTYPE CONTENT"
    | "REAL CONTENT"
    | "SITE CONFIGURATION"
    | "UNKNOWN / NEEDS REVIEW";
  readonly remediation: string;
};

type CleanupCandidate = {
  readonly athleteId: string;
  readonly name: string;
  readonly prototypeStatus: string;
  readonly references: readonly CleanupReference[];
  readonly referencePathCount: number;
  readonly safeToRemove: boolean;
  readonly associatedSampleRecords: readonly string[];
  readonly documentVariants: readonly string[];
  readonly safetyReasons: readonly string[];
};

type AnonymousDatasetCheck = {
  readonly verified: boolean;
  readonly private: boolean;
  readonly aclMode?: string;
  readonly anonymousDocumentCount?: number;
  readonly anonymousInternalDocumentCount?: number;
  readonly reason?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function chunksOf<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(items[index], index);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

function isDraftId(id: string): boolean {
  return id.startsWith("drafts.");
}

function isReleaseVersionId(id: string): boolean {
  return id.startsWith("versions.");
}

function canonicalIdForVariant(id: string): string {
  if (isDraftId(id)) {
    return id.slice("drafts.".length);
  }
  if (isReleaseVersionId(id)) {
    const [, releaseName, ...publishedIdParts] = id.split(".");
    if (releaseName && publishedIdParts.length > 0) {
      return publishedIdParts.join(".");
    }
  }
  return id;
}

function collapseDraftVariants<
  T extends {
    readonly _id: string;
    readonly _type: string;
    readonly _canonicalId?: string;
  },
>(
  documents: readonly T[],
): Array<T & ExistingDocument> {
  const groups = new Map<string, T[]>();

  for (const document of documents) {
    const canonicalId =
      document._canonicalId ?? canonicalIdForVariant(document._id);
    const group = groups.get(canonicalId) ?? [];
    group.push(document);
    groups.set(canonicalId, group);
  }

  return [...groups.entries()].map(([canonicalId, variants]) => {
    const selected =
      variants.find((variant) => isDraftId(variant._id)) ?? variants[0];
    return {
      ...selected,
      _id: canonicalId,
      variantIds: variants.map((variant) => variant._id).sort(),
    };
  });
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableIdPart(providerAthleteId: string): string {
  const normalized = providerAthleteId
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  if (normalized && normalized === providerAthleteId && normalized.length <= 72) {
    return normalized;
  }

  const prefix = normalized.slice(0, 48) || "athlete";
  return `${prefix}-${sha256(providerAthleteId).slice(0, 12)}`;
}

function canonicalAthleteId(providerAthleteId: string): string {
  return `athlete.official-streetlifting.${stableIdPart(providerAthleteId)}`;
}

function externalIdentityId(providerAthleteId: string): string {
  return `externalAthleteIdentity.official-streetlifting.${stableIdPart(providerAthleteId)}`;
}

function snapshotId(input: ImportInput): string {
  return `rankingSnapshot.${input.rankingSystem.slug}.${input.snapshot.rankingDate}`;
}

function reference(id: string) {
  return { _type: "reference", _ref: id };
}

function slug(current: string) {
  return { _type: "slug", current };
}

function initialsFor(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .toLocaleUpperCase()
    .slice(0, 4);

  if (initials.length < 2) {
    throw new Error(`Cannot derive valid initials for ${name}.`);
  }

  return initials;
}

function makeAthleteDocument(entry: SourceEntry, id: string): ImportDocument {
  const countryCode = countryCodeFor(entry.country);
  if (!countryCode) {
    throw new Error(
      `Unsupported country '${entry.country}' for ${entry.providerAthleteId}.`,
    );
  }

  const idPart = stableIdPart(entry.providerAthleteId);

  return {
    _id: id,
    _type: "athlete",
    name: entry.providerDisplayName,
    slug: slug(`osl-${idPart}`.slice(0, 96)),
    initials: initialsFor(entry.providerDisplayName),
    profileNumber: `OSL-${sha256(entry.providerAthleteId).slice(0, 10).toUpperCase()}`,
    profileStatus: "Internal athlete / not reviewed",
    country: countryNameFor(entry.country),
    primaryDiscipline: "Strength",
    primaryCategory: "power-strength",
    featured: false,
    rankingEligible: false,
    verification: {
      _type: "athleteVerification",
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    visualVariant: "signal",
    disciplineCode: "OSL",
  };
}

function makeIdentityDocument(
  entry: SourceEntry,
  athleteId: string,
  generatedAt: string,
): ImportDocument {
  return {
    _id: externalIdentityId(entry.providerAthleteId),
    _type: "externalAthleteIdentity",
    athlete: reference(athleteId),
    provider: reference(PROVIDER_ID),
    providerAthleteId: entry.providerAthleteId,
    providerAthleteUrl: entry.providerAthleteUrl,
    providerDisplayName: entry.providerDisplayName,
    matchingStatus: "candidate",
    reviewStatus: "not-reviewed",
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}

function makeSystemDocument(input: ImportInput): ImportDocument {
  return {
    _id: input.rankingSystem.canonicalId,
    _type: "rankingSystem",
    name: input.rankingSystem.name,
    slug: slug(input.rankingSystem.slug),
    provider: reference(PROVIDER_ID),
    rankingKind: input.rankingSystem.rankingKind,
    discipline: input.rankingSystem.discipline,
    category: input.rankingSystem.category,
    weightClass: input.rankingSystem.weightClass,
    sexDivision: input.rankingSystem.sexDivision,
    geographicScope: input.rankingSystem.geographicScope,
    status: "draft",
  };
}

function makeSnapshotDocument(
  input: ImportInput,
  plannedAthletes: readonly PlannedAthlete[],
): ImportDocument {
  return {
    _id: snapshotId(input),
    _type: "rankingSnapshot",
    rankingSystem: reference(input.rankingSystem.canonicalId),
    rankingDate: input.snapshot.rankingDate,
    checkedAt: input.snapshot.checkedAt,
    entries: plannedAthletes.map(({ source, canonicalAthleteId: athleteId }) => ({
      _key: stableIdPart(source.providerAthleteId),
      _type: "rankingSnapshotEntry",
      athlete: reference(athleteId),
      sourceDisplayName: source.providerDisplayName,
      providerAthleteId: source.providerAthleteId,
      position: source.position,
      status: "ranked",
    })),
    source: {
      _type: "provenanceSource",
      provider: reference(PROVIDER_ID),
      sourceTitle: input.snapshot.sourceTitle,
      sourceType: input.snapshot.sourceType,
      url: input.snapshot.sourceUrl,
      externalRecordId: `${input.rankingSystem.slug}:${input.snapshot.rankingDate}:${input.snapshot.coverage}`,
      checkedAt: input.snapshot.checkedAt,
      verificationStatus: input.snapshot.verificationStatus,
    },
    publicationStatus: "draft",
  };
}

function parseArguments() {
  const args = process.argv.slice(2);
  const inputArguments = args.filter((argument) =>
    argument.startsWith("--input="),
  );
  const inputDirectoryArguments = args.filter((argument) =>
    argument.startsWith("--input-dir="),
  );
  const unknownArguments = args.filter(
    (argument) =>
      argument !== "--write" &&
      argument !== "--delete-samples" &&
      argument !== "--validate" &&
      !argument.startsWith("--input=") &&
      !argument.startsWith("--input-dir="),
  );

  if (unknownArguments.length > 0) {
    throw new Error(`Unsupported argument(s): ${unknownArguments.join(", ")}`);
  }
  if (inputDirectoryArguments.length > 1) {
    throw new Error("Only one --input-dir=<workspace-relative-directory> is allowed.");
  }

  const write = args.includes("--write");
  const deleteSamples = args.includes("--delete-samples");
  const validateOnly = args.includes("--validate");
  if ([write, deleteSamples, validateOnly].filter(Boolean).length > 1) {
    throw new Error(
      "--validate, --write, and --delete-samples are mutually exclusive review modes.",
    );
  }

  if (inputArguments.some((argument) => argument === "--input=")) {
    throw new Error("--input requires a workspace-relative path.");
  }
  const inputDirectoryArgument = inputDirectoryArguments[0];
  if (inputDirectoryArgument === "--input-dir=") {
    throw new Error("--input-dir requires a workspace-relative directory.");
  }

  return {
    write,
    deleteSamples,
    validateOnly,
    inputs: inputArguments.map((argument) => argument.slice("--input=".length)),
    inputDirectory: inputDirectoryArgument?.slice("--input-dir=".length),
  };
}

function resolveInsideWorkspace(workspace: string, relativePath: string): string {
  const resolved = path.resolve(workspace, relativePath);
  const relative = path.relative(workspace, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path must remain inside the workspace: ${relativePath}`);
  }

  return resolved;
}

function rankingDimensionSlug(value: string): string {
  const trimmed = value.trim();
  const signPrefix = trimmed.startsWith("-")
    ? "minus-"
    : trimmed.startsWith("+")
      ? "plus-"
      : "";
  const unsigned = signPrefix ? trimmed.slice(1) : trimmed;
  return `${signPrefix}${unsigned
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")}`;
}

function expectedRankingSystemSlug(input: ImportInput): string {
  return [
    PROVIDER_SLUG,
    input.rankingSystem.sexDivision,
    input.rankingSystem.category,
    input.rankingSystem.geographicScope,
    input.rankingSystem.weightClass,
  ]
    .map(rankingDimensionSlug)
    .join("-");
}

function validateInputRelationships(
  input: ImportInput,
  requireExactFixture: boolean,
): string[] {
  const errors: string[] = [];
  const identities = new Set<string>();
  const positions = new Set<number>();
  const expectedSystemSlug = expectedRankingSystemSlug(input);

  if (input.provider.website !== "https://rankings.officialstreetlifting.com/") {
    errors.push(`Unexpected provider website: ${input.provider.website}`);
  }
  if (
    input.rankingSystem.canonicalId !==
    `rankingSystem.${input.rankingSystem.slug}`
  ) {
    errors.push(
      `Ranking system ID must be rankingSystem.<slug>; received ${input.rankingSystem.canonicalId}.`,
    );
  }
  if (!input.rankingSystem.slug.startsWith(`${PROVIDER_SLUG}-`)) {
    errors.push(
      `Ranking system slug must be provider-scoped with ${PROVIDER_SLUG}-.`,
    );
  }
  if (input.rankingSystem.slug !== expectedSystemSlug) {
    errors.push(
      `Ranking system slug must be derived from provider, sex division, category, geographic scope, and weight class; expected ${expectedSystemSlug}, received ${input.rankingSystem.slug}.`,
    );
  }
  if (
    input.rankingSystem.canonicalId !== `rankingSystem.${expectedSystemSlug}`
  ) {
    errors.push(
      `Ranking system canonical ID conflicts with its provider dimensions; expected rankingSystem.${expectedSystemSlug}.`,
    );
  }
  const sourceUrl = new URL(input.snapshot.sourceUrl);
  if (
    sourceUrl.protocol !== "https:" ||
    sourceUrl.origin !== "https://rankings.officialstreetlifting.com"
  ) {
    errors.push(
      `Ranking source must use the reviewed Official Streetlifting host: ${input.snapshot.sourceUrl}`,
    );
  }

  if (requireExactFixture) {
    if (input.rankingSystem.canonicalId !== REVIEWED_RANKING_SYSTEM_ID) {
      errors.push(
        `Unexpected ranking system ID: ${input.rankingSystem.canonicalId}`,
      );
    }
    if (input.rankingSystem.slug !== REVIEWED_RANKING_SYSTEM_SLUG) {
      errors.push(`Unexpected ranking system slug: ${input.rankingSystem.slug}`);
    }
    if (
      input.rankingSystem.name !==
      "Official Streetlifting — Male All4 -101kg World"
    ) {
      errors.push(`Unexpected ranking system name: ${input.rankingSystem.name}`);
    }
    if (
      input.rankingSystem.category !== "All4" ||
      input.rankingSystem.sexDivision !== "Male" ||
      input.rankingSystem.weightClass !== "-101kg" ||
      input.rankingSystem.geographicScope !== "World"
    ) {
      errors.push(
        "Reviewed source is restricted to the Male All4 -101kg World ranking.",
      );
    }
    if (input.snapshot.rankingDate !== REVIEWED_RANKING_DATE) {
      errors.push(
        `Unexpected observation-date rankingDate: ${input.snapshot.rankingDate}`,
      );
    }
    if (input.snapshot.checkedAt !== REVIEWED_CHECKED_AT) {
      errors.push(`Unexpected checkedAt timestamp: ${input.snapshot.checkedAt}`);
    }
    if (input.snapshot.coverage !== "selected-rows") {
      errors.push(`Unexpected reviewed coverage: ${input.snapshot.coverage}`);
    }
    if (input.snapshot.selection !== REVIEWED_SELECTION) {
      errors.push(`Unexpected reviewed selection: ${input.snapshot.selection}`);
    }
    if (input.snapshot.sourceTitle !== REVIEWED_SOURCE_TITLE) {
      errors.push(`Unexpected source title: ${input.snapshot.sourceTitle}`);
    }
    if (input.snapshot.sourceUrl !== REVIEWED_SOURCE_URL) {
      errors.push(`Unexpected ranking source URL: ${input.snapshot.sourceUrl}`);
    }
    if (input.snapshot.entries.length !== REVIEWED_ENTRIES.size) {
      errors.push(
        `Reviewed input must contain exactly ${REVIEWED_ENTRIES.size} entries; received ${input.snapshot.entries.length}.`,
      );
    }
  }

  for (const entry of input.snapshot.entries) {
    if (
      entry.canonicalAthleteId &&
      (!/^athlete\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(
        entry.canonicalAthleteId,
      ) ||
        isDraftId(entry.canonicalAthleteId) ||
        isReleaseVersionId(entry.canonicalAthleteId))
    ) {
      errors.push(
        `Explicit canonical athlete ID must be a published athlete.* ID for ${entry.providerAthleteId}: ${entry.canonicalAthleteId}.`,
      );
    }
    if (identities.has(entry.providerAthleteId)) {
      errors.push(`Duplicate provider athlete ID: ${entry.providerAthleteId}`);
    }
    identities.add(entry.providerAthleteId);

    if (positions.has(entry.position)) {
      errors.push(`Duplicate ranking position: ${entry.position}`);
    }
    positions.add(entry.position);

    const expectedUrl = `https://rankings.officialstreetlifting.com/athletes/${entry.providerAthleteId}`;
    if (entry.providerAthleteUrl !== expectedUrl) {
      errors.push(
        `Provider URL/ID mismatch for ${entry.providerAthleteId}: ${entry.providerAthleteUrl}`,
      );
    }

    const canonicalCountryCode = countryCodeFor(entry.country);
    if (!canonicalCountryCode) {
      errors.push(
        `Unsupported country '${entry.country}' for ${entry.providerAthleteId}.`,
      );
    } else {
      const providerCountryCode =
        entry.countryCode.length === 2
          ? entry.countryCode
          : REVIEWED_PROVIDER_COUNTRY_CODES.get(entry.countryCode);
      if (!providerCountryCode) {
        errors.push(
          `Provider country code ${entry.countryCode} has no reviewed ISO mapping for ${entry.providerAthleteId}.`,
        );
      } else if (providerCountryCode !== canonicalCountryCode) {
        errors.push(
          `Country/code mismatch for ${entry.providerAthleteId}: ${entry.country} resolves to ${canonicalCountryCode}, not ${entry.countryCode}.`,
        );
      }
    }

    if (
      entry.providerAthleteId === ABU_PROVIDER_ATHLETE_ID &&
      entry.canonicalAthleteId !== ABU_ATHLETE_ID
    ) {
      errors.push(
        `Abu must be explicitly mapped to ${ABU_ATHLETE_ID}; received ${entry.canonicalAthleteId ?? "no mapping"}.`,
      );
    }
    if (
      entry.providerAthleteId !== ABU_PROVIDER_ATHLETE_ID &&
      entry.canonicalAthleteId === ABU_ATHLETE_ID
    ) {
      errors.push(
        `${ABU_ATHLETE_ID} is reserved for provider athlete ${ABU_PROVIDER_ATHLETE_ID}.`,
      );
    }

    if (requireExactFixture) {
      const reviewed = REVIEWED_ENTRIES.get(entry.providerAthleteId);
      if (!reviewed) {
        errors.push(
          `Unreviewed provider athlete ID: ${entry.providerAthleteId}. Update the versioned source review before importing it.`,
        );
        continue;
      }

      const comparisons: Array<[string, unknown, unknown]> = [
        ["display name", entry.providerDisplayName, reviewed.displayName],
        ["country code", entry.countryCode, reviewed.countryCode],
        ["country", entry.country, reviewed.country],
        ["position", entry.position, reviewed.position],
        ["performance metric", entry.performance?.metric ?? null, "All4 total"],
        ["performance", entry.performance?.value ?? null, reviewed.performanceValue],
        [
          "canonical athlete ID",
          entry.canonicalAthleteId ?? null,
          reviewed.canonicalAthleteId ?? null,
        ],
      ];

      for (const [field, actual, expected] of comparisons) {
        if (actual !== expected) {
          errors.push(
            `Reviewed ${field} mismatch for ${entry.providerAthleteId}: expected ${String(expected)}, received ${String(actual)}.`,
          );
        }
      }
    }
  }

  if (requireExactFixture) {
    for (const providerAthleteId of REVIEWED_ENTRIES.keys()) {
      if (!identities.has(providerAthleteId)) {
        errors.push(`Reviewed athlete is missing: ${providerAthleteId}.`);
      }
    }

    const abu = input.snapshot.entries.find(
      (entry) => entry.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
    );
    if (!abu) {
      errors.push("Abu Asada is missing from the reviewed input.");
    } else if (abu.canonicalAthleteId !== ABU_ATHLETE_ID) {
      errors.push(
        `Abu must be explicitly mapped to ${ABU_ATHLETE_ID}; received ${abu.canonicalAthleteId ?? "no mapping"}.`,
      );
    }
  }

  if (
    input.sourceRights.automatedCollectionAllowed ||
    input.collectionMethod !== "manual-editorial"
  ) {
    errors.push(
      "This reviewed input must remain manual-editorial; automated collection is not approved.",
    );
  }

  return errors;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function loadReviewedInputs(
  workspace: string,
  args: ReturnType<typeof parseArguments>,
): Promise<LoadedInput[]> {
  const requestedPaths = [...args.inputs];

  if (args.inputDirectory) {
    const directoryPath = resolveInsideWorkspace(workspace, args.inputDirectory);
    const entries = await readdir(directoryPath, { withFileTypes: true });
    requestedPaths.push(
      ...entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => path.join(args.inputDirectory!, entry.name))
        .sort(),
    );
  }

  if (requestedPaths.length === 0) {
    if (args.inputDirectory) {
      throw new Error(
        `No reviewed JSON inputs were found in ${args.inputDirectory}.`,
      );
    }
    requestedPaths.push(DEFAULT_INPUT);
  }

  const uniquePaths = [
    ...new Map(
      requestedPaths.map((requestedPath) => {
        const inputPath = resolveInsideWorkspace(workspace, requestedPath);
        return [inputPath, inputPath] as const;
      }),
    ).values(),
  ].sort();

  if (uniquePaths.length > MAX_INPUT_FILES) {
    throw new Error(
      `At most ${MAX_INPUT_FILES} reviewed input files may be processed at once; received ${uniquePaths.length}.`,
    );
  }

  return mapWithConcurrency(uniquePaths, QUERY_CONCURRENCY, async (inputPath) => {
    const relativePath = path.relative(workspace, inputPath).split(path.sep).join("/");
    let input: ImportInput;
    try {
      const inputStats = await stat(inputPath);
      if (!inputStats.isFile()) {
        throw new Error("Expected a regular JSON file.");
      }
      if (inputStats.size > MAX_INPUT_FILE_BYTES) {
        throw new Error(
          `File exceeds the ${MAX_INPUT_FILE_BYTES}-byte reviewed-input limit.`,
        );
      }
      input = inputSchema.parse(
        JSON.parse(await readFile(inputPath, "utf8")) as unknown,
      );
    } catch (error) {
      throw new Error(
        `Invalid reviewed input ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const relationshipErrors = validateInputRelationships(
      input,
      relativePath === DEFAULT_INPUT,
    );
    if (relationshipErrors.length > 0) {
      throw new Error(
        `Manual source input validation failed for ${relativePath}:\n- ${relationshipErrors.join("\n- ")}`,
      );
    }

    return { inputPath, relativePath, input };
  });
}

function aggregateInputs(manifests: readonly LoadedInput[]): ImportBundle {
  if (manifests.length === 0) {
    throw new Error("At least one reviewed input manifest is required.");
  }

  const athleteEntries = new Map<string, SourceEntry>();
  const athleteSourceFiles = new Map<string, string>();
  const canonicalOwners = new Map<string, string>();
  const systems = new Map<string, ImportInput>();
  const snapshots = new Map<string, ImportInput>();
  let sourceEntryOccurrences = 0;

  for (const manifest of manifests) {
    const { input } = manifest;
    sourceEntryOccurrences += input.snapshot.entries.length;

    const systemId = input.rankingSystem.canonicalId;
    const existingSystem = systems.get(systemId);
    if (
      existingSystem &&
      stableJson(existingSystem.rankingSystem) !==
        stableJson(input.rankingSystem)
    ) {
      throw new Error(
        `Conflicting ranking system ${systemId} in ${manifest.relativePath}.`,
      );
    }
    systems.set(systemId, existingSystem ?? input);

    const currentSnapshotId = snapshotId(input);
    const existingSnapshot = snapshots.get(currentSnapshotId);
    if (
      existingSnapshot &&
      stableJson({
        rankingSystem: existingSnapshot.rankingSystem,
        snapshot: existingSnapshot.snapshot,
      }) !==
        stableJson({
          rankingSystem: input.rankingSystem,
          snapshot: input.snapshot,
        })
    ) {
      throw new Error(
        `Conflicting deterministic snapshot ${currentSnapshotId} in ${manifest.relativePath}; historical observations must not be overwritten.`,
      );
    }
    snapshots.set(currentSnapshotId, existingSnapshot ?? input);

    for (const entry of input.snapshot.entries) {
      const effectiveCanonicalId =
        entry.canonicalAthleteId ?? canonicalAthleteId(entry.providerAthleteId);
      const canonicalOwner = canonicalOwners.get(effectiveCanonicalId);
      if (canonicalOwner && canonicalOwner !== entry.providerAthleteId) {
        throw new Error(
          `Canonical athlete ${effectiveCanonicalId} is assigned to both ${canonicalOwner} and ${entry.providerAthleteId}.`,
        );
      }
      canonicalOwners.set(effectiveCanonicalId, entry.providerAthleteId);

      const existing = athleteEntries.get(entry.providerAthleteId);
      if (existing) {
        const existingIdentityFacts = {
          providerAthleteUrl: existing.providerAthleteUrl,
          providerDisplayName: existing.providerDisplayName,
          countryCode: existing.countryCode,
          country: existing.country,
          canonicalAthleteId:
            existing.canonicalAthleteId ??
            canonicalAthleteId(existing.providerAthleteId),
        };
        const currentIdentityFacts = {
          providerAthleteUrl: entry.providerAthleteUrl,
          providerDisplayName: entry.providerDisplayName,
          countryCode: entry.countryCode,
          country: entry.country,
          canonicalAthleteId: effectiveCanonicalId,
        };
        if (stableJson(existingIdentityFacts) !== stableJson(currentIdentityFacts)) {
          throw new Error(
            `Conflicting identity facts for provider athlete ${entry.providerAthleteId} in ${athleteSourceFiles.get(entry.providerAthleteId)} and ${manifest.relativePath}.`,
          );
        }
      } else {
        athleteEntries.set(entry.providerAthleteId, entry);
        athleteSourceFiles.set(entry.providerAthleteId, manifest.relativePath);
      }
    }
  }

  if (athleteEntries.size > MAX_UNIQUE_ATHLETES) {
    throw new Error(
      `At most ${MAX_UNIQUE_ATHLETES} unique athletes may be planned at once; received ${athleteEntries.size}.`,
    );
  }
  if (snapshots.size > MAX_SNAPSHOTS) {
    throw new Error(
      `At most ${MAX_SNAPSHOTS} snapshots may be planned at once; received ${snapshots.size}.`,
    );
  }

  const abuEntries = [...athleteEntries.values()].filter(
    (entry) => entry.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  if (
    abuEntries.length > 1 ||
    (abuEntries.length === 1 &&
      abuEntries[0].canonicalAthleteId !== ABU_ATHLETE_ID)
  ) {
    throw new Error(
      `When present, Abu provider athlete ID count must equal 1 and map to ${ABU_ATHLETE_ID}; received ${abuEntries.length}.`,
    );
  }

  return {
    manifests: [...manifests].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
    athletes: [...athleteEntries.values()].sort((left, right) =>
      left.providerAthleteId.localeCompare(right.providerAthleteId),
    ),
    systemInputs: [...systems.values()].sort((left, right) =>
      left.rankingSystem.canonicalId.localeCompare(
        right.rankingSystem.canonicalId,
      ),
    ),
    snapshotInputs: [...snapshots.values()].sort((left, right) =>
      snapshotId(left).localeCompare(snapshotId(right)),
    ),
    sourceEntryOccurrences,
    sourcePages: [
      ...new Set(manifests.map(({ input }) => input.snapshot.sourceUrl)),
    ].sort(),
  };
}

function makeManifest(bundle: ImportBundle, generatedAt: string) {
  const firstInput = bundle.manifests[0].input;
  const sourcesByAthlete = new Map<string, Set<string>>();
  for (const { input } of bundle.manifests) {
    for (const entry of input.snapshot.entries) {
      const sources = sourcesByAthlete.get(entry.providerAthleteId) ?? new Set();
      sources.add(input.snapshot.sourceUrl);
      sourcesByAthlete.set(entry.providerAthleteId, sources);
    }
  }

  return {
    schemaVersion: 1,
    generatedAt,
    collectionMethod: firstInput.collectionMethod,
    sourceId: firstInput.sourceId,
    reviewedInputFiles: bundle.manifests.map(({ relativePath }) => relativePath),
    sourceRights: bundle.manifests.map(({ relativePath, input }) => ({
      inputPath: relativePath,
      ...input.sourceRights,
    })),
    provider: firstInput.provider,
    sourcePagesProcessed: bundle.sourcePages,
    sourceEntryOccurrences: bundle.sourceEntryOccurrences,
    athletes: bundle.athletes.map((entry) => ({
      providerAthleteId: entry.providerAthleteId,
      providerAthleteUrl: entry.providerAthleteUrl,
      providerDisplayName: entry.providerDisplayName,
      countryCode: entry.countryCode,
      country: entry.country,
      sourceUrls: [...(sourcesByAthlete.get(entry.providerAthleteId) ?? [])].sort(),
      proposedCanonicalAthleteId:
        entry.canonicalAthleteId ?? canonicalAthleteId(entry.providerAthleteId),
    })),
    rankingSystems: bundle.systemInputs.map((input) => input.rankingSystem),
    rankingSnapshots: bundle.snapshotInputs.map((input) => ({
        canonicalId: snapshotId(input),
        rankingDate: input.snapshot.rankingDate,
        rankingDatePolicy: "observation-date",
        sourcePublishedAt: null,
        checkedAt: input.snapshot.checkedAt,
        coverage: input.snapshot.coverage,
        selection: input.snapshot.selection,
        source: {
          title: input.snapshot.sourceTitle,
          type: input.snapshot.sourceType,
          url: input.snapshot.sourceUrl,
          checkedAt: input.snapshot.checkedAt,
          verificationStatus: input.snapshot.verificationStatus,
        },
        entries: input.snapshot.entries.map((entry) => ({
          providerAthleteId: entry.providerAthleteId,
          providerDisplayName: entry.providerDisplayName,
          position: entry.position,
          performance: entry.performance,
        })),
      })),
    performanceMapping: {
      sanityRankingPoints: false,
      sanityRankingRating: false,
      note: "Observed kilograms remain manifest performance data and are not written as ranking points or rating.",
    },
  };
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildReadClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK;
  const token = process.env.SANITY_API_READ_TOKEN?.trim();

  if (!projectId || !dataset || !token) {
    throw new Error(
      "Read-only preflight requires Sanity project, dataset, and SANITY_API_READ_TOKEN.",
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  });
}

function buildWriteClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK;
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

  if (!projectId || !dataset || !token) {
    throw new Error(
      "Mutation mode requires Sanity project, dataset, and SANITY_API_WRITE_TOKEN.",
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  });
}

function deriveSampleAthletes(
  athletes: readonly RawAthlete[],
): SampleAthlete[] {
  const groups = new Map<string, RawAthlete[]>();

  for (const athlete of athletes) {
    const canonicalId =
      athlete._canonicalId ?? canonicalIdForVariant(athlete._id);
    const group = groups.get(canonicalId) ?? [];
    group.push(athlete);
    groups.set(canonicalId, group);
  }

  const canonicalSamples = [...groups.entries()]
    .filter(([, variants]) =>
      variants.some((variant) =>
        isNonProductionAthleteStatus(variant.prototypeStatus),
      ),
    )
    .map(([canonicalId, variants]) => {
      const selected =
        variants.find((variant) => isDraftId(variant._id)) ?? variants[0];
      const markerVariant = isNonProductionAthleteStatus(
        selected.prototypeStatus,
      )
        ? selected
        : variants.find((variant) =>
            isNonProductionAthleteStatus(variant.prototypeStatus),
          );
      const statuses = new Set(
        variants.map((variant) => variant.prototypeStatus ?? "<missing>"),
      );
      return {
        ...selected,
        _id: canonicalId,
        prototypeStatus: markerVariant?.prototypeStatus,
        variantIds: variants.map((variant) => variant._id).sort(),
        variantStatusConflict: statuses.size > 1,
      };
    });
  return canonicalSamples.sort((left, right) =>
    (left.name ?? left._id).localeCompare(right.name ?? right._id),
  );
}

async function fetchVariantsForIds<T extends VariantDocument>(
  client: SanityClient,
  canonicalIds: readonly string[],
  projection: string,
): Promise<T[]> {
  const uniqueIds = [...new Set(canonicalIds)].sort();
  if (uniqueIds.length === 0) {
    return [];
  }

  const batches = await mapWithConcurrency(
    chunksOf(uniqueIds, QUERY_ID_BATCH_SIZE),
    QUERY_CONCURRENCY,
    async (idBatch) => {
      const params: Record<string, string> = {};
      const predicates = idBatch.map((id, index) => {
        params[`id${index}`] = id;
        return `sanity::versionOf($id${index})`;
      });
      const canonicalProjection = idBatch
        .map(
          (_, index) =>
            `sanity::versionOf($id${index}) => $id${index}`,
        )
        .join(", ");
      const documents: T[] = [];
      let cursor = "";

      while (true) {
        const page = await client.fetch<T[]>(
          `*[(${predicates.join(" || ")}) && _id > $cursor]
            | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
              ${projection},
              "_canonicalId": select(${canonicalProjection})
            }`,
          { ...params, cursor },
        );
        documents.push(...page);
        if (page.length < QUERY_PAGE_SIZE) {
          break;
        }
        const nextCursor = page.at(-1)?._id;
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("Variant query pagination did not advance.");
        }
        cursor = nextCursor;
      }

      return documents;
    },
  );

  return batches.flat();
}

async function fetchIdentitiesForProviderIds(
  client: SanityClient,
  providerAthleteIds: readonly string[],
): Promise<RawIdentity[]> {
  const batches = await mapWithConcurrency(
    chunksOf([...new Set(providerAthleteIds)].sort(), QUERY_ID_BATCH_SIZE),
    QUERY_CONCURRENCY,
    async (providerAthleteIdBatch) => {
      const documents: RawIdentity[] = [];
      let cursor = "";

      while (true) {
        const page = await client.fetch<RawIdentity[]>(
          `*[
            _type == "externalAthleteIdentity" &&
            provider._ref == $providerId &&
            providerAthleteId in $providerAthleteIds &&
            _id > $cursor
          ] | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
            _id,
            _type,
            providerAthleteId,
            "athleteId": athlete._ref,
            matchingStatus,
            reviewStatus
          }`,
          {
            providerId: PROVIDER_ID,
            providerAthleteIds: providerAthleteIdBatch,
            cursor,
          },
        );
        documents.push(...page);
        if (page.length < QUERY_PAGE_SIZE) {
          break;
        }
        const nextCursor = page.at(-1)?._id;
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("External identity query pagination did not advance.");
        }
        cursor = nextCursor;
      }

      return documents;
    },
  );

  return batches.flat();
}

async function fetchSampleMarkers(client: SanityClient): Promise<RawAthlete[]> {
  const documents: RawAthlete[] = [];
  let cursor = "";

  while (true) {
    const page = await client.fetch<RawAthlete[]>(
      `*[
        _type == "athlete" &&
        prototypeStatus in [
          "sample-record",
          "fictional-prototype",
          "not-official"
        ] &&
        _id > $cursor
      ] | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
        _id,
        _type,
        name,
        "slug": slug.current,
        prototypeStatus
      }`,
      { cursor },
    );
    documents.push(...page);
    if (page.length < QUERY_PAGE_SIZE) {
      break;
    }
    const nextCursor = page.at(-1)?._id;
    if (!nextCursor || nextCursor === cursor) {
      throw new Error("Sample athlete query pagination did not advance.");
    }
    cursor = nextCursor;
  }

  return documents;
}

async function fetchExistingState(
  client: SanityClient,
  bundle: ImportBundle,
): Promise<ExistingState> {
  const providerAthleteIds = [
    ...bundle.athletes.map((entry) => entry.providerAthleteId),
    ABU_PROVIDER_ATHLETE_ID,
  ];
  const systemIds = bundle.systemInputs.map(
    (input) => input.rankingSystem.canonicalId,
  );
  const snapshotIds = bundle.snapshotInputs.map(snapshotId);
  const [providers, rawIdentities, rawSystems, rawSnapshots, sampleMarkers] =
    await Promise.all([
      fetchVariantsForIds<RawProvider>(
        client,
        [PROVIDER_ID],
        `_id, _type, name, "slug": slug.current, status, integrationMethod`,
      ),
      fetchIdentitiesForProviderIds(client, providerAthleteIds),
      fetchVariantsForIds<RawSystem>(
        client,
        systemIds,
        `_id, _type, "slug": slug.current, name,
          "providerId": provider._ref, rankingKind, discipline, category,
          sexDivision, weightClass, geographicScope, status`,
      ),
      fetchVariantsForIds<RawSnapshot>(
        client,
        snapshotIds,
        `_id, _type, "systemId": rankingSystem._ref, rankingDate,
          sourcePublishedAt, checkedAt,
          entries[]{
            "athleteId": athlete._ref, sourceDisplayName,
            providerAthleteId, position, points, rating,
            previousPosition, status
          },
          source{
            "providerId": provider._ref, sourceTitle, sourceType, url,
            externalRecordId, publishedAt, checkedAt, verificationStatus
          }, publicationStatus`,
      ),
      fetchSampleMarkers(client),
    ]);

  const identities = collapseDraftVariants(rawIdentities);
  const athleteIds = [
    ...bundle.athletes.map(
      (entry) =>
        entry.canonicalAthleteId ?? canonicalAthleteId(entry.providerAthleteId),
    ),
    ...identities.flatMap((identity) =>
      identity.athleteId ? [identity.athleteId] : [],
    ),
    ABU_ATHLETE_ID,
  ];
  const sampleCanonicalIds = sampleMarkers.map((marker) =>
    canonicalIdForVariant(marker._id),
  );
  const [rawAthletes, sampleVariants] = await Promise.all([
    fetchVariantsForIds<RawAthlete>(
      client,
      athleteIds,
      `_id, _type, name, "slug": slug.current, prototypeStatus`,
    ),
    fetchVariantsForIds<RawAthlete>(
      client,
      sampleCanonicalIds,
      `_id, _type, name, "slug": slug.current, prototypeStatus`,
    ),
  ]);
  const allAthletes = [
    ...new Map(
      [...rawAthletes, ...sampleMarkers, ...sampleVariants].map((athlete) => [
        athlete._id,
        athlete,
      ]),
    ).values(),
  ];

  return {
    provider: collapseDraftVariants(providers)[0],
    athletes: collapseDraftVariants(allAthletes),
    identities,
    systems: collapseDraftVariants(rawSystems),
    snapshots: collapseDraftVariants(rawSnapshots),
    samples: deriveSampleAthletes(allAthletes),
  };
}

async function checkAnonymousDataset(
  authenticatedClient: SanityClient,
): Promise<AnonymousDatasetCheck> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK;

  if (!projectId || !dataset) {
    return {
      verified: false,
      private: false,
      reason: "Sanity project and dataset are required.",
    };
  }

  try {
    let aclMode: string | undefined;
    try {
      const datasets = await authenticatedClient.datasets.list();
      aclMode = datasets.find((candidate) => candidate.name === dataset)?.aclMode;
    } catch {
      // Some dataset-scoped tokens cannot inspect project dataset settings. The
      // check remains fail-closed unless visibility can be verified elsewhere.
    }

    const query = `{
      "allDocuments": count(*[]),
      "internalDocuments": count(*[
        _type in [
          "auditEvent",
          "contributorProfile",
          "contributorIdentityClaim",
          "operationalLock",
          "submission",
          "externalAthleteIdentity",
          "rankingSnapshot"
        ]
      ])
    }`;
    const endpoint = new URL(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${encodeURIComponent(dataset)}`,
    );
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("perspective", "raw");
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "omit",
      headers: { accept: "application/json" },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        verified: aclMode === "private",
        private: aclMode === "private",
        aclMode,
        reason: "Anonymous Content Lake access was denied.",
      };
    }
    if (!response.ok) {
      return {
        verified: false,
        private: false,
        aclMode,
        reason: `Anonymous dataset check returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as unknown;
    const result = isRecord(payload) ? payload.result : undefined;
    const counts = isRecord(result) ? result : {};
    const allDocuments =
      typeof counts.allDocuments === "number" ? counts.allDocuments : undefined;
    const internalDocuments =
      typeof counts.internalDocuments === "number"
        ? counts.internalDocuments
        : undefined;

    if (allDocuments === undefined || internalDocuments === undefined) {
      return {
        verified: false,
        private: false,
        aclMode,
        reason: "Anonymous dataset check returned an unexpected response shape.",
      };
    }

    return {
      verified: aclMode === "private" && allDocuments === 0,
      private: aclMode === "private" && allDocuments === 0,
      aclMode,
      anonymousDocumentCount: allDocuments,
      anonymousInternalDocumentCount: internalDocuments,
      reason:
        allDocuments > 0
          ? "The configured unified dataset returns documents to an anonymous client."
          : aclMode === "private"
            ? "Dataset ACL is private and the direct anonymous query returned no documents."
            : "The anonymous query returned no documents, but the authenticated token could not verify a private dataset ACL.",
    };
  } catch (error) {
    return {
      verified: false,
      private: false,
      reason: `Could not verify anonymous dataset access: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function validateProviderAndSystems(
  inputs: readonly ImportInput[],
  state: ExistingState,
): string[] {
  const errors: string[] = [];
  const provider = state.provider;

  if (!provider) {
    errors.push(`Required provider ${PROVIDER_ID} does not exist.`);
  } else {
    if (
      provider.variantIds.length !== 1 ||
      provider.variantIds[0] !== PROVIDER_ID
    ) {
      errors.push(
        `Provider has draft/release/conflicting document variants: ${provider.variantIds.join(", ")}.`,
      );
    }
    if (provider.status !== "under-review") {
      errors.push(
        `Provider must remain under-review; current status is ${provider.status ?? "missing"}.`,
      );
    }
    if (provider.integrationMethod !== "manual") {
      errors.push(
        `Provider integration method must remain manual; current value is ${provider.integrationMethod ?? "missing"}.`,
      );
    }
  }

  for (const input of inputs) {
    const system = state.systems.find(
      (candidate) => candidate._id === input.rankingSystem.canonicalId,
    );
    if (!system) {
      continue;
    }
    if (
      system.variantIds.length !== 1 ||
      system.variantIds[0] !== input.rankingSystem.canonicalId
    ) {
      errors.push(
        `Ranking system has draft/release/conflicting document variants: ${system.variantIds.join(", ")}.`,
      );
    }
    const comparisons: Array<[string, unknown, unknown]> = [
      ["provider", system.providerId, PROVIDER_ID],
      ["slug", system.slug, input.rankingSystem.slug],
      ["name", system.name, input.rankingSystem.name],
      ["rankingKind", system.rankingKind, input.rankingSystem.rankingKind],
      ["discipline", system.discipline, input.rankingSystem.discipline],
      ["category", system.category, input.rankingSystem.category],
      ["sexDivision", system.sexDivision, input.rankingSystem.sexDivision],
      ["weightClass", system.weightClass, input.rankingSystem.weightClass],
      [
        "geographicScope",
        system.geographicScope,
        input.rankingSystem.geographicScope,
      ],
      ["status", system.status, "draft"],
    ];

    for (const [field, actual, expected] of comparisons) {
      if (actual !== expected) {
        errors.push(
          `Existing ranking system ${field} mismatch: expected ${String(expected)}, received ${String(actual)}.`,
        );
      }
    }
  }

  return errors;
}

function comparableSnapshot(
  snapshot: ExistingSnapshot,
): JsonRecord {
  return {
    systemId: snapshot.systemId ?? null,
    rankingDate: snapshot.rankingDate ?? null,
    sourcePublishedAt: snapshot.sourcePublishedAt ?? null,
    checkedAt: snapshot.checkedAt ?? null,
    publicationStatus: snapshot.publicationStatus ?? null,
    entries: [...(snapshot.entries ?? [])]
      .map((entry) => ({
        athleteId: entry.athleteId ?? null,
        sourceDisplayName: entry.sourceDisplayName ?? null,
        providerAthleteId: entry.providerAthleteId ?? null,
        position: entry.position ?? null,
        points: entry.points ?? null,
        rating: entry.rating ?? null,
        previousPosition: entry.previousPosition ?? null,
        status: entry.status ?? null,
      }))
      .sort((left, right) =>
        String(left.providerAthleteId).localeCompare(
          String(right.providerAthleteId),
        ),
      ),
    source: {
      providerId: snapshot.source?.providerId ?? null,
      sourceTitle: snapshot.source?.sourceTitle ?? null,
      sourceType: snapshot.source?.sourceType ?? null,
      url: snapshot.source?.url ?? null,
      externalRecordId: snapshot.source?.externalRecordId ?? null,
      publishedAt: snapshot.source?.publishedAt ?? null,
      checkedAt: snapshot.source?.checkedAt ?? null,
      verificationStatus: snapshot.source?.verificationStatus ?? null,
    },
  };
}

function expectedComparableSnapshot(
  input: ImportInput,
  plannedAthletes: readonly PlannedAthlete[],
): JsonRecord {
  return {
    systemId: input.rankingSystem.canonicalId,
    rankingDate: input.snapshot.rankingDate,
    sourcePublishedAt: null,
    checkedAt: input.snapshot.checkedAt,
    publicationStatus: "draft",
    entries: plannedAthletes
      .map(({ source, canonicalAthleteId: athleteId }) => ({
        athleteId,
        sourceDisplayName: source.providerDisplayName,
        providerAthleteId: source.providerAthleteId,
        position: source.position,
        points: null,
        rating: null,
        previousPosition: null,
        status: "ranked",
      }))
      .sort((left, right) =>
        left.providerAthleteId.localeCompare(right.providerAthleteId),
      ),
    source: {
      providerId: PROVIDER_ID,
      sourceTitle: input.snapshot.sourceTitle,
      sourceType: input.snapshot.sourceType,
      url: input.snapshot.sourceUrl,
      externalRecordId: `${input.rankingSystem.slug}:${input.snapshot.rankingDate}:${input.snapshot.coverage}`,
      publishedAt: null,
      checkedAt: input.snapshot.checkedAt,
      verificationStatus: input.snapshot.verificationStatus,
    },
  };
}

function validateExistingSnapshot(
  input: ImportInput,
  state: ExistingState,
  plannedAthletes: readonly PlannedAthlete[],
): string[] {
  const existing = state.snapshots.find(
    (candidate) => candidate._id === snapshotId(input),
  );
  if (!existing) {
    return [];
  }

  const errors: string[] = [];
  if (
    existing.variantIds.length !== 1 ||
    existing.variantIds[0] !== snapshotId(input)
  ) {
    errors.push(
      `Ranking snapshot has draft/release/conflicting document variants: ${existing.variantIds.join(", ")}.`,
    );
  }

  if (
    JSON.stringify(comparableSnapshot(existing)) !==
    JSON.stringify(expectedComparableSnapshot(input, plannedAthletes))
  ) {
    errors.push(
      `Existing snapshot ${snapshotId(input)} conflicts with the reviewed source; it will not be overwritten.`,
    );
  }

  return errors;
}

async function validateDocumentVariants(
  client: SanityClient,
  expectedTypes: ReadonlyMap<string, string>,
  proposedIds: ReadonlySet<string>,
): Promise<string[]> {
  const errors: string[] = [];
  const variants = await fetchVariantsForIds<VariantDocument>(
    client,
    [...expectedTypes.keys()],
    `_id, _type`,
  );
  const variantsByCanonicalId = new Map<string, VariantDocument[]>();
  for (const variant of variants) {
    if (!variant._canonicalId) {
      errors.push(
        `Could not normalize document variant ${variant._id}; manual review is required.`,
      );
      continue;
    }
    const group = variantsByCanonicalId.get(variant._canonicalId) ?? [];
    group.push(variant);
    variantsByCanonicalId.set(variant._canonicalId, group);
  }

  for (const [canonicalId, expectedType] of expectedTypes) {
    const canonicalVariants = variantsByCanonicalId.get(canonicalId) ?? [];
    const variantIds = canonicalVariants.map((variant) => variant._id).sort();

    if (
      canonicalVariants.some((variant) => isReleaseVersionId(variant._id))
    ) {
      errors.push(
        `Release version requires manual review for ${canonicalId}: ${variantIds.join(", ")}.`,
      );
    }
    if (
      canonicalVariants.length > 1 ||
      (canonicalVariants.length === 1 &&
        canonicalVariants[0]._id !== canonicalId)
    ) {
      errors.push(
        `Draft/release/conflicting variants require manual review for ${canonicalId}: ${variantIds.join(", ")}.`,
      );
    }
    for (const variant of canonicalVariants) {
      if (variant._type !== expectedType) {
        errors.push(
          `Document ID collision for ${canonicalId}: expected ${expectedType}, found ${variant._type} at ${variant._id}.`,
        );
      }
    }
    if (proposedIds.has(canonicalId) && canonicalVariants.length > 0) {
      errors.push(
        `Proposed document ID ${canonicalId} is already occupied; import creation would conflict.`,
      );
    }
  }

  return errors.sort();
}

function isNonProductionAthleteStatus(
  value: string | undefined,
): value is NonProductionAthleteStatus {
  return (
    value === "sample-record" ||
    value === "fictional-prototype" ||
    value === "not-official"
  );
}

function planAthletes(
  entries: readonly SourceEntry[],
  state: ExistingState,
  generatedAt: string,
): { planned: PlannedAthlete[]; errors: string[]; duplicateIdentities: string[] } {
  const errors: string[] = [];
  const duplicateIdentities: string[] = [];
  const planned: PlannedAthlete[] = [];
  const athletesById = new Map(state.athletes.map((athlete) => [athlete._id, athlete]));
  const identitiesByProviderId = new Map<string, ExistingIdentity[]>();

  for (const identity of state.identities) {
    if (!identity.providerAthleteId) {
      continue;
    }
    const group = identitiesByProviderId.get(identity.providerAthleteId) ?? [];
    group.push(identity);
    identitiesByProviderId.set(identity.providerAthleteId, group);
  }

  for (const [providerAthleteId, identities] of identitiesByProviderId) {
    if (identities.length > 1) {
      duplicateIdentities.push(providerAthleteId);
      errors.push(
        `Existing provider identity is duplicated for ${providerAthleteId}: ${identities.map((identity) => identity._id).join(", ")}.`,
      );
    }
  }

  for (const entry of entries) {
    const identities = identitiesByProviderId.get(entry.providerAthleteId) ?? [];
    const existingIdentity = identities.length === 1 ? identities[0] : undefined;

    if (existingIdentity) {
      if (
        existingIdentity.variantIds.length !== 1 ||
        existingIdentity.variantIds[0] !== existingIdentity._id
      ) {
        errors.push(
          `Existing identity ${existingIdentity._id} has draft/release/conflicting variants: ${existingIdentity.variantIds.join(", ")}.`,
        );
        continue;
      }
      if (
        !["candidate", "confirmed", "manually-linked"].includes(
          existingIdentity.matchingStatus ?? "",
        )
      ) {
        errors.push(
          `Existing identity ${existingIdentity._id} cannot be used with matchingStatus ${existingIdentity.matchingStatus ?? "missing"}.`,
        );
        continue;
      }
      if (!existingIdentity.athleteId) {
        errors.push(
          `Existing identity ${existingIdentity._id} has no canonical athlete reference.`,
        );
        continue;
      }
      if (!athletesById.has(existingIdentity.athleteId)) {
        errors.push(
          `Existing identity ${existingIdentity._id} references missing athlete ${existingIdentity.athleteId}.`,
        );
        continue;
      }
      const existingAthlete = athletesById.get(existingIdentity.athleteId);
      if (
        existingAthlete &&
        (existingAthlete.variantIds.length !== 1 ||
          existingAthlete.variantIds[0] !== existingAthlete._id)
      ) {
        errors.push(
          `Canonical athlete ${existingAthlete._id} has draft/release/conflicting variants: ${existingAthlete.variantIds.join(", ")}.`,
        );
        continue;
      }
      if (isNonProductionAthleteStatus(existingAthlete?.prototypeStatus)) {
        errors.push(
          `Existing identity ${existingIdentity._id} targets non-production athlete ${existingAthlete?._id} (${existingAthlete?.prototypeStatus}); explicit remediation is required.`,
        );
        continue;
      }
      if (
        entry.canonicalAthleteId &&
        entry.canonicalAthleteId !== existingIdentity.athleteId
      ) {
        errors.push(
          `Explicit mapping for ${entry.providerAthleteId} conflicts with existing identity ${existingIdentity._id}.`,
        );
        continue;
      }

      planned.push({
        source: entry,
        canonicalAthleteId: existingIdentity.athleteId,
        matchMethod: "existing-provider-identity",
      });
      continue;
    }

    if (entry.canonicalAthleteId) {
      if (!athletesById.has(entry.canonicalAthleteId)) {
        errors.push(
          `Explicit canonical athlete ${entry.canonicalAthleteId} does not exist for ${entry.providerAthleteId}.`,
        );
        continue;
      }
      const mappedAthlete = athletesById.get(entry.canonicalAthleteId);
      if (
        mappedAthlete &&
        (mappedAthlete.variantIds.length !== 1 ||
          mappedAthlete.variantIds[0] !== mappedAthlete._id)
      ) {
        errors.push(
          `Explicit canonical athlete ${mappedAthlete._id} has draft/release/conflicting variants: ${mappedAthlete.variantIds.join(", ")}.`,
        );
        continue;
      }
      if (isNonProductionAthleteStatus(mappedAthlete?.prototypeStatus)) {
        errors.push(
          `Explicit mapping for ${entry.providerAthleteId} targets non-production athlete ${mappedAthlete?._id} (${mappedAthlete?.prototypeStatus}); explicit remediation is required.`,
        );
        continue;
      }

      planned.push({
        source: entry,
        canonicalAthleteId: entry.canonicalAthleteId,
        matchMethod: "explicit-editorial-mapping",
        identityDocument: makeIdentityDocument(
          entry,
          entry.canonicalAthleteId,
          generatedAt,
        ),
      });
      continue;
    }

    const newAthleteId = canonicalAthleteId(entry.providerAthleteId);
    if (athletesById.has(newAthleteId)) {
      errors.push(
        `Deterministic athlete ID ${newAthleteId} already exists without the expected provider identity; explicit review is required.`,
      );
      continue;
    }

    planned.push({
      source: entry,
      canonicalAthleteId: newAthleteId,
      matchMethod: "new-canonical-athlete",
      athleteDocument: makeAthleteDocument(entry, newAthleteId),
      identityDocument: makeIdentityDocument(entry, newAthleteId, generatedAt),
    });
  }

  const sourceAbuEntries = entries.filter(
    (entry) => entry.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  const plannedAbuMatches = planned.filter(
    (item) => item.source.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  if (
    sourceAbuEntries.length > 1 ||
    plannedAbuMatches.length !== sourceAbuEntries.length ||
    plannedAbuMatches.some(
      (item) => item.canonicalAthleteId !== ABU_ATHLETE_ID,
    )
  ) {
    errors.push(
      `Abu identity protection failed: a bundle-local Abu entry must map exactly once to ${ABU_ATHLETE_ID}.`,
    );
  }

  return { planned, errors, duplicateIdentities };
}

function validateAbuGuarantees(
  bundle: ImportBundle,
  state: ExistingState,
  planned: readonly PlannedAthlete[],
): {
  readonly errors: string[];
  readonly counts: {
    readonly sourceProviderAthleteIds: number;
    readonly canonicalAthletes: number;
    readonly externalIdentities: number;
    readonly plannedMatches: number;
  };
} {
  const sourceEntries = bundle.athletes.filter(
    (entry) => entry.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  const canonicalAthletes = state.athletes.filter(
    (athlete) => athlete._id === ABU_ATHLETE_ID,
  );
  const identities = state.identities.filter(
    (identity) => identity.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  const plannedMatches = planned.filter(
    (item) =>
      item.source.providerAthleteId === ABU_PROVIDER_ATHLETE_ID &&
      item.canonicalAthleteId === ABU_ATHLETE_ID,
  );
  const errors: string[] = [];

  if (
    sourceEntries.length > 1 ||
    (sourceEntries.length === 1 &&
      sourceEntries[0].canonicalAthleteId !== ABU_ATHLETE_ID)
  ) {
    errors.push(
      `Bundle-local Abu provider athlete ID count must be 0 or 1 with exact canonical mapping; received ${sourceEntries.length}.`,
    );
  }
  if (
    canonicalAthletes.length !== 1 ||
    canonicalAthletes[0].variantIds.length !== 1 ||
    canonicalAthletes[0].variantIds[0] !== ABU_ATHLETE_ID
  ) {
    errors.push(
      `Abu canonical athlete count/variant guarantee failed for ${ABU_ATHLETE_ID}.`,
    );
  }
  if (
    identities.length !== 1 ||
    identities[0]._id !==
      `externalAthleteIdentity.official-streetlifting.${ABU_PROVIDER_ATHLETE_ID}` ||
    identities[0].athleteId !== ABU_ATHLETE_ID ||
    identities[0].variantIds.length !== 1 ||
    identities[0].variantIds[0] !== identities[0]._id
  ) {
    errors.push(
      `Abu external identity count/ID/reference guarantee failed for externalAthleteIdentity.official-streetlifting.${ABU_PROVIDER_ATHLETE_ID}.`,
    );
  }
  if (plannedMatches.length !== sourceEntries.length) {
    errors.push(
      `Bundle-local Abu planned match count must equal its source count; expected ${sourceEntries.length}, received ${plannedMatches.length}.`,
    );
  }

  return {
    errors,
    counts: {
      sourceProviderAthleteIds: sourceEntries.length,
      canonicalAthletes: canonicalAthletes.length,
      externalIdentities: identities.length,
      plannedMatches: plannedMatches.length,
    },
  };
}

function findReferencePaths(
  value: unknown,
  targetId: string,
  currentPath = "$",
  paths: string[] = [],
): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findReferencePaths(item, targetId, `${currentPath}[${index}]`, paths),
    );
    return paths;
  }

  if (!isRecord(value)) {
    return paths;
  }

  if (value._ref === targetId) {
    paths.push(currentPath);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "_ref") {
      continue;
    }
    findReferencePaths(child, targetId, `${currentPath}.${key}`, paths);
  }

  return paths;
}

function safeDocumentLabel(document: JsonRecord): string {
  const type = typeof document._type === "string" ? document._type : "document";
  const id = typeof document._id === "string" ? document._id : "unknown";
  const publicLabelTypes = new Set([
    "athlete",
    "competition",
    "video",
    "story",
    "team",
    "organization",
    "siteSettings",
    "rankingSnapshot",
    "rankingSystem",
  ]);

  if (publicLabelTypes.has(type)) {
    const label = [document.name, document.title]
      .find((value) => typeof value === "string" && value.trim()) as
      | string
      | undefined;
    if (label) {
      return label.trim();
    }
  }

  return id;
}

function classifyCleanupReference(document: JsonRecord): Pick<
  CleanupReference,
  "classification" | "remediation"
> {
  if (document._type === "siteSettings") {
    return {
      classification: "SITE CONFIGURATION",
      remediation:
        "Review the setting and replace or remove the sample reference only when an appropriate real record is selected editorially.",
    };
  }

  const status = [document.contentStatus, document.prototypeStatus].find(
    (value) => typeof value === "string" && value.length > 0,
  );
  if (
    status === "sample-record" ||
    status === "fictional-prototype" ||
    status === "not-official"
  ) {
    return {
      classification: "SAMPLE/PROTOTYPE CONTENT",
      remediation:
        "Remove or replace the explicitly marked sample/prototype document through editorial cleanup before deleting the athlete.",
    };
  }
  if (status === "published-record") {
    return {
      classification: "REAL CONTENT",
      remediation:
        "Stop and review the real-content relationship; never reassign it by name or delete the athlete automatically.",
    };
  }

  return {
    classification: "UNKNOWN / NEEDS REVIEW",
    remediation:
      "Inspect the document editorially and establish whether it is real or sample content before changing the reference.",
  };
}

async function fetchReferenceDocuments(
  client: SanityClient,
  targetIds: readonly string[],
): Promise<JsonRecord[]> {
  const pages = await mapWithConcurrency(
    chunksOf([...new Set(targetIds)].sort(), QUERY_ID_BATCH_SIZE),
    QUERY_CONCURRENCY,
    async (targetIdBatch) => {
      const params: Record<string, string> = {};
      const predicates = targetIdBatch.map((targetId, index) => {
        params[`targetId${index}`] = targetId;
        return `references($targetId${index})`;
      });
      const documents: JsonRecord[] = [];
      let cursor = "";

      while (true) {
        const page = await client.fetch<JsonRecord[]>(
          `*[
            (${predicates.join(" || ")}) &&
            _id > $cursor
          ] | order(_id asc)[0...${QUERY_PAGE_SIZE}]`,
          { ...params, cursor },
        );
        documents.push(...page);
        if (page.length < QUERY_PAGE_SIZE) {
          break;
        }
        const lastDocument = page.at(-1);
        const nextCursor =
          lastDocument && typeof lastDocument._id === "string"
            ? lastDocument._id
            : undefined;
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("Cleanup reference query pagination did not advance.");
        }
        cursor = nextCursor;
      }

      return documents;
    },
  );

  return [
    ...new Map(
      pages
        .flat()
        .filter((document) => typeof document._id === "string")
        .map((document) => [document._id as string, document]),
    ).values(),
  ];
}

async function buildCleanupPlan(
  client: SanityClient,
  samples: readonly SampleAthlete[],
): Promise<CleanupCandidate[]> {
  const candidates: CleanupCandidate[] = [];
  const documents = await fetchReferenceDocuments(
    client,
    samples.flatMap((sample) => [sample._id, ...sample.variantIds]),
  );

  for (const sample of samples) {
    if (sample._id === ABU_ATHLETE_ID) {
      throw new Error(
        `${ABU_ATHLETE_ID} appeared in the sample cleanup set. Cleanup aborted.`,
      );
    }
    if (!isNonProductionAthleteStatus(sample.prototypeStatus)) {
      throw new Error(
        `Cleanup candidate ${sample._id} lacks an explicit non-production prototypeStatus.`,
      );
    }

    const documentVariants = [...sample.variantIds].sort();
    const referenceTargetIds = [
      ...new Set([sample._id, ...documentVariants]),
    ];
    const variantStatusConflict = sample.variantStatusConflict;
    const references = documents
      .map((document) => {
        const paths = [
          ...new Set(
            referenceTargetIds.flatMap((variantId) =>
              findReferencePaths(document, variantId),
            ),
          ),
        ].sort();
        return {
          documentId:
            typeof document._id === "string" ? document._id : "unknown",
          documentType:
            typeof document._type === "string" ? document._type : "unknown",
          label: safeDocumentLabel(document),
          paths,
          ...classifyCleanupReference(document),
        } satisfies CleanupReference;
      })
      .filter((reference) => reference.paths.length > 0);
    const associatedSampleRecords = references
      .filter((reference) =>
        ["athlete", "competition", "video", "story", "siteSettings"].includes(
          reference.documentType,
        ),
      )
      .map((reference) => reference.documentId);
    const safetyReasons = [
      ...(references.length > 0
        ? [`${references.length} referencing document variant(s) remain.`]
        : []),
      ...(documentVariants.length !== 1 || documentVariants[0] !== sample._id
        ? [
            `Non-production athlete has draft/release/conflicting variants: ${documentVariants.join(", ")}.`,
          ]
        : []),
      ...(isReleaseVersionId(sample._id)
        ? ["Release-only non-production version requires manual cleanup review."]
        : []),
      ...(variantStatusConflict
        ? ["Prototype status differs across document variants."]
        : []),
      ...(sample.prototypeStatus !== "sample-record"
        ? [
            `${sample.prototypeStatus} is report-only and is not eligible for guarded sample-record deletion.`,
          ]
        : []),
    ];

    candidates.push({
      athleteId: sample._id,
      name: sample.name ?? sample._id,
      prototypeStatus: sample.prototypeStatus,
      references,
      referencePathCount: references.reduce(
        (total, reference) => total + reference.paths.length,
        0,
      ),
      safeToRemove: safetyReasons.length === 0,
      associatedSampleRecords,
      documentVariants,
      safetyReasons,
    });
  }

  return candidates;
}

function countryDistribution(entries: readonly SourceEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.country, (counts.get(entry.country) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function markdownEscape(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function importReportMarkdown(report: JsonRecord): string {
  const counts = report.counts as JsonRecord;
  const abuCounts = report.abuGuarantees as JsonRecord;
  const blockers = report.writeBlockers as string[];
  const warnings = report.warnings as string[];
  const inputPaths = report.inputPaths as string[];

  return [
    `# ${String(report.title)}`,
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    `Integration approach: ${String(report.integrationApproach)}`,
    `Source rights review: ${String(report.sourceRightsReviewStatus)}`,
    `Manifest: ${String(report.manifestPath)}`,
    "",
    "## Reviewed inputs",
    "",
    ...inputPaths.map((inputPath) => `- ${inputPath}`),
    "",
    "## Counts",
    "",
    `- Reviewed input files: ${String(counts.reviewedInputFiles)}`,
    `- Source pages/endpoints processed: ${String(counts.sourcePagesProcessed)}`,
    `- Athletes discovered: ${String(counts.athletesDiscovered)}`,
    `- Unique external identities: ${String(counts.uniqueExternalIdentities)}`,
    `- Existing identities matched: ${String(counts.existingIdentitiesMatched)}`,
    `- New canonical athletes proposed: ${String(counts.newCanonicalAthletesProposed)}`,
    `- New external identities proposed: ${String(counts.newExternalIdentitiesProposed)}`,
    `- Ranking systems discovered: ${String(counts.rankingSystemsDiscovered)}`,
    `- Ranking systems proposed: ${String(counts.rankingSystemsProposed)}`,
    `- Ranking snapshots discovered: ${String(counts.rankingSnapshotsDiscovered)}`,
    `- Ranking snapshots proposed: ${String(counts.rankingSnapshotsProposed)}`,
    `- Ranking entries: ${String(counts.rankingEntries)}`,
    `- Invalid records: ${String(counts.invalidRecords)}`,
    `- Duplicate identities: ${String(counts.duplicateIdentities)}`,
    `- Planned create documents: ${String(counts.proposedDocuments)}`,
    `- Planned create batches: ${String(counts.createBatches)}`,
    `- Abu matched existing record: ${String(report.abuMatchedExistingRecord)}`,
    `- Abu source provider IDs: ${String(abuCounts.sourceProviderAthleteIds)}`,
    `- Abu canonical athletes: ${String(abuCounts.canonicalAthletes)}`,
    `- Abu external identities: ${String(abuCounts.externalIdentities)}`,
    `- Abu planned matches: ${String(abuCounts.plannedMatches)}`,
    "",
    "## Write blockers",
    "",
    ...(blockers.length > 0
      ? blockers.map((blocker) => `- ${blocker}`)
      : ["- None"]),
    "",
    "## Warnings",
    "",
    ...(warnings.length > 0
      ? warnings.map((warning) => `- ${warning}`)
      : ["- None"]),
    "",
    "## Mutations",
    "",
    `Sanity mutations: ${String(report.sanityMutations)}`,
    `Create batches completed: ${String(report.completedCreateBatches)}`,
    "",
  ].join("\n");
}

function cleanupReportMarkdown(report: JsonRecord): string {
  const candidates = report.candidates as CleanupCandidate[];
  const skippedAthleteIds = Array.isArray(report.skippedAthleteIds)
    ? report.skippedAthleteIds
    : [];
  const lines = [
    "# Non-production athlete cleanup plan",
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    `Inbound document relationships: ${String(report.totalInboundRelationships)}`,
    `Reference field paths: ${String(report.totalReferencePaths)}`,
    `Safe to remove now: ${String(report.safeToRemoveNow)}`,
    `Requires remediation: ${String(report.requiresRemediation)}`,
    "",
    "| Athlete ID | Name | Prototype status | Document variants | Reference documents | Reference paths | Safe to remove? |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...candidates.map(
      (candidate) =>
        `| ${markdownEscape(candidate.athleteId)} | ${markdownEscape(candidate.name)} | ${markdownEscape(candidate.prototypeStatus)} | ${candidate.documentVariants.length} | ${candidate.references.length} | ${candidate.referencePathCount} | ${candidate.safeToRemove ? "Yes" : "No"} |`,
    ),
    "",
    "## References",
    "",
  ];

  for (const candidate of candidates) {
    lines.push(`### ${candidate.name} (${candidate.athleteId})`, "");
    if (candidate.references.length === 0) {
      lines.push("- No references found.", "");
    } else {
      for (const reference of candidate.references) {
        lines.push(
          `- ${reference.documentType} \`${reference.documentId}\` (${reference.label}) — ${reference.classification}: ${reference.paths.join(", ") || "reference path unavailable"}`,
          `  - Remediation: ${reference.remediation}`,
        );
      }
      lines.push("");
    }
    lines.push(
      `Document variants: ${candidate.documentVariants.join(", ")}`,
      `Safety reasons: ${candidate.safetyReasons.join(" ") || "None"}`,
      "",
    );
  }

  lines.push(
    `Actual deletions performed: ${String(report.actualDeletions)}`,
    `Mutation-time safety skips: ${skippedAthleteIds.length > 0 ? skippedAthleteIds.join(", ") : "None"}`,
    "",
  );
  return lines.join("\n");
}

function printDryRunSummary(report: JsonRecord, cleanupReport: JsonRecord) {
  const counts = report.counts as JsonRecord;
  const cleanupCandidates = cleanupReport.candidates as CleanupCandidate[];

  console.log(String(report.title));
  console.log("");
  console.log(`Integration approach: ${String(report.integrationApproach)}`);
  console.log(`Source registry write approval: ${report.sourceAccessReviewed ? "YES" : "NO"}`);
  console.log(`Manifest generated: ${report.manifestGenerated ? "YES" : "NO"}`);
  console.log(`Source pages/endpoints processed: ${String(counts.sourcePagesProcessed)}`);
  console.log(`Athletes discovered: ${String(counts.athletesDiscovered)}`);
  console.log(`Unique external identities: ${String(counts.uniqueExternalIdentities)}`);
  console.log(`Existing identities matched: ${String(counts.existingIdentitiesMatched)}`);
  console.log(`New canonical athletes proposed: ${String(counts.newCanonicalAthletesProposed)}`);
  console.log(`New external identities proposed: ${String(counts.newExternalIdentitiesProposed)}`);
  console.log(`Ranking systems discovered: ${String(counts.rankingSystemsDiscovered)}`);
  console.log(`Ranking snapshots proposed: ${String(counts.rankingSnapshotsProposed)}`);
  console.log(`Ranking entries: ${String(counts.rankingEntries)}`);
  console.log(`Invalid records: ${String(counts.invalidRecords)}`);
  console.log(`Duplicate identities: ${String(counts.duplicateIdentities)}`);
  console.log(`Abu matched existing record: ${String(report.abuMatchedExistingRecord)}`);
  console.log("");
  console.log("SANITY MUTATIONS:");
  console.log(String(report.sanityMutations));
  console.log("");
  console.log("NON-PRODUCTION ATHLETE CLEANUP PLAN");
  console.log(
    `Non-production athletes identified: ${cleanupCandidates.length}`,
  );
  console.log(
    `Safe to remove now: ${cleanupCandidates.filter((candidate) => candidate.safeToRemove).length}`,
  );
  for (const candidate of cleanupCandidates) {
    console.log(
      `${candidate.athleteId} | ${candidate.name} | ${candidate.prototypeStatus} | references: ${candidate.references.length} documents / ${candidate.referencePathCount} paths | safe: ${candidate.safeToRemove ? "YES" : "NO"}`,
    );
  }
  console.log(`Actual deletions performed: ${String(cleanupReport.actualDeletions)}`);
  console.log("");
  console.log(`Write blockers: ${(report.writeBlockers as string[]).length}`);
  for (const blocker of report.writeBlockers as string[]) {
    console.log(`- ${blocker}`);
  }
}

function documentBytes(documents: readonly ImportDocument[]): number {
  return Buffer.byteLength(JSON.stringify(documents), "utf8");
}

function packCreateUnits(
  phase: CreateBatch["phase"],
  units: readonly (readonly ImportDocument[])[],
): CreateBatch[] {
  const batches: CreateBatch[] = [];
  let documents: ImportDocument[] = [];

  const flush = () => {
    if (documents.length > 0) {
      batches.push({ phase, documents });
      documents = [];
    }
  };

  for (const unit of units) {
    if (unit.length === 0) {
      continue;
    }
    if (
      unit.length > CREATE_BATCH_DOCUMENT_LIMIT ||
      documentBytes(unit) > CREATE_BATCH_BYTE_LIMIT
    ) {
      throw new Error(
        `A ${phase} create unit exceeds the importer batch safety limit.`,
      );
    }
    const combined = [...documents, ...unit];
    if (
      combined.length > CREATE_BATCH_DOCUMENT_LIMIT ||
      documentBytes(combined) > CREATE_BATCH_BYTE_LIMIT
    ) {
      flush();
    }
    documents.push(...unit);
  }
  flush();
  return batches;
}

function makeCreateBatches(
  systemDocuments: readonly ImportDocument[],
  athletePlan: readonly PlannedAthlete[],
  snapshotDocuments: readonly ImportDocument[],
): CreateBatch[] {
  return [
    ...packCreateUnits(
      "systems",
      systemDocuments.map((document) => [document]),
    ),
    ...packCreateUnits(
      "athletes-and-identities",
      athletePlan.map((planned) =>
        [planned.athleteDocument, planned.identityDocument].filter(
          (document): document is ImportDocument => Boolean(document),
        ),
      ),
    ),
    ...packCreateUnits(
      "snapshots",
      snapshotDocuments.map((document) => [document]),
    ),
  ];
}

async function executeImportWrites(
  batches: readonly CreateBatch[],
  writeBlockers: readonly string[],
  onBatchCommitted?: (
    createdIds: readonly string[],
    batch: CreateBatch,
    batchIndex: number,
  ) => Promise<void>,
): Promise<string[]> {
  if (process.env.CONFIRM_OSL_IMPORT !== "YES") {
    throw new Error(
      "Import write refused. Set CONFIRM_OSL_IMPORT=YES only after reviewing the dry run.",
    );
  }
  if (writeBlockers.length > 0) {
    throw new Error(
      `Import write refused because ${writeBlockers.length} blocker(s) remain.`,
    );
  }

  const client = buildWriteClient();
  const createdIds: string[] = [];
  for (const [batchIndex, batch] of batches.entries()) {
    let transaction = client.transaction();
    for (const document of batch.documents) {
      // Preflight removes already-imported documents from the plan. Atomic
      // create fails on a race/collision instead of accepting a wrong record.
      transaction = transaction.create(document);
    }
    const result = await transaction.commit({
      visibility: "sync",
      returnFirst: false,
      returnDocuments: false,
    });
    const batchCreatedIds = result.results
      .filter((item) => item.operation === "create")
      .map((item) => item.id);
    createdIds.push(...batchCreatedIds);
    await onBatchCommitted?.(batchCreatedIds, batch, batchIndex);
  }
  return createdIds;
}

async function executeSampleDeletes(
  candidates: readonly CleanupCandidate[],
  anonymousDatasetCheck: AnonymousDatasetCheck,
): Promise<{
  readonly deletedIds: readonly string[];
  readonly skippedIds: readonly string[];
}> {
  if (process.env.CONFIRM_DELETE_SAMPLE_ATHLETES !== "YES") {
    throw new Error(
      "Sample deletion refused. Set CONFIRM_DELETE_SAMPLE_ATHLETES=YES only after reviewing the cleanup report.",
    );
  }
  if (!anonymousDatasetCheck.verified || !anonymousDatasetCheck.private) {
    throw new Error(
      "Sample deletion refused until the unified Sanity dataset is verified private.",
    );
  }

  const unsafe = candidates.filter((candidate) => !candidate.safeToRemove);
  if (unsafe.length > 0) {
    throw new Error(
      `Sample deletion refused: ${unsafe.length} candidate(s) still have references.`,
    );
  }
  if (candidates.some((candidate) => candidate.athleteId === ABU_ATHLETE_ID)) {
    throw new Error(`${ABU_ATHLETE_ID} is hard-protected from deletion.`);
  }
  if (
    candidates.some((candidate) => candidate.prototypeStatus !== "sample-record")
  ) {
    throw new Error("Deletion set contains a non-sample athlete.");
  }

  if (candidates.length === 0) {
    return { deletedIds: [], skippedIds: [] };
  }

  const client = buildWriteClient();
  const result = await client.delete(
    {
      query: `*[
        _id in $athleteIds &&
        _type == "athlete" &&
        prototypeStatus == "sample-record" &&
        count(*[references(^._id)]) == 0 &&
        count(*[sanity::versionOf(^._id)]) == 1
      ]`,
      params: {
        athleteIds: candidates.map((candidate) => candidate.athleteId),
      },
    },
    {
      visibility: "sync",
      returnFirst: false,
      returnDocuments: false,
    },
  );
  const deletedIds = result.documentIds;
  const deletedIdSet = new Set(deletedIds);
  return {
    deletedIds,
    skippedIds: candidates
      .map((candidate) => candidate.athleteId)
      .filter((athleteId) => !deletedIdSet.has(athleteId)),
  };
}

async function main() {
  const workspace = process.cwd();
  const args = parseArguments();
  const generatedAt = new Date().toISOString();
  const tmpDirectory = resolveInsideWorkspace(workspace, TMP_DIRECTORY);
  const loadedInputs = await loadReviewedInputs(workspace, args);
  const bundle = aggregateInputs(loadedInputs);
  const sourceRegistry = await loadSourceRegistry(workspace);
  const registeredSource = findRegisteredSource(sourceRegistry, SOURCE_ID);
  const sourceRegistryBlockers = sourceApprovalBlockers(registeredSource, [
    "athletes",
    "rankings",
  ]);

  await mkdir(tmpDirectory, { recursive: true });
  const manifestPath = path.join(tmpDirectory, MANIFEST_FILE);
  const manifest = makeManifest(bundle, generatedAt);

  // Local source parsing and manifest generation always complete before any
  // Sanity client is constructed or queried.
  await writeJson(manifestPath, manifest);

  if (args.validateOnly) {
    console.log("OFFICIAL STREETLIFTING LOCAL INPUT VALIDATION");
    console.log(`Reviewed input files: ${bundle.manifests.length}`);
    console.log(`Unique provider athletes: ${bundle.athletes.length}`);
    console.log(`Ranking systems: ${bundle.systemInputs.length}`);
    console.log(`Ranking snapshots: ${bundle.snapshotInputs.length}`);
    console.log(`Source registry: ${registeredSource.approvalStatus}`);
    console.log(`Manifest: ${path.relative(workspace, manifestPath)}`);
    console.log("Sanity access: NONE");
    console.log("Sanity mutations: 0");
    return;
  }

  const readClient = buildReadClient();
  const [state, anonymousDatasetCheck] = await Promise.all([
    fetchExistingState(readClient, bundle),
    checkAnonymousDataset(readClient),
  ]);
  const providerAndSystemErrors = validateProviderAndSystems(
    bundle.systemInputs,
    state,
  );
  const athletePlan = planAthletes(bundle.athletes, state, generatedAt);
  const abuGuarantees = validateAbuGuarantees(
    bundle,
    state,
    athletePlan.planned,
  );
  const cleanupCandidates = await buildCleanupPlan(readClient, state.samples);
  const plannedByProviderAthleteId = new Map(
    athletePlan.planned.map((planned) => [
      planned.source.providerAthleteId,
      planned,
    ]),
  );
  const snapshotPlans = bundle.snapshotInputs.map((input) => {
    const planned = input.snapshot.entries.flatMap((source) => {
      const base = plannedByProviderAthleteId.get(source.providerAthleteId);
      return base
        ? [
            {
              source,
              canonicalAthleteId: base.canonicalAthleteId,
              matchMethod: base.matchMethod,
            } satisfies PlannedAthlete,
          ]
        : [];
    });
    return {
      input,
      planned,
      complete: planned.length === input.snapshot.entries.length,
    };
  });
  const proposedSystemDocuments = bundle.systemInputs
    .filter(
      (input) =>
        !state.systems.some(
          (system) => system._id === input.rankingSystem.canonicalId,
        ),
    )
    .map(makeSystemDocument);
  const provisionalSnapshotDocuments = snapshotPlans
    .filter(
      ({ input, complete }) =>
        complete &&
        !state.snapshots.some(
          (snapshot) => snapshot._id === snapshotId(input),
        ),
    )
    .map(({ input, planned }) => makeSnapshotDocument(input, planned));
  const provisionalDocuments = [
    ...proposedSystemDocuments,
    ...athletePlan.planned.flatMap((item) =>
      [item.athleteDocument, item.identityDocument].filter(
        (document): document is ImportDocument => Boolean(document),
      ),
    ),
    ...provisionalSnapshotDocuments,
  ];
  const proposedIds = new Set(
    provisionalDocuments.map((document) => document._id),
  );
  const expectedTypes = new Map<string, string>([
    [PROVIDER_ID, "rankingProvider"],
    [ABU_ATHLETE_ID, "athlete"],
    [
      externalIdentityId(ABU_PROVIDER_ATHLETE_ID),
      "externalAthleteIdentity",
    ],
  ]);
  for (const input of bundle.systemInputs) {
    expectedTypes.set(input.rankingSystem.canonicalId, "rankingSystem");
  }
  for (const input of bundle.snapshotInputs) {
    expectedTypes.set(snapshotId(input), "rankingSnapshot");
  }
  for (const planned of athletePlan.planned) {
    expectedTypes.set(planned.canonicalAthleteId, "athlete");
    expectedTypes.set(
      externalIdentityId(planned.source.providerAthleteId),
      "externalAthleteIdentity",
    );
  }
  for (const identity of state.identities) {
    if (
      identity.providerAthleteId &&
      plannedByProviderAthleteId.has(identity.providerAthleteId)
    ) {
      expectedTypes.set(identity._id, "externalAthleteIdentity");
    }
  }
  const documentVariantErrors = await validateDocumentVariants(
    readClient,
    expectedTypes,
    proposedIds,
  );
  const existingSnapshotErrors = snapshotPlans.flatMap(
    ({ input, planned, complete }) =>
      complete ? validateExistingSnapshot(input, state, planned) : [],
  );
  const invalidRecords = [
    ...providerAndSystemErrors,
    ...athletePlan.errors,
    ...abuGuarantees.errors,
    ...existingSnapshotErrors,
    ...documentVariantErrors,
  ];
  const completePlan =
    invalidRecords.length === 0 &&
    athletePlan.planned.length === bundle.athletes.length &&
    snapshotPlans.every(({ complete }) => complete);
  const proposedSnapshotDocuments = completePlan
    ? provisionalSnapshotDocuments
    : [];
  const proposedDocuments = [
    ...proposedSystemDocuments,
    ...athletePlan.planned.flatMap((item) =>
      [item.athleteDocument, item.identityDocument].filter(
        (document): document is ImportDocument => Boolean(document),
      ),
    ),
    ...proposedSnapshotDocuments,
  ];
  let createBatches: CreateBatch[] = [];
  try {
    createBatches = makeCreateBatches(
      proposedSystemDocuments,
      athletePlan.planned,
      proposedSnapshotDocuments,
    );
  } catch (error) {
    invalidRecords.push(
      `Create batch planning failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const sourceRightsApproved = sourceRegistryBlockers.length === 0;
  const writeBlockers = [
    ...invalidRecords,
    ...sourceRegistryBlockers,
    ...(!anonymousDatasetCheck.verified
      ? [
          anonymousDatasetCheck.reason ??
            "Anonymous dataset access could not be verified.",
        ]
      : !anonymousDatasetCheck.private
        ? [
            `The unified Sanity dataset is anonymously queryable (${anonymousDatasetCheck.anonymousDocumentCount ?? "unknown"} documents, ${anonymousDatasetCheck.anonymousInternalDocumentCount ?? "unknown"} internal/operational documents).`,
          ]
        : []),
  ];
  const warnings = [
    ...(bundle.snapshotInputs.some(
      (input) => input.snapshot.coverage === "selected-rows",
    )
      ? ["At least one input covers selected rows, not a complete provider ranking export."]
      : []),
    "The provider publishes no clear ranking-effective date; rankingDate uses the documented observation-date policy.",
    "Observed kilogram totals remain manifest-only performance data.",
    "Create transactions are bounded and atomic per batch; a failed later batch can be safely resumed after a fresh full preflight.",
  ];
  const existingMatches = athletePlan.planned.filter(
    (item) => item.matchMethod === "existing-provider-identity",
  );
  const newAthletes = athletePlan.planned.filter(
    (item) => item.matchMethod === "new-canonical-athlete",
  );
  const newIdentities = athletePlan.planned.filter(
    (item) => Boolean(item.identityDocument),
  );
  const abuMatches = athletePlan.planned.filter(
    (item) => item.source.providerAthleteId === ABU_PROVIDER_ATHLETE_ID,
  );
  const abuMatchStatus =
    abuMatches.length === 0
      ? "NOT IN REVIEWED INPUT"
      : abuMatches.length === 1 &&
          abuMatches[0].canonicalAthleteId === ABU_ATHLETE_ID &&
          abuMatches[0].matchMethod === "existing-provider-identity" &&
          abuGuarantees.errors.length === 0
        ? "YES"
        : "NO";
  const importReport: JsonRecord = {
    title: args.write
      ? "OFFICIAL STREETLIFTING IMPORT WRITE"
      : "OFFICIAL STREETLIFTING IMPORT DRY RUN",
    generatedAt,
    mode: args.write
      ? "write-requested"
      : args.deleteSamples
        ? "sample-delete-requested"
        : "dry-run",
    integrationApproach: "manual-editorial structured input",
    sourceAccessReviewed: sourceRightsApproved,
    sourceRightsReviewStatus: sourceRightsApproved
      ? "approved"
      : "review-pending",
    sourceRegistry: {
      sourceId: registeredSource.sourceId,
      approvalStatus: registeredSource.approvalStatus,
      dataTypes: registeredSource.dataTypes,
      integrationMethod: registeredSource.integrationMethod,
      writeApproved: sourceRightsApproved,
    },
    manifestGenerated: true,
    manifestPath: path.relative(workspace, manifestPath),
    inputPaths: bundle.manifests.map(({ relativePath }) => relativePath),
    provider: {
      canonicalId: PROVIDER_ID,
      status: state.provider?.status,
      integrationMethod: state.provider?.integrationMethod,
    },
    anonymousDatasetCheck,
    queryStrategy: {
      perspective: "raw",
      idBatchSize: QUERY_ID_BATCH_SIZE,
      pageSize: QUERY_PAGE_SIZE,
      maxConcurrency: QUERY_CONCURRENCY,
    },
    createPlan: {
      maxDocumentsPerBatch: CREATE_BATCH_DOCUMENT_LIMIT,
      maxSerializedBytesPerBatch: CREATE_BATCH_BYTE_LIMIT,
      batches: createBatches.map((batch, index) => ({
        index,
        phase: batch.phase,
        documentCount: batch.documents.length,
        serializedBytes: documentBytes(batch.documents),
      })),
    },
    counts: {
      reviewedInputFiles: bundle.manifests.length,
      sourcePagesProcessed: bundle.sourcePages.length,
      athletesDiscovered: bundle.sourceEntryOccurrences,
      uniqueExternalIdentities: bundle.athletes.length,
      existingIdentitiesMatched: existingMatches.length,
      newCanonicalAthletesProposed: newAthletes.length,
      newExternalIdentitiesProposed: newIdentities.length,
      rankingSystemsDiscovered: bundle.systemInputs.length,
      rankingSystemsProposed: proposedSystemDocuments.length,
      rankingSnapshotsDiscovered: bundle.snapshotInputs.length,
      rankingSnapshotsProposed: proposedSnapshotDocuments.length,
      rankingEntries: proposedSnapshotDocuments.reduce(
        (total, document) =>
          total + (Array.isArray(document.entries) ? document.entries.length : 0),
        0,
      ),
      invalidRecords: invalidRecords.length,
      duplicateIdentities: athletePlan.duplicateIdentities.length,
      proposedDocuments: proposedDocuments.length,
      createBatches: createBatches.length,
    },
    operationDiff: {
      CREATE: proposedDocuments.map((document) => document._id),
      UPDATE: [],
      NOOP: existingMatches.map((item) => item.canonicalAthleteId),
      CONFLICT: invalidRecords,
      DELETE: [],
      safetyNote: "Ranking population is create-only. Existing exact mappings are NOOP; differences are CONFLICT. Sample cleanup remains a separate confirmed mode.",
    },
    countryDistribution: countryDistribution(bundle.athletes),
    duplicateProviderAthleteIds: athletePlan.duplicateIdentities,
    invalidRecords,
    matchedIdentities: existingMatches.map((item) => ({
      providerAthleteId: item.source.providerAthleteId,
      canonicalAthleteId: item.canonicalAthleteId,
      method: item.matchMethod,
    })),
    proposedAthletes: newAthletes.map((item) => ({
      canonicalAthleteId: item.canonicalAthleteId,
      providerAthleteId: item.source.providerAthleteId,
      providerDisplayName: item.source.providerDisplayName,
      country: item.source.country,
      verification: {
        identityStatus: "unverified",
        profileStatus: "not-reviewed",
      },
      prototypeStatus: null,
      rankingEligible: false,
    })),
    proposedRankingSystems: proposedSystemDocuments.map(
      (document) => document._id,
    ),
    proposedRankingSnapshots: proposedSnapshotDocuments.map(
      (document) => document._id,
    ),
    abuGuarantees: abuGuarantees.counts,
    abuMatchedExistingRecord: abuMatchStatus,
    writeBlockers,
    warnings,
    sanityMutations: 0,
    completedCreateBatches: 0,
    createdDocumentIds: [],
    mutationCounts: {
      bulkAthleteWrites: 0,
      externalIdentityWrites: 0,
      rankingWrites: 0,
      sampleDeletions: 0,
      providerStatusChanges: 0,
      publications: 0,
    },
  };
  const cleanupReport: JsonRecord = {
    title: "NON-PRODUCTION ATHLETE CLEANUP PLAN",
    generatedAt,
    sampleAthletesIdentified: cleanupCandidates.filter(
      (candidate) => candidate.prototypeStatus === "sample-record",
    ).length,
    nonProductionAthletesIdentified: cleanupCandidates.length,
    totalInboundRelationships: cleanupCandidates.reduce(
      (total, candidate) => total + candidate.references.length,
      0,
    ),
    totalReferencePaths: cleanupCandidates.reduce(
      (total, candidate) => total + candidate.referencePathCount,
      0,
    ),
    safeToRemoveNow: cleanupCandidates.filter(
      (candidate) => candidate.safeToRemove,
    ).length,
    requiresRemediation: cleanupCandidates.filter(
      (candidate) => !candidate.safeToRemove,
    ).length,
    candidates: cleanupCandidates,
    hardProtectedAthleteIds: [ABU_ATHLETE_ID],
    actualDeletions: 0,
    skippedAthleteIds: [],
  };

  const importReportJsonPath = path.join(tmpDirectory, IMPORT_REPORT_JSON);
  const importReportMarkdownPath = path.join(
    tmpDirectory,
    IMPORT_REPORT_MARKDOWN,
  );
  const cleanupReportJsonPath = path.join(tmpDirectory, CLEANUP_REPORT_JSON);
  const cleanupReportMarkdownPath = path.join(
    tmpDirectory,
    CLEANUP_REPORT_MARKDOWN,
  );

  const persistReports = () =>
    Promise.all([
      writeJson(importReportJsonPath, importReport),
      writeFile(
        importReportMarkdownPath,
        importReportMarkdown(importReport),
        "utf8",
      ),
      writeJson(cleanupReportJsonPath, cleanupReport),
      writeFile(
        cleanupReportMarkdownPath,
        cleanupReportMarkdown(cleanupReport),
        "utf8",
      ),
    ]);

  // Persist the reviewed zero-mutation plan even if an explicitly requested
  // mutation is refused by a confirmation or safety gate below.
  await persistReports();

  if (args.write) {
    const committedIds: string[] = [];
    const createdIds = await executeImportWrites(
      createBatches,
      writeBlockers,
      async (batchCreatedIds, _batch, batchIndex) => {
        committedIds.push(...batchCreatedIds);
        const mutationCounts = importReport.mutationCounts as JsonRecord;
        mutationCounts.bulkAthleteWrites = committedIds.filter((id) =>
          id.startsWith("athlete."),
        ).length;
        mutationCounts.externalIdentityWrites = committedIds.filter((id) =>
          id.startsWith("externalAthleteIdentity."),
        ).length;
        mutationCounts.rankingWrites = committedIds.filter(
          (id) =>
            id.startsWith("rankingSystem.") ||
            id.startsWith("rankingSnapshot."),
        ).length;
        importReport.sanityMutations = committedIds.length;
        importReport.createdDocumentIds = [...committedIds];
        importReport.completedCreateBatches = batchIndex + 1;
        await persistReports();
      },
    );
    console.log(`Import documents created: ${createdIds.length}`);
  }

  if (args.deleteSamples) {
    const { deletedIds, skippedIds } = await executeSampleDeletes(
      cleanupCandidates,
      anonymousDatasetCheck,
    );
    const mutationCounts = importReport.mutationCounts as JsonRecord;
    mutationCounts.sampleDeletions = deletedIds.length;
    importReport.sanityMutations = deletedIds.length;
    importReport.deletedDocumentIds = deletedIds;
    cleanupReport.actualDeletions = deletedIds.length;
    cleanupReport.deletedAthleteIds = deletedIds;
    cleanupReport.skippedAthleteIds = skippedIds;
    console.log(`Sample athletes deleted: ${deletedIds.length}`);
    if (skippedIds.length > 0) {
      console.log(
        `Sample athletes skipped by mutation-time safety checks: ${skippedIds.join(", ")}`,
      );
    }
  }

  if (args.write || args.deleteSamples) {
    await persistReports();
  }

  printDryRunSummary(importReport, cleanupReport);
  console.log("");
  console.log(
    `Reports: ${path.relative(workspace, importReportMarkdownPath)}, ${path.relative(workspace, cleanupReportMarkdownPath)}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
