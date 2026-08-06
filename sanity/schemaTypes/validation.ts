import type {ValidationContext} from "sanity"

import {
  isPublicSlug,
  PUBLIC_SLUG_MAX_LENGTH,
} from "../../lib/content/public-slug"

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function referenceAt(value: unknown, fieldName?: string): string | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const possibleReference = fieldName ? value[fieldName] : value

  if (!isRecord(possibleReference)) {
    return undefined
  }

  return typeof possibleReference._ref === "string"
    ? possibleReference._ref.replace(/^drafts\./, "")
    : undefined
}

export function validateSlugLength(value: unknown): true | string {
  if (!isRecord(value) || typeof value.current !== "string") {
    return true
  }

  if (value.current.length > PUBLIC_SLUG_MAX_LENGTH) {
    return `Slugs cannot exceed ${PUBLIC_SLUG_MAX_LENGTH} characters.`
  }

  return isPublicSlug(value.current)
    ? true
    : "Use lowercase letters and numbers separated by single hyphens."
}

export function validateUniqueReferences(
  values: unknown[] | undefined,
  fieldName?: string,
): true | string {
  const references = (values || [])
    .map((value) => referenceAt(value, fieldName))
    .filter((reference): reference is string => Boolean(reference))

  return new Set(references).size === references.length
    ? true
    : "The same referenced document cannot be selected more than once."
}

export function validateUniqueStringFields(
  values: unknown[] | undefined,
  fieldName: string,
  label: string,
): true | string {
  const entries = (values || [])
    .map((value) =>
      isRecord(value) && typeof value[fieldName] === "string"
        ? value[fieldName].trim().toLocaleLowerCase()
        : undefined,
    )
    .filter((entry): entry is string => Boolean(entry))

  return new Set(entries).size === entries.length
    ? true
    : `${label} may appear only once.`
}

export function validateNoSelfReference(
  values: unknown[] | undefined,
  context: ValidationContext,
): true | string {
  const documentId =
    typeof context.document?._id === "string"
      ? context.document._id.replace(/^drafts\./, "")
      : undefined

  if (!documentId) {
    return true
  }

  return (values || []).some(
    (value) => referenceAt(value) === documentId,
  )
    ? "A document cannot reference itself."
    : true
}

export function validateUniqueNumbers(
  values: unknown[] | undefined,
  fieldName: string,
  label: string,
): true | string {
  const numbers = (values || [])
    .map((value) =>
      isRecord(value) && typeof value[fieldName] === "number"
        ? value[fieldName]
        : undefined,
    )
    .filter((number): number is number => number !== undefined)

  return new Set(numbers).size === numbers.length
    ? true
    : `${label} must be unique within this document.`
}

export function validateImageAlt(
  alt: string | undefined,
  context: ValidationContext,
): true | string {
  const decorative =
    isRecord(context.parent) && context.parent.decorative === true

  if (decorative && alt?.trim()) {
    return "Decorative images must use an empty alt description."
  }

  if (!decorative && !alt?.trim()) {
    return "Describe the image, or mark it as decorative."
  }

  return true
}

export function validateCompetitionEndDate(
  endDate: string | undefined,
  context: ValidationContext,
): true | string {
  const startDate =
    isRecord(context.document) &&
    typeof context.document.startDate === "string"
      ? context.document.startDate
      : undefined

  if (!startDate || !endDate) {
    return true
  }

  return endDate >= startDate
    ? true
    : "The end date cannot be before the start date."
}

export function validateCompetitionResultsStatus(
  resultsStatus: string | undefined,
  context: ValidationContext,
): true | string {
  const status =
    isRecord(context.document) && typeof context.document.status === "string"
      ? context.document.status
      : undefined

  return status !== "completed" &&
    (resultsStatus === "sample-results" ||
      resultsStatus === "verified-results")
    ? "Only completed competitions can publish sample or verified results."
    : true
}

