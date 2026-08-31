import assert from "node:assert/strict";

import { normalizeCompetitionSourceStatus, planOfficialStreetliftingImport } from "../lib/data-ops/official-streetlifting-plan";
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

// Status propagation: the parser's source status must survive planning
// (this session's fix -- previously the importer hardcoded "unknown"
// regardless of what the parser found).
assert.equal(normalizeCompetitionSourceStatus("Upcoming"), "upcoming");
assert.equal(normalizeCompetitionSourceStatus("Completed"), "completed");
assert.equal(normalizeCompetitionSourceStatus("Cancelled"), "cancelled");
assert.equal(normalizeCompetitionSourceStatus("Postponed"), "postponed");
assert.equal(normalizeCompetitionSourceStatus("Unknown"), "unknown");
assert.equal(normalizeCompetitionSourceStatus("anything-unrecognized"), "unknown", "an unrecognized source status must never be guessed into something specific");

const upcomingCompetition = { ...competition, externalId: "event-upcoming", sourceStatus: "Upcoming" };
const upcomingPlan = planOfficialStreetliftingImport({ competitions: [upcomingCompetition], results: [], rankings: [], observedOn: "2026-08-30" });
assert.equal(upcomingPlan.competitions[0].status, "upcoming", "a structurally-upcoming source competition must plan as status upcoming");

const completedPlan = planOfficialStreetliftingImport({ competitions: [competition], results: [], rankings: [], observedOn: "2026-08-30" });
assert.equal(completedPlan.competitions[0].status, "completed", "an explicitly-completed source competition must plan as status completed");

const ambiguousStatusCompetition = { ...competition, externalId: "event-ambiguous", sourceStatus: "Unknown" };
const ambiguousStatusPlan = planOfficialStreetliftingImport({ competitions: [ambiguousStatusCompetition], results: [], rankings: [], observedOn: "2026-08-30" });
assert.equal(ambiguousStatusPlan.competitions[0].status, "unknown", "a source competition with no recognized status marker must plan as status unknown, never guessed");

// Repeated planning against an unchanged existing status must not flag a
// change -- the same idempotency property already proven for dates/rankings
// above, now proven for status too.
const unchangedStatusPlan = planOfficialStreetliftingImport({
  competitions: [competition], results: [], rankings: [], observedOn: "2026-08-30",
  existingCompetitionIdentities: [{ canonicalId: "existing-event", provider: "official-streetlifting", externalId: "event-1", status: "completed" }],
});
assert.equal(unchangedStatusPlan.competitions[0].statusChanged, false, "an unchanged competition status must not be flagged as changed");

// A genuine source status change must be flagged as a diff, mirroring how
// dateChanged already works above -- surfaced for review, never silently
// applied and never silently dropped.
const changedStatusPlan = planOfficialStreetliftingImport({
  competitions: [competition], results: [], rankings: [], observedOn: "2026-08-30",
  existingCompetitionIdentities: [{ canonicalId: "existing-event", provider: "official-streetlifting", externalId: "event-1", status: "upcoming" }],
});
assert.equal(changedStatusPlan.competitions[0].statusChanged, true, "a genuine source status change (upcoming -> completed) must be flagged as changed");
assert.equal(changedStatusPlan.competitions[0].status, "completed", "the plan must still carry the newly observed status even when flagging the change");

console.log("Official Streetlifting planning validation passed: external-ID-only identity, ambiguity blocking, change detection, history, idempotency, and status propagation.");
