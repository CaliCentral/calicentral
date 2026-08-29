/**
 * Read-only production-content readiness inventory.
 *
 * Run with:
 *   npm run sanity:report:p1-readiness
 *
 * The script only calls Sanity's query API. Its only writes are ignored report
 * artifacts under .tmp/.
 */
import {mkdir, readdir, readFile, writeFile} from "node:fs/promises"
import path from "node:path"

import {getCliClient} from "sanity/cli"
import {
  findRegisteredSource,
  loadSourceRegistry,
  sourceApprovalBlockers,
  type SourceDataType,
  type SourceRegistry,
} from "./lib/source-registry"

const API_VERSION = "2026-07-01"
const REPORT_DIRECTORY = ".tmp"
const COMPETITION_REPORT_JSON = "global-competition-readiness.json"
const COMPETITION_REPORT_MARKDOWN = "global-competition-readiness.md"
const SAMPLE_REPORT_JSON = "prelaunch-sample-content.json"
const SAMPLE_REPORT_MARKDOWN = "prelaunch-sample-content.md"
const PRODUCTION_REPORT_JSON = "production-data-readiness.json"
const PRODUCTION_REPORT_MARKDOWN = "production-data-readiness.md"
const REPLACEMENT_QUEUE_JSON = "sample-replacement-queue.json"
const REPLACEMENT_QUEUE_MARKDOWN = "sample-replacement-queue.md"
const IMPORT_DIRECTORY = "data/imports"

const CONTENT_TYPES = [
  "athlete",
  "competition",
  "video",
  "story",
  "team",
  "organization",
] as const
const NON_PRODUCTION_MARKERS = [
  "fictional-prototype",
  "sample-record",
  "not-official",
] as const
const PUBLIC_TEAM_STATUSES = new Set([
  "approved-prospective",
  "official",
  "active",
  "inactive",
])
const ABU_ATHLETE_ID = "athlete.abu-asada"
const ABU_IDENTITY_ID = "externalAthleteIdentity.official-streetlifting.abu-asada"
const ABU_SNAPSHOT_ID = "rankingSnapshot.official-streetlifting-male-all4-world-minus-101kg.2026-08-09"

type ContentType = (typeof CONTENT_TYPES)[number]
type ReferenceClassification =
  | "SAMPLE/PROTOTYPE CONTENT"
  | "REAL CONTENT"
  | "SITE CONFIGURATION"
  | "UNKNOWN / NEEDS REVIEW"

type RawReference = {
  readonly _id: string
  readonly _type: string
  readonly label?: string
  readonly marker?: string
  readonly hasSlug?: boolean
  readonly profileApproved?: boolean
  readonly publicStatus?: string | null
  readonly source?: {
    readonly url?: string | null
    readonly verificationStatus?: string | null
  } | null
}

type RawSampleDocument = RawReference & {
  readonly _type: ContentType
  readonly origin?: string
  readonly ownershipStatus?: string
  readonly sourcePlatform?: string
  readonly sourceAccount?: string
  readonly originalPostUrl?: string
  readonly availabilityLabel?: string
  readonly references?: readonly RawReference[]
}

type RawCompetition = {
  readonly _id: string
  readonly name?: string
  readonly marker?: string
  readonly hasSlug?: boolean
  readonly status?: string
  readonly startDate?: string
  readonly endDate?: string
  readonly city?: string
  readonly administrativeArea?: string
  readonly state?: string
  readonly country?: string
  readonly organizerName?: string
  readonly organizerVerificationStatus?: string
  readonly publicStatus?: string | null
  readonly organization?: {
    readonly canonicalId?: string
    readonly name?: string
  } | null
  readonly source?: {
    readonly sourceTitle?: string
    readonly sourceType?: string
    readonly url?: string | null
    readonly verificationStatus?: string | null
    readonly providerId?: string | null
  } | null
  readonly registrationStatus?: string
  readonly scheduleStatus?: string
  readonly resultsStatus?: string
  readonly officialSourceLinkCount?: number
  readonly verifiedResultCount?: number
}

type ClassifiedReference = {
  readonly documentId: string
  readonly documentType: string
  readonly label: string
  readonly marker: string | null
  readonly classification: ReferenceClassification
  readonly publiclyVisible: boolean
  readonly recommendedAction: string
}

type SampleInventoryItem = {
  readonly type: ContentType
  readonly documentId: string
  readonly title: string
  readonly marker: string
  readonly publiclyVisible: boolean
  readonly referenceCount: number
  readonly referenceClassificationCounts: Record<ReferenceClassification, number>
  readonly references: readonly ClassifiedReference[]
  readonly recommendedAction: string
}

type SampleReplacementQueueItem = {
  readonly priority: "P0 — site configuration" | "P1 — referenced" | "P2 — unreferenced"
  readonly type: ContentType
  readonly documentId: string
  readonly title: string
  readonly currentReferences: number
  readonly siteSettingReferences: number
  readonly replacementRequired: true
  readonly realReplacementNeeded: string
  readonly safeToRemoveNow: false
  readonly blockingReason: string
}

type VideoOriginAuditItem = {
  readonly documentId: string
  readonly title: string
  readonly marker: string
  readonly publiclyVisible: boolean
  readonly origin: string | null
  readonly ownershipStatus: string | null
  readonly sourcePlatformPresent: boolean
  readonly sourceAccountPresent: boolean
  readonly originalPostUrlPresent: boolean
  readonly availabilityLabel: string | null
  readonly safelyInferable: boolean
  readonly inferredOrigin: string | null
  readonly rationale: string
  readonly recommendedAction: string
}

type ProductionState = {
  readonly documents: {
    readonly athlete: number
    readonly externalAthleteIdentity: number
    readonly rankingProvider: number
    readonly rankingSystem: number
    readonly rankingSnapshot: number
    readonly competition: number
    readonly organization: number
    readonly video: number
    readonly story: number
    readonly team: number
  }
  readonly abu: {
    readonly canonicalCount: number
    readonly externalIdentityCount: number
    readonly snapshotCount: number
    readonly rankingEntryCount: number
    readonly rankingPosition: number | null
    readonly snapshotStatus: string | null
    readonly providerAthleteId: string | null
    readonly slugCount: number
  }
  readonly athletes: {
    readonly total: number
    readonly real: number
    readonly sample: number
    readonly internalReal: number
    readonly publicApprovedReal: number
    readonly publicSample: number
    readonly externalSourceUnreviewed: number
  }
  readonly rankings: {
    readonly providers: number
    readonly activeProviders: number
    readonly systems: number
    readonly activeSystems: number
    readonly draftSystems: number
    readonly snapshots: number
    readonly publishedSnapshots: number
    readonly draftSnapshots: number
    readonly entries: number
    readonly publicSnapshots: number
  }
  readonly organizations: {
    readonly total: number
    readonly real: number
    readonly sample: number
    readonly public: number
    readonly providerLinked: number
    readonly competitionLinked: number
    readonly sourceConfirmedCompetitionLinked: number
  }
  readonly stories: {
    readonly total: number
    readonly real: number
    readonly sample: number
  }
  readonly videos: {
    readonly total: number
    readonly real: number
    readonly sample: number
    readonly validOrigin: number
    readonly missingOrigin: number
  }
}

type ManifestInventoryItem = {
  readonly path: string
  readonly providerSource: string
  readonly recordType: string
  readonly recordCount: number
  readonly reviewStatus: string
  readonly sourceRightsStatus:
    | "AUTHORIZED"
    | "EDITOR-REVIEWED"
    | "SOURCE-RIGHTS-UNRESOLVED"
    | "INVALID"
  readonly writeEligible: boolean
  readonly reason: string
}

