import {createHash} from "node:crypto"
import {mkdir, readFile, readdir, writeFile} from "node:fs/promises"
import path from "node:path"

import {createClient, type SanityClient} from "next-sanity"
import {z} from "zod"

import {countryCodeFor} from "../lib/geography"
import {
  findRegisteredSource,
  loadSourceRegistry,
  sourceApprovalBlockers,
} from "./lib/source-registry"

type JsonRecord = Record<string, unknown>
type ImportDocument = {_id: string; _type: string; [field: string]: unknown}
type VariantDocument = {_id: string; _type: string; _canonicalId?: string}

const API_VERSION = "2026-07-01"
const DEFAULT_DIRECTORY = "data/imports/organizations"
const REPORT_DIRECTORY = ".tmp"
const PLAN_FILE = "reviewed-organization-import-plan.json"
const REPORT_JSON = "reviewed-organization-import-report.json"
const REPORT_MARKDOWN = "reviewed-organization-import-report.md"
const MAX_FILES = 100
const MAX_ORGANIZATIONS = 5_000
const QUERY_BATCH = 40
const PAGE_SIZE = 200
const CONCURRENCY = 4
const CREATE_DOCUMENT_LIMIT = 50
const CREATE_BYTE_LIMIT = 750_000

const httpUrl = z.string().trim().url().refine((value) => {
  const url = new URL(value)
  return ["http:", "https:"].includes(url.protocol) &&
    !url.username && !url.password
}, "Expected a public HTTP(S) URL without credentials.")
const slugValue = z.string().trim().min(1).max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const organizationType = z.enum([
  "federation", "league", "competition-organizer", "gym",
  "training-facility", "team-operator", "brand", "retailer",
  "media-company", "community-organization", "other",
])
const sourceSchema = z.object({
  sourceTitle: z.string().trim().min(1).max(180),
  sourceType: z.enum([
    "official-results-page", "organization-ranking-page",
    "official-result-sheet", "organizer-source", "editor-confirmed", "other",
  ]),
  sourceUrl: httpUrl,
  publishedAt: z.string().datetime({offset: true}).optional(),
  checkedAt: z.string().datetime({offset: true}),
  verificationStatus: z.enum(["unverified", "submitted", "source-confirmed", "official"]),
}).strict()
const organizationSchema = z.object({
  reviewedKey: slugValue,
  canonicalOrganizationId: z.string().trim().max(128)
    .regex(/^organization\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/).optional(),
  slug: slugValue.optional(),
  name: z.string().trim().min(1).max(140),
  organizationType,
  description: z.string().trim().min(1).max(2000),
  country: z.string().trim().min(1).max(120).optional(),
  administrativeArea: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  geographicScope: z.string().trim().min(1).max(120).optional(),
  disciplines: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  website: httpUrl.optional(),
  status: z.enum(["active", "inactive", "historical"]).optional(),
}).strict()
const inputSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal("organizations"),
  sourceId: z.string().trim().min(1).max(96),
  collectionMethod: z.literal("manual-editorial"),
  source: sourceSchema,
  organizations: z.array(organizationSchema).min(1).max(1000),
}).strict()

