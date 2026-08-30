import { NextResponse, type NextRequest } from "next/server";

import { safeAuthReturnPath } from "@/lib/auth/redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSiteOrigin,
  isTrustedAuthOriginConfigured,
} from "@/lib/site/config";

export async function GET(request: NextRequest) {
  if (!isTrustedAuthOriginConfigured) {
    return new NextResponse("Account authentication is not configured.", {
      status: 503,
    });
  }

  const origin = getSiteOrigin();
  if (!isSupabaseAuthConfigured) {
    return NextResponse.redirect(new URL("/auth/error?code=Configuration", origin));
  }

  const code = request.nextUrl.searchParams.get("code");
  const next = safeAuthReturnPath(request.nextUrl.searchParams.get("next") ?? "/account");
  if (!code) return NextResponse.redirect(new URL("/auth/error?code=OAuthCallback", origin));

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (!error) {
    // Best-effort, matching the legacy provisioning boundary: the database
    // activates and grants a configured bootstrap role only to the caller's
    // own member identity. If the RPC fails, OAuth still succeeds but no
    // durable role/RLS authority is invented. See bootstrap_activate_self()
    // for the database-enforced identity, suspension, idempotency, and audit
    // safeguards.
    await client.rpc("bootstrap_activate_self");
  }
  return NextResponse.redirect(new URL(error ? "/auth/error?code=OAuthCallback" : next, origin));
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
