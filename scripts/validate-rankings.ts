import assert from "node:assert/strict";

import {
  normalizeAthleteRankingSnapshots,
  normalizeExternalAthleteIdentities,
} from "@/lib/content/ranking-source-normalize";
import { normalizeAdminAthleteRankingSnapshots } from "@/lib/content/admin-ranking-normalize";
import {
  athleteRankingFilterOptions,
  filterAthleteRankingSnapshots,
  sanitizeAthleteRankingFilters,
} from "@/lib/rankings/filters";
import {
  ADMIN_ATHLETE_DETAIL_QUERY,
  ADMIN_ATHLETE_DIRECTORY_QUERY,
  ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
  ADMIN_RANKING_OVERVIEW_QUERY,
  ADMIN_EXTERNAL_ATHLETE_IDENTITIES_QUERY,
  ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY,
  ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY,
  ATHLETE_RANKING_SNAPSHOTS_QUERY,
  COMPETITION_PAGE_QUERY,
  COMPETITIONS_QUERY,
  HOMEPAGE_QUERY,
  PUBLIC_ATHLETE_PAGE_QUERY,
  RANKING_CATEGORIES_QUERY,
  STORY_PAGE_QUERY,
  TEAM_PAGE_QUERY,
  TEAMS_QUERY,
  VIDEO_PAGE_QUERY,
  VIDEOS_PAGE_QUERY,
} from "@/sanity/queries";

const canonicalAthlete = {
  canonicalId: "athlete.fictional.mira-santos",
  slug: "mira-santos",
  name: "Mira Santos",
};

function provider(
  canonicalId: string,
  slug: string,
  name: string,
  status: "active" | "inactive" | "under-review" = "active",
) {
  return {
    canonicalId,
    slug,
    name,
    description: "Fictional provider fixture for offline validation.",
    status,
    disciplines: ["Streetlifting"],
    geographicScope: "Global",
    integrationMethod: "manual",
    attributionRequirement: "Attribute the named provider and source URL.",
  };
}

function snapshotFixture({
  id,
  systemSlug,
  providerRecord,
  sourceUrl,
  weightClass,
}: {
  readonly id: string;
  readonly systemSlug: string;
  readonly providerRecord: ReturnType<typeof provider>;
  readonly sourceUrl: string;
  readonly weightClass: string;
}) {
  return {
    canonicalId: id,
    systemName: `${providerRecord.name} fictional strength table`,
    systemSlug,
    rankingKind: "relative-strength",
    discipline: "Streetlifting",
    category: "Weighted pull-up",
    weightClass,
    geographicScope: "Global",
    season: "Fictional 2026",
    rankingDate: "2026-07-01",
    checkedAt: "2026-07-02T12:00:00.000Z",
    provider: providerRecord,
    entries: [
      {
        canonicalId: `${id}.entry-1`,
        athlete: canonicalAthlete,
        sourceDisplayName: "M. Santos",
        position: 1,
        points: 100,
        status: "ranked",
      },
    ],
    provenance: {
      sourceTitle: "Fictional offline fixture",
      sourceType: "organization-ranking-page",
      url: sourceUrl,
      checkedAt: "2026-07-02T12:00:00.000Z",
      verificationStatus: "official",
    },
    notes: "This intentionally private fixture note must never normalize publicly.",
  };
}

function validateProviderNeutralSnapshots() {
  const raw = [
    snapshotFixture({
      id: "snapshot.fictional.provider-a",
      systemSlug: "provider-a-fictional-strength",
      providerRecord: provider(
        "provider.fictional.a",
        "provider-a",
        "Provider A",
      ),
      sourceUrl: "https://provider-a.invalid/rankings/fictional-2026",
      weightClass: "Source class A",
    }),
    snapshotFixture({
      id: "snapshot.fictional.official-streetlifting",
      systemSlug: "official-streetlifting-fictional-strength",
      providerRecord: provider(
        "provider.official-streetlifting.test-fixture",
        "official-streetlifting",
        "Official Streetlifting",
      ),
      sourceUrl:
        "https://official-streetlifting.invalid/rankings/fictional-2026",
      weightClass: "Source class B",
    }),
  ];
  const snapshots = normalizeAthleteRankingSnapshots(raw);
  assert.equal(snapshots.length, 2);
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.provider.name),
    ["Provider A", "Official Streetlifting"],
    "provider records must remain independently attributed",
  );
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.entries[0]?.athleteSlug),
    [canonicalAthlete.slug, canonicalAthlete.slug],
    "separate provider entries may link to the same reviewed canonical athlete",
  );
  assert.equal(
    "notes" in snapshots[0],
    false,
    "private snapshot notes must not enter the public projection",
  );

  const options = athleteRankingFilterOptions(snapshots);
  const filters = sanitizeAthleteRankingFilters(
    {
      provider: "official-streetlifting",
      discipline: "streetlifting",
      category: "weighted pull-up",
      weightClass: "Source class B",
      scope: "global",
      season: "Fictional 2026",
    },
    options,
  );
  const filtered = filterAthleteRankingSnapshots(snapshots, filters);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.provider.name, "Official Streetlifting");

  const invalid = sanitizeAthleteRankingFilters(
    { provider: "unknown-provider", season: "invented-season" },
    options,
  );
  assert.deepEqual(invalid, {
    provider: undefined,
    discipline: undefined,
    category: undefined,
    weightClass: undefined,
    scope: undefined,
    season: undefined,
  });
}

