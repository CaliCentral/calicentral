import "server-only";

import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { isAuthConfigured } from "@/lib/auth/config";
import { safeAuthReturnPath } from "@/lib/auth/redirects";
import type {
  AccessStatus,
  PortalRole,
  PortalUser,
} from "@/lib/auth/types";
import {
  isAccessStatus,
  isAuthProviderId,
  isPortalRole,
} from "@/lib/auth/types";
import { safeLog } from "@/lib/observability/logger";
import { getSupabasePortalUser } from "@/lib/auth/supabase-session";
import { isSupabaseConfigured, useSupabaseAuth } from "@/lib/supabase/config";

const ROLE_WEIGHT: Record<PortalRole, number> = {
  contributor: 0,
  editor: 1,
  admin: 2,
};

export function hasRole(
  actualRole: PortalRole,
  requiredRole: PortalRole,
): boolean {
  return ROLE_WEIGHT[actualRole] >= ROLE_WEIGHT[requiredRole];
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isAuthConfigured) {
    return null;
  }

  // Session state is request-bound. Waiting for an incoming request keeps
  // Next's prerender analysis from invoking Auth.js without request context;
  // actual runtime failures still pass through the logged catch below.
  await connection();

  try {
    return await auth();
  } catch {
    safeLog({
      severity: "error",
      event: "auth.session_lookup_failed",
      routeCategory: "auth",
      errorCategory: "auth_error",
    });
    return null;
  }
}

export async function getCurrentUser(): Promise<PortalUser | null> {
  if (useSupabaseAuth) {
    if (!isSupabaseConfigured) return null;
    try {
      return await getSupabasePortalUser();
    } catch {
      safeLog({
        severity: "error",
        event: "auth.session_lookup_failed",
        routeCategory: "auth",
        errorCategory: "auth_error",
      });
      return null;
    }
  }

  const session = await getCurrentSession();
  const user = session?.user;

  if (
    !user ||
    !user.id ||
    !user.email ||
    !isPortalRole(user.role) ||
    !isAccessStatus(user.accessStatus) ||
    !isAuthProviderId(user.authProvider)
  ) {
    return null;
  }

  return {
    id: user.id,
    displayName: user.displayName || user.name || "Contributor",
    email: user.email,
    avatarUrl: user.image ?? null,
    role: user.role,
    accessStatus: user.accessStatus,
    authProvider: user.authProvider,
    profileConfigured: user.profileConfigured,
  };
}

export async function requireAuthenticatedUser(
  returnTo?: string,
): Promise<PortalUser> {
  const user = await getCurrentUser();

  if (!user) {
    const callbackUrl = encodeURIComponent(safeAuthReturnPath(returnTo));
    redirect(`/sign-in?callbackUrl=${callbackUrl}`);
  }

  return user;
}

const accessStatusPath = (status: AccessStatus) =>
  `/account/access?status=${encodeURIComponent(status)}`;

async function requireRole(
  requiredRole: PortalRole,
  returnTo?: string,
): Promise<PortalUser> {
  const user = await requireAuthenticatedUser(returnTo);

  if (user.accessStatus !== "active") {
    redirect(accessStatusPath(user.accessStatus));
  }

  if (!hasRole(user.role, requiredRole)) {
    redirect("/account/access?reason=forbidden");
  }

  return user;
}

export function requireContributor(returnTo?: string) {
  return requireRole("contributor", returnTo);
}

export function requireEditor(returnTo?: string) {
  return requireRole("editor", returnTo);
}

export function requireAdmin(returnTo?: string) {
  return requireRole("admin", returnTo);
}
