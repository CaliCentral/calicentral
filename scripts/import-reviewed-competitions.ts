import {createHash} from "node:crypto"
import {mkdir, readFile, readdir, writeFile} from "node:fs/promises"
import path from "node:path"

import {createClient, type SanityClient} from "next-sanity"
import {z} from "zod"

import {countryCodeFor, countryNameFor} from "../lib/geography"
import {
  findRegisteredSource,
  loadSourceRegistry,
  sourceApprovalBlockers,
  type SourceRegistry,
} from "./lib/source-registry"

type JsonRecord = Record<string, unknown>
type ImportDocument = {
  readonly _id: string
  readonly _type: string
  readonly [field: string]: unknown
}

const API_VERSION_FALLBACK = "2026-07-01"
const DEFAULT_INPUT_DIRECTORY = "data/imports/competitions"
const TMP_DIRECTORY = ".tmp"
const PLAN_FILE = "reviewed-competition-import-plan.json"
const REPORT_JSON_FILE = "reviewed-competition-import-report.json"
const REPORT_MARKDOWN_FILE = "reviewed-competition-import-report.md"
const MAX_INPUT_FILES = 100
const MAX_COMPETITIONS = 10_000
const QUERY_ID_BATCH_SIZE = 40
const QUERY_PAGE_SIZE = 200
const QUERY_CONCURRENCY = 4
const CREATE_BATCH_DOCUMENT_LIMIT = 50
const CREATE_BATCH_BYTE_LIMIT = 750_000

const httpUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value)
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    )
  }, "Expected a public HTTP(S) URL without embedded credentials.")

const slugValue = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const sourceSchema = z
  .object({
    sourceTitle: z.string().trim().min(1).max(180),
    sourceType: z.enum([
      "official-results-page",
      "organization-ranking-page",
      "official-result-sheet",
      "organizer-source",
      "editor-confirmed",
      "other",
    ]),
    sourceUrl: httpUrl,
    publishedAt: z.string().datetime({offset: true}).optional(),
    checkedAt: z.string().datetime({offset: true}),
    verificationStatus: z.enum([
      "unverified",
      "submitted",
      "source-confirmed",
      "official",
    ]),
  })
  .strict()

const competitionEntrySchema = z
  .object({
    reviewedKey: slugValue,
    providerCompetitionId: z.string().trim().min(1).max(180).optional(),
    providerCompetitionUrl: httpUrl.optional(),
    providerDisplayName: z.string().trim().min(1).max(140).optional(),
    sourceTitle: z.string().trim().min(1).max(180).optional(),
    sourceUrl: httpUrl.optional(),
    canonicalCompetitionId: z
      .string()
      .trim()
      .max(128)
      .regex(/^competition\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/)
      .optional(),
    slug: slugValue.optional(),
    name: z.string().trim().min(1).max(120),
    eventSeries: z.string().trim().min(1).max(140).optional(),
    editorialPriority: z.enum([
      "world-championship",
      "continental-championship",
      "national-championship",
      "major-open",
      "qualifier",
      "major-event",
      "standard",
    ]).optional(),
    featured: z.boolean().optional(),
    startDate: z.string().date(),
    endDate: z.string().date().optional(),
    status: z
      .enum(["upcoming", "completed", "postponed", "cancelled", "preview"])
      .optional(),
    city: z.string().trim().min(1).max(80).optional(),
    administrativeArea: z.string().trim().min(1).max(100).optional(),
    country: z.string().trim().min(1).max(80).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    venueName: z.string().trim().min(1).max(120).optional(),
    organizerName: z.string().trim().min(1).max(120).optional(),
    organizationId: z
      .string()
      .trim()
      .max(128)
      .regex(/^organization\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/)
      .optional(),
    disciplines: z
      .array(
        z.enum([
          "freestyle",
          "streetlifting",
          "weighted-calisthenics",
          "static-strength",
          "dynamic",
          "endurance",
          "skills",
          "team",
          "mixed",
        ]),
      )
      .min(1)
      .max(6)
      .optional(),
    primaryDiscipline: z
      .enum([
        "freestyle",
        "streetlifting",
        "weighted-calisthenics",
        "static-strength",
        "dynamic",
        "endurance",
        "skills",
        "team",
        "mixed",
      ])
      .optional(),
    competitionFormat: z.string().trim().min(1).max(240).optional(),
    registrationUrl: httpUrl.optional(),
    officialWebsite: httpUrl.optional(),
    resultsUrl: httpUrl.optional(),
    livestreamUrl: httpUrl.optional(),
  })
  .strict()

const inputSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal("competitions"),
    sourceId: z.string().trim().min(1).max(96).optional(),
    collectionMethod: z.literal("manual-editorial"),
    provider: z
      .object({
        canonicalId: z
          .string()
          .trim()
          .max(128)
          .regex(/^rankingProvider\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/),
        slug: slugValue,
        name: z.string().trim().min(1).max(140),
        website: httpUrl,
        integrationMethod: z.enum(["manual", "editorial"]),
        status: z.enum(["under-review", "active"]),
      })
      .strict()
      .optional(),
    sourceRights: z
      .object({
        reviewStatus: z.enum(["review-pending", "approved"]),
        automatedCollectionAllowed: z.literal(false),
        approvalReference: z.string().trim().min(1).max(500).optional(),
        approvedAt: z.string().datetime({offset: true}).optional(),
        notes: z.string().trim().min(1).max(2000),
      })
      .strict(),
    source: sourceSchema,
    competitions: z.array(competitionEntrySchema).min(1).max(1000),
  })
  .strict()

type ImportInput = z.infer<typeof inputSchema>
type CompetitionEntry = z.infer<typeof competitionEntrySchema>

type LoadedInput = {
  readonly inputPath: string
  readonly relativePath: string
  readonly input: ImportInput
}

type ReviewedCompetition = {
  readonly key: string
  readonly inputPath: string
  readonly provider?: NonNullable<ImportInput["provider"]>
  readonly sourceRights: ImportInput["sourceRights"]
  readonly source: ImportInput["source"]
  readonly competition: CompetitionEntry
  readonly deterministicCompetitionId: string
  readonly deterministicIdentityId?: string
  readonly deterministicSlug: string
}

type ImportBundle = {
  readonly manifests: readonly LoadedInput[]
  readonly competitions: readonly ReviewedCompetition[]
  readonly providers: readonly NonNullable<ImportInput["provider"]>[]
}

type VariantDocument = {
  readonly _id: string
  readonly _type: string
  readonly _canonicalId?: string
}

type RawProvider = VariantDocument & {
  readonly name?: string
  readonly slug?: string
  readonly website?: string
  readonly status?: string
  readonly integrationMethod?: string
}

type RawIdentity = VariantDocument & {
  readonly providerId?: string
  readonly providerCompetitionId?: string
  readonly providerCompetitionUrl?: string
  readonly providerDisplayName?: string
  readonly competitionId?: string
  readonly matchingStatus?: string
  readonly reviewStatus?: string
}

type RawCompetitionSource = {
  readonly providerId?: string
  readonly sourceTitle?: string
  readonly sourceType?: string
  readonly url?: string
  readonly externalRecordId?: string
  readonly publishedAt?: string
  readonly checkedAt?: string
  readonly verificationStatus?: string
}

type RawCompetition = VariantDocument & {
  readonly name?: string
  readonly eventSeries?: string
  readonly editorialPriority?: string
  readonly featured?: boolean
  readonly slug?: string
  readonly startDate?: string
  readonly endDate?: string
  readonly status?: string
  readonly city?: string
  readonly administrativeArea?: string
  readonly country?: string
  readonly region?: string
  readonly venueName?: string
  readonly organizerName?: string
  readonly organizationId?: string
  readonly disciplines?: readonly string[]
  readonly primaryDiscipline?: string
  readonly competitionFormat?: string
  readonly actionLinks?: readonly {
    readonly linkType?: string
    readonly url?: string
    readonly affiliate?: boolean
  }[]
  readonly contentStatus?: string
  readonly publicStatus?: string
  readonly externalProviderId?: string
  readonly externalProviderUrl?: string
  readonly source?: RawCompetitionSource
}

type RawOrganization = VariantDocument & {
  readonly name?: string
}

type ExistingState = {
  readonly providers: readonly RawProvider[]
  readonly identities: readonly RawIdentity[]
  readonly competitions: readonly RawCompetition[]
  readonly organizations: readonly RawOrganization[]
  readonly targetVariants: readonly VariantDocument[]
}

type AnonymousDatasetCheck = {
  readonly verified: boolean
  readonly private: boolean
  readonly aclMode?: string
  readonly anonymousDocumentCount?: number
  readonly anonymousInternalDocumentCount?: number
  readonly reason?: string
}

