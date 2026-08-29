import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicConfiguration } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const configuration = requireSupabasePublicConfiguration();
  const cookieStore = await cookies();
  return createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          for (const value of values) cookieStore.set(value.name, value.value, value.options);
        } catch {
          // Server Components cannot set cookies. A Route Handler/Server Action
          // performs refresh writes; reads still remain valid here.
        }
      },
    },
  });
}