export function validateCompetitionResults(
  results: unknown[] | undefined,
  context: ValidationContext,
): true | string {
  const status =
    isRecord(context.document) && typeof context.document.status === "string"
      ? context.document.status
      : undefined

  if (results?.length && status !== "completed") {
    return "Result entries are only allowed for completed competitions."
  }

  const resultsStatus =
    isRecord(context.document) &&
    typeof context.document.resultsStatus === "string"
      ? context.document.resultsStatus
      : undefined

  if (resultsStatus === "verified-results") {
    const invalidVerifiedResult = (results || []).some((result) => {
      if (!isRecord(result)) {
        return true
      }

      return (
        result.verificationStatus !== "verified" ||
        typeof result.sourceType !== "string" ||
        !result.sourceType.trim() ||
        typeof result.sourceName !== "string" ||
        !result.sourceName.trim() ||
        typeof result.sourceUrl !== "string" ||
        !/^https?:\/\//i.test(result.sourceUrl)
      )
    })

    if (invalidVerifiedResult) {
      return "Every verified result requires verified status, a source type, a public source name, and an HTTP(S) source URL."
    }
  }

  const fieldPlacements = (results || [])
    .filter(isRecord)
    .map((result) => {
      const category =
        typeof result.category === "string"
          ? result.category.trim().toLocaleLowerCase()
          : ""
      const division =
        typeof result.division === "string"
          ? result.division.trim().toLocaleLowerCase()
          : ""
      const placement =
        typeof result.placement === "number" ? result.placement : ""

      return `${category}|${division}|${placement}`
    })

  return new Set(fieldPlacements).size === fieldPlacements.length
    ? true
    : "Placements must be unique within the same category and division."
}

export function validateResultVerificationStatus(
  verificationStatus: string | undefined,
  context: ValidationContext,
): true | string {
  if (verificationStatus !== "verified") {
    return true
  }

  const parent = isRecord(context.parent) ? context.parent : undefined
  const hasSourceName =
    typeof parent?.sourceName === "string" && Boolean(parent.sourceName.trim())
  const hasSourceUrl =
    typeof parent?.sourceUrl === "string" &&
    /^https?:\/\//i.test(parent.sourceUrl)
  const hasSourceType =
    typeof parent?.sourceType === "string" && Boolean(parent.sourceType.trim())

  return hasSourceName && hasSourceUrl && hasSourceType
    ? true
    : "Verified results require a source type, public source name, and HTTP(S) source URL."
}

export function validateAffiliateAction(
  affiliate: boolean | undefined,
  context: ValidationContext,
): true | string {
  if (!affiliate) {
    return true
  }

  const parent = isRecord(context.parent) ? context.parent : undefined
  const hasPartner =
    typeof parent?.partnerName === "string" && Boolean(parent.partnerName.trim())
  const hasDisclosure =
    typeof parent?.disclosure === "string" && Boolean(parent.disclosure.trim())

  return hasPartner && hasDisclosure
    ? true
    : "Affiliate actions require both a partner name and a public disclosure."
}

export function validateStandingPublicationStatus(
  status: string | undefined,
  context: ValidationContext,
): true | string {
  if (status !== "published") {
    return true
  }

  const document = isRecord(context.document) ? context.document : undefined
  const entries = Array.isArray(document?.entries) ? document.entries : []

  if (document?.scope !== "competition") {
    return "Only competition standings can currently be published."
  }

  if (document?.methodologyStatus !== "approved") {
    return "Approve the methodology before publishing standings."
  }

  if (typeof document?.seasonLabel !== "string" || !document.seasonLabel.trim()) {
    return "Published standings require a season label."
  }

  if (entries.length === 0) {
    return "Published standings require at least one sourced entry."
  }

  const hasUnsupportedEntry = entries.some((entry) => {
    if (!isRecord(entry) || !Array.isArray(entry.sources) || entry.sources.length === 0) {
      return true
    }

    return entry.sources.some(
      (source) =>
        !isRecord(source) ||
        !isRecord(source.competition) ||
        typeof source.competition._ref !== "string" ||
        !source.competition._ref.trim() ||
        source.verificationStatus !== "verified" ||
        typeof source.resultKey !== "string" ||
        !source.resultKey.trim() ||
        typeof source.sourceName !== "string" ||
        !source.sourceName.trim() ||
        typeof source.sourceUrl !== "string" ||
        !/^https?:\/\//i.test(source.sourceUrl),
    )
  })

  return hasUnsupportedEntry
    ? "Every published standing entry requires at least one verified result source."
    : true
}

export function validateTimestampAgainstDuration(
  timestamp: number | undefined,
  context: ValidationContext,
): true | string {
  const documentDuration =
    isRecord(context.document) &&
    typeof context.document.durationSeconds === "number"
      ? context.document.durationSeconds
      : undefined

  if (
    timestamp === undefined ||
    documentDuration === undefined ||
    timestamp <= documentDuration
  ) {
    return true
  }

  return "Timestamp cannot exceed the video's duration."
}

export function validateMovementAmount(
  amount: number | undefined,
  context: ValidationContext,
): true | string {
  const direction =
    isRecord(context.parent) && typeof context.parent.movementDirection === "string"
      ? context.parent.movementDirection
      : undefined

  if ((direction === "hold" || direction === "new") && amount && amount !== 0) {
    return "Hold and new entries must have a movement amount of 0."
  }

  if ((direction === "up" || direction === "down") && !amount) {
    return "Up and down entries require a positive movement amount."
  }

  return true
}
