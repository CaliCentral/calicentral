import { handlers, isAuthConfigured } from "@/auth";
import type { NextRequest } from "next/server";

const authenticationUnavailable = async () =>
  Response.json(
    {
      error:
        "Contributor authentication is not configured for this environment.",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );

const emptySession = async () =>
  Response.json(null, {
    status: 200,
  });

function isSessionLookup(request: NextRequest) {
  return request.nextUrl.pathname === "/api/auth/session";
}

async function noIndex(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: NextRequest) {
  return noIndex(
    isAuthConfigured
      ? await handlers.GET(request)
      : isSessionLookup(request)
        ? await emptySession()
        : await authenticationUnavailable(),
  );
}

export async function POST(request: NextRequest) {
  return noIndex(
    isAuthConfigured
      ? await handlers.POST(request)
      : await authenticationUnavailable(),
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