type Input = z.infer<typeof inputSchema>
type Entry = z.infer<typeof organizationSchema>
type Reviewed = {
  inputPath: string
  sourceId: string
  source: Input["source"]
  entry: Entry
  canonicalId: string
  slug: string
}
type RawOrganization = VariantDocument & {
  name?: string; slug?: string; organizationType?: string; description?: string
  country?: string; administrativeArea?: string; city?: string
  geographicScope?: string; disciplines?: string[]; website?: string
  status?: string; publicStatus?: string; prototypeStatus?: string
  source?: JsonRecord
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
function sha(value: string) {
  return createHash("sha256").update(value).digest("hex")
}
function idPart(value: string) {
  const normalized = value.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-")
  return normalized || `record-${sha(value).slice(0, 12)}`
}
function bounded(prefix: string, value: string, limit: number) {
  const combined = `${prefix}${idPart(value)}`
  return combined.length <= limit
    ? combined
    : `${combined.slice(0, limit - 13)}-${sha(combined).slice(0, 12)}`
}
function organizationId(sourceId: string, reviewedKey: string) {
  return bounded("organization.", `${sourceId}-${reviewedKey}`, 128)
}
function organizationSlug(sourceId: string, reviewedKey: string) {
  return bounded("", `${sourceId}-${reviewedKey}`, 96)
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  if (isRecord(value)) return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${stable(value[key])}`,
  ).join(",")}}`
  return JSON.stringify(value) ?? "null"
}
function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}
async function concurrent<T, R>(
  values: readonly T[], worker: (value: T) => Promise<R>,
): Promise<R[]> {
  const result = new Array<R>(values.length)
  let cursor = 0
  await Promise.all(Array.from({length: Math.min(CONCURRENCY, values.length)}, async () => {
    while (cursor < values.length) {
      const index = cursor++
      result[index] = await worker(values[index])
    }
  }))
  return result
}
function inside(workspace: string, requested: string) {
  const resolved = path.resolve(workspace, requested)
  const relative = path.relative(workspace, resolved)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path must remain inside the workspace: ${requested}`)
  }
  return resolved
}
function parseArgs() {
  const args = process.argv.slice(2)
  const inputs = args.filter((value) => value.startsWith("--input="))
  const directories = args.filter((value) => value.startsWith("--input-dir="))
  const unknown = args.filter((value) =>
    value !== "--validate" && value !== "--write" &&
    !value.startsWith("--input=") && !value.startsWith("--input-dir="),
  )
  if (unknown.length) throw new Error(`Unsupported argument(s): ${unknown.join(", ")}`)
  if (directories.length > 1) throw new Error("Only one --input-dir is allowed.")
  if (args.includes("--validate") && args.includes("--write")) {
    throw new Error("--validate and --write are mutually exclusive.")
  }
  return {
    validate: args.includes("--validate"),
    write: args.includes("--write"),
    inputs: inputs.map((value) => value.slice("--input=".length)),
    directory: directories[0]?.slice("--input-dir=".length) ??
      (inputs.length === 0 ? DEFAULT_DIRECTORY : undefined),
    defaultDirectory: inputs.length === 0 && directories.length === 0,
  }
}
async function discover(workspace: string, args: ReturnType<typeof parseArgs>) {
  const requested = [...args.inputs]
  if (args.directory) {
    try {
      const entries = await readdir(inside(workspace, args.directory), {withFileTypes: true})
      requested.push(...entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => path.join(args.directory!, entry.name)))
    } catch (error) {
      if (!(args.defaultDirectory && isRecord(error) && error.code === "ENOENT")) throw error
    }
  }
  const unique = [...new Set(requested)].sort()
  if (unique.length > MAX_FILES) throw new Error(`At most ${MAX_FILES} inputs are allowed.`)
  return unique.map((value) => inside(workspace, value))
}
async function load(workspace: string, args: ReturnType<typeof parseArgs>) {
  const files = await discover(workspace, args)
  return Promise.all(files.map(async (file) => {
    const relative = path.relative(workspace, file).split(path.sep).join("/")
    try {
      return {relative, input: inputSchema.parse(JSON.parse(await readFile(file, "utf8")))}
    } catch (error) {
      throw new Error(`Invalid reviewed organization input ${relative}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }))
}
function aggregate(inputs: Awaited<ReturnType<typeof load>>) {
  const reviewed = new Map<string, Reviewed>()
  const slugs = new Map<string, string>()
  for (const {relative, input} of inputs) {
    for (const entry of input.organizations) {
      if (entry.country && !countryCodeFor(entry.country)) {
        throw new Error(`${relative}: unsupported country ${entry.country}.`)
      }
      const canonicalId = entry.canonicalOrganizationId ?? organizationId(input.sourceId, entry.reviewedKey)
      const slug = entry.slug ?? organizationSlug(input.sourceId, entry.reviewedKey)
      const item = {inputPath: relative, sourceId: input.sourceId, source: input.source, entry, canonicalId, slug}
      const previous = reviewed.get(canonicalId)
      if (previous && stable(previous) !== stable(item)) {
        throw new Error(`Conflicting canonical organization ${canonicalId}.`)
      }
      const slugOwner = slugs.get(slug)
      if (slugOwner && slugOwner !== canonicalId) {
        throw new Error(`Organization slug ${slug} belongs to multiple reviewed identities.`)
      }
      reviewed.set(canonicalId, previous ?? item)
      slugs.set(slug, canonicalId)
    }
  }
  if (reviewed.size > MAX_ORGANIZATIONS) throw new Error("Organization input cap exceeded.")
  return [...reviewed.values()].sort((a, b) => a.canonicalId.localeCompare(b.canonicalId))
}
function sourceObject(item: Reviewed) {
  return {
    sourceTitle: item.source.sourceTitle,
    sourceType: item.source.sourceType,
    url: item.source.sourceUrl,
    ...(item.source.publishedAt ? {publishedAt: item.source.publishedAt} : {}),
    checkedAt: item.source.checkedAt,
    verificationStatus: item.source.verificationStatus,
  }
}
function document(item: Reviewed): ImportDocument {
  const entry = item.entry
  return {
    _id: item.canonicalId,
    _type: "organization",
    name: entry.name,
    slug: {_type: "slug", current: item.slug},
    organizationType: entry.organizationType,
    description: entry.description,
    ...(entry.country ? {country: entry.country} : {}),
    ...(entry.administrativeArea ? {administrativeArea: entry.administrativeArea} : {}),
    ...(entry.city ? {city: entry.city} : {}),
    ...(entry.geographicScope ? {geographicScope: entry.geographicScope} : {}),
    ...(entry.disciplines ? {disciplines: entry.disciplines} : {}),
    ...(entry.website ? {website: entry.website} : {}),
    status: entry.status ?? "active",
    publicStatus: "draft",
    source: sourceObject(item),
  }
}
function readClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const token = process.env.SANITY_API_READ_TOKEN?.trim()
  if (!projectId || !dataset || !token) throw new Error("Read preflight requires Sanity project, dataset, and read token.")
  return createClient({projectId, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || API_VERSION, token, useCdn: false, perspective: "raw"})
}
function writeClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim()
  if (!projectId || !dataset || !token) throw new Error("Write requires Sanity project, dataset, and write token.")
  return createClient({projectId, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || API_VERSION, token, useCdn: false, perspective: "raw"})
}
async function privacy(client: SanityClient) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  if (!projectId || !dataset) return {private: false, reason: "Missing dataset configuration."}
  let aclMode: string | undefined
  try {
    aclMode = (await client.datasets.list()).find((item) => item.name === dataset)?.aclMode
  } catch {}
  try {
    const url = new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${encodeURIComponent(dataset)}`)
    url.searchParams.set("query", "count(*[])")
    url.searchParams.set("perspective", "raw")
    const response = await fetch(url, {headers: {accept: "application/json"}, credentials: "omit"})
    if ([401, 403].includes(response.status)) return {private: aclMode === "private", reason: "Anonymous access denied."}
    if (!response.ok) return {private: false, reason: `Anonymous check HTTP ${response.status}.`}
    const payload = await response.json() as unknown
    const count = isRecord(payload) && typeof payload.result === "number" ? payload.result : undefined
    return {private: aclMode === "private" && count === 0, reason: `ACL ${aclMode ?? "unknown"}; anonymous count ${count ?? "unknown"}.`}
  } catch (error) {
    return {private: false, reason: error instanceof Error ? error.message : String(error)}
  }
}
async function variants(client: SanityClient, ids: readonly string[]) {
  const pages = await concurrent(chunks([...new Set(ids)].sort(), QUERY_BATCH), async (batch) => {
    const params: Record<string, string> = {}
    const predicates = batch.map((id, index) => {
      params[`id${index}`] = id
      return `sanity::versionOf($id${index})`
    })
    const canonical = batch.map((_, index) => `sanity::versionOf($id${index}) => $id${index}`).join(",")
    return client.fetch<RawOrganization[]>(`*[${predicates.join(" || ")}] | order(_id asc)[0...${PAGE_SIZE}]{
      _id,_type,"_canonicalId":select(${canonical}),name,"slug":slug.current,
      organizationType,description,country,administrativeArea,city,geographicScope,
      disciplines,website,status,publicStatus,prototypeStatus,
      source{sourceTitle,sourceType,url,publishedAt,checkedAt,verificationStatus}
    }`, params)
  })
  return pages.flat()
}
async function slugCollisions(client: SanityClient, slugs: readonly string[]) {
  const pages = await concurrent(chunks([...new Set(slugs)].sort(), QUERY_BATCH), (batch) =>
    client.fetch<Array<{_id: string; slug: string}>>(
      `*[_type == "organization" && slug.current in $slugs][0...${PAGE_SIZE}]{_id,"slug":slug.current}`,
      {slugs: batch},
    ),
  )
  return pages.flat()
}
function comparable(doc: ImportDocument | RawOrganization) {
  const value = doc as JsonRecord
  return {
    name: value.name, slug: isRecord(value.slug) ? value.slug.current : value.slug,
    organizationType: value.organizationType, description: value.description,
    country: value.country, administrativeArea: value.administrativeArea,
    city: value.city, geographicScope: value.geographicScope,
    disciplines: value.disciplines, website: value.website, status: value.status,
    source: value.source,
  }
}
function batches(documents: readonly ImportDocument[]) {
  const result: ImportDocument[][] = []
  let current: ImportDocument[] = []
  for (const doc of documents) {
    const next = [...current, doc]
    if (next.length > CREATE_DOCUMENT_LIMIT || Buffer.byteLength(JSON.stringify(next)) > CREATE_BYTE_LIMIT) {
      if (current.length) result.push(current)
      current = [doc]
    } else current = next
  }
  if (current.length) result.push(current)
  return result
}
async function writeJson(file: string, value: unknown) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}
function markdown(report: JsonRecord) {
  const counts = report.counts as JsonRecord
  const blockers = report.writeBlockers as string[]
  return `# Reviewed organization import\n\n- Mode: ${report.mode}\n- Inputs: ${counts.inputFiles}\n- Organizations: ${counts.reviewedOrganizations}\n- Proposed: ${counts.proposedOrganizations}\n- Batches: ${counts.createBatches}\n- Sanity mutations: ${report.sanityMutations}\n\n## Write blockers\n\n${blockers.length ? blockers.map((item) => `- ${item}`).join("\n") : "- None"}\n`
}

