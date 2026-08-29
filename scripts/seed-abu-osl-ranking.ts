import {createClient} from "next-sanity"

type SeedDocument = {
  readonly _id: string
  readonly _type: string
  readonly [field: string]: unknown
}

const API_VERSION_FALLBACK = "2026-07-01"

const PROVIDER_ID =
  "rankingProvider.official-streetlifting"

const ATHLETE_ID =
  "athlete.abu-asada"

const IDENTITY_ID =
  "externalAthleteIdentity.official-streetlifting.abu-asada"

const SYSTEM_ID =
  "rankingSystem.official-streetlifting-male-all4-world-minus-101kg"

const SNAPSHOT_ID =
  "rankingSnapshot.official-streetlifting-male-all4-world-minus-101kg.2026-08-09"

const SOURCE_URL =
  "https://rankings.officialstreetlifting.com/athletes/abu-asada"

function reference(id: string) {
  return {
    _type: "reference",
    _ref: id,
  }
}

function slug(current: string) {
  return {
    _type: "slug",
    current,
  }
}

function makeDocuments(): SeedDocument[] {
  const checkedAt = new Date().toISOString()

  const system: SeedDocument = {
    _id: SYSTEM_ID,
    _type: "rankingSystem",

    name:
      "Official Streetlifting — Male All4 -101kg World",

    slug: slug(
      "official-streetlifting-male-all4-world-minus-101kg",
    ),

    provider: reference(PROVIDER_ID),

    rankingKind: "ordinal-position",

    discipline: "Streetlifting",
    category: "All4",

    weightClass: "-101kg",
    sexDivision: "Male",

    geographicScope: "World",

    methodologyNotes:
      "Provider-defined Official Streetlifting All4 ranking for the Male -101kg weight class at world scope. Cali Central preserves the provider-defined ranking and does not combine it with unrelated ranking authorities.",

    status: "draft",
  }

  const snapshot: SeedDocument = {
    _id: SNAPSHOT_ID,
    _type: "rankingSnapshot",

    rankingSystem: reference(SYSTEM_ID),

    rankingDate: "2026-08-09",

    checkedAt,

    entries: [
      {
        _key: "abu-asada",
        _type: "rankingSnapshotEntry",

        athlete: reference(ATHLETE_ID),

        sourceDisplayName: "Abu Asada",

        providerAthleteId: "abu-asada",

        position: 17,

        status: "ranked",
      },
    ],

    source: {
      _type: "provenanceSource",

      provider: reference(PROVIDER_ID),

      sourceTitle:
        "Official Streetlifting — Abu Asada athlete profile",

      sourceType: "organization-ranking-page",

      url: SOURCE_URL,

      externalRecordId: "abu-asada",

      checkedAt,

      verificationStatus: "source-confirmed",
    },

    notes:
      "Manual editorial snapshot of Abu Asada's provider-published World All4 Total Rank for the Male -101kg weight class. Source showed position 17 and 500.0 kg total at review time. The 500.0 kg performance is preserved in this editorial note only and is not stored as ranking points or rating because kilograms are sporting performance data, not ranking points.",

    publicationStatus: "draft",
  }

  return [system, snapshot]
}

function validateDocuments(
  documents: readonly SeedDocument[],
) {
  if (documents.length !== 2) {
    throw new Error(
      `Expected exactly 2 documents; received ${documents.length}.`,
    )
  }

  const system = documents.find(
    (document) => document._id === SYSTEM_ID,
  )

  const snapshot = documents.find(
    (document) => document._id === SNAPSHOT_ID,
  )

  if (!system || system._type !== "rankingSystem") {
    throw new Error(
      "Ranking system document is missing.",
    )
  }

  if (
    system.status !== "draft" ||
    system.weightClass !== "-101kg" ||
    system.sexDivision !== "Male" ||
    system.geographicScope !== "World" ||
    system.category !== "All4"
  ) {
    throw new Error(
      "Ranking system dimensions are not the expected Male All4 -101kg World definition.",
    )
  }

  if (
    !snapshot ||
    snapshot._type !== "rankingSnapshot"
  ) {
    throw new Error(
      "Ranking snapshot document is missing.",
    )
  }

  if (snapshot.publicationStatus !== "draft") {
    throw new Error(
      "Initial ranking snapshot must remain draft.",
    )
  }

  const entries =
    snapshot.entries as
      | Array<Record<string, unknown>>
      | undefined

  if (!entries || entries.length !== 1) {
    throw new Error(
      "Snapshot must contain exactly one athlete entry.",
    )
  }

  const entry = entries[0]

  if (
    entry.position !== 17 ||
    entry.status !== "ranked" ||
    entry.providerAthleteId !== "abu-asada"
  ) {
    throw new Error(
      "Abu ranking entry does not match the reviewed source value.",
    )
  }

  if (
    "points" in entry ||
    "rating" in entry
  ) {
    throw new Error(
      "Do not store kilograms as ranking points or rating.",
    )
  }

  const source =
    snapshot.source as
      | Record<string, unknown>
      | undefined

  if (
    !source ||
    source.url !== SOURCE_URL ||
    source.sourceType !==
      "organization-ranking-page" ||
    source.verificationStatus !==
      "source-confirmed"
  ) {
    throw new Error(
      "Snapshot provenance is incomplete or unexpected.",
    )
  }
}

