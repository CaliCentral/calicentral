export const siteStages = [
  "development",
  "preview",
  "prototype",
  "production",
] as const;

export type SiteStage = (typeof siteStages)[number];

const LOCAL_SITE_ORIGIN = "http://localhost:3000";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizedValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

const configuredStageValue = normalizedValue(
  process.env.SITE_STAGE,
)?.toLocaleLowerCase();
const isSiteStageExplicitlyConfigured =
  configuredStageValue !== undefined;
const isConfiguredSiteStageValid =
  configuredStageValue === undefined ||
  siteStages.includes(configuredStageValue as SiteStage);

function parseStage(value: string | undefined): SiteStage {
  const normalized = normalizedValue(value)?.toLocaleLowerCase();

  if (siteStages.includes(normalized as SiteStage)) {
    return normalized as SiteStage;
  }

  return process.env.NODE_ENV === "development"
    ? "development"
    : "prototype";
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

export function parseSiteOrigin(value: string | undefined): string | null {
  const normalized = normalizedValue(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    const hasOnlyOrigin =
      (url.pathname === "/" || url.pathname === "") &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password;
    const hasAllowedProtocol =
      url.protocol === "https:" ||
      (url.protocol === "http:" && isLocalHostname(url.hostname));

    return hasOnlyOrigin && hasAllowedProtocol ? url.origin : null;
  } catch {
    return null;
  }
}

function parseContactEmail(value: string | undefined): string | undefined {
  const normalized = normalizedValue(value)?.toLocaleLowerCase();

  return normalized && EMAIL_PATTERN.test(normalized)
    ? normalized
    : undefined;
}

export const siteStage = parseStage(process.env.SITE_STAGE);
export const isProductionStage = siteStage === "production";

const configuredSiteOrigin = parseSiteOrigin(
  process.env.NEXT_PUBLIC_SITE_URL,
);
const configuredDeploymentOrigin =
  configuredSiteOrigin?.startsWith("https://") &&
  !isLocalHostname(new URL(configuredSiteOrigin).hostname)
    ? configuredSiteOrigin
    : null;

export const isSiteOriginConfigured = configuredSiteOrigin !== null;
export const isTrustedAuthOriginConfigured =
  configuredDeploymentOrigin !== null ||
  (siteStage === "development" && configuredSiteOrigin !== null);
export const isSiteOriginConfigurationReady =
  isConfiguredSiteStageValid &&
  (siteStage === "development" ||
    (isSiteStageExplicitlyConfigured &&
      configuredDeploymentOrigin !== null));
export const isProductionConfigurationReady =
  !isProductionStage || configuredDeploymentOrigin !== null;

const indexingWasApproved =
  normalizedValue(process.env.SITE_INDEXING_ENABLED)?.toLocaleLowerCase() ===
  "true";

export const isPublicIndexingEnabled =
  isProductionStage &&
  indexingWasApproved &&
  isProductionConfigurationReady &&
  isSiteOriginConfigured;

export const publicContactEmail = parseContactEmail(
  process.env.SITE_CONTACT_EMAIL,
);

export function getSiteOrigin(): string {
  if (!isConfiguredSiteStageValid) {
    throw new Error(
      "SITE_STAGE must be development, preview, prototype, or production.",
    );
  }

  if (
    isSiteStageExplicitlyConfigured &&
    siteStage !== "development" &&
    !configuredDeploymentOrigin
  ) {
    throw new Error(
      `A ${siteStage} site origin is required. Set NEXT_PUBLIC_SITE_URL to the canonical public HTTPS origin.`,
    );
  }

  if (configuredSiteOrigin) {
    return configuredSiteOrigin;
  }

  return LOCAL_SITE_ORIGIN;
}

export function isCanonicalSiteOrigin(value: string | undefined): boolean {
  if (!isSiteOriginConfigurationReady) {
    return false;
  }

  const candidate = parseSiteOrigin(value);
  const canonical =
    configuredSiteOrigin ??
    (siteStage === "development" ? LOCAL_SITE_ORIGIN : null);

  return candidate !== null && canonical !== null && candidate === canonical;
}

export function absoluteSiteUrl(pathname = "/"): string {
  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  ) {
    throw new Error("Site URLs must use a same-origin absolute path.");
  }

  const origin = getSiteOrigin();
  const url = new URL(pathname, `${origin}/`);

  if (url.origin !== origin) {
    throw new Error("Site URLs cannot leave the configured canonical origin.");
  }

  return url.toString();
}