type PlannedCompetition = {
  readonly reviewed: ReviewedCompetition
  readonly canonicalCompetitionId: string
  readonly matchMethod:
    | "existing-provider-identity"
    | "explicit-editorial-mapping"
    | "deterministic-provider-id"
    | "reviewed-source-key"
  readonly competitionDocument?: ImportDocument
  readonly identityDocument?: ImportDocument
}

type CreateBatch = {
  readonly documents: readonly ImportDocument[]
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function chunksOf<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0
  const workers = Array.from(
    {length: Math.min(concurrency, items.length)},
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex
        nextIndex += 1
        results[index] = await mapper(items[index], index)
      }
    },
  )
  await Promise.all(workers)
  return results
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function stableIdPart(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")

  if (normalized && normalized === value && normalized.length <= 72) {
    return normalized
  }

  return `${normalized.slice(0, 48) || "competition"}-${sha256(value).slice(0, 12)}`
}

function boundedProviderDocumentId(
  namespace: "competition.import" | "externalCompetitionIdentity",
  providerSlug: string,
  providerCompetitionId: string,
) {
  const providerPart = stableIdPart(providerSlug)
  const competitionPart = stableIdPart(providerCompetitionId)
  const natural = `${namespace}.${providerPart}.${competitionPart}`
  if (natural.length <= 128) {
    return natural
  }
  const hash = sha256(`${providerSlug}\u0000${providerCompetitionId}`).slice(0, 16)
  const bounded = `${namespace}.${providerPart.slice(0, 32)}.${competitionPart.slice(0, 48)}-${hash}`
  if (bounded.length > 128) {
    throw new Error(`Could not construct a bounded ${namespace} document ID.`)
  }
  return bounded
}

function competitionId(providerSlug: string, providerCompetitionId: string) {
  return boundedProviderDocumentId(
    "competition.import",
    providerSlug,
    providerCompetitionId,
  )
}

function reviewedCompetitionId(reviewedKey: string) {
  return `competition.reviewed.${reviewedKey}`
}

function identityId(providerSlug: string, providerCompetitionId: string) {
  return boundedProviderDocumentId(
    "externalCompetitionIdentity",
    providerSlug,
    providerCompetitionId,
  )
}

function boundedSlug(prefix: string, identity: string) {
  const value = `${prefix}-${stableIdPart(identity)}`
  return value.length <= 96
    ? value
    : `${value.slice(0, 83)}-${sha256(`${prefix}\u0000${identity}`).slice(0, 12)}`
}

function competitionSlug(providerSlug: string, providerCompetitionId: string) {
  return boundedSlug(providerSlug, providerCompetitionId)
}

function reviewedCompetitionSlug(reviewedKey: string) {
  return boundedSlug("reviewed", reviewedKey)
}

function reference(id: string) {
  return {_type: "reference", _ref: id}
}

function slug(current: string) {
  return {_type: "slug", current}
}

function parseArguments() {
  const args = process.argv.slice(2)
  const inputArguments = args.filter((argument) => argument.startsWith("--input="))
  const inputDirectoryArguments = args.filter((argument) =>
    argument.startsWith("--input-dir="),
  )
  const unknownArguments = args.filter(
    (argument) =>
      argument !== "--validate" &&
      argument !== "--write" &&
      !argument.startsWith("--input=") &&
      !argument.startsWith("--input-dir="),
  )

  if (unknownArguments.length > 0) {
    throw new Error(`Unsupported argument(s): ${unknownArguments.join(", ")}`)
  }
  if (inputDirectoryArguments.length > 1) {
    throw new Error("Only one --input-dir=<directory> is allowed.")
  }
  if (args.includes("--validate") && args.includes("--write")) {
    throw new Error("--validate and --write are mutually exclusive.")
  }
  if (inputArguments.some((argument) => argument === "--input=")) {
    throw new Error("--input requires a workspace-relative JSON path.")
  }
  if (inputDirectoryArguments[0] === "--input-dir=") {
    throw new Error("--input-dir requires a workspace-relative directory.")
  }

  return {
    validateOnly: args.includes("--validate"),
    write: args.includes("--write"),
    inputs: inputArguments.map((argument) => argument.slice("--input=".length)),
    inputDirectory:
      inputDirectoryArguments[0]?.slice("--input-dir=".length) ??
      (inputArguments.length === 0 ? DEFAULT_INPUT_DIRECTORY : undefined),
    defaultDirectory:
      inputArguments.length === 0 && inputDirectoryArguments.length === 0,
  }
}