const SAMPLE_INVENTORY_QUERY = `
  *[
    _type in $contentTypes &&
    coalesce(contentStatus, prototypeStatus) in $markers
  ] | order(_type asc, _id asc){
    _id,
    _type,
    "label": coalesce(name, title, _id),
    "marker": coalesce(contentStatus, prototypeStatus),
    "hasSlug": defined(slug.current),
    "profileApproved": verification.profileStatus == "approved",
    publicStatus,
    source{
      url,
      verificationStatus
    },
    origin,
    ownershipStatus,
    sourcePlatform,
    sourceAccount,
    originalPostUrl,
    availabilityLabel,
    "references": *[references(^._id)] | order(_type asc, _id asc){
      _id,
      _type,
      "label": select(
        _type in $contentTypes => coalesce(name, title, _id),
        _id
      ),
      "marker": coalesce(contentStatus, prototypeStatus),
      "hasSlug": defined(slug.current),
      "profileApproved": verification.profileStatus == "approved",
      publicStatus,
      source{
        url,
        verificationStatus
      }
    }
  }
`

const COMPETITION_INVENTORY_QUERY = `
  *[_type == "competition"] | order(startDate asc, name asc){
    _id,
    name,
    "marker": coalesce(contentStatus, prototypeStatus),
    "hasSlug": defined(slug.current),
    status,
    startDate,
    endDate,
    city,
    administrativeArea,
    state,
    country,
    organizerName,
    organizerVerificationStatus,
    publicStatus,
    "organization": organization->{
      "canonicalId": _id,
      name
    },
    source{
      sourceTitle,
      sourceType,
      url,
      verificationStatus,
      "providerId": provider._ref
    },
    registrationStatus,
    scheduleStatus,
    resultsStatus,
    "officialSourceLinkCount": count(actionLinks[
      linkType in ["official-site", "organizer-social", "results"] &&
      defined(url)
    ]),
    "verifiedResultCount": count(results[
      verificationStatus == "verified" &&
      defined(sourceUrl)
    ])
  }
`

const PRODUCTION_STATE_QUERY = `
  {
    "documents": {
      "athlete": count(*[_type == "athlete"]),
      "externalAthleteIdentity": count(*[_type == "externalAthleteIdentity"]),
      "rankingProvider": count(*[_type == "rankingProvider"]),
      "rankingSystem": count(*[_type == "rankingSystem"]),
      "rankingSnapshot": count(*[_type == "rankingSnapshot"]),
      "competition": count(*[_type == "competition"]),
      "organization": count(*[_type == "organization"]),
      "video": count(*[_type == "video"]),
      "story": count(*[_type == "story"]),
      "team": count(*[_type == "team"])
    },
    "abu": {
      "canonicalCount": count(*[
        _type == "athlete" && _id == $abuAthleteId
      ]),
      "externalIdentityCount": count(*[
        _type == "externalAthleteIdentity" &&
        _id == $abuIdentityId &&
        providerAthleteId == "abu-asada" &&
        athlete._ref == $abuAthleteId
      ]),
      "snapshotCount": count(*[
        _type == "rankingSnapshot" && _id == $abuSnapshotId
      ]),
      "rankingEntryCount": count(*[
        _type == "rankingSnapshot" && _id == $abuSnapshotId
      ].entries[athlete._ref == $abuAthleteId]),
      "rankingPosition": *[
        _type == "rankingSnapshot" && _id == $abuSnapshotId
      ][0].entries[athlete._ref == $abuAthleteId][0].position,
      "snapshotStatus": *[
        _type == "rankingSnapshot" && _id == $abuSnapshotId
      ][0].publicationStatus,
      "providerAthleteId": *[
        _type == "externalAthleteIdentity" && _id == $abuIdentityId
      ][0].providerAthleteId,
      "slugCount": count(*[
        _type == "athlete" && slug.current == "abu-asada"
      ])
    },
    "athletes": {
      "total": count(*[_type == "athlete"]),
      "real": count(*[_type == "athlete" && !(prototypeStatus in $markers)]),
      "sample": count(*[_type == "athlete" && prototypeStatus in $markers]),
      "internalReal": count(*[
        _type == "athlete" &&
        !(prototypeStatus in $markers) &&
        verification.profileStatus != "approved"
      ]),
      "publicApprovedReal": count(*[
        _type == "athlete" &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**")) &&
        defined(slug.current) &&
        !(prototypeStatus in $markers) &&
        verification.profileStatus == "approved"
      ]),
      "publicSample": count(*[
        _type == "athlete" &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**")) &&
        defined(slug.current) &&
        prototypeStatus in ["fictional-prototype", "sample-record"]
      ]),
      "externalSourceUnreviewed": count(*[
        _type == "athlete" &&
        !(prototypeStatus in $markers) &&
        verification.profileStatus == "not-reviewed" &&
        count(*[
          _type == "externalAthleteIdentity" &&
          athlete._ref == ^._id
        ]) > 0
      ])
    },
    "rankings": {
      "providers": count(*[_type == "rankingProvider"]),
      "activeProviders": count(*[_type == "rankingProvider" && status == "active"]),
      "systems": count(*[_type == "rankingSystem"]),
      "activeSystems": count(*[_type == "rankingSystem" && status == "active"]),
      "draftSystems": count(*[_type == "rankingSystem" && status == "draft"]),
      "snapshots": count(*[_type == "rankingSnapshot"]),
      "publishedSnapshots": count(*[_type == "rankingSnapshot" && publicationStatus == "published"]),
      "draftSnapshots": count(*[_type == "rankingSnapshot" && publicationStatus == "draft"]),
      "entries": count(*[_type == "rankingSnapshot"].entries[]),
      "publicSnapshots": count(*[
        _type == "rankingSnapshot" &&
        publicationStatus == "published" &&
        rankingSystem->status == "active" &&
        rankingSystem->provider->status == "active" &&
        source.verificationStatus in ["source-confirmed", "official"] &&
        defined(source.url)
      ])
    },
    "organizations": {
      "total": count(*[_type == "organization"]),
      "real": count(*[_type == "organization" && !(prototypeStatus in $markers)]),
      "sample": count(*[_type == "organization" && prototypeStatus in $markers]),
      "public": count(*[
        _type == "organization" &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**")) &&
        publicStatus == "published"
      ]),
      "providerLinked": count(array::unique(*[
        _type == "rankingProvider" && defined(organization._ref)
      ].organization._ref)),
      "competitionLinked": count(array::unique(*[
        _type == "competition" && defined(organization._ref)
      ].organization._ref)),
      "sourceConfirmedCompetitionLinked": count(array::unique(*[
        _type == "competition" &&
        coalesce(contentStatus, prototypeStatus) == "published-record" &&
        source.verificationStatus in ["source-confirmed", "official"] &&
        defined(source.url) &&
        defined(organization._ref)
      ].organization._ref))
    },
    "stories": {
      "total": count(*[_type == "story"]),
      "real": count(*[_type == "story" && !(prototypeStatus in $markers)]),
      "sample": count(*[_type == "story" && prototypeStatus in $markers])
    },
    "videos": {
      "total": count(*[_type == "video"]),
      "real": count(*[_type == "video" && !(prototypeStatus in $markers)]),
      "sample": count(*[_type == "video" && prototypeStatus in $markers]),
      "validOrigin": count(*[_type == "video" && defined(origin)]),
      "missingOrigin": count(*[_type == "video" && !defined(origin)])
    }
  }
`

function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value)
}

function isNonProductionMarker(value: string | undefined): boolean {
  return value !== undefined &&
    (NON_PRODUCTION_MARKERS as readonly string[]).includes(value)
}

function isPublicCompetitionMarker(value: string | undefined): boolean {
  return value === "fictional-prototype" || value === "sample-record"
}

function hasConfirmedCompetitionSource(
  source: RawReference["source"],
): boolean {
  return Boolean(
    source?.url &&
      (source.verificationStatus === "source-confirmed" ||
        source.verificationStatus === "official"),
  )
}

function isPublishedDocumentId(documentId: string): boolean {
  return !documentId.startsWith("drafts.") && !documentId.startsWith("versions.")
}

