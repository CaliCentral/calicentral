import {readFile} from "node:fs/promises"
import path from "node:path"

import {z} from "zod"

export const SOURCE_REGISTRY_PATH = "data/imports/source-registry.json"

export const sourceDataTypeSchema = z.enum([
  "athletes",
  "rankings",
  "competitions",
  "organizations",
  "results",
])

export const sourceApprovalStatusSchema = z.enum([
  "unreviewed",
  "review-pending",
  "approved-manual-import",
  "approved-api",
  "approved-feed",
  "denied",
  "expired",
])

const httpUrl = z.string().trim().url().refine((value) => {
  const url = new URL(value)
  return ["http:", "https:"].includes(url.protocol) &&
    !url.username && !url.password
}, "Expected a public HTTP(S) URL without credentials.")

export const sourceRegistryEntrySchema = z.object({
  sourceId: z.string().trim().min(1).max(96).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  officialWebsite: httpUrl,
  dataTypes: z.array(sourceDataTypeSchema).min(1).max(5).refine(
    (values) => new Set(values).size === values.length,
    "Source data types must be unique.",
  ),
  integrationMethod: z.enum(["manual-import", "authorized-api", "licensed-feed"]),
  approvalStatus: sourceApprovalStatusSchema,
  approvalBasis: z.string().trim().min(1).max(1000).optional(),
  approvalReference: z.string().trim().min(1).max(1000).optional(),
  approvedBy: z.string().trim().min(1).max(160).optional(),
  approvedAt: z.string().datetime({offset: true}).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
}).strict().superRefine((source, context) => {
  if (!source.approvalStatus.startsWith("approved-")) return
  for (const field of [
    "approvalBasis",
    "approvalReference",
    "approvedBy",
    "approvedAt",
  ] as const) {
    if (!source[field]) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required for an approved source.`,
      })
    }
  }
})

export const sourceRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(sourceRegistryEntrySchema).max(500).superRefine((sources, context) => {
    const seen = new Set<string>()
    for (const [index, source] of sources.entries()) {
      if (seen.has(source.sourceId)) {
        context.addIssue({
          code: "custom",
          path: [index, "sourceId"],
          message: `Duplicate sourceId: ${source.sourceId}`,
        })
      }
      seen.add(source.sourceId)
    }
  }),
}).strict()

export type SourceDataType = z.infer<typeof sourceDataTypeSchema>
export type SourceRegistryEntry = z.infer<typeof sourceRegistryEntrySchema>
export type SourceRegistry = z.infer<typeof sourceRegistrySchema>

export async function loadSourceRegistry(
  workspace: string,
  registryPath = SOURCE_REGISTRY_PATH,
): Promise<SourceRegistry> {
  const absolutePath = path.resolve(workspace, registryPath)
  const relative = path.relative(workspace, absolutePath)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source registry must remain inside the workspace: ${registryPath}`)
  }
  try {
    return sourceRegistrySchema.parse(
      JSON.parse(await readFile(absolutePath, "utf8")) as unknown,
    )
  } catch (error) {
    throw new Error(
      `Invalid source registry ${registryPath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function findRegisteredSource(
  registry: SourceRegistry,
  sourceId: string,
): SourceRegistryEntry {
  const source = registry.sources.find((entry) => entry.sourceId === sourceId)
  if (!source) throw new Error(`Source registry has no entry for ${sourceId}.`)
  return source
}

export function sourceApprovalBlockers(
  source: SourceRegistryEntry,
  requiredDataTypes: readonly SourceDataType[],
): string[] {
  const blockers: string[] = []
  for (const dataType of requiredDataTypes) {
    if (!source.dataTypes.includes(dataType)) {
      blockers.push(`${source.sourceId} approval does not cover ${dataType}.`)
    }
  }
  if (!source.approvalStatus.startsWith("approved-")) {
    blockers.push(
      `${source.sourceId} approval status is ${source.approvalStatus}; approved-manual-import, approved-api, or approved-feed is required.`,
    )
  }
  return blockers
}

export function sourceWriteApproved(
  source: SourceRegistryEntry,
  requiredDataTypes: readonly SourceDataType[],
): boolean {
  return sourceApprovalBlockers(source, requiredDataTypes).length === 0
}
