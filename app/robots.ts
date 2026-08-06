import type { MetadataRoute } from "next";

import {
  absoluteSiteUrl,
  getSiteOrigin,
  isPublicIndexingEnabled,
  isSiteOriginConfigured,
} from "@/lib/site/config";

const privatePaths = [
  "/account",
  "/admin",
  "/studio",
  "/sign-in",
  "/auth",
  "/api/auth",
  "/api/draft-mode",
  "/api/health",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (!isPublicIndexingEnabled) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      ...(isSiteOriginConfigured
        ? { sitemap: absoluteSiteUrl("/sitemap.xml") }
        : {}),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privatePaths],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: getSiteOrigin(),
  };
}
