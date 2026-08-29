import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "frame-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https://cdn.sanity.io",
  "connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io wss://*.api.sanity.io",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const baselineSecurityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
];

const privateResponseHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store, max-age=0, must-revalidate",
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];
const isProductionSiteStage =
  process.env.SITE_STAGE?.trim().toLocaleLowerCase() === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler: true,
  // OpenNext performs the final Worker bundle. Keeping Zod external to each
  // Turbopack route chunk lets that final bundle include one shared copy
  // instead of repeating the same validation runtime across route groups.
  serverExternalPackages: ["jose", "zod"],
  images: {
    loader: "custom",
    loaderFile: "./sanity-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    const hstsHeaders = isProductionSiteStage
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ]
      : [];

    return [
      {
        source: "/:path*",
        headers: [...baselineSecurityHeaders, ...hstsHeaders],
      },
      {
        source: "/account/:path*",
        headers: privateResponseHeaders,
      },
      {
        source: "/admin/:path*",
        headers: privateResponseHeaders,
      },
      {
        source: "/studio/:path*",
        headers: privateResponseHeaders,
      },
      {
        source: "/sign-in",
        headers: privateResponseHeaders,
      },
      {
        source: "/auth/:path*",
        headers: privateResponseHeaders,
      },
      {
        source: "/api/:path*",
        headers: privateResponseHeaders,
      },
      {
        source: "/api/draft-mode/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
    ];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
