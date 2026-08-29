import { NextResponse, type NextRequest } from "next/server";

import { safeAuthReturnPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured, useSupabaseAuth } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!useSupabaseAuth || !isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/auth/error?code=Configuration", origin));
  }

  const code = request.nextUrl.searchParams.get("code");
  const next = safeAuthReturnPath(request.nextUrl.searchParams.get("next") ?? "/account");
  if (!code) return NextResponse.redirect(new URL("/auth/error?code=OAuthCallback", origin));

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/auth/error?code=OAuthCallback" : next, origin));
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