function resolveInsideWorkspace(workspace: string, relativePath: string): string {
  const resolved = path.resolve(workspace, relativePath)
  const relative = path.relative(workspace, resolved)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path must remain inside the workspace: ${relativePath}`)
  }
  return resolved
}

async function discoverInputPaths(
  workspace: string,
  args: ReturnType<typeof parseArguments>,
): Promise<string[]> {
  const paths = [...args.inputs]
  if (args.inputDirectory) {
    const absoluteDirectory = resolveInsideWorkspace(workspace, args.inputDirectory)
    let entries
    try {
      entries = await readdir(absoluteDirectory, {withFileTypes: true})
    } catch (error) {
      if (
        args.defaultDirectory &&
        isRecord(error) &&
        String(error.code ?? "") === "ENOENT"
      ) {
        return []
      }
      throw error
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLocaleLowerCase().endsWith(".json")) {
        paths.push(path.join(args.inputDirectory, entry.name))
      }
    }
  }

  const uniquePaths = [...new Set(paths)].sort()
  if (uniquePaths.length > MAX_INPUT_FILES) {
    throw new Error(`At most ${MAX_INPUT_FILES} competition input files are allowed.`)
  }
  return uniquePaths
}

function validateInputRelationships(input: ImportInput, relativePath: string) {
  const errors: string[] = []
  if (
    input.provider &&
    input.provider.canonicalId !== `rankingProvider.${input.provider.slug}`
  ) {
    errors.push(
      `${relativePath}: provider.canonicalId must be rankingProvider.${input.provider.slug}.`,
    )
  }
  if (
    input.sourceRights.reviewStatus === "approved" &&
    (!input.sourceRights.approvalReference || !input.sourceRights.approvedAt)
  ) {
    errors.push(
      `${relativePath}: approved source rights require approvalReference and approvedAt.`,
    )
  }
  if (
    input.sourceRights.reviewStatus === "review-pending" &&
    (input.sourceRights.approvalReference || input.sourceRights.approvedAt)
  ) {
    errors.push(
      `${relativePath}: pending source rights cannot carry approvalReference or approvedAt.`,
    )
  }

  const ids = new Set<string>()
  for (const entry of input.competitions) {
    if (entry.providerCompetitionId && !input.provider) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} supplies providerCompetitionId without provider metadata.`,
      )
    }
    if (entry.providerCompetitionUrl && !input.provider) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} supplies providerCompetitionUrl without provider metadata; use sourceUrl for a source-only record.`,
      )
    }
    if (entry.providerDisplayName && !entry.providerCompetitionId) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} supplies providerDisplayName without providerCompetitionId.`,
      )
    }
    const identityKey = entry.providerCompetitionId
      ? `${input.provider?.canonicalId ?? "missing-provider"}:${entry.providerCompetitionId}`
      : `reviewed:${entry.reviewedKey}`
    if (ids.has(identityKey)) {
      errors.push(
        `${relativePath}: duplicate competition identity ${identityKey}.`,
      )
    }
    ids.add(identityKey)

    if (entry.endDate && entry.endDate < entry.startDate) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} ends before it starts.`,
      )
    }
    if (entry.country && !countryCodeFor(entry.country)) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} has unsupported country '${entry.country}'.`,
      )
    }
    if (
      entry.primaryDiscipline &&
      !entry.disciplines?.includes(entry.primaryDiscipline)
    ) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} primaryDiscipline must also appear in disciplines.`,
      )
    }
    if (entry.disciplines && new Set(entry.disciplines).size !== entry.disciplines.length) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} has duplicate disciplines.`,
      )
    }

    const expectedSlug =
      input.provider && entry.providerCompetitionId
        ? competitionSlug(input.provider.slug, entry.providerCompetitionId)
        : reviewedCompetitionSlug(entry.reviewedKey)
    if (entry.slug && entry.slug !== expectedSlug) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} slug must be deterministic (${expectedSlug}).`,
      )
    }

    const actionUrls = [
      entry.registrationUrl,
      entry.officialWebsite,
      entry.resultsUrl,
      entry.livestreamUrl,
    ].filter((url): url is string => Boolean(url))
    if (new Set(actionUrls).size !== actionUrls.length) {
      errors.push(
        `${relativePath}: ${entry.reviewedKey} repeats a public action URL.`,
      )
    }
  }
  return errors
}

async function loadInputs(
  workspace: string,
  args: ReturnType<typeof parseArguments>,
): Promise<LoadedInput[]> {
  const inputPaths = await discoverInputPaths(workspace, args)
  return Promise.all(
    inputPaths.map(async (inputPath) => {
      const absolutePath = resolveInsideWorkspace(workspace, inputPath)
      const relativePath = path.relative(workspace, absolutePath)
      let parsed: unknown
      try {
        parsed = JSON.parse(await readFile(absolutePath, "utf8"))
      } catch (error) {
        throw new Error(
          `${relativePath}: invalid JSON (${error instanceof Error ? error.message : String(error)}).`,
        )
      }

      const result = inputSchema.safeParse(parsed)
      if (!result.success) {
        const details = result.error.issues
          .map((issue) => `${issue.path.join(".") || "document"}: ${issue.message}`)
          .join("; ")
        throw new Error(`${relativePath}: manifest validation failed: ${details}`)
      }
      const relationshipErrors = validateInputRelationships(result.data, relativePath)
      if (relationshipErrors.length > 0) {
        throw new Error(relationshipErrors.join("\n"))
      }
      return {inputPath: absolutePath, relativePath, input: result.data}
    }),
  )
}

function aggregateInputs(manifests: readonly LoadedInput[]): ImportBundle {
  const competitions: ReviewedCompetition[] = []
  const seenKeys = new Map<string, string>()
  const seenSlugs = new Map<string, {key: string; path: string}>()
  const seenDocumentIds = new Map<string, {key: string; path: string}>()
  const providers = new Map<
    string,
    NonNullable<ImportInput["provider"]>
  >()

  for (const manifest of manifests) {
    if (manifest.input.provider) {
      const existingProvider = providers.get(
        manifest.input.provider.canonicalId,
      )
      if (
        existingProvider &&
        JSON.stringify(existingProvider) !==
          JSON.stringify(manifest.input.provider)
      ) {
        throw new Error(
          `Provider metadata conflicts across inputs for ${manifest.input.provider.canonicalId}.`,
        )
      }
      providers.set(
        manifest.input.provider.canonicalId,
        manifest.input.provider,
      )
    }

    for (const entry of manifest.input.competitions) {
      const key =
        manifest.input.provider && entry.providerCompetitionId
          ? `${manifest.input.provider.canonicalId}\u0000${entry.providerCompetitionId}`
          : `reviewed\u0000${entry.reviewedKey}`
      const priorPath = seenKeys.get(key)
      if (priorPath) {
        throw new Error(
          `Competition identity ${entry.providerCompetitionId ?? entry.reviewedKey} is repeated in ${priorPath} and ${manifest.relativePath}.`,
        )
      }
      seenKeys.set(key, manifest.relativePath)
      const providerBacked = Boolean(
        manifest.input.provider && entry.providerCompetitionId,
      )
      const deterministicSlug = providerBacked
        ? competitionSlug(
            manifest.input.provider!.slug,
            entry.providerCompetitionId!,
          )
        : reviewedCompetitionSlug(entry.reviewedKey)
      const priorSlug = seenSlugs.get(deterministicSlug)
      if (priorSlug && priorSlug.key !== key) {
        throw new Error(
          `Deterministic slug ${deterministicSlug} collides between ${priorSlug.path} and ${manifest.relativePath}.`,
        )
      }
      seenSlugs.set(deterministicSlug, {key, path: manifest.relativePath})
      const deterministicCompetitionId = providerBacked
        ? competitionId(
            manifest.input.provider!.slug,
            entry.providerCompetitionId!,
          )
        : reviewedCompetitionId(entry.reviewedKey)
      const deterministicIdentityId = providerBacked
        ? identityId(
            manifest.input.provider!.slug,
            entry.providerCompetitionId!,
          )
        : undefined
      for (const documentId of [
        deterministicCompetitionId,
        deterministicIdentityId,
      ].filter((id): id is string => Boolean(id))) {
        if (documentId.length > 128) {
          throw new Error(`Deterministic document ID exceeds 128 characters: ${documentId}.`)
        }
        const priorDocumentId = seenDocumentIds.get(documentId)
        if (priorDocumentId && priorDocumentId.key !== key) {
          throw new Error(
            `Deterministic document ID ${documentId} collides between ${priorDocumentId.path} and ${manifest.relativePath}.`,
          )
        }
        seenDocumentIds.set(documentId, {key, path: manifest.relativePath})
      }
      competitions.push({
        key,
        inputPath: manifest.relativePath,
        provider: manifest.input.provider,
        sourceRights: manifest.input.sourceRights,
        source: manifest.input.source,
        competition: entry,
        deterministicCompetitionId,
        deterministicIdentityId,
        deterministicSlug,
      })
    }
  }

  if (competitions.length > MAX_COMPETITIONS) {
    throw new Error(`At most ${MAX_COMPETITIONS} reviewed competitions are allowed.`)
  }
  return {
    manifests,
    competitions,
    providers: [...providers.values()].sort((left, right) =>
      left.canonicalId.localeCompare(right.canonicalId),
    ),
  }
}

function actionLinks(entry: CompetitionEntry) {
  const actions = [
    ["registration", "Register to compete", entry.registrationUrl],
    ["official-site", "Official event site", entry.officialWebsite],
    ["results", "View results", entry.resultsUrl],
    ["livestream", "Watch livestream", entry.livestreamUrl],
  ] as const

  return actions.flatMap(([linkType, label, url]) =>
    url
      ? [
          {
            _key: `${linkType}-${sha256(url).slice(0, 10)}`,
            _type: "competitionActionLink",
            label,
            url,
            linkType,
            affiliate: false,
          },
        ]
      : [],
  )
}

function makeCompetitionDocument(
  reviewed: ReviewedCompetition,
  canonicalCompetitionId: string,
): ImportDocument {
  const entry = reviewed.competition
  const links = actionLinks(entry)
  const sourceProvider = reviewed.provider
    ? {provider: reference(reviewed.provider.canonicalId)}
    : {}
  return {
    _id: canonicalCompetitionId,
    _type: "competition",
    name: entry.name,
    ...(entry.eventSeries ? {eventSeries: entry.eventSeries} : {}),
    ...(entry.editorialPriority
      ? {editorialPriority: entry.editorialPriority}
      : {}),
    slug: slug(reviewed.deterministicSlug),
    startDate: entry.startDate,
    ...(entry.endDate ? {endDate: entry.endDate} : {}),
    ...(entry.status ? {status: entry.status} : {}),
    ...(entry.city ? {city: entry.city} : {}),
    ...(entry.administrativeArea
      ? {administrativeArea: entry.administrativeArea}
      : {}),
    ...(entry.country ? {country: countryNameFor(entry.country)} : {}),
    ...(entry.region ? {region: entry.region} : {}),
    ...(entry.venueName ? {venueName: entry.venueName} : {}),
    ...(entry.organizerName ? {organizerName: entry.organizerName} : {}),
    ...(entry.organizationId
      ? {organization: reference(entry.organizationId)}
      : {}),
    ...(entry.disciplines ? {disciplines: entry.disciplines} : {}),
    ...(entry.primaryDiscipline
      ? {primaryDiscipline: entry.primaryDiscipline}
      : {}),
    ...(entry.competitionFormat
      ? {competitionFormat: entry.competitionFormat}
      : {}),
    ...(links.length > 0 ? {actionLinks: links} : {}),
    featured: entry.featured ?? false,
    visualVariant: "signal",
    contentStatus: "published-record",
    publicStatus: "draft",
    source: {
      _type: "provenanceSource",
      ...sourceProvider,
      sourceTitle: entry.sourceTitle ?? reviewed.source.sourceTitle,
      sourceType: reviewed.source.sourceType,
      url:
        entry.sourceUrl ??
        entry.providerCompetitionUrl ??
        reviewed.source.sourceUrl,
      ...(entry.providerCompetitionId
        ? {externalRecordId: entry.providerCompetitionId}
        : {}),
      ...(reviewed.source.publishedAt
        ? {publishedAt: reviewed.source.publishedAt}
        : {}),
      checkedAt: reviewed.source.checkedAt,
      verificationStatus: reviewed.source.verificationStatus,
    },
    ...(entry.providerCompetitionId
      ? {externalProviderId: entry.providerCompetitionId}
      : {}),
    ...(reviewed.provider && entry.providerCompetitionUrl
      ? {externalProviderUrl: entry.providerCompetitionUrl}
      : {}),
  }
}

function makeIdentityDocument(
  reviewed: ReviewedCompetition,
  canonicalCompetitionId: string,
  generatedAt: string,
): ImportDocument {
  const entry = reviewed.competition
  if (
    !reviewed.provider ||
    !entry.providerCompetitionId ||
    !reviewed.deterministicIdentityId
  ) {
    throw new Error(
      `External identity requested for source-only record ${entry.reviewedKey}.`,
    )
  }
  return {
    _id: reviewed.deterministicIdentityId,
    _type: "externalCompetitionIdentity",
    competition: reference(canonicalCompetitionId),
    provider: reference(reviewed.provider.canonicalId),
    providerCompetitionId: entry.providerCompetitionId,
    ...(entry.providerCompetitionUrl
      ? {providerCompetitionUrl: entry.providerCompetitionUrl}
      : {}),
    providerDisplayName: entry.providerDisplayName ?? entry.name,
    matchingStatus: "candidate",
    reviewStatus: "not-reviewed",
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

function isDraftId(id: string) {
  return id.startsWith("drafts.")
}

function isReleaseVersionId(id: string) {
  return id.startsWith("versions.")
}

function canonicalIdForVariant(id: string): string {
  if (isDraftId(id)) {
    return id.slice("drafts.".length)
  }
  if (isReleaseVersionId(id)) {
    const [, releaseName, ...publishedIdParts] = id.split(".")
    if (releaseName && publishedIdParts.length > 0) {
      return publishedIdParts.join(".")
    }
  }
  return id
}

function buildReadClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK
  const token = process.env.SANITY_API_READ_TOKEN?.trim()
  if (!projectId || !dataset || !token) {
    throw new Error(
      "Read-only preflight requires Sanity project, dataset, and SANITY_API_READ_TOKEN.",
    )
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  })
}

function buildWriteClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim()
  if (!projectId || !dataset || !token) {
    throw new Error(
      "Mutation mode requires Sanity project, dataset, and SANITY_API_WRITE_TOKEN.",
    )
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  })
}

async function checkAnonymousDataset(
  authenticatedClient: SanityClient,
): Promise<AnonymousDatasetCheck> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || API_VERSION_FALLBACK
  if (!projectId || !dataset) {
    return {
      verified: false,
      private: false,
      reason: "Sanity project and dataset are required.",
    }
  }

  try {
    let aclMode: string | undefined
    try {
      const datasets = await authenticatedClient.datasets.list()
      aclMode = datasets.find((candidate) => candidate.name === dataset)?.aclMode
    } catch {
      // Dataset-scoped tokens may not be able to inspect project settings. The
      // direct anonymous check below still fails closed.
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
          "externalCompetitionIdentity",
          "rankingSnapshot"
        ]
      ])
    }`
    const endpoint = new URL(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${encodeURIComponent(dataset)}`,
    )
    endpoint.searchParams.set("query", query)
    endpoint.searchParams.set("perspective", "raw")
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "omit",
      headers: {accept: "application/json"},
    })
    if (response.status === 401 || response.status === 403) {
      return {
        verified: aclMode === "private",
        private: aclMode === "private",
        aclMode,
        reason: "Anonymous Content Lake access was denied.",
      }
    }
    if (!response.ok) {
      return {
        verified: false,
        private: false,
        aclMode,
        reason: `Anonymous dataset check returned HTTP ${response.status}.`,
      }
    }

    const payload = (await response.json()) as unknown
    const result = isRecord(payload) ? payload.result : undefined
    const counts = isRecord(result) ? result : {}
    const allDocuments =
      typeof counts.allDocuments === "number" ? counts.allDocuments : undefined
    const internalDocuments =
      typeof counts.internalDocuments === "number"
        ? counts.internalDocuments
        : undefined
    if (allDocuments === undefined || internalDocuments === undefined) {
      return {
        verified: false,
        private: false,
        aclMode,
        reason: "Anonymous dataset check returned an unexpected response shape.",
      }
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
            : "The anonymous query returned no documents, but a private dataset ACL could not be verified.",
    }
  } catch (error) {
    return {
      verified: false,
      private: false,
      reason: `Could not verify anonymous dataset access: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

async function fetchVariantsForIds<T extends VariantDocument>(
  client: SanityClient,
  canonicalIds: readonly string[],
  projection: string,
): Promise<T[]> {
  const uniqueIds = [...new Set(canonicalIds)].sort()
  if (uniqueIds.length === 0) {
    return []
  }
  const batches = await mapWithConcurrency(
    chunksOf(uniqueIds, QUERY_ID_BATCH_SIZE),
    QUERY_CONCURRENCY,
    async (idBatch) => {
      const params: Record<string, string> = {}
      const predicates = idBatch.map((id, index) => {
        params[`id${index}`] = id
        return `sanity::versionOf($id${index})`
      })
      const canonicalProjection = idBatch
        .map((_, index) => `sanity::versionOf($id${index}) => $id${index}`)
        .join(", ")
      const documents: T[] = []
      let cursor = ""
      while (true) {
        const page = await client.fetch<T[]>(
          `*[(${predicates.join(" || ")}) && _id > $cursor]
            | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
              ${projection},
              "_canonicalId": select(${canonicalProjection})
            }`,
          {...params, cursor},
        )
        documents.push(...page)
        if (page.length < QUERY_PAGE_SIZE) {
          break
        }
        const nextCursor = page.at(-1)?._id
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("Variant query pagination did not advance.")
        }
        cursor = nextCursor
      }
      return documents
    },
  )
  return batches.flat()
}