function isPubliclyVisible(document: RawReference): boolean {
  if (!isPublishedDocumentId(document._id) || !document.hasSlug) {
    return false
  }

  switch (document._type) {
    case "athlete":
      return document.profileApproved === true ||
        document.marker === "fictional-prototype" ||
        document.marker === "sample-record"
    case "competition":
      return (
        document.publicStatus === "published" &&
        (
          isPublicCompetitionMarker(document.marker) ||
          hasConfirmedCompetitionSource(document.source)
        )
      ) || (
        !document.publicStatus && isPublicCompetitionMarker(document.marker)
      )
    case "video":
    case "story":
      return true
    case "team":
      return PUBLIC_TEAM_STATUSES.has(document.publicStatus ?? "")
    case "organization":
      return document.publicStatus === "published"
    default:
      return false
  }
}

function classifyReference(reference: RawReference): ReferenceClassification {
  if (reference._type === "siteSettings") {
    return "SITE CONFIGURATION"
  }
  if (isNonProductionMarker(reference.marker)) {
    return "SAMPLE/PROTOTYPE CONTENT"
  }
  if (isContentType(reference._type)) {
    return "REAL CONTENT"
  }
  return "UNKNOWN / NEEDS REVIEW"
}

function actionForReference(classification: ReferenceClassification): string {
  switch (classification) {
    case "SAMPLE/PROTOTYPE CONTENT":
      return "Remove or replace the referring sample/prototype document as a whole; do not only sever this reference."
    case "REAL CONTENT":
      return "STOP: a real content document depends on this sample. Require editorial review; do not reassign by name."
    case "SITE CONFIGURATION":
      return "Repoint Site settings only when an appropriate reviewed real replacement exists."
    case "UNKNOWN / NEEDS REVIEW":
      return "STOP: inspect this dependency manually before any cleanup or reassignment."
  }
}

function emptyReferenceCounts(): Record<ReferenceClassification, number> {
  return {
    "SAMPLE/PROTOTYPE CONTENT": 0,
    "REAL CONTENT": 0,
    "SITE CONFIGURATION": 0,
    "UNKNOWN / NEEDS REVIEW": 0,
  }
}

function recommendedActionForSample(
  document: RawSampleDocument,
  counts: Record<ReferenceClassification, number>,
): string {
  if (counts["REAL CONTENT"] > 0 || counts["UNKNOWN / NEEDS REVIEW"] > 0) {
    return "STOP and complete editorial review of real or unknown dependencies before any cleanup. Do not reassign references by name."
  }

  if (document._type === "athlete") {
    return document.references?.length
      ? "Do not delete. Replace or retire the referring sample graph first, and repoint Site settings only after a reviewed real replacement exists."
      : "No inbound dependency was found, but deletion still requires the separate guarded cleanup workflow; this report performs no deletion."
  }
  if (document._type === "competition") {
    return "Replace or retire the fictional competition and its sample relationships as one editorial unit; never convert it to a real event without primary-source verification."
  }
  if (document._type === "video") {
    return document.origin
      ? "Replace or retire the fictional video and its linked sample content as one editorial unit."
      : "Replace or retire the fictional video; if retained, an editor must establish truthful origin metadata before validation can pass."
  }
  if (document._type === "story") {
    return "Replace or retire the fictional story and its linked sample content as one editorial unit."
  }
  if (document._type === "team") {
    return "Keep non-public or retire the sample team until a source-confirmed real team record is available."
  }
  return "Keep non-public or retire the sample organization until a source-confirmed real organization record is available."
}

function buildSampleInventory(documents: readonly RawSampleDocument[]): SampleInventoryItem[] {
  return documents.map((document) => {
    const counts = emptyReferenceCounts()
    const references = (document.references ?? []).map((reference) => {
      const classification = classifyReference(reference)
      counts[classification] += 1
      return {
        documentId: reference._id,
        documentType: reference._type,
        label: reference.label ?? reference._id,
        marker: reference.marker ?? null,
        classification,
        publiclyVisible: isPubliclyVisible(reference),
        recommendedAction: actionForReference(classification),
      }
    })

    return {
      type: document._type,
      documentId: document._id,
      title: document.label ?? document._id,
      marker: document.marker ?? "missing-marker",
      publiclyVisible: isPubliclyVisible(document),
      referenceCount: references.length,
      referenceClassificationCounts: counts,
      references,
      recommendedAction: recommendedActionForSample(document, counts),
    }
  })
}

function auditVideoOrigin(document: RawSampleDocument): VideoOriginAuditItem {
  const ownershipStatus = document.ownershipStatus ?? null
  const sourcePlatformPresent = Boolean(document.sourcePlatform?.trim())
  const sourceAccountPresent = Boolean(document.sourceAccount?.trim())
  const originalPostUrlPresent = Boolean(document.originalPostUrl?.trim())

  let inferredOrigin: string | null = null
  let rationale: string

  if (document.origin) {
    rationale = "Origin is already present; no inference is needed."
  } else if (ownershipStatus === "cali-central-original") {
    inferredOrigin = "cali-central-original"
    rationale = "The explicit ownership status matches the schema's Cali Central Original origin requirement."
  } else if (
    ownershipStatus === "third-party-attributed" &&
    sourcePlatformPresent &&
    originalPostUrlPresent
  ) {
    inferredOrigin = "external-source"
    rationale = "Explicit third-party ownership, source platform, and original public URL satisfy the schema's External Source requirements."
  } else {
    rationale = ownershipStatus === "source-unavailable"
      ? "Source-unavailable ownership supplies no evidence for Cali Central Original, Community Submission, or External Source."
      : "The stored fields do not satisfy a complete, unambiguous origin case in the schema."
  }

  const missingOrigin = !document.origin
  const safelyInferable = missingOrigin && inferredOrigin !== null

  return {
    documentId: document._id,
    title: document.label ?? document._id,
    marker: document.marker ?? "missing-marker",
    publiclyVisible: isPubliclyVisible(document),
    origin: document.origin ?? null,
    ownershipStatus,
    sourcePlatformPresent,
    sourceAccountPresent,
    originalPostUrlPresent,
    availabilityLabel: document.availabilityLabel ?? null,
    safelyInferable,
    inferredOrigin,
    rationale,
    recommendedAction: missingOrigin
      ? safelyInferable
        ? `Editorially confirm and set origin to ${inferredOrigin}; this read-only report makes no Sanity mutation.`
        : "Editorial review must establish truthful provenance, or the fictional video should be retired. Do not fabricate origin."
      : "No origin correction is required.",
  }
}

function competitionClassification(marker: string | undefined): "sample/prototype" | "real" | "unknown/needs-review" {
  if (isNonProductionMarker(marker)) {
    return "sample/prototype"
  }
  if (marker === "published-record") {
    return "real"
  }
  return "unknown/needs-review"
}

function isCompetitionSourceConfirmed(competition: RawCompetition): boolean {
  return competitionClassification(competition.marker) === "real" &&
    hasConfirmedCompetitionSource(competition.source)
}

function competitionRecommendedAction(competition: RawCompetition): string {
  const classification = competitionClassification(competition.marker)
  if (classification === "sample/prototype") {
    return "Replace or retire this fictional/sample event; do not treat its organizer, schedule, or results as production facts."
  }
  if (classification === "unknown/needs-review") {
    return "Review the content marker and primary-source evidence before treating this event as real or public-ready."
  }
  if (!isCompetitionSourceConfirmed(competition)) {
    return "Keep under review until canonical source provenance has a public URL and source-confirmed or official verification."
  }
  return "Source-confirmed real competition; continue normal editorial freshness checks."
}

function markdownEscape(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ")
}

function pluralCount(value: unknown): string {
  return typeof value === "number" ? String(value) : "0"
}

