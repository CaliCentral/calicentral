/**
 * Guarded ranking-provider seed.
 *
 * Preview:
 *   npx sanity exec scripts/seed-ranking-providers.ts -- --dry-run
 *
 * Inspect:
 *   npx sanity exec scripts/seed-ranking-providers.ts -- --ndjson
 *
 * Write:
 *   CONFIRM_SANITY_RANKING_SEED=YES \
 *   SANITY_API_WRITE_TOKEN=... \
 *   npx sanity exec scripts/seed-ranking-providers.ts -- --write
 *
 * Important:
 * - deterministic IDs
 * - createOrReplace only
 * - no deletes
 * - no athlete records
 * - no ranking snapshots
 * - no external athlete identity mappings
 * - no automated scraping/importing
 */

import {createClient} from "next-sanity"

type SeedDocument = {
  readonly _id: string
  readonly _type: string
  readonly [field: string]: unknown
}

const API_VERSION_FALLBACK = "2026-07-01"

const OFFICIAL_STREETLIFTING_PROVIDER_ID =
  "rankingProvider.official-streetlifting"

const rankingSystems = [
  {
    slug: "official-streetlifting-male-all4-absolute",
    name: "Official Streetlifting — Male All4 Absolute",
    rankingKind: "ordinal-position",
    discipline: "Streetlifting",
    category: "All4",
    sexDivision: "Male",
    geographicScope: "Global",
  },
  {
    slug: "official-streetlifting-female-all4-absolute",
    name: "Official Streetlifting — Female All4 Absolute",
    rankingKind: "ordinal-position",
    discipline: "Streetlifting",
    category: "All4",
    sexDivision: "Female",
    geographicScope: "Global",
  },
  {
    slug: "official-streetlifting-male-classic-absolute",
    name: "Official Streetlifting — Male Classic Absolute",
    rankingKind: "ordinal-position",
    discipline: "Streetlifting",
    category: "Classic",
    sexDivision: "Male",
    geographicScope: "Global",
  },
  {
    slug: "official-streetlifting-female-classic-absolute",
    name: "Official Streetlifting — Female Classic Absolute",
    rankingKind: "ordinal-position",
    discipline: "Streetlifting",
    category: "Classic",
    sexDivision: "Female",
    geographicScope: "Global",
  },
] as const

function slugObject(current: string) {
  return {
    _type: "slug",
    current,
  }
}

function reference(id: string) {
  return {
    _type: "reference",
    _ref: id,
  }
}

function makeProvider(): SeedDocument {
  return {
    _id: OFFICIAL_STREETLIFTING_PROVIDER_ID,
    _type: "rankingProvider",

    name: "Official Streetlifting",
    slug: slugObject("official-streetlifting"),

    website: "https://rankings.officialstreetlifting.com/",

    description:
      "External streetlifting ranking provider represented in Cali Central with source attribution and provider-specific ranking systems. No automated ingestion is enabled by this seed.",

    status: "under-review",

    disciplines: [
      "Streetlifting",
      "All4",
      "Classic",
      "Weighted Muscle-Up",
      "Weighted Pull-Up",
      "Weighted Dip",
      "Squat",
    ],

    geographicScope: "Global",

    integrationMethod: "manual",

    attributionRequirement:
      "Clearly identify Official Streetlifting as the ranking authority and preserve the original public source URL for every manually reviewed or imported ranking snapshot.",

    sourcePolicyNotes:
      "Manual/editorial source review only. Do not scrape or automatically ingest ranking data until API availability, reuse permissions, attribution requirements, provider terms, and import reliability are separately reviewed.",

    lastReviewedAt: new Date().toISOString(),
  }
}

function makeRankingSystems(): SeedDocument[] {
  return rankingSystems.map((system) => ({
    _id: `rankingSystem.${system.slug}`,
    _type: "rankingSystem",

    name: system.name,
    slug: slugObject(system.slug),

    provider: reference(OFFICIAL_STREETLIFTING_PROVIDER_ID),

    rankingKind: system.rankingKind,

    discipline: system.discipline,

    category: system.category,

    sexDivision: system.sexDivision,

    geographicScope: system.geographicScope,

    methodologyNotes:
      "Provider-defined ranking represented without modification. Cali Central preserves provider attribution and does not combine this ranking with unrelated providers into a universal rank.",

    status: "draft",
  }))
}

