import { getCurrentUser } from "@/lib/auth";

// The public site header needs to know the current viewer's auth state
// client-side without forcing every page that renders it into dynamic
// (per-request) rendering -- the same tradeoff next-auth/react's own
// /api/auth/session endpoint already makes for the Auth.js path. This is the
// provider-aware equivalent: it dispatches through getCurrentUser(), the
// same resolver every server-rendered page already uses, so the header
// reflects whichever backend AUTH_MIGRATION_PROVIDER actually selects
// instead of only ever knowing about Auth.js.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(
    { user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
