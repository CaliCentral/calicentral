import "server-only";

import type {
  AuthProviderDescriptor,
  AuthProviderId,
  PortalRole,
} from "@/lib/auth/types";
import {
  isCanonicalSiteOrigin,
  isProductionConfigurationReady,
  isProductionStage,
  parseSiteOrigin,
} from "@/lib/site/config";

type OAuthCredentials = {
  id: AuthProviderId;
  clientId: string;
  clientSecret: string;
};

const cleanEnvironmentValue = (value: string | undefined) => {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
};

const readSecret = (value: string | undefined) =>
  value?.trim() ? value : null;

const authSecret = readSecret(process.env.AUTH_SECRET);
const authUrl = cleanEnvironmentValue(process.env.AUTH_URL);
const googleClientId = cleanEnvironmentValue(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = readSecret(process.env.GOOGLE_CLIENT_SECRET);
const githubClientId = cleanEnvironmentValue(process.env.GITHUB_CLIENT_ID);
const githubClientSecret = readSecret(process.env.GITHUB_CLIENT_SECRET);

const googleConfigured = Boolean(googleClientId && googleClientSecret);
const githubConfigured = Boolean(githubClientId && githubClientSecret);
const googlePartiallyConfigured = Boolean(
  (googleClientId || googleClientSecret) && !googleConfigured,
);
const githubPartiallyConfigured = Boolean(
  (githubClientId || githubClientSecret) && !githubConfigured,
);

/**
 * Auth.js recommends a generated secret. Treat shorter values as unavailable
 * rather than initializing a weak JWT encryption key.
 */
const authSecretConfigured = Boolean(authSecret && authSecret.length >= 32);
const authSecretPresent = Boolean(authSecret);
const parsedAuthOrigin = parseSiteOrigin(authUrl ?? undefined);
const authUrlMatchesSiteOrigin = (() => {
  try {
    return isCanonicalSiteOrigin(authUrl ?? undefined);
  } catch {
    return false;
  }
})();
const authUrlUsesSecureProtocol = parsedAuthOrigin?.startsWith("https://")
  ?? false;
const authUrlConfigured =
  parsedAuthOrigin !== null &&
  authUrlMatchesSiteOrigin &&
  isProductionConfigurationReady &&
  (!isProductionStage || authUrlUsesSecureProtocol);
const configuredProviderCount =
  Number(googleConfigured) + Number(githubConfigured);

export const authConfiguration = Object.freeze({
  authSecretPresent,
  authSecretConfigured,
  authUrlConfigured,
  authUrlMatchesSiteOrigin,
  authUrlUsesSecureProtocol,
  googleConfigured,
  googlePartiallyConfigured,
  githubConfigured,
  githubPartiallyConfigured,
  configuredProviderCount,
});

export const isAuthConfigured =
  authSecretConfigured && authUrlConfigured && configuredProviderCount > 0;

const providerDescriptors: AuthProviderDescriptor[] = [];

if (googleConfigured) {
  providerDescriptors.push({ id: "google", label: "Google" });
}

if (githubConfigured) {
  providerDescriptors.push({ id: "github", label: "GitHub" });
}

/**
 * Safe, serializable provider metadata for the server-rendered sign-in page.
 * A provider is omitted unless its complete credential pair, AUTH_SECRET, and
 * canonical AUTH_URL are present.
 */
export const configuredAuthProviders: readonly AuthProviderDescriptor[] =
  Object.freeze(isAuthConfigured ? providerDescriptors : []);

export function getOAuthCredentials(): OAuthCredentials[] {
  const credentials: OAuthCredentials[] = [];

  if (googleClientId && googleClientSecret) {
    credentials.push({
      id: "google",
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    });
  }

  if (githubClientId && githubClientSecret) {
    credentials.push({
      id: "github",
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    });
  }

  return credentials;
}

export function getAuthSecret(): string | undefined {
  return authSecretConfigured ? authSecret ?? undefined : undefined;
}

export const useSecureAuthCookies = authUrlUsesSecureProtocol;

export function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (
    !normalized ||
    normalized.length > 254 ||
    /\s/.test(normalized) ||
    !/^[^@]+@[^@]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

const parseEmailAllowlist = (value: string | undefined) => {
  const emails = new Set<string>();

  for (const candidate of value?.split(",") ?? []) {
    const normalized = normalizeEmail(candidate);

    if (normalized) {
      emails.add(normalized);
    }
  }

  return emails;
};

const bootstrapAdminEmails = parseEmailAllowlist(
  process.env.CALI_CENTRAL_ADMIN_EMAILS,
);
const bootstrapEditorEmails = parseEmailAllowlist(
  process.env.CALI_CENTRAL_EDITOR_EMAILS,
);

export function isBootstrapAdmin(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  return normalized ? bootstrapAdminEmails.has(normalized) : false;
}

export function isBootstrapEditor(email: string | null | undefined) {
  const normalized = normalizeEmail(email);

  return normalized
    ? bootstrapAdminEmails.has(normalized) ||
        bootstrapEditorEmails.has(normalized)
    : false;
}

export function getBootstrapRole(
  email: string | null | undefined,
): PortalRole | null {
  if (isBootstrapAdmin(email)) {
    return "admin";
  }

  if (isBootstrapEditor(email)) {
    return "editor";
  }

  return null;
}