function makeDocuments(): SeedDocument[] {
  return [
    makeProvider(),
    ...makeRankingSystems(),
  ]
}

function validateDocuments(
  documents: readonly SeedDocument[],
) {
  const ids = documents.map((document) => document._id)

  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate ranking seed document IDs detected.")
  }

  const provider = documents.find(
    (document) =>
      document._id === OFFICIAL_STREETLIFTING_PROVIDER_ID,
  )

  if (!provider) {
    throw new Error(
      "Official Streetlifting provider document is missing.",
    )
  }

  documents.forEach((document) => {
    if (!document._id || !document._type) {
      throw new Error(
        "Every ranking seed document requires _id and _type.",
      )
    }

    if (
      document._type !== "rankingProvider" &&
      document._type !== "rankingSystem"
    ) {
      throw new Error(
        `Unexpected ranking seed document type: ${document._type}`,
      )
    }
  })

  const systems = documents.filter(
    (document) => document._type === "rankingSystem",
  )

  systems.forEach((system) => {
    const providerReference =
      system.provider as
        | {_type?: string; _ref?: string}
        | undefined

    if (
      providerReference?._type !== "reference" ||
      providerReference._ref !==
        OFFICIAL_STREETLIFTING_PROVIDER_ID
    ) {
      throw new Error(
        `Ranking system ${system._id} does not reference the expected provider.`,
      )
    }
  })
}

async function writeDocuments(
  documents: readonly SeedDocument[],
) {
  if (
    process.env.CONFIRM_SANITY_RANKING_SEED !== "YES"
  ) {
    throw new Error(
      "Write refused. Set CONFIRM_SANITY_RANKING_SEED=YES only after reviewing the dry run.",
    )
  }

  const token =
    process.env.SANITY_API_WRITE_TOKEN?.trim()

  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()

  const dataset =
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()

  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
    API_VERSION_FALLBACK

  if (!token) {
    throw new Error(
      "Write refused. SANITY_API_WRITE_TOKEN is required.",
    )
  }

  if (!projectId || !dataset) {
    throw new Error(
      "Write refused. NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are required.",
    )
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })

  const transaction = documents.reduce(
    (current, document) =>
      current.createOrReplace(document),
    client.transaction(),
  )

  await transaction.commit({
    visibility: "sync",
  })

  console.log(
    `Ranking seed complete: ${documents.length} documents created or replaced.`,
  )

  console.log(
    "No athlete records, ranking snapshots, external athlete identities, or unrelated documents were modified.",
  )

  console.log(
    "No delete operations were issued.",
  )
}

async function main() {
  const argumentsList =
    process.argv.slice(2)

  const supportedArguments = new Set([
    "--dry-run",
    "--ndjson",
    "--write",
  ])

  const unsupportedArgument =
    argumentsList.find(
      (argument) =>
        !supportedArguments.has(argument),
    )

  if (unsupportedArgument) {
    throw new Error(
      `Unsupported ranking seed argument: ${unsupportedArgument}`,
    )
  }

  const selectedModes = [
    "--dry-run",
    "--ndjson",
    "--write",
  ].filter((argument) =>
    argumentsList.includes(argument),
  )

  if (selectedModes.length > 1) {
    throw new Error(
      "Choose exactly one of --dry-run, --ndjson, or --write.",
    )
  }

  const shouldEmitNdjson =
    argumentsList.includes("--ndjson")

  const shouldWrite =
    argumentsList.includes("--write")

  const documents = makeDocuments()

  validateDocuments(documents)

  if (shouldEmitNdjson) {
    documents.forEach((document) => {
      console.log(JSON.stringify(document))
    })

    return
  }

  if (shouldWrite) {
    await writeDocuments(documents)
    return
  }

  console.log(
    "Dry run only. No Sanity requests or dataset mutations were issued.",
  )

  console.log(
    `Validated ${documents.length} ranking seed documents.`,
  )

  documents.forEach((document) => {
    console.log(
      `- ${document._type}: ${document._id}`,
    )
  })

  console.log("")
  console.log(
    "Provider remains under-review.",
  )
  console.log(
    "Ranking systems remain draft.",
  )
  console.log(
    "No real athlete data is included.",
  )
  console.log(
    "No external provider data is fetched.",
  )
  console.log(
    "Use --ndjson to inspect exact documents before writing.",
  )
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown ranking seed failure."

  console.error(
    `Ranking seed failed: ${message}`,
  )

  process.exitCode = 1
})