async function writeDocuments(
  documents: readonly SeedDocument[],
) {
  if (
    process.env.CONFIRM_SANITY_ABU_RANKING_SEED !==
    "YES"
  ) {
    throw new Error(
      "Write refused. Set CONFIRM_SANITY_ABU_RANKING_SEED=YES only after reviewing the dry run and NDJSON.",
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
      "Write refused. Sanity project ID and dataset are required.",
    )
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })

  const prerequisite = await client.fetch<{
    provider?: {
      _id?: string
      status?: string
    }
    athlete?: {
      _id?: string
    }
    identity?: {
      _id?: string
      matchingStatus?: string
      reviewStatus?: string
    }
  }>(
    `{
      "provider":
        *[_id == $providerId][0]{
          _id,
          status
        },

      "athlete":
        *[_id == $athleteId][0]{
          _id
        },

      "identity":
        *[_id == $identityId][0]{
          _id,
          matchingStatus,
          reviewStatus
        }
    }`,
    {
      providerId: PROVIDER_ID,
      athleteId: ATHLETE_ID,
      identityId: IDENTITY_ID,
    },
  )

  if (!prerequisite.provider) {
    throw new Error(
      "Official Streetlifting provider does not exist.",
    )
  }

  if (!prerequisite.athlete) {
    throw new Error(
      "Canonical Abu Asada athlete does not exist.",
    )
  }

  if (!prerequisite.identity) {
    throw new Error(
      "Abu Official Streetlifting external identity does not exist.",
    )
  }

  if (
    ![
      "candidate",
      "confirmed",
      "manually-linked",
    ].includes(
      prerequisite.identity.matchingStatus || "",
    )
  ) {
    throw new Error(
      `Unexpected external identity matching status: ${prerequisite.identity.matchingStatus}`,
    )
  }

  const existing =
    await client.fetch<
      Array<{
        _id: string
        _type: string
      }>
    >(
      '*[_id in $ids]{_id,_type}',
      {
        ids: [
          SYSTEM_ID,
          SNAPSHOT_ID,
        ],
      },
    )

  if (existing.length > 0) {
    throw new Error(
      `Write refused. Target document(s) already exist: ${existing
        .map((document) => document._id)
        .join(", ")}`,
    )
  }

  const transaction =
    documents.reduce(
      (current, document) =>
        current.createIfNotExists(document),
      client.transaction(),
    )

  await transaction.commit({
    visibility: "sync",
  })

  console.log("")
  console.log(
    "Official Streetlifting Abu ranking seed complete.",
  )

  console.log(
    `Created ranking system: ${SYSTEM_ID}`,
  )

  console.log(
    `Created draft ranking snapshot: ${SNAPSHOT_ID}`,
  )

  console.log("")
  console.log(
    "Snapshot position: World #17",
  )

  console.log(
    "Category: Male All4 -101kg",
  )

  console.log(
    "Provider: Official Streetlifting",
  )

  console.log(
    `Source: ${SOURCE_URL}`,
  )

  console.log("")
  console.log(
    "The snapshot remains DRAFT.",
  )

  console.log(
    "The ranking system remains DRAFT.",
  )

  console.log(
    "The provider status was NOT changed.",
  )

  console.log(
    "The athlete verification state was NOT changed.",
  )

  console.log(
    "No ranking points/rating were invented.",
  )

  console.log(
    "No existing records were overwritten or deleted.",
  )
}

async function main() {
  const args = process.argv.slice(2)

  const supported =
    new Set([
      "--dry-run",
      "--ndjson",
      "--write",
    ])

  const unsupported =
    args.find(
      (argument) =>
        !supported.has(argument),
    )

  if (unsupported) {
    throw new Error(
      `Unsupported argument: ${unsupported}`,
    )
  }

  const modes = [
    "--dry-run",
    "--ndjson",
    "--write",
  ].filter(
    (argument) =>
      args.includes(argument),
  )

  if (modes.length > 1) {
    throw new Error(
      "Choose only one mode.",
    )
  }

  const documents = makeDocuments()

  validateDocuments(documents)

  if (args.includes("--ndjson")) {
    documents.forEach((document) => {
      console.log(
        JSON.stringify(document),
      )
    })

    return
  }

  if (args.includes("--write")) {
    await writeDocuments(documents)
    return
  }

  console.log("")
  console.log(
    "Dry run only. No Sanity mutations were issued.",
  )

  console.log("")
  console.log(
    "Validated 2 documents:",
  )

  documents.forEach((document) => {
    console.log(
      `- ${document._type}: ${document._id}`,
    )
  })

  console.log("")
  console.log(
    "Reviewed provider value:",
  )

  console.log(
    "Official Streetlifting / Male / All4 / -101kg / World / #17",
  )

  console.log("")
  console.log(
    "Snapshot remains draft.",
  )

  console.log(
    "System remains draft.",
  )

  console.log(
    "Provider remains under-review.",
  )

  console.log(
    "No athlete verification changes.",
  )

  console.log(
    "No public ranking activation.",
  )
}

void main().catch(
  (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : String(error)

    console.error(
      `Official Streetlifting Abu ranking seed failed: ${message}`,
    )

    process.exitCode = 1
  },
)
