import {getSiteOrigin} from "../lib/site/config"

const PROJECT_ID_PATTERN = /^[a-z0-9-]+$/
const DATASET_PATTERN = /^[a-z0-9_-]+$/
const API_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const STUDIO_PROJECT_ID_FALLBACK = "not-configured"
const DATASET_FALLBACK = "production"
const API_VERSION_FALLBACK = "2026-07-01"

function normalizeEnv(value: string | undefined): string | undefined {
  const normalized = value?.trim()

  return normalized || undefined
}

function validProjectId(value: string | undefined): value is string {
  return Boolean(value && PROJECT_ID_PATTERN.test(value))
}

function validDataset(value: string | undefined): value is string {
  return Boolean(value && DATASET_PATTERN.test(value))
}

const configuredProjectId = normalizeEnv(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
)
const configuredDataset = normalizeEnv(process.env.NEXT_PUBLIC_SANITY_DATASET)
const configuredApiVersion = normalizeEnv(
  process.env.NEXT_PUBLIC_SANITY_API_VERSION,
)
const configuredSiteOrigin = getSiteOrigin()

/**
 * This is the only flag public data clients should use before making a request.
 * The placeholder project ID exists solely to keep Studio and CLI imports valid.
 */
export const isSanityConfigured =
  validProjectId(configuredProjectId) && validDataset(configuredDataset)

export const projectId = validProjectId(configuredProjectId)
  ? configuredProjectId
  : STUDIO_PROJECT_ID_FALLBACK

export const dataset = validDataset(configuredDataset)
  ? configuredDataset
  : DATASET_FALLBACK

export const apiVersion =
  configuredApiVersion && API_VERSION_PATTERN.test(configuredApiVersion)
    ? configuredApiVersion
    : API_VERSION_FALLBACK

export const studioBasePath = "/studio"

export const siteUrl = configuredSiteOrigin
export const siteOrigin = configuredSiteOrigin

export function hasSanityReadToken(): boolean {
  return (
    typeof window === "undefined" &&
    Boolean(normalizeEnv(process.env.SANITY_API_READ_TOKEN))
  )
}

export function requireSanityConfig(): {
  apiVersion: string
  dataset: string
  projectId: string
} {
  if (!isSanityConfigured) {
    throw new Error(
      "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.",
    )
  }

  return {apiVersion, dataset, projectId}
}
