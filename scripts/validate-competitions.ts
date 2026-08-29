import assert from "node:assert/strict";

import { normalizeAdminCompetitionList } from "@/lib/content/admin-competition-normalize";
import {
  ADMIN_COMPETITIONS_QUERY,
  COMPETITION_PAGE_QUERY,
  COMPETITION_SLUGS_QUERY,
  COMPETITIONS_QUERY,
  HOMEPAGE_QUERY,
  PUBLIC_ATHLETE_PAGE_QUERY,
  RANKING_CATEGORIES_QUERY,
} from "@/sanity/queries";

type VisibilityFixture = {
  readonly publicStatus?: "draft" | "published" | "archived";
  readonly contentStatus?: string;
  readonly prototypeStatus?: string;
  readonly source?: {
    readonly url?: string;
    readonly verificationStatus?: string;
  };
};

function isPublicCompetition(fixture: VisibilityFixture): boolean {
  const marker = fixture.contentStatus ?? fixture.prototypeStatus;
  const sample = ["fictional-prototype", "sample-record"].includes(
    marker ?? "",
  );
  const confirmedRealSource =
    ["source-confirmed", "official"].includes(
      fixture.source?.verificationStatus ?? "",
    ) && Boolean(fixture.source?.url);

  return (
    (fixture.publicStatus === "published" &&
      (sample || confirmedRealSource)) ||
    (fixture.publicStatus === undefined && sample)
  );
}

const publicQueries = [
  ["directory", COMPETITIONS_QUERY],
  ["slug index", COMPETITION_SLUGS_QUERY],
  ["detail", COMPETITION_PAGE_QUERY],
] as const;
const legacyGate =
  '!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]';

for (const [label, query] of publicQueries) {
  assert.ok(
    query.includes('publicStatus == "published"'),
    `${label} query must require explicit publication for new records`,
  );
  assert.ok(
    query.includes(legacyGate),
    `${label} query must intentionally preserve existing legacy samples`,
  );
  assert.ok(
    query.includes(
      'source.verificationStatus in ["source-confirmed", "official"]',
    ),
    `${label} query must require confirmed provenance for real records`,
  );
}

assert.equal(
  isPublicCompetition({
    contentStatus: "fictional-prototype",
    prototypeStatus: "sample-record",
  }),
  true,
  "an existing legacy sample remains intentionally public",
);
assert.equal(
  isPublicCompetition({
    publicStatus: "draft",
    contentStatus: "published-record",
    source: {
      url: "https://provider.invalid/competitions/reviewed-event",
      verificationStatus: "source-confirmed",
    },
  }),
  false,
  "an imported internal draft stays private even with confirmed provenance",
);
assert.equal(
  isPublicCompetition({
    publicStatus: "published",
    contentStatus: "published-record",
    source: {
      url: "https://provider.invalid/competitions/reviewed-event",
      verificationStatus: "source-confirmed",
    },
  }),
  true,
  "a reviewed real record needs explicit publication and confirmed provenance",
);
assert.equal(
  isPublicCompetition({
    publicStatus: "published",
    contentStatus: "published-record",
    source: {verificationStatus: "unverified"},
  }),
  false,
  "publication alone cannot expose an unverified real competition",
);

assert.ok(
  ADMIN_COMPETITIONS_QUERY.includes("[$offset...$end]"),
  "the admin competition query must remain bounded and paginated",
);
assert.equal(
  (
    ADMIN_COMPETITIONS_QUERY.match(
      /\$publicStatus == "legacy-public"\s*&&\s*!defined\(publicStatus\)\s*&&\s*coalesce\(contentStatus, prototypeStatus\) in \["fictional-prototype", "sample-record"\]/g,
    ) ?? []
  ).length,
  2,
  "legacy-public filtering must use the same legacy sample predicate for totals and rows",
);

for (const [label, query, forbiddenProjection] of [
  ["homepage ranking sources", HOMEPAGE_QUERY, "sources[]{"],
  ["ranking category sources", RANKING_CATEGORIES_QUERY, "sources[]{"],
  ["public athlete history", PUBLIC_ATHLETE_PAGE_QUERY, "competitionHistory[]{"],
] as const) {
  assert.equal(
    query.includes(forbiddenProjection),
    false,
    `${label} must not dereference competitions without a visibility filter`,
  );
  assert.ok(
    query.includes('competition->publicStatus == "published"'),
    `${label} must apply the nested competition publication gate`,
  );
}
for (const privateField of [
  "privateReviewNotes",
  "privateVerificationNotes",
  "privateEvidenceUrls",
  "verifiedBy",
]) {
  assert.equal(
    ADMIN_COMPETITIONS_QUERY.includes(privateField),
    false,
    `the admin competition projection must omit ${privateField}`,
  );
}

const normalized = normalizeAdminCompetitionList({
  counts: {total: 1},
  total: 1,
  items: [
    {
      canonicalId: "competition.fixture.reviewed-event",
      name: "Reviewed event",
      publicStatus: "draft",
      contentStatus: "published-record",
      disciplines: [
        "streetlifting",
        "weighted-calisthenics",
        "skills",
      ],
      privateReviewNotes: "Never expose this note.",
      source: {
        title: "Fixture source",
        url: "https://provider.invalid/competitions/reviewed-event",
        verificationStatus: "source-confirmed",
        privateReviewNotes: "Never expose this source note.",
      },
    },
  ],
});
assert.deepEqual(normalized.items[0]?.disciplines, [
  "streetlifting",
  "weighted-calisthenics",
  "skills",
]);
assert.equal(
  JSON.stringify(normalized).includes("Never expose"),
  false,
  "admin normalization must not retain unprojected private notes",
);

console.log("Competition visibility/admin validation passed.\n");
