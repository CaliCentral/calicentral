import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { safeLog } from "@/lib/observability/logger";
import { absoluteSiteUrl } from "@/lib/site/config";

export const dynamic = "force-dynamic";

const draftModeHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET() {
  try {
    (await draftMode()).disable();

    return NextResponse.redirect(absoluteSiteUrl("/"), {
      status: 307,
      headers: draftModeHeaders,
    });
  } catch {
    safeLog({
      severity: "error",
      event: "draft_mode.disable_failed",
      routeCategory: "draft_mode",
      errorCategory: "draft_mode_error",
    });

    return Response.json(
      {
        error: "Sanity Draft Mode could not be disabled.",
      },
      {
        status: 500,
        headers: draftModeHeaders,
      },
    );
  }
}
