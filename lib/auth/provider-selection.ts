import "server-only";

import { isAuthConfigured } from "@/lib/auth/config";
import {
  isSupabaseAuthConfigured,
  useSupabaseAuth,
} from "@/lib/supabase/config";

type AuthProviderSelectionInput = {
  readonly useSupabase: boolean;
  readonly supabaseConfigured: boolean;
  readonly authJsConfigured: boolean;
};

export function resolveAuthProviderSelection({
  useSupabase,
  supabaseConfigured,
  authJsConfigured,
}: AuthProviderSelectionInput) {
  return Object.freeze({
    mode: useSupabase ? ("supabase" as const) : ("authjs" as const),
    configured: useSupabase ? supabaseConfigured : authJsConfigured,
  });
}

export const authProviderSelection = resolveAuthProviderSelection({
  useSupabase: useSupabaseAuth,
  supabaseConfigured: isSupabaseAuthConfigured,
  authJsConfigured: isAuthConfigured,
});