async function fetchExactIdentities(
  client: SanityClient,
  competitions: readonly ReviewedCompetition[],
): Promise<RawIdentity[]> {
  const providerGroups = new Map<string, string[]>()
  for (const reviewed of competitions) {
    if (!reviewed.provider || !reviewed.competition.providerCompetitionId) {
      continue
    }
    const ids = providerGroups.get(reviewed.provider.canonicalId) ?? []
    ids.push(reviewed.competition.providerCompetitionId)
    providerGroups.set(reviewed.provider.canonicalId, ids)
  }

  const requests = [...providerGroups.entries()].flatMap(([providerId, ids]) =>
    chunksOf([...new Set(ids)].sort(), QUERY_ID_BATCH_SIZE).map((idBatch) => ({
      providerId,
      idBatch,
    })),
  )
  const pages = await mapWithConcurrency(
    requests,
    QUERY_CONCURRENCY,
    async ({providerId, idBatch}) => {
      const documents: RawIdentity[] = []
      let cursor = ""
      while (true) {
        const page = await client.fetch<RawIdentity[]>(
          `*[
            _type == "externalCompetitionIdentity" &&
            provider._ref == $providerId &&
            providerCompetitionId in $providerCompetitionIds &&
            _id > $cursor
          ] | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
            _id, _type,
            "providerId": provider._ref,
            providerCompetitionId,
            providerCompetitionUrl,
            providerDisplayName,
            "competitionId": competition._ref,
            matchingStatus,
            reviewStatus
          }`,
          {providerId, providerCompetitionIds: idBatch, cursor},
        )
        documents.push(...page)
        if (page.length < QUERY_PAGE_SIZE) {
          break
        }
        const nextCursor = page.at(-1)?._id
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("External competition identity pagination did not advance.")
        }
        cursor = nextCursor
      }
      return documents
    },
  )
  return pages.flat()
}

async function fetchCompetitionsForSlugs(
  client: SanityClient,
  slugs: readonly string[],
): Promise<RawCompetition[]> {
  const requests = chunksOf(
    [...new Set(slugs)].sort(),
    QUERY_ID_BATCH_SIZE,
  )
  const pages = await mapWithConcurrency(
    requests,
    QUERY_CONCURRENCY,
    async (slugBatch) => {
      const documents: RawCompetition[] = []
      let cursor = ""
      while (true) {
        const page = await client.fetch<RawCompetition[]>(
          `*[
            _type == "competition" &&
            slug.current in $slugs &&
            _id > $cursor
          ] | order(_id asc)[0...${QUERY_PAGE_SIZE}]{
            _id, _type, name, eventSeries, editorialPriority, featured,
            "slug": slug.current, startDate, endDate,
            status, city, administrativeArea, country, region, venueName,
            organizerName, "organizationId": organization._ref,
            disciplines, primaryDiscipline, competitionFormat,
            actionLinks[]{linkType, url, affiliate},
            contentStatus, publicStatus, externalProviderId,
            externalProviderUrl,
            source{"providerId": provider._ref, sourceTitle, sourceType, url,
              externalRecordId, publishedAt, checkedAt, verificationStatus}
          }`,
          {slugs: slugBatch, cursor},
        )
        documents.push(...page)
        if (page.length < QUERY_PAGE_SIZE) {
          break
        }
        const nextCursor = page.at(-1)?._id
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("Competition slug query pagination did not advance.")
        }
        cursor = nextCursor
      }
      return documents
    },
  )
  return pages.flat()
}

