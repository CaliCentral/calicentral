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

  return status !== "completed" && resultsStatus === "sample-results"
    ? "Only completed competitions can use the sample-results status."
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

  return validateUniqueNumbers(results, "placement", "Placements")
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