function validateExternalIdentitySeparation() {
  const records = normalizeExternalAthleteIdentities([
    {
      canonicalId: "identity.fictional.provider-a.mira",
      athlete: canonicalAthlete,
      provider: provider("provider.fictional.a", "provider-a", "Provider A"),
      providerAthleteId: "provider-a-fictional-101",
      providerAthleteUrl: "https://provider-a.invalid/athletes/fictional-101",
      providerDisplayName: "M. Santos",
      matchingStatus: "confirmed",
      reviewStatus: "reviewed",
      privateReviewNotes: "Never project this text.",
    },
    {
      canonicalId: "identity.fictional.official-streetlifting.mira",
      athlete: canonicalAthlete,
      provider: provider(
        "provider.official-streetlifting.test-fixture",
        "official-streetlifting",
        "Official Streetlifting",
      ),
      providerAthleteId: "official-streetlifting-fictional-202",
      providerAthleteUrl:
        "https://official-streetlifting.invalid/athletes/fictional-202",
      providerDisplayName: "Mira Santos",
      matchingStatus: "manually-linked",
      reviewStatus: "reviewed",
      privateReviewNotes: "Never project this text either.",
    },
  ]);

  assert.equal(records.length, 2);
  assert.notEqual(records[0]?.providerAthleteUrl, records[1]?.providerAthleteUrl);
  assert.equal(records[0]?.athleteId, records[1]?.athleteId);
  assert.equal("privateReviewNotes" in records[0], false);
}