async function fetchExistingState(
  client: SanityClient,
  bundle: ImportBundle,
): Promise<ExistingState> {
  const exactIdentities = await fetchExactIdentities(client, bundle.competitions)
  const identityCompetitionIds = exactIdentities.flatMap((identity) =>
    identity.competitionId ? [canonicalIdForVariant(identity.competitionId)] : [],
  )
  const candidateCompetitionIds = bundle.competitions.map(
    (reviewed) =>
      reviewed.competition.canonicalCompetitionId ??
      reviewed.deterministicCompetitionId,
  )
  const organizationIds = bundle.competitions.flatMap((reviewed) =>
    reviewed.competition.organizationId
      ? [reviewed.competition.organizationId]
      : [],
  )
  const targetIdentityIds = bundle.competitions.map(
    (reviewed) => reviewed.deterministicIdentityId,
  ).filter((id): id is string => Boolean(id))

  const [
    providers,
    targetIdentities,
    competitionsById,
    competitionsBySlug,
    organizations,
    targetVariants,
  ] = await Promise.all([
      fetchVariantsForIds<RawProvider>(
        client,
        bundle.providers.map((provider) => provider.canonicalId),
        `_id, _type, name, "slug": slug.current, website, status, integrationMethod`,
      ),
      fetchVariantsForIds<RawIdentity>(
        client,
        targetIdentityIds,
        `_id, _type, "providerId": provider._ref, providerCompetitionId,
          providerCompetitionUrl, providerDisplayName,
          "competitionId": competition._ref, matchingStatus, reviewStatus`,
      ),
      fetchVariantsForIds<RawCompetition>(
        client,
        [...candidateCompetitionIds, ...identityCompetitionIds],
        `_id, _type, name, eventSeries, editorialPriority, featured,
          "slug": slug.current, startDate, endDate,
          status, city, administrativeArea, country, region, venueName,
          organizerName, "organizationId": organization._ref,
          disciplines, primaryDiscipline, competitionFormat,
          actionLinks[]{linkType, url, affiliate},
          contentStatus, publicStatus, externalProviderId, externalProviderUrl,
          source{"providerId": provider._ref, sourceTitle, sourceType, url,
            externalRecordId, publishedAt, checkedAt, verificationStatus}`,
      ),
      fetchCompetitionsForSlugs(
        client,
        bundle.competitions.map((reviewed) => reviewed.deterministicSlug),
      ),
      fetchVariantsForIds<RawOrganization>(
        client,
        organizationIds,
        `_id, _type, name`,
      ),
      fetchVariantsForIds<VariantDocument>(
        client,
        [
          ...candidateCompetitionIds,
          ...targetIdentityIds,
          ...organizationIds,
          ...bundle.providers.map((provider) => provider.canonicalId),
        ],
        `_id, _type`,
      ),
    ])

  return {
    providers,
    identities: [
      ...new Map(
        [...exactIdentities, ...targetIdentities].map((identity) => [
          identity._id,
          identity,
        ]),
      ).values(),
    ],
    competitions: [
      ...new Map(
        [...competitionsById, ...competitionsBySlug].map((competition) => [
          competition._id,
          competition,
        ]),
      ).values(),
    ],
    organizations,
    targetVariants,
  }
}

function variantsByCanonicalId<T extends VariantDocument>(documents: readonly T[]) {
  const groups = new Map<string, T[]>()
  for (const document of documents) {
    const canonicalId = document._canonicalId ?? canonicalIdForVariant(document._id)
    const group = groups.get(canonicalId) ?? []
    group.push(document)
    groups.set(canonicalId, group)
  }
  return groups
}

function validateSinglePublishedVariant(
  canonicalId: string,
  expectedType: string,
  variants: readonly VariantDocument[],
) {
  const errors: string[] = []
  const ids = variants.map((variant) => variant._id).sort()
  if (
    variants.some((variant) => isReleaseVersionId(variant._id)) ||
    variants.length > 1 ||
    (variants.length === 1 && variants[0]._id !== canonicalId)
  ) {
    errors.push(
      `Draft/release/conflicting variants require manual review for ${canonicalId}: ${ids.join(", ")}.`,
    )
  }
  for (const variant of variants) {
    if (variant._type !== expectedType) {
      errors.push(
        `Document ID collision for ${canonicalId}: expected ${expectedType}, found ${variant._type} at ${variant._id}.`,
      )
    }
  }
  return errors
}

function validateProvidersAndOrganizations(
  bundle: ImportBundle,
  state: ExistingState,
) {
  const errors: string[] = []
  const providerGroups = variantsByCanonicalId(state.providers)
  for (const expected of bundle.providers) {
    const variants = providerGroups.get(expected.canonicalId) ?? []
    if (variants.length === 0) {
      errors.push(`Ranking provider does not exist: ${expected.canonicalId}.`)
      continue
    }
    errors.push(
      ...validateSinglePublishedVariant(
        expected.canonicalId,
        "rankingProvider",
        variants,
      ),
    )
    const provider = variants[0]
    if (
      provider &&
      (provider.name !== expected.name ||
        provider.slug !== expected.slug ||
        provider.website !== expected.website ||
        provider.integrationMethod !== expected.integrationMethod ||
        provider.status !== expected.status)
    ) {
      errors.push(
        `Live provider metadata conflicts with the manifest for ${expected.canonicalId}.`,
      )
    }
  }

  const organizationGroups = variantsByCanonicalId(state.organizations)
  const requestedOrganizationIds = [
    ...new Set(
      bundle.competitions.flatMap((reviewed) =>
        reviewed.competition.organizationId
          ? [reviewed.competition.organizationId]
          : [],
      ),
    ),
  ]
  for (const organizationId of requestedOrganizationIds) {
    const variants = organizationGroups.get(organizationId) ?? []
    if (variants.length === 0) {
      errors.push(`Referenced organization does not exist: ${organizationId}.`)
      continue
    }
    errors.push(
      ...validateSinglePublishedVariant(
        organizationId,
        "organization",
        variants,
      ),
    )
  }
  return errors
}

function coreCompetitionConflicts(
  document: RawCompetition,
  reviewed: ReviewedCompetition,
) {
  const entry = reviewed.competition
  return (
    document.name !== entry.name ||
    document.startDate !== entry.startDate ||
    (entry.endDate !== undefined && document.endDate !== entry.endDate)
  )
}

function deterministicCompetitionConflicts(
  document: RawCompetition,
  reviewed: ReviewedCompetition,
) {
  const entry = reviewed.competition
  const mismatches: string[] = []
  const check = (label: string, expected: unknown, actual: unknown) => {
    if (expected !== undefined && expected !== actual) {
      mismatches.push(label)
    }
  }

  check("slug", reviewed.deterministicSlug, document.slug)
  check("eventSeries", entry.eventSeries, document.eventSeries)
  check("editorialPriority", entry.editorialPriority, document.editorialPriority)
  check("featured", entry.featured ?? false, document.featured)
  check("status", entry.status, document.status)
  check("city", entry.city, document.city)
  check("administrativeArea", entry.administrativeArea, document.administrativeArea)
  check(
    "country",
    entry.country ? countryNameFor(entry.country) : undefined,
    document.country,
  )
  check("region", entry.region, document.region)
  check("venueName", entry.venueName, document.venueName)
  check("organizerName", entry.organizerName, document.organizerName)
  check("organization", entry.organizationId, document.organizationId)
  check("primaryDiscipline", entry.primaryDiscipline, document.primaryDiscipline)
  check("competitionFormat", entry.competitionFormat, document.competitionFormat)
  check(
    "externalProviderId",
    entry.providerCompetitionId,
    document.externalProviderId,
  )
  check(
    "externalProviderUrl",
    reviewed.provider ? entry.providerCompetitionUrl : undefined,
    document.externalProviderUrl,
  )

  if (entry.disciplines) {
    const expected = [...entry.disciplines].sort()
    const actual = [...(document.disciplines ?? [])].sort()
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      mismatches.push("disciplines")
    }
  }

  const expectedSourceUrl =
    entry.sourceUrl ??
    entry.providerCompetitionUrl ??
    reviewed.source.sourceUrl
  check("source.provider", reviewed.provider?.canonicalId, document.source?.providerId)
  check(
    "source.sourceTitle",
    entry.sourceTitle ?? reviewed.source.sourceTitle,
    document.source?.sourceTitle,
  )
  check("source.sourceType", reviewed.source.sourceType, document.source?.sourceType)
  check("source.url", expectedSourceUrl, document.source?.url)
  check(
    "source.externalRecordId",
    entry.providerCompetitionId,
    document.source?.externalRecordId,
  )
  check(
    "source.publishedAt",
    reviewed.source.publishedAt,
    document.source?.publishedAt,
  )
  if (
    !document.source?.checkedAt ||
    document.source.checkedAt < reviewed.source.checkedAt
  ) {
    mismatches.push("source.checkedAt")
  }
  const verificationRank = new Map([
    ["unverified", 0],
    ["submitted", 1],
    ["source-confirmed", 2],
    ["official", 3],
  ])
  const expectedVerification =
    verificationRank.get(reviewed.source.verificationStatus) ?? -1
  const actualVerification =
    verificationRank.get(document.source?.verificationStatus ?? "") ?? -1
  if (actualVerification < expectedVerification) {
    mismatches.push("source.verificationStatus")
  }

  const expectedActions = [
    ["registration", entry.registrationUrl],
    ["official-site", entry.officialWebsite],
    ["results", entry.resultsUrl],
    ["livestream", entry.livestreamUrl],
  ] as const
  for (const [linkType, url] of expectedActions) {
    if (
      url &&
      !document.actionLinks?.some(
        (action) =>
          action.linkType === linkType &&
          action.url === url &&
          action.affiliate === false,
      )
    ) {
      mismatches.push(`actionLinks.${linkType}`)
    }
  }
  return [...new Set(mismatches)]
}

