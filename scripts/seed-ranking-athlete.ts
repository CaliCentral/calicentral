import {createClient} from "next-sanity"

type SeedDocument = {
  readonly _id: string
  readonly _type: string
  readonly [field: string]: unknown
}

const API_VERSION_FALLBACK = "2026-07-01"

const ATHLETE_ID = "athlete.abu-asada"
const PROVIDER_ID = "rankingProvider.official-streetlifting"
const EXTERNAL_IDENTITY_ID =
  "externalAthleteIdentity.official-streetlifting.abu-asada"

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
  const now = new Date().toISOString()

  const athlete: SeedDocument = {
    _id: ATHLETE_ID,
    _type: "athlete",

    name: "Abu Asada",
    slug: slug("abu-asada"),
    initials: "AA",

    profileNumber: "EXT-OSL-AA",
    profileStatus: "External-source athlete profile / not claimed",
    profileLabel: "External-source athlete record",

    country: "United States",

    primaryDiscipline: "Strength",
    primaryCategory: "power-strength",

    secondaryDisciplines: [],
    specialties: [
      "weighted-calisthenics",
      "pull-strength",
      "dip-strength",
      "muscle-ups",
    ],

    featured: false,
    rankingEligible: false,

    visualVariant: "signal",
    disciplineCode: "STR",

    socialLinks: [],

    verification: {
      _type: "athleteVerification",
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
  }

  const externalIdentity: SeedDocument = {
    _id: EXTERNAL_IDENTITY_ID,
    _type: "externalAthleteIdentity",

    athlete: reference(ATHLETE_ID),
    provider: reference(PROVIDER_ID),

    providerAthleteId: "abu-asada",

    providerAthleteUrl:
      "https://rankings.officialstreetlifting.com/athletes/abu-asada",

    providerDisplayName: "Abu Asada",

    aliases: [],

    matchingStatus: "candidate",
    reviewStatus: "not-reviewed",

    privateReviewNotes:
      "Candidate mapping created from the public Official Streetlifting athlete profile. Country and public provider profile align with the canonical candidate. This record does not mean the athlete controls or has verified the Cali Central profile. Review before changing matchingStatus to confirmed or manually-linked.",

    createdAt: now,
    updatedAt: now,
  }

  return [athlete, externalIdentity]
}

function validateDocuments(
  documents: readonly SeedDocument[],
) {
  if (documents.length !== 2) {
    throw new Error(
      `Expected exactly 2 documents, received ${documents.length}.`,
    )
  }

  const ids = documents.map((document) => document._id)

  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate seed document IDs detected.")
  }

  const athlete = documents.find(
    (document) => document._id === ATHLETE_ID,
  )

  const externalIdentity = documents.find(
    (document) => document._id === EXTERNAL_IDENTITY_ID,
  )

  if (!athlete || athlete._type !== "athlete") {
    throw new Error("Canonical athlete document is missing.")
  }

  if (
    !externalIdentity ||
    externalIdentity._type !== "externalAthleteIdentity"
  ) {
    throw new Error(
      "External athlete identity document is missing.",
    )
  }

  const athleteReference =
    externalIdentity.athlete as
      | {_type?: string; _ref?: string}
      | undefined

  const providerReference =
    externalIdentity.provider as
      | {_type?: string; _ref?: string}
      | undefined

  if (
    athleteReference?._type !== "reference" ||
    athleteReference._ref !== ATHLETE_ID
  ) {
    throw new Error(
      "External athlete identity does not reference the canonical athlete.",
    )
  }

  if (
    providerReference?._type !== "reference" ||
    providerReference._ref !== PROVIDER_ID
  ) {
    throw new Error(
      "External athlete identity does not reference Official Streetlifting.",
    )
  }

  if (externalIdentity.matchingStatus !== "candidate") {
    throw new Error(
      "Initial external athlete mapping must remain candidate.",
    )
  }

  const verification =
    athlete.verification as
      | {
          identityStatus?: string
          profileStatus?: string
        }
      | undefined

  if (
    verification?.identityStatus !== "unverified" ||
    verification.profileStatus !== "not-reviewed"
  ) {
    throw new Error(
      "Initial athlete profile must remain unverified and not-reviewed.",
    )
  }
}

async function writeDocuments(
  documents: readonly SeedDocument[],
) {
  if (
    process.env.CONFIRM_SANITY_RANKING_ATHLETE_SEED !== "YES"
  ) {
    throw new Error(
      "Write refused. Set CONFIRM_SANITY_RANKING_ATHLETE_SEED=YES only after reviewing the dry run and NDJSON.",
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

  const provider = await client.fetch<{
    _id?: string
    _type?: string
  } | null>(
    '*[_id == $providerId && _type == "rankingProvider"][0]{_id,_type}',
    {
      providerId: PROVIDER_ID,
    },
  )

  if (
    !provider ||
    provider._id !== PROVIDER_ID ||
    provider._type !== "rankingProvider"
  ) {
    throw new Error(
      "Write refused. Official Streetlifting ranking provider does not exist.",
    )
  }

  const existing = await client.fetch<
    Array<{
      _id: string
      _type: string
    }>
  >(
    '*[_id in $ids]{_id,_type}',
    {
      ids: [ATHLETE_ID, EXTERNAL_IDENTITY_ID],
    },
  )

  if (existing.length > 0) {
    throw new Error(
      `Write refused. One or more target documents already exist: ${existing
        .map((document) => document._id)
        .join(", ")}. Review them manually rather than overwriting.`,
    )
  }

  const transaction = documents.reduce(
    (current, document) =>
      current.createIfNotExists(document),
    client.transaction(),
  )

  await transaction.commit({
    visibility: "sync",
  })

  console.log(
    `Ranking athlete seed complete: ${documents.length} new documents created.`,
  )

  console.log(`Created canonical athlete: ${ATHLETE_ID}`)
  console.log(
    `Created candidate external identity: ${EXTERNAL_IDENTITY_ID}`,
  )

  console.log(
    "Athlete remains unverified and not reviewed.",
  )

  console.log(
    "External mapping remains candidate and not reviewed.",
  )

  console.log(
    "No ranking snapshot was created.",
  )

  console.log(
    "No external ranking values were copied.",
  )

  console.log(
    "No existing document was replaced or deleted.",
  )
}

async function main() {
  const argumentsList = process.argv.slice(2)

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
      `Unsupported ranking athlete seed argument: ${unsupportedArgument}`,
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

  const documents = makeDocuments()

  validateDocuments(documents)

  if (argumentsList.includes("--ndjson")) {
    documents.forEach((document) => {
      console.log(JSON.stringify(document))
    })

    return
  }

  if (argumentsList.includes("--write")) {
    await writeDocuments(documents)
    return
  }

  console.log(
    "Dry run only. No Sanity requests or dataset mutations were issued.",
  )

  console.log(
    `Validated ${documents.length} ranking-athlete seed documents.`,
  )

  documents.forEach((document) => {
    console.log(
      `- ${document._type}: ${document._id}`,
    )
  })

  console.log("")
  console.log(
    "Canonical athlete remains unverified / not-reviewed.",
  )
  console.log(
    "Official Streetlifting identity remains candidate / not-reviewed.",
  )
  console.log(
    "No ranking snapshots or ranking values are included.",
  )
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown ranking athlete seed failure."

  console.error(
    `Ranking athlete seed failed: ${message}`,
  )

  process.exitCode = 1
})
