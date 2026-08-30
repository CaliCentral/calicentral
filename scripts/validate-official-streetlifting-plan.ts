import assert from "node:assert/strict";

import { planOfficialStreetliftingImport } from "../lib/data-ops/official-streetlifting-plan";
import type { OfficialStreetliftingRanking, OfficialStreetliftingResult } from "../lib/data-ops/providers/types";

function result(id: string, athleteId: string, athleteName: string, rank: number): OfficialStreetliftingResult {
  return {
    externalResultId: id,
    sourceUrl: `https://rankings.officialstreetlifting.com/results/${id}`,
    athleteExternalId: athleteId,
    athleteSourceUrl: `https://rankings.officialstreetlifting.com/athletes/${athleteId}`,
    athleteName,
    competitionExternalId: "event-1",
    competitionSourceUrl: "https://rankings.officialstreetlifting.com/competitions/event-1",
    position: rank,
    totalKg: 100,
    liftsKg: {},
  };
}

const ranking = (entries: readonly OfficialStreetliftingResult[]): OfficialStreetliftingRanking => ({
  sourceUrl: "https://rankings.officialstreetlifting.com/rankings/classic?gender=male",
  title: "Male Classic Rankings",
  category: "Male Classic",
  gender: "male",
  entries,
});
const competition = { externalId: "event-1", sourceUrl: "https://rankings.officialstreetlifting.com/competitions/event-1", name: "Event One", sourceStatus: "Completed", startDate: "2026-08-01" };

const first = planOfficialStreetliftingImport({
  competitions: [competition],
  results: [],
  rankings: [ranking([result("1", "athlete-a", "Same Name", 1), result("2", "athlete-b", "Same Name", 2)])],
  observedOn: "2026-08-30",
});
assert.equal(first.athletes.length, 2, "duplicate names must remain distinct when stable external IDs differ");
assert.equal(new Set(first.athletes.map((athlete) => athlete.canonicalId)).size, 2);
assert.equal(first.results.filter((item) => item.blocked).length, 0);

const repeated = planOfficialStreetliftingImport({
  competitions: [competition], results: [], rankings: [ranking([result("1", "athlete-a", "Same Name", 1), result("2", "athlete-b", "Same Name", 2)])], observedOn: "2026-08-30",
});
assert.deepEqual(repeated, first, "unchanged source planning must be deterministic");
const unchangedLater = planOfficialStreetliftingImport({
  competitions: [competition], results: [], rankings: [ranking([result("1", "athlete-a", "Same Name", 1), result("2", "athlete-b", "Same Name", 2)])], observedOn: "2026-08-31",
});
assert.equal(unchangedLater.rankingSnapshots[0].id, first.rankingSnapshots[0].id, "an unchanged ranking must not create a duplicate snapshot on a later check");

const matched = planOfficialStreetliftingImport({
  competitions: [competition], results: [result("1", "athlete-a", "Same Name", 1)], rankings: [], observedOn: "2026-08-30",
  existingAthleteIdentities: [{ canonicalId: "existing-athlete", provider: "official-streetlifting", externalId: "athlete-a" }],
  existingCompetitionIdentities: [{ canonicalId: "existing-event", provider: "official-streetlifting", externalId: "event-1", startDate: "2026-07-31" }],
});
assert.equal(matched.athletes[0].state, "matched");
assert.equal(matched.athletes[0].canonicalId, "existing-athlete");
assert.equal(matched.competitions[0].dateChanged, true);

const conflict = planOfficialStreetliftingImport({
  competitions: [competition], results: [result("1", "athlete-a", "First", 1), result("1", "athlete-a", "Changed", 1)], rankings: [], observedOn: "2026-08-30",
});
assert.equal(conflict.errors.length, 1);

const ambiguous = planOfficialStreetliftingImport({
  competitions: [competition], results: [result("1", "athlete-a", "Same Name", 1)], rankings: [], observedOn: "2026-08-30",
  existingAthleteIdentities: [
    { canonicalId: "one", provider: "official-streetlifting", externalId: "athlete-a" },
    { canonicalId: "two", provider: "official-streetlifting", externalId: "athlete-a" },
  ],
});
assert.equal(ambiguous.athletes[0].state, "ambiguous");
assert.equal(ambiguous.results[0].blocked, true);

const moved = planOfficialStreetliftingImport({ competitions: [competition], results: [], rankings: [ranking([result("1", "athlete-a", "Same Name", 2)])], observedOn: "2026-08-31" });
assert.notEqual(moved.rankingSnapshots[0].id, first.rankingSnapshots[0].id, "a later changed ranking must retain a distinct historical snapshot identity");

console.log("Official Streetlifting planning validation passed: external-ID-only identity, ambiguity blocking, change detection, history, and idempotency.");
