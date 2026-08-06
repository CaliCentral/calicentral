import { readFileSync } from "node:fs";

import {
  formatPlatformMetric,
  hasCompleteMediaAttribution,
  safeMediaSourceUrl,
} from "@/lib/media/provenance";
import { mediaPitchDetailsSchema } from "@/lib/operations/validation";

let assertionCount = 0;

function assert(condition: unknown, message: string): asserts condition {
  assertionCount += 1;

  if (!condition) {
    throw new Error(message);
  }
}

assert(
  safeMediaSourceUrl("https://example.com/post") ===
    "https://example.com/post",
  "A valid media source URL was rejected.",
);

for (const unsafeUrl of [
  "javascript:alert(1)",
  "data:text/plain,unsafe",
  "https://user:password@example.com/private",
]) {
  assert(
    safeMediaSourceUrl(unsafeUrl) === undefined,
    `An unsafe media source URL was accepted: ${unsafeUrl}`,
  );
}

assert(
  !hasCompleteMediaAttribution({
    platform: "Instagram",
    ownershipStatus: "third-party-attributed",
  }),
  "Third-party media without an original URL was treated as fully attributed.",
);
assert(
  hasCompleteMediaAttribution({
    platform: "Instagram",
    ownershipStatus: "third-party-attributed",
    originalPostUrl: "https://www.instagram.com/example-post",
  }),
  "A complete third-party attribution was rejected.",
);
assert(
  hasCompleteMediaAttribution({
    platform: "Cali Central",
    ownershipStatus: "cali-central-original",
  }),
  "A Cali Central original was not recognized as attributed.",
);

const mediaPitch = {
  proposedTitle: "A source-aware media submission",
  series: "",
  format: "Short clip",
  subject: "An athlete training session",
  location: "",
  visualApproach:
    "A concise visual record with explicit ownership and source context.",
  estimatedDuration: "",
  sourcePlatform: "Instagram" as const,
  sourceAccount: "example-athlete",
  originalPostUrl: "",
  mediaPermissionStatus: "public-reference-only" as const,
  publicReferenceLinks: [],
};

assert(
  !mediaPitchDetailsSchema.safeParse(mediaPitch).success,
  "A public-reference media submission omitted its original post URL.",
);
assert(
  mediaPitchDetailsSchema.safeParse({
    ...mediaPitch,
    originalPostUrl: "https://www.instagram.com/example-post",
  }).success,
  "A source-complete moderated media submission was rejected.",
);

const metricLabels = [
  formatPlatformMetric({
    platform: "TikTok",
    label: "Views",
    value: 1_200,
  }),
  formatPlatformMetric({
    platform: "YouTube",
    label: "Views",
    value: 280,
  }),
];

assert(
  metricLabels.length === 2 &&
    metricLabels[0]?.includes("TikTok") &&
    metricLabels[1]?.includes("YouTube"),
  "Platform metrics lost their separate source labels.",
);

const queries = readFileSync(
  new URL("../sanity/queries.ts", import.meta.url),
  "utf8",
);
assert(
  queries.includes(
    "platformMetrics[]{platform, label, value, observedAt, sourceUrl}",
  ),
  "Public video queries omit platform-specific metric provenance.",
);

for (const route of [
  "../app/(site)/videos/page.tsx",
  "../app/(site)/videos/archive/page.tsx",
]) {
  const source = readFileSync(new URL(route, import.meta.url), "utf8");
  assert(source.length > 0, `Required media route is missing: ${route}`);
}

console.log(`Media integrity checks passed (${assertionCount} assertions).`);
