import assert from "node:assert/strict";

import { matchRankingSystem, type ExistingRankingSystem, type SourceRankingSystem } from "../lib/data-ops/ranking-system-matcher";

// Models the five hosted preview `ranking_systems` rows exactly as read
// read-only from the approved preview project (2026-08-31), plus the
// structured-dimension backfill proposed in
// migrations/202608310001_backfill_official_streetlifting_legacy_ranking_systems.sql.
// This proves the backfill resolves all four absolute legacy systems to
// EXACT_MATCH against the live source tables, keeps the -101kg World system
// separate, and introduces no duplicate or new-system outcomes -- without
// making any hosted request.

const PROVIDER = "official-streetlifting";

function sourceRanking(gender: "male" | "female", liftFormat: "all4" | "2-lift-pull-dip"): SourceRankingSystem {
  const path = liftFormat === "all4" ? "/rankings" : "/rankings/classic";
  const stableKey = `${path}?gender=${gender}`;
  return {
    providerSlug: PROVIDER,
    externalSystemKey: stableKey,
    sourceUrl: `https://rankings.officialstreetlifting.com${stableKey}`,
    title: `${gender === "male" ? "Male" : "Female"} ${liftFormat === "all4" ? "All4" : "Classic"} Absolute Rankings`,
    supported: true,
    dimensions: {
      gender, liftFormat, category: "absolute-total",
      equipment: "source-defined", methodology: "source-total-descending",
      geographicScope: "world",
    },
  };
}

const sources = {
  femaleAll4: sourceRanking("female", "all4"),
  femaleClassic: sourceRanking("female", "2-lift-pull-dip"),
  maleAll4: sourceRanking("male", "all4"),
  maleClassic: sourceRanking("male", "2-lift-pull-dip"),
};

// Current hosted dimensions (pre-backfill), read 2026-08-31: category holds
// the lift format ("All4"/"Classic"), geographic_scope is "Global", and
// lift_format/equipment/methodology_category do not exist as populated
// values. This fixture proves today's hosted state -- unbackfilled -- lands
// every absolute system in AMBIGUOUS_REVIEW, matching the documented
// EXACT_MATCH:0 / AMBIGUOUS_REVIEW:4 planner result.
const hostedBeforeBackfill: readonly ExistingRankingSystem[] = [
  { id: "female-all4", providerSlug: PROVIDER, title: "Official Streetlifting — Female All4 Absolute", dimensions: { gender: "female", category: "All4", geographicScope: "Global" } },
  { id: "female-classic", providerSlug: PROVIDER, title: "Official Streetlifting — Female Classic Absolute", dimensions: { gender: "female", category: "Classic", geographicScope: "Global" } },
  { id: "male-all4-world-101kg", providerSlug: PROVIDER, title: "Official Streetlifting — Male All4 -101kg World", dimensions: { gender: "male", category: "All4", weightClass: "-101kg", geographicScope: "World" } },
  { id: "male-all4", providerSlug: PROVIDER, title: "Official Streetlifting — Male All4 Absolute", dimensions: { gender: "male", category: "All4", geographicScope: "Global" } },
  { id: "male-classic", providerSlug: PROVIDER, title: "Official Streetlifting — Male Classic Absolute", dimensions: { gender: "male", category: "Classic", geographicScope: "Global" } },
];

for (const [key, source] of Object.entries(sources)) {
  const outcome = matchRankingSystem(source, hostedBeforeBackfill).outcome;
  assert.equal(outcome, "AMBIGUOUS_REVIEW", `${key} must be ambiguous against unbackfilled hosted dimensions (was ${outcome})`);
}

// Proposed backfill: move the lift format out of `category` and into
// `lift_format`, and set the source-constant `equipment`/`methodology`
// dimensions the parser always emits for the four absolute tables. The
// -101kg World system is untouched -- its weight_class keeps it structurally
// distinct from every absolute source table.
const hostedAfterBackfill: readonly ExistingRankingSystem[] = hostedBeforeBackfill.map((system) => {
  if (system.id === "male-all4-world-101kg") return system;
  const liftFormat = system.dimensions.category === "All4" ? "all4" : "2-lift-pull-dip";
  return {
    ...system,
    dimensions: {
      gender: system.dimensions.gender, liftFormat, category: "absolute-total",
      equipment: "source-defined", methodology: "source-total-descending",
      geographicScope: system.dimensions.geographicScope,
    },
  };
});

const expectedMatch: Record<keyof typeof sources, string> = {
  femaleAll4: "female-all4", femaleClassic: "female-classic",
  maleAll4: "male-all4", maleClassic: "male-classic",
};

let exactMatches = 0;
let ambiguous = 0;
let externalOnlyNew = 0;
for (const [key, source] of Object.entries(sources) as [keyof typeof sources, SourceRankingSystem][]) {
  const match = matchRankingSystem(source, hostedAfterBackfill);
  if (match.outcome === "EXACT_MATCH") exactMatches += 1;
  if (match.outcome === "AMBIGUOUS_REVIEW") ambiguous += 1;
  if (match.outcome === "EXTERNAL_ONLY_NEW_SYSTEM") externalOnlyNew += 1;
  assert.equal(match.outcome, "EXACT_MATCH", `${key} must resolve EXACT_MATCH after backfill (was ${match.outcome}: ${match.reason})`);
  assert.equal(match.systemId, expectedMatch[key], `${key} must match its own hosted system, never a different one`);
}
assert.equal(exactMatches, 4, "all four absolute legacy systems must resolve exactly");
assert.equal(ambiguous, 0, "no absolute system may remain ambiguous after backfill");
assert.equal(externalOnlyNew, 0, "no absolute system may be treated as a brand-new external system after backfill");

// The -101kg World system must never match an absolute source table, before
// or after the backfill -- it stays a separate, non-absolute system.
for (const source of Object.values(sources)) {
  const worldOnly = matchRankingSystem(source, [hostedAfterBackfill.find((s) => s.id === "male-all4-world-101kg")!]);
  assert.equal(worldOnly.outcome, "EXTERNAL_ONLY_NEW_SYSTEM", "the -101kg World system must never satisfy an absolute source table");
}

// Idempotency: matching against the backfilled state twice with the same
// inputs produces byte-identical decisions.
const first = Object.values(sources).map((source) => matchRankingSystem(source, hostedAfterBackfill));
const second = Object.values(sources).map((source) => matchRankingSystem(source, hostedAfterBackfill));
assert.deepEqual(first, second, "matching must be deterministic on rerun");

console.log("Official Streetlifting legacy ranking-system backfill validation passed: EXACT_MATCH=4, AMBIGUOUS_REVIEW=0, -101kg World stays separate, deterministic on rerun.");