async function main() {
  const workspace = process.cwd()
  const args = parseArgs()
  const loaded = await load(workspace, args)
  const reviewed = aggregate(loaded)
  const registry = await loadSourceRegistry(workspace)
  const rightsBlockers = [...new Set(loaded.flatMap(({relative, input}) => {
    try {
      return sourceApprovalBlockers(findRegisteredSource(registry, input.sourceId), ["organizations"])
        .map((blocker) => `${relative}: ${blocker}`)
    } catch (error) {
      return [`${relative}: ${error instanceof Error ? error.message : String(error)}`]
    }
  }))]
  const sourceBlockers = loaded.flatMap(({relative, input}) =>
    ["source-confirmed", "official"].includes(input.source.verificationStatus)
      ? [] : [`${relative}: organization source facts are not confirmed.`],
  )
  const output = path.join(workspace, REPORT_DIRECTORY)
  await mkdir(output, {recursive: true})
  const planPath = path.join(output, PLAN_FILE)
  const reportPath = path.join(output, REPORT_JSON)
  const markdownPath = path.join(output, REPORT_MARKDOWN)
  await writeJson(planPath, {generatedAt: new Date().toISOString(), reviewed: reviewed.map((item) => ({
    inputPath: item.inputPath, sourceId: item.sourceId, reviewedKey: item.entry.reviewedKey,
    canonicalId: item.canonicalId, slug: item.slug, publicStatus: "draft",
  }))})

  if (args.validate || reviewed.length === 0) {
    const blockers = reviewed.length === 0 ? ["No reviewed organization manifests were supplied."] : [...rightsBlockers, ...sourceBlockers]
    const report: JsonRecord = {mode: "local-validation", counts: {inputFiles: loaded.length, reviewedOrganizations: reviewed.length, proposedOrganizations: 0, createBatches: 0}, writeBlockers: blockers, sanityAccess: "NONE", sanityMutations: 0}
    await Promise.all([writeJson(reportPath, report), writeFile(markdownPath, markdown(report), "utf8")])
    console.log(`REVIEWED ORGANIZATION LOCAL VALIDATION\nInputs: ${loaded.length}\nOrganizations: ${reviewed.length}\nSanity access: NONE\nSanity mutations: 0`)
    return
  }

  const client = readClient()
  const [existing, collisions, privacyCheck] = await Promise.all([
    variants(client, reviewed.map((item) => item.canonicalId)),
    slugCollisions(client, reviewed.map((item) => item.slug)),
    privacy(client),
  ])
  const existingById = new Map(existing.map((item) => [item._canonicalId ?? item._id, item]))
  const errors: string[] = []
  const proposed: ImportDocument[] = []
  for (const item of reviewed) {
    const variantsForId = existing.filter((value) => (value._canonicalId ?? value._id) === item.canonicalId)
    if (variantsForId.length > 1 || variantsForId.some((value) => value._id !== item.canonicalId)) {
      errors.push(`${item.canonicalId}: draft/release or multiple variants require manual review.`)
      continue
    }
    const collision = collisions.find((value) => value.slug === item.slug && value._id !== item.canonicalId)
    if (collision) {
      errors.push(`${item.canonicalId}: slug ${item.slug} already belongs to ${collision._id}.`)
      continue
    }
    const expected = document(item)
    const current = existingById.get(item.canonicalId)
    if (current) {
      if (current._type !== "organization" || stable(comparable(current)) !== stable(comparable(expected))) {
        errors.push(`${item.canonicalId}: existing organization conflicts with reviewed identity facts.`)
      }
    } else proposed.push(expected)
  }
  const createBatches = batches(proposed)
  const blockers = [...rightsBlockers, ...sourceBlockers, ...errors, ...(!privacyCheck.private ? [`Private dataset check failed: ${privacyCheck.reason}`] : [])]
  const report: JsonRecord = {
    mode: args.write ? "write-requested" : "dry-run",
    counts: {inputFiles: loaded.length, reviewedOrganizations: reviewed.length, existingOrganizationsMatched: reviewed.length - proposed.length - errors.length, proposedOrganizations: proposed.length, createBatches: createBatches.length},
    operationDiff: {CREATE: proposed.map((item) => item._id), UPDATE: [], NOOP: reviewed.filter((item) => existingById.has(item.canonicalId) && !errors.some((error) => error.startsWith(`${item.canonicalId}:`))).map((item) => item.canonicalId), CONFLICT: errors, DELETE: [], safetyNote: "Create-only: exact existing documents are NOOP and semantic differences are CONFLICT."},
    writeBlockers: [...new Set(blockers)], privacyCheck, sanityMutations: 0, createdDocumentIds: [],
  }
  const persist = () => Promise.all([writeJson(reportPath, report), writeFile(markdownPath, markdown(report), "utf8")])
  await persist()
  if (args.write) {
    if (process.env.CONFIRM_ORGANIZATION_IMPORT !== "YES") throw new Error("Organization write refused. Set CONFIRM_ORGANIZATION_IMPORT=YES after reviewing the dry run.")
    if (blockers.length) throw new Error(`Organization write refused because ${blockers.length} blocker(s) remain.`)
    const client = writeClient()
    const created: string[] = []
    for (const batch of createBatches) {
      let transaction = client.transaction()
      for (const doc of batch) transaction = transaction.create(doc)
      const result = await transaction.commit({visibility: "sync", returnDocuments: false, returnFirst: false})
      created.push(...result.results.filter((item) => item.operation === "create").map((item) => item.id))
      report.sanityMutations = created.length
      report.createdDocumentIds = [...created]
      await persist()
    }
  }
  console.log(`REVIEWED ORGANIZATION ${args.write ? "WRITE" : "DRY RUN"}\nReviewed: ${reviewed.length}\nProposed: ${proposed.length}\nBlockers: ${blockers.length}\nSanity mutations: ${report.sanityMutations}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