function planImport(
  bundle: ImportBundle,
  state: ExistingState,
  generatedAt: string,
) {
  const errors = validateProvidersAndOrganizations(bundle, state)
  const warnings: string[] = []
  const identityGroupsByKey = new Map<string, RawIdentity[]>()
  for (const identity of state.identities) {
    if (!identity.providerId || !identity.providerCompetitionId) {
      continue
    }
    const key = `${identity.providerId}\u0000${identity.providerCompetitionId}`
    const group = identityGroupsByKey.get(key) ?? []
    group.push(identity)
    identityGroupsByKey.set(key, group)
  }
  const competitionGroups = variantsByCanonicalId(state.competitions)
  const targetVariantGroups = variantsByCanonicalId(state.targetVariants)
  const planned: PlannedCompetition[] = []
  const proposedCompetitions = new Map<string, ImportDocument>()

  for (const reviewed of bundle.competitions) {
    const providerBacked = Boolean(
      reviewed.provider && reviewed.competition.providerCompetitionId,
    )
    const exactIdentityVariants = identityGroupsByKey.get(reviewed.key) ?? []
    const exactIdentityCanonicalIds = [
      ...new Set(
        exactIdentityVariants.map(
          (identity) =>
            identity._canonicalId ?? canonicalIdForVariant(identity._id),
        ),
      ),
    ]
    if (exactIdentityCanonicalIds.length > 1) {
      errors.push(
        `Duplicate external identities exist for ${reviewed.provider?.canonicalId ?? "source-only"} / ${reviewed.competition.providerCompetitionId ?? reviewed.competition.reviewedKey}: ${exactIdentityCanonicalIds.join(", ")}.`,
      )
      continue
    }

    const identityCanonicalId = exactIdentityCanonicalIds[0]
    const identityVariants = identityCanonicalId
      ? exactIdentityVariants.filter(
          (identity) =>
            (identity._canonicalId ?? canonicalIdForVariant(identity._id)) ===
            identityCanonicalId,
        )
      : []
    if (identityCanonicalId) {
      const identityVariantErrors = validateSinglePublishedVariant(
        identityCanonicalId,
        "externalCompetitionIdentity",
        identityVariants,
      )
      errors.push(...identityVariantErrors)
      if (identityVariantErrors.length > 0) {
        continue
      }
    }
    const existingIdentity = identityVariants[0]
    if (existingIdentity && !existingIdentity.competitionId) {
      errors.push(
        `External identity ${existingIdentity._id} has no canonical competition reference.`,
      )
      continue
    }
    if (
      existingIdentity &&
      !["candidate", "confirmed", "manually-linked"].includes(
        existingIdentity.matchingStatus ?? "",
      )
    ) {
      errors.push(
        `External identity ${existingIdentity._id} has non-matchable status ${existingIdentity.matchingStatus ?? "missing"}.`,
      )
      continue
    }

    const mappedCompetitionId = existingIdentity?.competitionId
      ? canonicalIdForVariant(existingIdentity.competitionId)
      : undefined
    if (
      mappedCompetitionId &&
      reviewed.competition.canonicalCompetitionId &&
      mappedCompetitionId !== reviewed.competition.canonicalCompetitionId
    ) {
      errors.push(
        `Explicit mapping for ${reviewed.competition.providerCompetitionId ?? reviewed.competition.reviewedKey} conflicts with existing identity ${existingIdentity?._id}.`,
      )
      continue
    }
    const canonicalCompetitionId =
      mappedCompetitionId ??
      reviewed.competition.canonicalCompetitionId ??
      reviewed.deterministicCompetitionId
    const matchMethod: PlannedCompetition["matchMethod"] = existingIdentity
      ? "existing-provider-identity"
      : reviewed.competition.canonicalCompetitionId
        ? "explicit-editorial-mapping"
        : providerBacked
          ? "deterministic-provider-id"
          : "reviewed-source-key"

    const competitionVariants = competitionGroups.get(canonicalCompetitionId) ?? []
    const competitionVariantErrors = validateSinglePublishedVariant(
      canonicalCompetitionId,
      "competition",
      competitionVariants,
    )
    errors.push(...competitionVariantErrors)
    if (competitionVariantErrors.length > 0) {
      continue
    }
    const existingCompetition = competitionVariants[0]
    const slugCollisionIds = [
      ...new Set(
        state.competitions
          .filter(
            (competition) =>
              competition.slug === reviewed.deterministicSlug &&
              (competition._canonicalId ??
                canonicalIdForVariant(competition._id)) !==
                canonicalCompetitionId,
          )
          .map(
            (competition) =>
              competition._canonicalId ??
              canonicalIdForVariant(competition._id),
          ),
      ),
    ].sort()
    if (!existingCompetition && slugCollisionIds.length > 0) {
      errors.push(
        `Deterministic slug ${reviewed.deterministicSlug} is already used by ${slugCollisionIds.join(", ")}.`,
      )
      continue
    }
    if (!existingCompetition && existingIdentity) {
      errors.push(
        `External identity ${existingIdentity._id} points to missing competition ${canonicalCompetitionId}.`,
      )
      continue
    }
    if (
      existingCompetition &&
      coreCompetitionConflicts(existingCompetition, reviewed)
    ) {
      errors.push(
        `Existing competition ${canonicalCompetitionId} conflicts with reviewed name/date facts; it will not be overwritten.`,
      )
      continue
    }
    if (
      existingCompetition &&
      existingCompetition.contentStatus !== "published-record"
    ) {
      errors.push(
        `Existing competition ${canonicalCompetitionId} is not a real published-record target (${existingCompetition.contentStatus ?? "missing marker"}).`,
      )
      continue
    }
    if (
      existingCompetition &&
      ["deterministic-provider-id", "reviewed-source-key"].includes(
        matchMethod,
      )
    ) {
      const mismatches = deterministicCompetitionConflicts(
        existingCompetition,
        reviewed,
      )
      if (mismatches.length > 0) {
        errors.push(
          `Existing deterministic competition ${canonicalCompetitionId} conflicts with reviewed fields (${mismatches.join(", ")}); it will not be overwritten.`,
        )
        continue
      }
    }

    let competitionDocument: ImportDocument | undefined
    if (!existingCompetition) {
      const candidate = makeCompetitionDocument(reviewed, canonicalCompetitionId)
      const prior = proposedCompetitions.get(canonicalCompetitionId)
      if (prior && JSON.stringify(prior) !== JSON.stringify(candidate)) {
        errors.push(
          `Multiple reviewed records propose conflicting facts for ${canonicalCompetitionId}.`,
        )
        continue
      }
      if (!prior) {
        proposedCompetitions.set(canonicalCompetitionId, candidate)
        competitionDocument = candidate
      }
    }

    let identityDocument: ImportDocument | undefined
    if (
      providerBacked &&
      !existingIdentity &&
      reviewed.deterministicIdentityId
    ) {
      const targetVariants =
        targetVariantGroups.get(reviewed.deterministicIdentityId) ?? []
      if (targetVariants.length > 0) {
        errors.push(
          `Deterministic identity ID ${reviewed.deterministicIdentityId} is occupied but did not match the exact provider identity.`,
        )
        continue
      }
      identityDocument = makeIdentityDocument(
        reviewed,
        canonicalCompetitionId,
        generatedAt,
      )
    } else if (existingIdentity) {
      const expectedName =
        reviewed.competition.providerDisplayName ?? reviewed.competition.name
      if (
        existingIdentity.providerDisplayName !== expectedName ||
        (reviewed.competition.providerCompetitionUrl &&
          existingIdentity.providerCompetitionUrl !==
            reviewed.competition.providerCompetitionUrl)
      ) {
        errors.push(
          `Existing identity ${existingIdentity._id} conflicts with reviewed provider display facts; it will not be overwritten.`,
        )
        continue
      }
    }

    planned.push({
      reviewed,
      canonicalCompetitionId,
      matchMethod,
      competitionDocument,
      identityDocument,
    })
  }

  const proposedCompetitionIds = new Set(
    planned.flatMap((item) =>
      item.competitionDocument ? [item.competitionDocument._id] : [],
    ),
  )
  for (const [canonicalId, document] of proposedCompetitions) {
    if (!proposedCompetitionIds.has(canonicalId)) {
      const owner = planned.find(
        (item) => item.canonicalCompetitionId === canonicalId,
      )
      if (owner) {
        planned[planned.indexOf(owner)] = {...owner, competitionDocument: document}
      }
    }
  }

  if (
    bundle.competitions.some(
      (reviewed) => reviewed.source.verificationStatus === "unverified",
    )
  ) {
    warnings.push("At least one competition source remains unverified.")
  }
  return {planned, errors: [...new Set(errors)].sort(), warnings}
}