function competitionReportMarkdown(report: Record<string, unknown>): string {
  const counts = report.counts as Record<string, unknown>
  const competitions = report.competitions as Array<Record<string, unknown>>
  const definitions = report.definitions as Record<string, unknown>

  return [
    `# ${String(report.title)}`,
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    "This is a read-only raw-perspective inventory. Sanity mutations: **0**.",
    "",
    "## Counts",
    "",
    `- Current competitions: ${pluralCount(counts.currentCompetitions)}`,
    `- Sample/prototype: ${pluralCount(counts.samplePrototypeCompetitions)}`,
    `- Real: ${pluralCount(counts.realCompetitions)}`,
    `- Unknown / needs review: ${pluralCount(counts.unknownCompetitions)}`,
    `- Source-confirmed: ${pluralCount(counts.sourceConfirmedCompetitions)}`,
    `- Upcoming by status: ${pluralCount(counts.upcomingCompetitions)}`,
    `- Past/completed by status: ${pluralCount(counts.pastCompetitions)}`,
    `- Future-dated: ${pluralCount(counts.futureDatedCompetitions)}`,
    `- Postponed: ${pluralCount(counts.postponedCompetitions)}`,
    `- Countries represented: ${pluralCount(counts.countriesRepresented)}`,
    `- Canonical organization records represented: ${pluralCount(counts.organizationsRepresented)}`,
    `- Organizer-name labels represented: ${pluralCount(counts.organizerLabelsRepresented)}`,
    "",
    "## Definitions",
    "",
    `- Real: ${String(definitions.realCompetition)}`,
    `- Source-confirmed: ${String(definitions.sourceConfirmedCompetition)}`,
    `- Organizations represented: ${String(definitions.organizationsRepresented)}`,
    `- Publicly visible: ${String(definitions.publiclyVisible)}`,
    "",
    "## Inventory",
    "",
    "| Document ID | Competition | Date | Status | Country | Organizer | Canonical organization | Marker | Class | Source-confirmed? | Public route eligible? |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...competitions.map((competition) =>
      `| ${markdownEscape(String(competition.documentId))} | ${markdownEscape(String(competition.name))} | ${markdownEscape(String(competition.startDate ?? "—"))} | ${markdownEscape(String(competition.status ?? "—"))} | ${markdownEscape(String(competition.country ?? "—"))} | ${markdownEscape(String(competition.organizerName ?? "—"))} | ${markdownEscape(String(competition.organizationName ?? "—"))} | ${markdownEscape(String(competition.marker ?? "—"))} | ${markdownEscape(String(competition.classification))} | ${competition.sourceConfirmed ? "Yes" : "No"} | ${competition.publiclyVisible ? "Yes" : "No"} |`,
    ),
    "",
    "## Recommended actions",
    "",
    ...competitions.map((competition) =>
      `- \`${String(competition.documentId)}\`: ${String(competition.recommendedAction)}`,
    ),
    "",
  ].join("\n")
}

function sampleReportMarkdown(report: Record<string, unknown>): string {
  const counts = report.counts as Record<string, unknown>
  const inventory = report.inventory as SampleInventoryItem[]
  const videoAudit = report.videoOriginAudit as Record<string, unknown>
  const videoItems = videoAudit.videos as VideoOriginAuditItem[]

  const lines = [
    `# ${String(report.title)}`,
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    "This is a read-only raw-perspective inventory. Sanity mutations: **0**.",
    "",
    "`Publicly visible` means eligible under the current public route query; it does not mean anonymous Content Lake access.",
    "",
    "## Counts",
    "",
    `- Sample athletes: ${pluralCount(counts.sampleAthletes)}`,
    `- Sample competitions: ${pluralCount(counts.sampleCompetitions)}`,
    `- Sample videos: ${pluralCount(counts.sampleVideos)}`,
    `- Sample stories: ${pluralCount(counts.sampleStories)}`,
    `- Sample teams: ${pluralCount(counts.sampleTeams)}`,
    `- Sample organizations: ${pluralCount(counts.sampleOrganizations)}`,
    `- Public sample content remaining: ${pluralCount(counts.publicSampleContentRemaining)}`,
    `- Inbound reference relationships: ${pluralCount(counts.inboundReferenceRelationships)}`,
    "",
    "## Inventory",
    "",
    "| Type | Document ID | Title/name | Marker | Publicly visible? | Inbound reference documents | Recommended action |",
    "| --- | --- | --- | --- | --- | ---: | --- |",
    ...inventory.map((item) =>
      `| ${markdownEscape(item.type)} | ${markdownEscape(item.documentId)} | ${markdownEscape(item.title)} | ${markdownEscape(item.marker)} | ${item.publiclyVisible ? "Yes" : "No"} | ${item.referenceCount} | ${markdownEscape(item.recommendedAction)} |`,
    ),
    "",
    "## Inbound reference classification",
    "",
  ]

  for (const item of inventory) {
    lines.push(`### ${item.title} (\`${item.documentId}\`)`, "")
    if (item.references.length === 0) {
      lines.push("- No inbound reference documents found.", "")
      continue
    }
    for (const reference of item.references) {
      lines.push(
        `- **${reference.classification}** — ${reference.documentType} \`${reference.documentId}\` (${reference.label}); public route eligible: ${reference.publiclyVisible ? "yes" : "no"}. ${reference.recommendedAction}`,
      )
    }
    lines.push("")
  }

  lines.push(
    "## Video origin audit",
    "",
    `- Missing origin: ${pluralCount(videoAudit.missingOrigin)}`,
    `- Safely fixable from explicit fields: ${pluralCount(videoAudit.safelyFixable)}`,
    `- Needs editorial review: ${pluralCount(videoAudit.needsEditorialReview)}`,
    "",
    "Safe inference is deliberately narrow: matching Cali Central ownership supports `cali-central-original`; complete third-party attribution plus source platform and original URL supports `external-source`. The schema contains no field that independently proves `community-submission`.",
    "",
    "| Document ID | Video | Marker | Ownership | Platform present? | Account present? | Original URL present? | Safe inference |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...videoItems.map((video) =>
      `| ${markdownEscape(video.documentId)} | ${markdownEscape(video.title)} | ${markdownEscape(video.marker)} | ${markdownEscape(video.ownershipStatus ?? "—")} | ${video.sourcePlatformPresent ? "Yes" : "No"} | ${video.sourceAccountPresent ? "Yes" : "No"} | ${video.originalPostUrlPresent ? "Yes" : "No"} | ${markdownEscape(video.inferredOrigin ?? "No")} |`,
    ),
    "",
    "### Editorial actions",
    "",
    ...videoItems
      .filter((video) => video.origin === null)
      .map((video) => `- \`${video.documentId}\`: ${video.rationale} ${video.recommendedAction}`),
    "",
    `Abu affected by sample inventory: ${report.abuAffected ? "YES" : "NO"}`,
    "",
  )

  return lines.join("\n")
}

function replacementNeededFor(type: ContentType): string {
  const descriptions: Record<ContentType, string> = {
    athlete: "A source-approved real athlete profile, with any public feature or relationship explicitly repointed.",
    competition: "A source-confirmed real competition record with truthful organizer, date, location, and provenance.",
    video: "A rights-cleared real video with truthful origin, ownership, attribution, and availability metadata.",
    story: "A reviewed real editorial story whose athlete, competition, and video relationships are production-safe.",
    team: "A source-confirmed real team record reviewed for public publication.",
    organization: "A source-confirmed canonical organization record reviewed for public publication.",
  }
  return descriptions[type]
}

