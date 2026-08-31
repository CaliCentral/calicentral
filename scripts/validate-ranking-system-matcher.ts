import assert from "node:assert/strict";

import { matchRankingSystem, type ExistingRankingSystem, type SourceRankingSystem } from "../lib/data-ops/ranking-system-matcher";
import { addPreviousRankingPositions } from "../lib/rankings/history";
import type { AthleteRankingSnapshot } from "../types/ranking-source";

const source: SourceRankingSystem = {
  providerSlug: "official-streetlifting",
  externalSystemKey: "/rankings?gender=male",
  sourceUrl: "https://rankings.officialstreetlifting.com/rankings?gender=male",
  title: "Male All4 Absolute Rankings",
  supported: true,
  dimensions: {
    gender: "male", liftFormat: "all4", methodology: "source-total-descending",
    category: "absolute-total", equipment: "source-defined", geographicScope: "world",
  },
};

const exact: ExistingRankingSystem = {
  id: "system-exact", providerSlug: "official-streetlifting",
  externalSystemKey: source.externalSystemKey, title: "Cosmetically renamed title",
  dimensions: source.dimensions,
};
assert.equal(matchRankingSystem(source, [exact]).outcome, "EXACT_MATCH");
assert.equal(matchRankingSystem(source, []).outcome, "EXTERNAL_ONLY_NEW_SYSTEM");

const sameTitleWrongDimensions: ExistingRankingSystem = {
  id: "wrong", providerSlug: "official-streetlifting", title: source.title,
  dimensions: { ...source.dimensions, gender: "female" },
};
assert.equal(matchRankingSystem(source, [sameTitleWrongDimensions]).outcome, "EXTERNAL_ONLY_NEW_SYSTEM", "a title alone must never match");

const legacyPartial: ExistingRankingSystem = {
  id: "legacy-partial", providerSlug: "official-streetlifting", title: "Legacy absolute system",
  dimensions: { gender: "male", category: "All4", geographicScope: "Global" },
};
assert.equal(matchRankingSystem(source, [legacyPartial]).outcome, "AMBIGUOUS_REVIEW", "a plausible legacy system with missing methodology dimensions must be reviewed, never duplicated or force-matched");
const legacyWeightSpecific: ExistingRankingSystem = {
  ...legacyPartial, id: "legacy-weight-specific", dimensions: { ...legacyPartial.dimensions, weightClass: "-101kg" },
};
assert.equal(matchRankingSystem(source, [legacyWeightSpecific]).outcome, "EXTERNAL_ONLY_NEW_SYSTEM", "a weight-specific legacy system cannot match an absolute source table");

const duplicateDimensions: ExistingRankingSystem[] = [
  { ...exact, id: "one", externalSystemKey: undefined },
  { ...exact, id: "two", externalSystemKey: undefined },
];
assert.equal(matchRankingSystem(source, duplicateDimensions).outcome, "AMBIGUOUS_REVIEW");
assert.equal(matchRankingSystem({ ...source, supported: false }, []).outcome, "UNSUPPORTED");
assert.equal(matchRankingSystem({ ...source, externalSystemKey: undefined }, []).outcome, "UNKNOWN");

const snapshot = (id: string, date: string, rank: number): AthleteRankingSnapshot => ({
  canonicalId: id,
  provider: { canonicalId: "provider", slug: "provider", name: "Provider", description: "", status: "active", disciplines: [], geographicScope: "world", integrationMethod: "structured-import", attributionRequirement: "source" },
  systemName: "System", systemSlug: "system", rankingKind: "ordinal-position", discipline: "streetlifting", geographicScope: "world",
  rankingDate: date, checkedAt: `${date}T00:00:00Z`, provenance: { title: "Source", type: "organization-ranking-page", url: "https://example.test", verificationStatus: "source-confirmed" },
  entries: [{ canonicalId: `${id}:entry`, externalAthleteId: "athlete-1", athleteName: "Athlete", position: rank, status: "ranked" }],
});
const history = addPreviousRankingPositions([snapshot("new", "2026-08-30", 5), snapshot("old", "2026-08-01", 8)]);
assert.equal(history[0].entries[0].previousPosition, 8, "published history supports movement from #8 to #5 by stable external athlete identity");

console.log("Ranking-system matcher validation passed: exact, external-only, ambiguous, unsupported, unknown, and no title-only matching.");
