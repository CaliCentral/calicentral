import { unstable_rethrow } from "next/navigation";
import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { safeLog } from "@/lib/observability/logger";
import { isSanityConfigured } from "@/sanity/env";
import { requireSanityClient } from "@/sanity/lib/client";

export const dynamic = "force-dynamic";

const draftModeHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const withDraftModeHeaders = (response: Response) => {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(draftModeHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const draftModeUnavailable = () =>
  Response.json(
    {
      error: "Sanity Draft Mode is unavailable.",
    },
    {
      status: 503,
      headers: draftModeHeaders,
    },
  );

export async function GET(request: Request) {
  const token = process.env.SANITY_API_READ_TOKEN?.trim();

  if (!isSanityConfigured || !token) {
    return draftModeUnavailable();
  }

  try {
    const { GET: enableDraftMode } = defineEnableDraftMode({
      client: requireSanityClient().withConfig({
        token,
        useCdn: false,
      }),
    });

    return withDraftModeHeaders(await enableDraftMode(request));
  } catch (error) {
    // next-sanity uses Next's redirect control-flow exception after enabling
    // the cookies. It must reach the framework unchanged.
    unstable_rethrow(error);

    safeLog({
      severity: "error",
      event: "draft_mode.enable_failed",
      routeCategory: "draft_mode",
      errorCategory: "draft_mode_error",
    });

    return Response.json(
      {
        error: "Sanity Draft Mode could not be enabled.",
      },
      {
        status: 500,
        headers: draftModeHeaders,
      },
    );
  }
}