function buildReplacementQueue(inventory: readonly SampleInventoryItem[]): SampleReplacementQueueItem[] {
  return inventory
    .filter((item) => item.publiclyVisible)
    .map((item) => {
      const siteSettingReferences = item.references.filter(
        (reference) => reference.classification === "SITE CONFIGURATION",
      ).length
      const priority = siteSettingReferences > 0
        ? "P0 — site configuration" as const
        : item.referenceCount > 0
          ? "P1 — referenced" as const
          : "P2 — unreferenced" as const
      return {
        priority,
        type: item.type,
        documentId: item.documentId,
        title: item.title,
        currentReferences: item.referenceCount,
        siteSettingReferences,
        replacementRequired: true as const,
        realReplacementNeeded: replacementNeededFor(item.type),
        safeToRemoveNow: false as const,
        blockingReason: siteSettingReferences > 0
          ? "Referenced by Site settings. Repoint the configured slot only after its reviewed real replacement is ready."
          : item.referenceCount > 0
            ? "Inbound relationships must be reviewed and repointed or retired as a coordinated graph change."
            : "This inventory does not certify deletion; use the guarded cleanup workflow after replacement review.",
      }
    })
    .sort((left, right) =>
      left.priority.localeCompare(right.priority) ||
      left.type.localeCompare(right.type) ||
      left.documentId.localeCompare(right.documentId),
    )
}

function replacementQueueMarkdown(report: Record<string, unknown>): string {
  const summary = report.summary as Record<string, number>
  const queue = report.queue as SampleReplacementQueueItem[]
  return [
    `# ${String(report.title)}`,
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    "Read-only editorial queue. Sanity mutations: **0**. No item is certified safe to remove.",
    "",
    "## Summary",
    "",
    `- Public sample/prototype records queued: ${summary.total}`,
    `- Site-configuration replacements: ${summary.siteConfigurationBlocked}`,
    `- Other referenced replacements: ${summary.referencedBlocked}`,
    `- Safe to remove now: ${summary.safeToRemoveNow}`,
    "",
    "## Queue",
    "",
    "| Priority | Type | Document ID | Current references | Site settings | Real replacement needed | Safe now? |",
    "| --- | --- | --- | ---: | ---: | --- | --- |",
    ...queue.map((item) =>
      `| ${markdownEscape(item.priority)} | ${item.type} | ${markdownEscape(item.documentId)} | ${item.currentReferences} | ${item.siteSettingReferences} | ${markdownEscape(item.realReplacementNeeded)} | No |`,
    ),
    "",
    "## Blocking reasons",
    "",
    ...queue.map((item) => `- \`${item.documentId}\`: ${item.blockingReason}`),
    "",
  ].join("\n")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function findJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {withFileTypes: true}).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return []
      throw error
    },
  )
  const discovered = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findJsonFiles(entryPath)
    return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : []
  }))
  return discovered.flat().sort()
}

function inspectManifest(
  workspace: string,
  filePath: string,
  value: unknown,
  registry: SourceRegistry,
): ManifestInventoryItem {
  const relativePath = path.relative(workspace, filePath)
  if (!isRecord(value)) {
    return {
      path: relativePath,
      providerSource: "unknown",
      recordType: "unknown",
      recordCount: 0,
      reviewStatus: "invalid",
      sourceRightsStatus: "INVALID",
      writeEligible: false,
      reason: "The manifest root is not an object.",
    }
  }

  const sourceRights = isRecord(value.sourceRights) ? value.sourceRights : null
  const reviewStatus = typeof sourceRights?.reviewStatus === "string"
    ? sourceRights.reviewStatus
    : "missing"
  const provider = isRecord(value.provider) ? value.provider : null
  const source = isRecord(value.source) ? value.source : null
  const providerSource = typeof provider?.name === "string"
    ? provider.name
    : typeof source?.sourceTitle === "string"
      ? source.sourceTitle
      : "editor-reviewed source"

  const registryApproval = (requiredDataTypes: readonly SourceDataType[]) => {
    if (typeof value.sourceId !== "string") return null
    try {
      const registered = findRegisteredSource(registry, value.sourceId)
      const blockers = sourceApprovalBlockers(registered, requiredDataTypes)
      return {
        providerSource: registered.name,
        reviewStatus: registered.approvalStatus,
        writeEligible: blockers.length === 0,
        reason: blockers.length === 0
          ? "The source registry records complete approval; live importer preflight and explicit write confirmation are still required."
          : blockers.join(" "),
      }
    } catch (error) {
      return {
        providerSource,
        reviewStatus: "missing",
        writeEligible: false,
        reason: error instanceof Error ? error.message : String(error),
      }
    }
  }

  if (isRecord(value.snapshot) && Array.isArray(value.snapshot.entries)) {
    const approval = registryApproval(["athletes", "rankings"])
    const writeEligible = approval?.writeEligible ?? reviewStatus === "approved"
    return {
      path: relativePath,
      providerSource: approval?.providerSource ?? providerSource,
      recordType: "athletes + ranking snapshot",
      recordCount: value.snapshot.entries.length,
      reviewStatus: approval?.reviewStatus ?? reviewStatus,
      sourceRightsStatus: writeEligible
        ? "AUTHORIZED"
        : reviewStatus === "review-pending"
          ? "SOURCE-RIGHTS-UNRESOLVED"
          : "EDITOR-REVIEWED",
      writeEligible,
      reason: approval?.reason ?? (writeEligible
        ? "The manifest records source-rights approval; live importer preflight and explicit write confirmation are still required."
        : "The reviewed data is locally valid, but source/reuse approval is not recorded."),
    }
  }

  if (value.kind === "competitions" && Array.isArray(value.competitions)) {
    const approval = registryApproval(["competitions"])
    const sourceVerified = isRecord(value.source) &&
      ["source-confirmed", "official"].includes(String(value.source.verificationStatus))
    const approvalComplete = reviewStatus === "approved" &&
      typeof sourceRights?.approvalReference === "string" &&
      typeof sourceRights?.approvedAt === "string"
    const writeEligible = (approval?.writeEligible ?? approvalComplete) && sourceVerified
    return {
      path: relativePath,
      providerSource: approval?.providerSource ?? providerSource,
      recordType: "competitions",
      recordCount: value.competitions.length,
      reviewStatus: approval?.reviewStatus ?? reviewStatus,
      sourceRightsStatus: writeEligible
        ? "AUTHORIZED"
        : reviewStatus === "review-pending"
          ? "SOURCE-RIGHTS-UNRESOLVED"
          : "EDITOR-REVIEWED",
      writeEligible,
      reason: approval && !approval.writeEligible
        ? approval.reason
        : writeEligible
        ? "Rights approval evidence and confirmed source facts are recorded; live importer preflight and explicit write confirmation are still required."
        : "Competition writes require approved rights evidence and source-confirmed or official facts.",
    }
  }

  if (value.kind === "organizations" && Array.isArray(value.organizations)) {
    const approval = registryApproval(["organizations"])
    const sourceVerified = isRecord(value.source) &&
      ["source-confirmed", "official"].includes(String(value.source.verificationStatus))
    const writeEligible = (approval?.writeEligible ?? reviewStatus === "approved") && sourceVerified
    return {
      path: relativePath,
      providerSource: approval?.providerSource ?? providerSource,
      recordType: "organizations",
      recordCount: value.organizations.length,
      reviewStatus: approval?.reviewStatus ?? reviewStatus,
      sourceRightsStatus: writeEligible
        ? "AUTHORIZED"
        : reviewStatus === "review-pending"
          ? "SOURCE-RIGHTS-UNRESOLVED"
          : "EDITOR-REVIEWED",
      writeEligible,
      reason: approval && !approval.writeEligible
        ? approval.reason
        : writeEligible
          ? "Rights approval and confirmed source facts are recorded; live importer preflight and explicit write confirmation are still required."
          : "Organization writes require source/reuse approval and source-confirmed or official facts.",
    }
  }

  return {
    path: relativePath,
    providerSource,
    recordType: "unknown",
    recordCount: 0,
    reviewStatus,
    sourceRightsStatus: "INVALID",
    writeEligible: false,
    reason: "The JSON file does not match a recognized reviewed import shape.",
  }
}

