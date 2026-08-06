import { isAuthConfigured } from "@/lib/auth/config";
import {
  isProductionConfigurationReady,
  isProductionStage,
  isSiteOriginConfigurationReady,
  siteStage,
} from "@/lib/site/config";
import {
  hasSanityReadToken,
  isSanityConfigured,
} from "@/sanity/env";
import { isSanityMutationConfigured } from "@/sanity/lib/write-client";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET() {
  const productionReady =
    isProductionConfigurationReady &&
    isAuthConfigured &&
    isSanityConfigured &&
    hasSanityReadToken() &&
    isSanityMutationConfigured();
  const ready = isProductionStage
    ? productionReady
    : isSiteOriginConfigurationReady;

  return Response.json(
    {
      service: "cali-central",
      status: ready ? "ready" : "degraded",
      stage: siteStage,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: responseHeaders,
    },
  );
}
