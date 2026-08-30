import "server-only";

export {
  authConfiguration,
  configuredAuthProviders,
  getBootstrapRole,
  isAuthConfigured,
  isBootstrapAdmin,
  isBootstrapEditor,
  normalizeEmail,
} from "@/lib/auth/config";
export { resolveEffectiveRole } from "@/lib/auth/identity";
export {
  getCurrentSession,
  getCurrentUser,
  hasRole,
  requireAdmin,
  requireAuthenticatedUser,
  requireContributor,
  requireEditor,
  signOutCurrentSession,
} from "@/lib/auth/session";
export {
  ACCESS_STATUSES,
  AUTH_PROVIDER_IDS,
  PORTAL_ROLES,
  isAccessStatus,
  isAuthProviderId,
  isPortalRole,
} from "@/lib/auth/types";
export type {
  AccessStatus,
  AuthIdentity,
  AuthProviderDescriptor,
  AuthProviderId,
  PortalRole,
  PortalUser,
} from "@/lib/auth/types";