async function inventoryManifests(workspace: string): Promise<ManifestInventoryItem[]> {
  const importDirectory = path.join(workspace, IMPORT_DIRECTORY)
  const [registry, discovered] = await Promise.all([
    loadSourceRegistry(workspace),
    findJsonFiles(importDirectory),
  ])
  const files = discovered.filter((filePath) => {
    const relative = path.relative(importDirectory, filePath).split(path.sep).join("/")
    return relative !== "source-registry.json" && !relative.startsWith("templates/")
  })
  return Promise.all(files.map(async (filePath) => {
    try {
      const value: unknown = JSON.parse(await readFile(filePath, "utf8"))
      return inspectManifest(workspace, filePath, value, registry)
    } catch (error) {
      return {
        path: path.relative(workspace, filePath),
        providerSource: "unknown",
        recordType: "unknown",
        recordCount: 0,
        reviewStatus: "invalid",
        sourceRightsStatus: "INVALID",
        writeEligible: false,
        reason: error instanceof Error ? error.message : String(error),
      }
    }
  }))
}

function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 10_000) / 100
}

function productionReportMarkdown(report: Record<string, unknown>): string {
  const counts = report.counts as Record<string, Record<string, number>>
  const directory = report.publicDirectory as Record<string, number>
  const manifests = report.manifests as ManifestInventoryItem[]
  const remaining = report.remainingFictionalPublicDocuments as Array<{
    documentId: string
    type: string
    reason: string
  }>
  const athlete = counts.athletes
  const ranking = counts.rankings
  const competition = counts.competitions
  const organization = counts.organizations
  const story = counts.stories
  const video = counts.videos
  const abu = report.abuSafety as ProductionState["abu"]

  return [
    `# ${String(report.title)}`,
    "",
    `Generated: ${String(report.generatedAt)}`,
    "",
    "This is a read-only raw-perspective production inventory. Sanity mutations: **0**.",
    "",
    "## Reviewed manifests",
    "",
    "| Path | Provider/source | Record type | Records | Review | Rights status | Write eligible |",
    "| --- | --- | --- | ---: | --- | --- | --- |",
    ...manifests.map((manifest) =>
      `| ${markdownEscape(manifest.path)} | ${markdownEscape(manifest.providerSource)} | ${markdownEscape(manifest.recordType)} | ${manifest.recordCount} | ${markdownEscape(manifest.reviewStatus)} | ${manifest.sourceRightsStatus} | ${manifest.writeEligible ? "YES" : "NO"} |`,
    ),
    "",
    "## Athletes",
    "",
    `- Real: ${athlete.real}`,
    `- Sample/prototype: ${athlete.sample}`,
    `- Internal real: ${athlete.internalReal}`,
    `- Public approved real: ${athlete.publicApprovedReal}`,
    `- External-source unreviewed: ${athlete.externalSourceUnreviewed}`,
    "",
    "## Rankings",
    "",
    `- Providers: ${ranking.providers}`,
    `- Systems: ${ranking.systems}`,
    `- Snapshots: ${ranking.snapshots}`,
    `- Entries: ${ranking.entries}`,
    `- Published snapshots: ${ranking.publishedSnapshots}`,
    `- Draft snapshots: ${ranking.draftSnapshots}`,
    "",
    "## Competitions and organizations",
    "",
    `- Real competitions: ${competition.real}`,
    `- Sample competitions: ${competition.sample}`,
    `- Public real competitions: ${competition.publicReal}`,
    `- Countries represented: ${competition.countries}`,
    `- Real organizations: ${organization.real}`,
    `- Sample organizations: ${organization.sample}`,
    `- Provider-linked organizations: ${organization.providerLinked}`,
    `- Competition-linked organizations: ${organization.competitionLinked}`,
    "",
    "## Stories and videos",
    "",
    `- Real stories: ${story.real}`,
    `- Sample stories: ${story.sample}`,
    `- Real videos: ${video.real}`,
    `- Sample videos: ${video.sample}`,
    `- Videos with valid origin: ${video.validOrigin}`,
    `- Videos missing origin: ${video.missingOrigin}`,
    "",
    "## Public directory composition",
    "",
    `- Athlete directory real: ${directory.athleteRealPercent}%`,
    `- Competition directory real: ${directory.competitionRealPercent}%`,
    `- Remaining public fictional/sample documents: ${directory.remainingFictionalPublicDocuments}`,
    "",
    "## Abu safety",
    "",
    `- Canonical athlete count: ${abu.canonicalCount}`,
    `- Exact external identity count: ${abu.externalIdentityCount}`,
    `- Existing snapshot count: ${abu.snapshotCount}`,
    `- Stored ranking entry: ${abu.rankingEntryCount} at position ${abu.rankingPosition ?? "missing"}`,
    `- Snapshot status: ${abu.snapshotStatus ?? "missing"}`,
    `- Provider athlete ID: ${abu.providerAthleteId ?? "missing"}`,
    `- Abu slug count: ${abu.slugCount}`,
    "",
    "## Remaining public fictional/sample documents",
    "",
    ...remaining.map((item) =>
      `- \`${markdownEscape(item.documentId)}\` (${markdownEscape(item.type)}): ${markdownEscape(item.reason)}`,
    ),
    "",
    "No sample document is deletion-eligible merely because it appears here. Coordinated cleanup still requires real public replacements, resolved Site settings, a fresh reference audit, and separate destructive confirmation.",
    "",
  ].join("\n")
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function main(): Promise<void> {
  const client = getCliClient({
    apiVersion: API_VERSION,
    perspective: "raw",
    useCdn: false,
  })
  const generatedAt = new Date().toISOString()
  const reportDate = generatedAt.slice(0, 10)
  const workspace = process.cwd()
  const reportDirectory = path.join(workspace, REPORT_DIRECTORY)

  const [rawSamples, rawCompetitions, productionState, manifests] = await Promise.all([
    client.fetch<RawSampleDocument[]>(SAMPLE_INVENTORY_QUERY, {
      contentTypes: CONTENT_TYPES,
      markers: NON_PRODUCTION_MARKERS,
    }),
    client.fetch<RawCompetition[]>(COMPETITION_INVENTORY_QUERY),
    client.fetch<ProductionState>(PRODUCTION_STATE_QUERY, {
      markers: NON_PRODUCTION_MARKERS,
      abuAthleteId: ABU_ATHLETE_ID,
      abuIdentityId: ABU_IDENTITY_ID,
      abuSnapshotId: ABU_SNAPSHOT_ID,
    }),
    inventoryManifests(workspace),
  ])

  const inventory = buildSampleInventory(rawSamples)
  const replacementQueue = buildReplacementQueue(inventory)
  const videoOriginItems = rawSamples
    .filter((document) => document._type === "video")
    .map(auditVideoOrigin)
  const missingOriginVideos = videoOriginItems.filter((video) => video.origin === null)
  const safelyFixableVideos = missingOriginVideos.filter((video) => video.safelyInferable)

  const sampleCounts = Object.fromEntries(
    CONTENT_TYPES.map((type) => [
      type,
      inventory.filter((item) => item.type === type).length,
    ]),
  ) as Record<ContentType, number>

  const referenceClassifications = emptyReferenceCounts()
  for (const item of inventory) {
    for (const classification of Object.keys(referenceClassifications) as ReferenceClassification[]) {
      referenceClassifications[classification] += item.referenceClassificationCounts[classification]
    }
  }

  const competitionItems = rawCompetitions.map((competition) => {
    const classification = competitionClassification(competition.marker)
    const sourceConfirmed = isCompetitionSourceConfirmed(competition)
    return {
      documentId: competition._id,
      name: competition.name ?? competition._id,
      marker: competition.marker ?? null,
      classification,
      publicStatus: competition.publicStatus ?? null,
      publiclyVisible: isPubliclyVisible({
        _id: competition._id,
        _type: "competition",
        marker: competition.marker,
        hasSlug: competition.hasSlug,
        publicStatus: competition.publicStatus,
        source: competition.source,
      }),
      status: competition.status ?? null,
      startDate: competition.startDate ?? null,
      endDate: competition.endDate ?? null,
      location: {
        city: competition.city ?? null,
        administrativeArea: competition.administrativeArea ?? competition.state ?? null,
        country: competition.country ?? null,
      },
      country: competition.country ?? null,
      organizerName: competition.organizerName ?? null,
      organizerVerificationStatus: competition.organizerVerificationStatus ?? null,
      organizationId: competition.organization?.canonicalId ?? null,
      organizationName: competition.organization?.name ?? null,
      registrationStatus: competition.registrationStatus ?? null,
      scheduleStatus: competition.scheduleStatus ?? null,
      resultsStatus: competition.resultsStatus ?? null,
      sourceEvidence: {
        sourceTitle: competition.source?.sourceTitle ?? null,
        sourceType: competition.source?.sourceType ?? null,
        sourceUrlPresent: Boolean(competition.source?.url),
        verificationStatus: competition.source?.verificationStatus ?? null,
        providerId: competition.source?.providerId ?? null,
        officialPrimaryLinkCount: competition.officialSourceLinkCount ?? 0,
        verifiedResultCount: competition.verifiedResultCount ?? 0,
      },
      sourceConfirmed,
      recommendedAction: competitionRecommendedAction(competition),
    }
  })

  const countries = [...new Set(
    rawCompetitions
      .map((competition) => competition.country?.trim())
      .filter((country): country is string => Boolean(country)),
  )].sort()
  const organizerLabels = [...new Set(
    rawCompetitions
      .map((competition) => competition.organizerName?.trim())
      .filter((organizer): organizer is string => Boolean(organizer)),
  )].sort()
  const organizations = [...new Map(
    rawCompetitions
      .filter((competition) => Boolean(competition.organization?.canonicalId))
      .map((competition) => [
        String(competition.organization?.canonicalId),
        {
          canonicalId: String(competition.organization?.canonicalId),
          name: competition.organization?.name ?? null,
        },
      ]),
  ).values()].sort((left, right) =>
    left.canonicalId.localeCompare(right.canonicalId),
  )

  const competitionReport: Record<string, unknown> = {
    schemaVersion: 1,
    title: "GLOBAL COMPETITION DATA READINESS REPORT",
    generatedAt,
    reportDate,
    apiVersion: API_VERSION,
    perspective: "raw",
    readOnly: true,
    sanityMutations: 0,
    definitions: {
      samplePrototypeCompetition: `contentStatus/prototypeStatus is one of: ${NON_PRODUCTION_MARKERS.join(", ")}.`,
      realCompetition: "contentStatus is explicitly published-record; an absent or unknown marker is not assumed real.",
      sourceConfirmedCompetition: "Real record whose canonical source provenance has verificationStatus source-confirmed or official and a public source URL.",
      upcomingCompetition: "status is upcoming.",
      pastCompetition: "status is completed.",
      organizationsRepresented: "Unique canonical organization documents referenced through competition.organization; organizer-name labels are reported separately.",
      publiclyVisible: "Published document with a slug, then either publicStatus=published plus legacy sample/prototype metadata or confirmed/official canonical source provenance with a URL, or a legacy sample/prototype document with publicStatus missing. Draft, archived, and unreviewed real records are excluded. This is route eligibility, not anonymous Content Lake access.",
    },
    counts: {
      currentCompetitions: competitionItems.length,
      samplePrototypeCompetitions: competitionItems.filter((item) => item.classification === "sample/prototype").length,
      realCompetitions: competitionItems.filter((item) => item.classification === "real").length,
      unknownCompetitions: competitionItems.filter((item) => item.classification === "unknown/needs-review").length,
      sourceConfirmedCompetitions: competitionItems.filter((item) => item.sourceConfirmed).length,
      upcomingCompetitions: competitionItems.filter((item) => item.status === "upcoming").length,
      pastCompetitions: competitionItems.filter((item) => item.status === "completed").length,
      futureDatedCompetitions: competitionItems.filter((item) => typeof item.startDate === "string" && item.startDate >= reportDate).length,
      postponedCompetitions: competitionItems.filter((item) => item.status === "postponed").length,
      countriesRepresented: countries.length,
      organizationsRepresented: organizations.length,
      organizerLabelsRepresented: organizerLabels.length,
      publiclyVisibleCompetitions: competitionItems.filter((item) => item.publiclyVisible).length,
    },
    countries,
    organizations,
    organizerLabels,
    competitions: competitionItems,
    blockers: competitionItems.length > 0 && competitionItems.every((item) => item.classification === "sample/prototype")
      ? ["The live competition inventory contains no real, source-confirmed competition records."]
      : [],
  }

  const prelaunchReport: Record<string, unknown> = {
    schemaVersion: 1,
    title: "PRE-LAUNCH SAMPLE CONTENT REPORT",
    generatedAt,
    reportDate,
    apiVersion: API_VERSION,
    perspective: "raw",
    readOnly: true,
    sanityMutations: 0,
    sampleCriteria: {
      fields: ["prototypeStatus", "competition.contentStatus"],
      markers: NON_PRODUCTION_MARKERS,
      note: "Candidates are selected by explicit sample/prototype metadata, never by exclusion or by comparison with Abu.",
    },
    publicVisibilityDefinition: "Eligibility under the current route query for the document type; it does not imply anonymous Content Lake access.",
    counts: {
      sampleAthletes: sampleCounts.athlete,
      sampleCompetitions: sampleCounts.competition,
      sampleVideos: sampleCounts.video,
      sampleStories: sampleCounts.story,
      sampleTeams: sampleCounts.team,
      sampleOrganizations: sampleCounts.organization,
      sampleDocuments: inventory.length,
      publicSampleContentRemaining: inventory.filter((item) => item.publiclyVisible).length,
      inboundReferenceRelationships: inventory.reduce((sum, item) => sum + item.referenceCount, 0),
      inboundReferenceClassifications: referenceClassifications,
    },
    inventory,
    sampleAthleteCleanup: {
      sampleAthletes: sampleCounts.athlete,
      inboundReferenceRelationships: inventory
        .filter((item) => item.type === "athlete")
        .reduce((sum, item) => sum + item.referenceCount, 0),
      safeNow: 0,
      requiresRemediation: sampleCounts.athlete,
      safetyNote: "This inventory does not certify hard-delete eligibility. The separate guarded cleanup report must also verify document variants, provider identities, all reference paths, and deletion protections.",
      actualDeletions: 0,
      hardProtectedAthleteIds: [ABU_ATHLETE_ID],
    },
    videoOriginAudit: {
      missingOrigin: missingOriginVideos.length,
      safelyFixable: safelyFixableVideos.length,
      needsEditorialReview: missingOriginVideos.length - safelyFixableVideos.length,
      inferenceRules: {
        caliCentralOriginal: "ownershipStatus=cali-central-original",
        externalSource: "ownershipStatus=third-party-attributed plus sourcePlatform and originalPostUrl",
        communitySubmission: "not inferable: the current video schema stores no independent submission-evidence field",
      },
      mutations: 0,
      videos: videoOriginItems,
    },
    abuAffected: inventory.some((item) =>
      item.documentId === ABU_ATHLETE_ID ||
      item.references.some((reference) => reference.documentId === ABU_ATHLETE_ID),
    ),
  }

  const replacementQueueReport: Record<string, unknown> = {
    schemaVersion: 1,
    title: "SAMPLE REPLACEMENT QUEUE",
    generatedAt,
    reportDate,
    apiVersion: API_VERSION,
    perspective: "raw",
    readOnly: true,
    sanityMutations: 0,
    definition: "Every currently public sample/prototype record requires a reviewed real replacement or an explicit retirement decision. Site settings are the first migration priority. This queue never certifies deletion.",
    summary: {
      total: replacementQueue.length,
      siteConfigurationBlocked: replacementQueue.filter((item) => item.siteSettingReferences > 0).length,
      referencedBlocked: replacementQueue.filter(
        (item) => item.siteSettingReferences === 0 && item.currentReferences > 0,
      ).length,
      unreferenced: replacementQueue.filter((item) => item.currentReferences === 0).length,
      safeToRemoveNow: 0,
      byType: Object.fromEntries(
        CONTENT_TYPES.map((type) => [
          type,
          replacementQueue.filter((item) => item.type === type).length,
        ]),
      ),
    },
    queue: replacementQueue,
  }

  const publicApprovedRealAthletes = productionState.athletes.publicApprovedReal
  const publicSampleAthletes = productionState.athletes.publicSample
  const publicAthleteTotal = publicApprovedRealAthletes + publicSampleAthletes
  const publicRealCompetitions = competitionItems.filter((item) =>
    item.classification === "real" && item.publiclyVisible
  ).length
  const publicSampleCompetitions = competitionItems.filter((item) =>
    item.classification === "sample/prototype" && item.publiclyVisible
  ).length
  const publicCompetitionTotal = publicRealCompetitions + publicSampleCompetitions
  const remainingFictionalPublicDocuments = inventory
    .filter((item) => item.publiclyVisible)
    .map((item) => ({
      documentId: item.documentId,
      type: item.type,
      marker: item.marker,
      reason: item.recommendedAction,
    }))

  const productionReport: Record<string, unknown> = {
    schemaVersion: 1,
    title: "PRODUCTION DATA READINESS REPORT",
    generatedAt,
    reportDate,
    apiVersion: API_VERSION,
    perspective: "raw",
    readOnly: true,
    sanityMutations: 0,
    manifests,
    manifestSummary: {
      reviewedManifestsFound: manifests.length,
      writeEligibleManifests: manifests.filter((manifest) => manifest.writeEligible).length,
      sourceRightsUnresolvedManifests: manifests.filter(
        (manifest) => manifest.sourceRightsStatus === "SOURCE-RIGHTS-UNRESOLVED",
      ).length,
      invalidManifests: manifests.filter(
        (manifest) => manifest.sourceRightsStatus === "INVALID",
      ).length,
      athleteRecordsAvailable: manifests
        .filter((manifest) => manifest.recordType.includes("athletes"))
        .reduce((sum, manifest) => sum + manifest.recordCount, 0),
      rankingSnapshotsAvailable: manifests.filter(
        (manifest) => manifest.recordType.includes("ranking snapshot"),
      ).length,
      competitionRecordsAvailable: manifests
        .filter((manifest) => manifest.recordType === "competitions")
        .reduce((sum, manifest) => sum + manifest.recordCount, 0),
      organizationRecordsAvailable: manifests
        .filter((manifest) => manifest.recordType === "organizations")
        .reduce((sum, manifest) => sum + manifest.recordCount, 0),
    },
    counts: {
      documents: productionState.documents,
      athletes: productionState.athletes,
      rankings: productionState.rankings,
      competitions: {
        total: competitionItems.length,
        real: competitionItems.filter((item) => item.classification === "real").length,
        sample: competitionItems.filter((item) => item.classification === "sample/prototype").length,
        upcoming: competitionItems.filter((item) => item.status === "upcoming").length,
        past: competitionItems.filter((item) => item.status === "completed").length,
        countries: countries.length,
        organizations: organizations.length,
        sourceConfirmed: competitionItems.filter((item) => item.sourceConfirmed).length,
        publicReal: publicRealCompetitions,
        publicSample: publicSampleCompetitions,
      },
      organizations: productionState.organizations,
      stories: productionState.stories,
      videos: productionState.videos,
    },
    abuSafety: productionState.abu,
    publicDirectory: {
      approvedRealAthletes: publicApprovedRealAthletes,
      sampleAthletes: publicSampleAthletes,
      athleteTotal: publicAthleteTotal,
      athleteRealPercent: percent(publicApprovedRealAthletes, publicAthleteTotal),
      realCompetitions: publicRealCompetitions,
      sampleCompetitions: publicSampleCompetitions,
      competitionTotal: publicCompetitionTotal,
      competitionRealPercent: percent(publicRealCompetitions, publicCompetitionTotal),
      remainingFictionalPublicDocuments: remainingFictionalPublicDocuments.length,
    },
    sampleMigration: {
      sampleAthletesBefore: sampleCounts.athlete,
      sampleAthletesAfter: sampleCounts.athlete,
      sampleCompetitionsBefore: sampleCounts.competition,
      sampleCompetitionsAfter: sampleCounts.competition,
      sampleVideosBefore: sampleCounts.video,
      sampleVideosAfter: sampleCounts.video,
      sampleStoriesBefore: sampleCounts.story,
      sampleStoriesAfter: sampleCounts.story,
      siteSettingReferencesMigrated: 0,
      brokenReferencesIntroduced: 0,
      actualSampleDocumentsDeleted: 0,
      note: "No production write or cleanup mutation was eligible. The report does not claim an exhaustive traversal of arbitrary weak references; it confirms that this run introduced none and leaves the previously audited sample graph unchanged.",
    },
    remainingFictionalPublicDocuments,
    writeEligibility: {
      eligibleBatches: manifests
        .filter((manifest) => manifest.writeEligible)
        .map((manifest) => manifest.path),
      unresolvedBatches: manifests
        .filter((manifest) => !manifest.writeEligible)
        .map((manifest) => ({path: manifest.path, reason: manifest.reason})),
    },
  }

  await mkdir(reportDirectory, {recursive: true})
  const paths = {
    competitionJson: path.join(reportDirectory, COMPETITION_REPORT_JSON),
    competitionMarkdown: path.join(reportDirectory, COMPETITION_REPORT_MARKDOWN),
    sampleJson: path.join(reportDirectory, SAMPLE_REPORT_JSON),
    sampleMarkdown: path.join(reportDirectory, SAMPLE_REPORT_MARKDOWN),
    productionJson: path.join(reportDirectory, PRODUCTION_REPORT_JSON),
    productionMarkdown: path.join(reportDirectory, PRODUCTION_REPORT_MARKDOWN),
    replacementQueueJson: path.join(reportDirectory, REPLACEMENT_QUEUE_JSON),
    replacementQueueMarkdown: path.join(reportDirectory, REPLACEMENT_QUEUE_MARKDOWN),
  }
  await Promise.all([
    writeJson(paths.competitionJson, competitionReport),
    writeFile(paths.competitionMarkdown, competitionReportMarkdown(competitionReport), "utf8"),
    writeJson(paths.sampleJson, prelaunchReport),
    writeFile(paths.sampleMarkdown, sampleReportMarkdown(prelaunchReport), "utf8"),
    writeJson(paths.productionJson, productionReport),
    writeFile(paths.productionMarkdown, productionReportMarkdown(productionReport), "utf8"),
    writeJson(paths.replacementQueueJson, replacementQueueReport),
    writeFile(paths.replacementQueueMarkdown, replacementQueueMarkdown(replacementQueueReport), "utf8"),
  ])

  const competitionCounts = competitionReport.counts as Record<string, number>
  const sampleReportCounts = prelaunchReport.counts as Record<string, number>
  console.log("Production readiness reports generated (read-only; Sanity mutations: 0).")
  console.log(`Competitions: ${competitionCounts.currentCompetitions} current / ${competitionCounts.realCompetitions} real / ${competitionCounts.samplePrototypeCompetitions} sample-prototype / ${competitionCounts.sourceConfirmedCompetitions} source-confirmed.`)
  console.log(`Public sample content remaining: ${sampleReportCounts.publicSampleContentRemaining}.`)
  console.log(`Missing-origin videos: ${missingOriginVideos.length}; safely inferable: ${safelyFixableVideos.length}; editorial review: ${missingOriginVideos.length - safelyFixableVideos.length}.`)
  console.log(`Production manifests: ${manifests.length} reviewed / ${manifests.filter((manifest) => manifest.writeEligible).length} write-eligible.`)
  console.log(`Sample replacement queue: ${replacementQueue.length} blocked / 0 safe to remove.`)
  for (const filePath of Object.values(paths)) {
    console.log(path.relative(workspace, filePath))
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
