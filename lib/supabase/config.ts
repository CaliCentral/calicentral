import "server-only";

import { isTrustedAuthOriginConfigured } from "@/lib/site/config";

const value = (name: string) => process.env[name]?.trim() || null;

export const supabaseConfiguration = Object.freeze({
  url: value("NEXT_PUBLIC_SUPABASE_URL"),
  publishableKey: value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  serviceRoleKey: value("SUPABASE_SERVICE_ROLE_KEY"),
});

export const isSupabaseConfigured = Boolean(
  supabaseConfiguration.url && supabaseConfiguration.publishableKey,
);

export const isSupabaseServiceConfigured = Boolean(
  isSupabaseConfigured && supabaseConfiguration.serviceRoleKey,
);

export const useSupabaseAuth =
  process.env.AUTH_MIGRATION_PROVIDER?.trim().toLowerCase() === "supabase";

/**
 * Supabase OAuth needs the public client configuration and an explicit,
 * trusted application origin for its callback. Auth.js credentials are not
 * part of this readiness boundary.
 */
export const isSupabaseAuthConfigured =
  useSupabaseAuth && isSupabaseConfigured && isTrustedAuthOriginConfigured;

export function requireSupabasePublicConfiguration() {
  if (!supabaseConfiguration.url || !supabaseConfiguration.publishableKey) {
    throw new Error("Supabase server access is not configured.");
  }
  return {
    url: supabaseConfiguration.url,
    publishableKey: supabaseConfiguration.publishableKey,
  };
}

export function requireSupabaseServiceConfiguration() {
  const publicConfiguration = requireSupabasePublicConfiguration();
  if (!supabaseConfiguration.serviceRoleKey) {
    throw new Error("Supabase service access is not configured.");
  }
  return { ...publicConfiguration, serviceRoleKey: supabaseConfiguration.serviceRoleKey };
}
