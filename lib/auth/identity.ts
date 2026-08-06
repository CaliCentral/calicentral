import "server-only";

import {
  getBootstrapRole,
  normalizeEmail,
} from "@/lib/auth/config";
import type {
  AccessStatus,
  AuthIdentity,
  PortalRole,
  PortalUser,
} from "@/lib/auth/types";
import {
  isAccessStatus,
  isAuthProviderId,
  isPortalRole,
} from "@/lib/auth/types";
import {
  createContributorDocumentId,
  ensureContributorProfile,
  getContributorByAuthIdentity,
} from "@/lib/operations/contributors";
import type { ContributorIdentityRecord } from "@/lib/operations/types";
import { safeLog } from "@/lib/observability/logger";

type OAuthAccountIdentity = {
  provider?: string | null;
  providerAccountId?: string | null;
};

type OAuthUserIdentity = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

const ROLE_WEIGHT: Record<PortalRole, number> = {
  contributor: 0,
  editor: 1,
  admin: 2,
};

const cleanText = (value: unknown, maximumLength: number) => {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maximumLength) : null;
};

const cleanAvatarUrl = (value: unknown) => {
  const candidate = cleanText(value, 2_048);

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const opaqueContributorId = (identity: AuthIdentity) =>
  createContributorDocumentId(identity);

const higherRole = (first: PortalRole, second: PortalRole): PortalRole =>
  ROLE_WEIGHT[first] >= ROLE_WEIGHT[second] ? first : second;

export function resolveEffectiveRole(
  storedRole: PortalRole,
  email: string | null | undefined,
) {
  const bootstrapRole = getBootstrapRole(email);
  return bootstrapRole ? higherRole(storedRole, bootstrapRole) : storedRole;
}

export function createAuthIdentity(
  account: OAuthAccountIdentity | null | undefined,
  user: OAuthUserIdentity | null | undefined,
): AuthIdentity | null {
  const provider = account?.provider;
  const providerAccountId = cleanText(account?.providerAccountId, 512);
  const normalizedEmail = normalizeEmail(user?.email);

  if (
    !isAuthProviderId(provider) ||
    !providerAccountId ||
    !normalizedEmail
  ) {
    return null;
  }

  return {
    provider,
    providerAccountId,
    email: normalizedEmail,
    normalizedEmail,
    name: cleanText(user?.name, 160),
    image: cleanAvatarUrl(user?.image),
  };
}

export function createAuthIdentityFromToken(token: {
  authProvider?: unknown;
  providerAccountId?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
}): AuthIdentity | null {
  return createAuthIdentity(
    {
      provider:
        typeof token.authProvider === "string"
          ? token.authProvider
          : undefined,
      providerAccountId:
        typeof token.providerAccountId === "string"
          ? token.providerAccountId
          : undefined,
    },
    {
      email: typeof token.email === "string" ? token.email : undefined,
      name: typeof token.name === "string" ? token.name : undefined,
      image: typeof token.picture === "string" ? token.picture : undefined,
    },
  );
}

const fallbackPortalUser = (identity: AuthIdentity): PortalUser => ({
  id: opaqueContributorId(identity),
  displayName: identity.name ?? "Contributor",
  email: identity.normalizedEmail,
  avatarUrl: identity.image,
  role: resolveEffectiveRole("contributor", identity.normalizedEmail),
  accessStatus: "pending",
  authProvider: identity.provider,
  profileConfigured: false,
});

const getRecordId = (
  record: ContributorIdentityRecord,
  identity: AuthIdentity,
) =>
  cleanText(record.id, 256) ?? opaqueContributorId(identity);

export async function resolvePortalUser(
  identity: AuthIdentity,
): Promise<PortalUser> {
  let profile: ContributorIdentityRecord | null;

  try {
    profile = await getContributorByAuthIdentity(identity);
  } catch {
    safeLog({
      severity: "error",
      event: "auth.profile_lookup_failed",
      routeCategory: "auth",
      errorCategory: "content_read_error",
      provider: identity.provider,
    });
    return fallbackPortalUser(identity);
  }

  if (!profile) {
    return fallbackPortalUser(identity);
  }

  const storedRole: PortalRole = isPortalRole(profile.role)
    ? profile.role
    : "contributor";
  const accessStatus: AccessStatus = isAccessStatus(profile.accessStatus)
    ? profile.accessStatus
    : "pending";

  return {
    id: getRecordId(profile, identity),
    displayName:
      cleanText(profile.displayName, 160) ??
      identity.name ??
      "Contributor",
    email: identity.normalizedEmail,
    avatarUrl: cleanAvatarUrl(profile.avatarUrl) ?? identity.image,
    role: resolveEffectiveRole(storedRole, identity.normalizedEmail),
    accessStatus,
    authProvider: identity.provider,
    profileConfigured: true,
  };
}

/**
 * Provisioning is best-effort by design: OAuth authentication can succeed
 * without a Sanity write token, while the resulting session remains pending
 * and all operational mutations stay unavailable.
 */
export async function provisionContributorProfile(identity: AuthIdentity) {
  try {
    await ensureContributorProfile(
      identity,
      getBootstrapRole(identity.normalizedEmail),
    );
    return true;
  } catch {
    safeLog({
      severity: "error",
      event: "auth.profile_provision_failed",
      routeCategory: "auth",
      errorCategory: "content_write_error",
      provider: identity.provider,
    });
    return false;
  }
}