function documentBytes(documents: readonly ImportDocument[]) {
  return Buffer.byteLength(JSON.stringify(documents), "utf8")
}

function makeCreateBatches(planned: readonly PlannedCompetition[]): CreateBatch[] {
  const unitsByCompetition = new Map<string, ImportDocument[]>()
  for (const item of planned) {
    const unit = unitsByCompetition.get(item.canonicalCompetitionId) ?? []
    if (item.competitionDocument && !unit.some((doc) => doc._id === item.competitionDocument?._id)) {
      unit.push(item.competitionDocument)
    }
    if (item.identityDocument) {
      unit.push(item.identityDocument)
    }
    unitsByCompetition.set(item.canonicalCompetitionId, unit)
  }

  const batches: CreateBatch[] = []
  let documents: ImportDocument[] = []
  const flush = () => {
    if (documents.length > 0) {
      batches.push({documents})
      documents = []
    }
  }
  for (const unit of unitsByCompetition.values()) {
    if (unit.length === 0) {
      continue
    }
    if (
      unit.length > CREATE_BATCH_DOCUMENT_LIMIT ||
      documentBytes(unit) > CREATE_BATCH_BYTE_LIMIT
    ) {
      throw new Error(
        "A canonical competition plus identity unit exceeds the create batch safety limit.",
      )
    }
    const combined = [...documents, ...unit]
    if (
      combined.length > CREATE_BATCH_DOCUMENT_LIMIT ||
      documentBytes(combined) > CREATE_BATCH_BYTE_LIMIT
    ) {
      flush()
    }
    documents.push(...unit)
  }
  flush()
  return batches
}

