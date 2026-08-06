export const PORTAL_ROLES = ["contributor", "editor", "admin"] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

export const ACCESS_STATUSES = [
  "active",
  "pending",
  "suspended",
  "archived",
] as const;

export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const AUTH_PROVIDER_IDS = ["google", "github"] as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[number];

export type AuthProviderDescriptor = {
  id: AuthProviderId;
  label: string;
};

/**
 * Trusted OAuth identity material used only in server modules. Provider account
 * IDs remain in the encrypted Auth.js JWT and are not copied into the public
 * session object.
 */
export type AuthIdentity = {
  provider: AuthProviderId;
  providerAccountId: string;
  email: string;
  normalizedEmail: string;
  name: string | null;
  image: string | null;
};

/**
 * The deliberately small user shape returned by server authorization helpers.
 * `id` is an opaque contributor-profile identifier and must not be rendered as
 * user-facing account metadata.
 */
export type PortalUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: PortalRole;
  accessStatus: AccessStatus;
  authProvider: AuthProviderId;
  profileConfigured: boolean;
};

export function isPortalRole(value: unknown): value is PortalRole {
  return (
    typeof value === "string" &&
    (PORTAL_ROLES as readonly string[]).includes(value)
  );
}

export function isAccessStatus(value: unknown): value is AccessStatus {
  return (
    typeof value === "string" &&
    (ACCESS_STATUSES as readonly string[]).includes(value)
  );
}

export function isAuthProviderId(value: unknown): value is AuthProviderId {
  return (
    typeof value === "string" &&
    (AUTH_PROVIDER_IDS as readonly string[]).includes(value)
  );
}
