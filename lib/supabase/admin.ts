import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseServiceConfiguration } from "@/lib/supabase/config";

export function createSupabaseAdminClient() {
  const configuration = requireSupabaseServiceConfiguration();
  return createClient(configuration.url, configuration.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