function sourceRightsBlockers(bundle: ImportBundle, registry: SourceRegistry) {
  return bundle.manifests.flatMap(({relativePath, input}) => {
    const blockers: string[] = []
    if (input.sourceId) {
      try {
        const registered = findRegisteredSource(registry, input.sourceId)
        blockers.push(
          ...sourceApprovalBlockers(registered, ["competitions"]).map(
            (blocker) => `${relativePath}: ${blocker}`,
          ),
        )
      } catch (error) {
        blockers.push(
          `${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    } else {
      if (input.sourceRights.reviewStatus !== "approved") {
        blockers.push(`${relativePath}: source/reuse review remains pending.`)
      }
      if (!input.sourceRights.approvalReference || !input.sourceRights.approvedAt) {
        blockers.push(`${relativePath}: source/reuse approval evidence is incomplete.`)
      }
    }
    if (
      !["source-confirmed", "official"].includes(
        input.source.verificationStatus,
      )
    ) {
      blockers.push(`${relativePath}: competition source facts are not confirmed.`)
    }
    return blockers
  })
}

function isOfficialStreetlifting(bundle: ImportBundle) {
  return bundle.providers.some(
    (provider) =>
      provider.slug === "official-streetlifting" ||
      provider.canonicalId === "rankingProvider.official-streetlifting",
  )
}

async function executeWrites(
  batches: readonly CreateBatch[],
  blockers: readonly string[],
  bundle: ImportBundle,
  onBatchCommitted: (ids: readonly string[], batchIndex: number) => Promise<void>,
) {
  if (process.env.CONFIRM_COMPETITION_IMPORT !== "YES") {
    throw new Error(
      "Competition write refused. Set CONFIRM_COMPETITION_IMPORT=YES only after reviewing the dry run.",
    )
  }
  if (
    isOfficialStreetlifting(bundle) &&
    process.env.CONFIRM_OSL_IMPORT !== "YES"
  ) {
    throw new Error(
      "Official Streetlifting competition write refused. CONFIRM_OSL_IMPORT=YES is also required.",
    )
  }
  if (blockers.length > 0) {
    throw new Error(
      `Competition write refused because ${blockers.length} blocker(s) remain.`,
    )
  }

  const client = buildWriteClient()
  const createdIds: string[] = []
  for (const [batchIndex, batch] of batches.entries()) {
    let transaction = client.transaction()
    for (const document of batch.documents) {
      transaction = transaction.create(document)
    }
    const result = await transaction.commit({
      visibility: "sync",
      returnFirst: false,
      returnDocuments: false,
    })
    const ids = result.results
      .filter((item) => item.operation === "create")
      .map((item) => item.id)
    createdIds.push(...ids)
    await onBatchCommitted(ids, batchIndex)
  }
  return createdIds
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function markdownEscape(value: unknown) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ")
}

function reportMarkdown(report: JsonRecord) {
  const counts = report.counts as JsonRecord
  const blockers = report.writeBlockers as string[]
  const rows = report.reviewedCompetitions as JsonRecord[]
  return `# Reviewed competition import report

- Generated: ${markdownEscape(report.generatedAt)}
- Mode: ${markdownEscape(report.mode)}
- Input files: ${markdownEscape(counts.inputFiles)}
- Reviewed competitions: ${markdownEscape(counts.reviewedCompetitions)}
- Proposed canonical competitions: ${markdownEscape(counts.proposedCompetitions)}
- Proposed external identities: ${markdownEscape(counts.proposedExternalIdentities)}
- Planned create batches: ${markdownEscape(counts.createBatches)}
- Sanity mutations: ${markdownEscape(report.sanityMutations)}

## Safety status

${blockers.length > 0 ? blockers.map((blocker) => `- BLOCKED — ${blocker}`).join("\n") : "- All source, identity, and collision gates passed."}

## Reviewed records

| Provider | Provider competition ID | Canonical competition | Match | Public status |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.map((row) => `| ${markdownEscape(row.providerId)} | ${markdownEscape(row.providerCompetitionId)} | ${markdownEscape(row.canonicalCompetitionId)} | ${markdownEscape(row.matchMethod)} | draft |`).join("\n") : "| — | — | — | No reviewed manifests | — |"}

## Operating boundary

This tool reads only reviewed local JSON. It does not crawl, fetch, or infer
provider facts. Every new canonical competition remains an internal draft, and
all writes use atomic create operations in bounded batches.
`
}

function makeLocalPlan(bundle: ImportBundle, generatedAt: string) {
  return {
    generatedAt,
    schemaVersion: 1,
    integrationApproach: "provider-neutral manual/editorial manifests",
    inputPaths: bundle.manifests.map(({relativePath}) => relativePath),
    providers: bundle.providers,
    competitions: bundle.competitions.map((reviewed) => ({
      inputPath: reviewed.inputPath,
      providerId: reviewed.provider?.canonicalId ?? null,
      providerCompetitionId:
        reviewed.competition.providerCompetitionId ?? null,
      reviewedKey: reviewed.competition.reviewedKey,
      explicitCanonicalCompetitionId:
        reviewed.competition.canonicalCompetitionId ?? null,
      deterministicCompetitionId: reviewed.deterministicCompetitionId,
      deterministicIdentityId: reviewed.deterministicIdentityId,
      deterministicSlug: reviewed.deterministicSlug,
      sourceRightsReviewStatus: reviewed.sourceRights.reviewStatus,
      sourceVerificationStatus: reviewed.source.verificationStatus,
      publicStatus: "draft",
    })),
  }
}

async function main() {
  const workspace = process.cwd()
  const args = parseArguments()
  const generatedAt = new Date().toISOString()
  const tmpDirectory = resolveInsideWorkspace(workspace, TMP_DIRECTORY)
  const manifests = await loadInputs(workspace, args)
  const bundle = aggregateInputs(manifests)
  const sourceRegistry = await loadSourceRegistry(workspace)
  await mkdir(tmpDirectory, {recursive: true})
  const planPath = path.join(tmpDirectory, PLAN_FILE)
  const reportJsonPath = path.join(tmpDirectory, REPORT_JSON_FILE)
  const reportMarkdownPath = path.join(tmpDirectory, REPORT_MARKDOWN_FILE)
  await writeJson(planPath, makeLocalPlan(bundle, generatedAt))

  if (args.validateOnly || bundle.competitions.length === 0) {
    const blockers =
      bundle.competitions.length === 0
        ? ["No reviewed competition manifests were supplied; no data write is proposed."]
        : sourceRightsBlockers(bundle, sourceRegistry)
    const report: JsonRecord = {
      title: "REVIEWED COMPETITION LOCAL VALIDATION",
      generatedAt,
      mode: "local-validation",
      inputPaths: bundle.manifests.map(({relativePath}) => relativePath),
      counts: {
        inputFiles: bundle.manifests.length,
        reviewedCompetitions: bundle.competitions.length,
        proposedCompetitions: 0,
        proposedExternalIdentities: 0,
        createBatches: 0,
      },
      reviewedCompetitions: bundle.competitions.map((reviewed) => ({
        providerId: reviewed.provider?.canonicalId ?? "source-only",
        providerCompetitionId:
          reviewed.competition.providerCompetitionId ??
          reviewed.competition.reviewedKey,
        canonicalCompetitionId:
          reviewed.competition.canonicalCompetitionId ??
          reviewed.deterministicCompetitionId,
        matchMethod: reviewed.competition.canonicalCompetitionId
          ? "explicit-editorial-mapping-not-live-checked"
          : reviewed.provider && reviewed.competition.providerCompetitionId
            ? "deterministic-provider-id-not-live-checked"
            : "reviewed-source-key-not-live-checked",
      })),
      writeBlockers: blockers,
      sanityAccess: "NONE",
      sanityMutations: 0,
    }
    await Promise.all([
      writeJson(reportJsonPath, report),
      writeFile(reportMarkdownPath, reportMarkdown(report), "utf8"),
    ])
    console.log("REVIEWED COMPETITION LOCAL VALIDATION")
    console.log(`Reviewed input files: ${bundle.manifests.length}`)
    console.log(`Reviewed competitions: ${bundle.competitions.length}`)
    console.log(`Plan: ${path.relative(workspace, planPath)}`)
    console.log(`Report: ${path.relative(workspace, reportMarkdownPath)}`)
    console.log("Sanity access: NONE")
    console.log("Sanity mutations: 0")
    return
  }

  const readClient = buildReadClient()
  const [state, anonymousDatasetCheck] = await Promise.all([
    fetchExistingState(readClient, bundle),
    checkAnonymousDataset(readClient),
  ])
  const plan = planImport(bundle, state, generatedAt)
  let batches: CreateBatch[] = []
  try {
    batches = makeCreateBatches(plan.planned)
  } catch (error) {
    plan.errors.push(
      `Create batch planning failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  const writeBlockers = [
    ...sourceRightsBlockers(bundle, sourceRegistry),
    ...plan.errors,
    ...(!anonymousDatasetCheck.verified
      ? [
          anonymousDatasetCheck.reason ??
            "Anonymous dataset privacy could not be verified.",
        ]
      : !anonymousDatasetCheck.private
        ? ["The unified Sanity dataset is not private."]
        : []),
    ...(plan.planned.length === bundle.competitions.length
      ? []
      : ["Not every reviewed competition produced a complete identity plan."]),
  ]
  const proposedDocuments = batches.flatMap((batch) => batch.documents)
  const report: JsonRecord = {
    title: args.write
      ? "REVIEWED COMPETITION IMPORT WRITE"
      : "REVIEWED COMPETITION IMPORT DRY RUN",
    generatedAt,
    mode: args.write ? "write-requested" : "dry-run",
    integrationApproach: "provider-neutral manual/editorial manifests",
    sourceAccess: "local reviewed JSON only; no provider network requests",
    anonymousDatasetCheck,
    inputPaths: bundle.manifests.map(({relativePath}) => relativePath),
    queryStrategy: {
      perspective: "raw",
      idBatchSize: QUERY_ID_BATCH_SIZE,
      pageSize: QUERY_PAGE_SIZE,
      maxConcurrency: QUERY_CONCURRENCY,
    },
    createPlan: {
      maxDocumentsPerBatch: CREATE_BATCH_DOCUMENT_LIMIT,
      maxSerializedBytesPerBatch: CREATE_BATCH_BYTE_LIMIT,
      batches: batches.map((batch, index) => ({
        index,
        documentCount: batch.documents.length,
        serializedBytes: documentBytes(batch.documents),
        documentIds: batch.documents.map((document) => document._id),
      })),
    },
    counts: {
      inputFiles: bundle.manifests.length,
      reviewedCompetitions: bundle.competitions.length,
      existingIdentitiesMatched: plan.planned.filter(
        (item) => item.matchMethod === "existing-provider-identity",
      ).length,
      proposedCompetitions: proposedDocuments.filter(
        (document) => document._type === "competition",
      ).length,
      proposedExternalIdentities: proposedDocuments.filter(
        (document) => document._type === "externalCompetitionIdentity",
      ).length,
      createBatches: batches.length,
      invalidRecords: plan.errors.length,
    },
    operationDiff: {
      CREATE: proposedDocuments.map((document) => document._id),
      UPDATE: [],
      NOOP: plan.planned.filter((item) => !item.competitionDocument && !item.identityDocument).map((item) => item.canonicalCompetitionId),
      CONFLICT: plan.errors,
      DELETE: [],
      safetyNote: "This importer is create-only. Existing reviewed matches are NOOP; semantic differences are CONFLICT, never UPDATE.",
    },
    reviewedCompetitions: plan.planned.map((item) => ({
      inputPath: item.reviewed.inputPath,
      providerId: item.reviewed.provider?.canonicalId ?? "source-only",
      providerCompetitionId:
        item.reviewed.competition.providerCompetitionId ??
        item.reviewed.competition.reviewedKey,
      reviewedKey: item.reviewed.competition.reviewedKey,
      canonicalCompetitionId: item.canonicalCompetitionId,
      externalIdentityId: item.reviewed.deterministicIdentityId,
      matchMethod: item.matchMethod,
      competitionCreateProposed: Boolean(item.competitionDocument),
      identityCreateProposed: Boolean(item.identityDocument),
      sourceRightsReviewStatus: item.reviewed.sourceRights.reviewStatus,
      sourceVerificationStatus: item.reviewed.source.verificationStatus,
      publicStatus: "draft",
    })),
    invalidRecords: plan.errors,
    warnings: [
      ...plan.warnings,
      "Names are display facts only and are never identity keys.",
      "No results, participants, editorial copy, or publication state is inferred.",
      "Create transactions are bounded and atomic per canonical competition identity unit.",
    ],
    writeBlockers: [...new Set(writeBlockers)].sort(),
    sanityMutations: 0,
    createdDocumentIds: [],
    completedCreateBatches: 0,
  }
  const persistReports = () =>
    Promise.all([
      writeJson(reportJsonPath, report),
      writeFile(reportMarkdownPath, reportMarkdown(report), "utf8"),
    ])
  await persistReports()

  if (args.write) {
    const committedIds: string[] = []
    await executeWrites(
      batches,
      report.writeBlockers as string[],
      bundle,
      async (ids, batchIndex) => {
        committedIds.push(...ids)
        report.sanityMutations = committedIds.length
        report.createdDocumentIds = [...committedIds]
        report.completedCreateBatches = batchIndex + 1
        await persistReports()
      },
    )
  }

  console.log(String(report.title))
  console.log(`Reviewed input files: ${bundle.manifests.length}`)
  console.log(`Reviewed competitions: ${bundle.competitions.length}`)
  console.log(`Proposed documents: ${proposedDocuments.length}`)
  console.log(`Write blockers: ${(report.writeBlockers as string[]).length}`)
  console.log(`Sanity mutations: ${String(report.sanityMutations)}`)
  console.log(`Report: ${path.relative(workspace, reportMarkdownPath)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