function validatePublicQueryBoundary() {
  assert.match(
    ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /rankingSystem->status == "active"/,
  );
  assert.match(
    ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /rankingSystem->provider->status == "active"/,
  );
  assert.doesNotMatch(ATHLETE_RANKING_SNAPSHOTS_QUERY, /\bnotes\b/);
  assert.doesNotMatch(
    ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /sourcePolicyNotes/,
  );
  assert.match(
    ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /entries\[\s*athlete->verification\.profileStatus == "approved"/,
    "public provider snapshots must omit entries linked only to internal athletes",
  );

  const nestedAthleteQueries = [
    HOMEPAGE_QUERY,
    RANKING_CATEGORIES_QUERY,
    PUBLIC_ATHLETE_PAGE_QUERY,
    STORY_PAGE_QUERY,
    COMPETITIONS_QUERY,
    COMPETITION_PAGE_QUERY,
    VIDEOS_PAGE_QUERY,
    VIDEO_PAGE_QUERY,
    TEAMS_QUERY,
    TEAM_PAGE_QUERY,
  ];
  for (const query of nestedAthleteQueries) {
    assert.ok(
      query.includes('verification.profileStatus == "approved"'),
      "every public nested athlete projection must apply profile approval or the legacy sample exception",
    );
    assert.ok(
      query.includes('prototypeStatus in ["fictional-prototype", "sample-record"]'),
      "every public nested athlete projection must preserve only the intentional legacy sample exception",
    );
  }
  assert.doesNotMatch(
    COMPETITIONS_QUERY,
    /"athleteSlug": athlete->slug\.current/,
    "competition cards must not directly dereference an internal athlete",
  );
  assert.doesNotMatch(
    COMPETITION_PAGE_QUERY,
    /"athleteSlug": athlete->slug\.current/,
    "competition detail must not directly dereference an internal athlete",
  );
  assert.doesNotMatch(
    VIDEOS_PAGE_QUERY,
    /relatedAthletes\[\]->/,
    "video discovery must filter related athlete references",
  );
  assert.doesNotMatch(
    VIDEO_PAGE_QUERY,
    /relatedAthletes\[defined\(@->slug\.current\)\]/,
    "video detail must filter related athlete references beyond slug presence",
  );

  const inactive = snapshotFixture({
    id: "snapshot.fictional.inactive-provider",
    systemSlug: "inactive-provider-system",
    providerRecord: provider(
      "provider.fictional.inactive",
      "inactive-provider",
      "Inactive Provider",
      "inactive",
    ),
    sourceUrl: "https://inactive-provider.invalid/ranking",
    weightClass: "Source class C",
  });
  assert.equal(normalizeAthleteRankingSnapshots([inactive]).length, 0);
}

function validateAdminReviewBoundary() {
  const underReviewProvider = provider(
    "rankingProvider.official-streetlifting",
    "official-streetlifting",
    "Official Streetlifting",
    "under-review",
  );
  const raw = {
    canonicalId:
      "rankingSnapshot.official-streetlifting-male-all4-world-minus-101kg.2026-08-09",
    publicationStatus: "draft",
    rankingDate: "2026-08-09",
    checkedAt: "2026-08-09T17:12:56.920Z",
    system: {
      canonicalId:
        "rankingSystem.official-streetlifting-male-all4-world-minus-101kg",
      name: "Official Streetlifting — Male All4 -101kg World",
      slug: "official-streetlifting-male-all4-world-minus-101kg",
      status: "draft",
      rankingKind: "ordinal-position",
      discipline: "Streetlifting",
      category: "All4",
      weightClass: "-101kg",
      sexDivision: "Male",
      geographicScope: "World",
      provider: underReviewProvider,
    },
    entries: [
      {
        canonicalId: "abu-asada",
        providerAthleteId: "abu-asada",
        sourceDisplayName: "Abu Asada",
        athlete: {
          canonicalId: "athlete.abu-asada",
          slug: "abu-asada",
          name: "Abu Asada",
        },
        position: 17,
        status: "ranked",
      },
    ],
    provenance: {
      title: "Official Streetlifting — Abu Asada athlete profile",
      type: "organization-ranking-page",
      url: "https://rankings.officialstreetlifting.com/athletes/abu-asada",
      externalRecordId: "abu-asada",
      checkedAt: "2026-08-09T17:12:56.920Z",
      verificationStatus: "source-confirmed",
      provider: {
        canonicalId: underReviewProvider.canonicalId,
        name: underReviewProvider.name,
      },
    },
    notes: "This private note must not survive normalization.",
  };

  const snapshots = normalizeAdminAthleteRankingSnapshots([raw]);
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.publicationStatus, "draft");
  assert.equal(snapshots[0]?.system?.status, "draft");
  assert.equal(snapshots[0]?.system?.provider?.status, "under-review");
  assert.equal(snapshots[0]?.entries[0]?.athleteId, "athlete.abu-asada");
  assert.equal(snapshots[0]?.entries[0]?.providerAthleteId, "abu-asada");
  assert.equal(snapshots[0]?.entries[0]?.position, 17);
  assert.equal(
    snapshots[0]?.provenance.verificationStatus,
    "source-confirmed",
  );
  assert.equal("notes" in snapshots[0]!, false);

  assert.match(ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY, /publicationStatus/);
  assert.match(ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY, /providerAthleteId/);
  assert.doesNotMatch(
    ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /publicationStatus\s*==\s*"published"/,
  );
  assert.doesNotMatch(
    ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /rankingSystem->status\s*==\s*"active"/,
  );
  assert.doesNotMatch(
    ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /provider->status\s*==\s*"active"/,
  );
  assert.doesNotMatch(ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY, /\bnotes\b/);
  assert.doesNotMatch(
    ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY,
    /sourcePolicyNotes|privateReviewNotes/,
  );
  assert.doesNotMatch(
    ADMIN_EXTERNAL_ATHLETE_IDENTITIES_QUERY,
    /privateReviewNotes/,
  );

  assert.match(ADMIN_ATHLETE_DIRECTORY_QUERY, /\$offset\.\.\.\$end/);
  assert.match(ADMIN_ATHLETE_DIRECTORY_QUERY, /\$rankingStatus/);
  assert.match(ADMIN_ATHLETE_DETAIL_QUERY, /_id == \$id/);
  assert.match(ADMIN_ATHLETE_DETAIL_QUERY, /entries\[/);
  assert.match(ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY, /\$offset\.\.\.\$end/);
  assert.match(ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY, /entries\[0\.\.\.12\]/);
  assert.match(ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY, /_id == \$id/);
  assert.match(ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY, /entries\[0\.\.\.1000\]/);
  assert.doesNotMatch(
    ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY,
    /sourcePolicyNotes|privateReviewNotes|notes/,
  );
  assert.match(
    ADMIN_RANKING_OVERVIEW_QUERY,
    /entries\[defined\(athlete\._ref\)\]\.athlete\._ref/,
    "unmatched entries must not inflate the linked-athlete count",
  );
}

function main() {
  validateProviderNeutralSnapshots();
  validateExternalIdentitySeparation();
  validatePublicQueryBoundary();
  validateAdminReviewBoundary();
  console.log(
    "Ranking validation passed: provider-neutral fixtures, identity-link separation, public-query privacy, active-source gating, admin draft review, bounded admin queries, and filters.",
  );
}

main();
