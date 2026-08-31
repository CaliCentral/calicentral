import assert from "node:assert/strict";

import {
  buildOfficialStreetliftingSnapshot,
  fetchOfficialStreetliftingPage,
  isOfficialStreetliftingRankingPageReset,
  parseOfficialStreetliftingCompetitions,
  parseOfficialStreetliftingRanking,
  parseOfficialStreetliftingRankingTaxonomy,
  parseOfficialStreetliftingPagination,
  parseOfficialStreetliftingResults,
} from "../lib/data-ops/providers/official-streetlifting";

const row = `<tr>
  <td><span>1</span><a href="/athletes/stable-athlete-id">Example Athlete</a></td>
  <td>Male</td><td><a href="/records/male/classes/-80kg">-80kg</a></td>
  <td>79.50</td><td>Classic</td><td>0.00</td><td>80.00</td><td>100.00</td><td>0.00</td>
  <td>180.00</td><td>42.50</td><td><a href="/competitions/stable-event-id">Example Event</a></td>
  <td><time datetime="2026-08-01T00:00:00Z">Aug 1</time></td>
  <td><a href="/results/123">View</a></td>
</tr>`;
const table = `<h1>Male Classic -80kg Rankings</h1><table><thead><tr>
  <th>Lifter</th><th>Gender</th><th>Class</th><th>Body Weight (kg)</th><th>Style</th>
  <th>Muscle Up (kg)</th><th>Pull (kg)</th><th>Dip (kg)</th><th>Squat (kg)</th>
  <th>Total (kg)</th><th>Ris Score</th><th>Competition</th><th>Date</th><th>Actions</th>
</tr></thead><tbody>${row}</tbody></table>`;

async function main() {
const results = parseOfficialStreetliftingResults(table);
assert.equal(results.length, 1);
assert.equal(results[0].athleteExternalId, "stable-athlete-id");
assert.equal(results[0].externalResultId, "123");
assert.equal(results[0].competitionExternalId, "stable-event-id");
assert.equal(results[0].totalKg, 180);
assert.equal(results[0].liftsKg.pull, 80);
assert.equal(results[0].liftsKg.dip, 100);

const ranking = parseOfficialStreetliftingRanking(table, "https://rankings.officialstreetlifting.com/rankings/classic?gender=male");
assert.equal(ranking.gender, "male");
assert.equal(ranking.weightClass, "-80kg");
assert.equal(ranking.liftFormat, "2-lift-pull-dip");
assert.equal(ranking.stableKey, "/rankings/classic?gender=male");
assert.equal(ranking.entries[0].position, 1);
assert.equal(isOfficialStreetliftingRankingPageReset("https://rankings.officialstreetlifting.com/rankings/classic?gender=male&page=2", ranking), true, "an out-of-range page that wraps to rank 1 is rejected as a pagination reset");
assert.equal(isOfficialStreetliftingRankingPageReset("https://rankings.officialstreetlifting.com/rankings/classic?gender=male", ranking), false);

const taxonomy = parseOfficialStreetliftingRankingTaxonomy(`
  <a href="/rankings?gender=male">Male All4 Absolute Rankings</a>
  <a href="/rankings/classic?gender=female">Female Classic Absolute Rankings</a>
  <a href="/records/male/classes/-66kg">Male -66kg Weight Class</a>
  <a href="/records/female/divisions/division3-female">Division 3 | Female</a>
  <a href="/records/male">Male All-Time Absolute WR</a>
`);
assert.equal(taxonomy.length, 5);
assert.equal(taxonomy.filter((item) => item.importSupport === "supported").length, 2);
assert.equal(taxonomy.find((item) => item.stableKey.includes("classic"))?.dimensions.liftFormat, "2-lift-pull-dip");

const pagination = parseOfficialStreetliftingPagination(
  `<a href="/rankings?gender=male&page=2">Next</a><a href="https://example.com/rankings?page=2">Next</a>`,
  "https://rankings.officialstreetlifting.com/rankings?gender=male",
);
assert.deepEqual(pagination, ["https://rankings.officialstreetlifting.com/rankings?gender=male&page=2"]);

const competitionHtml = `<div class="group relative flex flex-col"><span>Upcoming</span><h3><a href="/competitions/stable-event-id">Example Event</a></h3><time datetime="2026-09-01T00:00:00Z">Sep 1</time></div>`;
assert.deepEqual(parseOfficialStreetliftingCompetitions(competitionHtml), [{
  externalId: "stable-event-id",
  sourceUrl: "https://rankings.officialstreetlifting.com/competitions/stable-event-id",
  name: "Example Event",
  sourceStatus: "Upcoming",
  startDate: "2026-09-01",
}]);

// The live directory page carries no per-card badge at all for upcoming
// competitions (confirmed against a real fetch) -- a card with no badge but
// structurally listed under the page's own "Upcoming Competitions" heading
// must resolve to "Upcoming" from that section evidence, never a guess.
const sectionedDirectoryHtml = `
  <h3>Upcoming Competitions</h3>
  <div class="group relative flex flex-col"><h3><a href="/competitions/no-badge-upcoming">No Badge Upcoming</a></h3><time datetime="2026-09-01T00:00:00Z">Sep 1</time></div>
  <a href="/competitions/past">View All Past Competitions</a>
  <div class="group relative flex flex-col"><h3><a href="/competitions/no-badge-elsewhere">No Badge Outside Section</a></h3><time datetime="2026-01-01T00:00:00Z">Jan 1</time></div>
`;
const sectioned = parseOfficialStreetliftingCompetitions(sectionedDirectoryHtml);
assert.equal(sectioned.find((item) => item.externalId === "no-badge-upcoming")?.sourceStatus, "Upcoming", "a badge-less card inside the Upcoming Competitions section must resolve to Upcoming, not Unknown");
assert.equal(sectioned.find((item) => item.externalId === "no-badge-elsewhere")?.sourceStatus, "Unknown", "a badge-less card outside any recognized section still falls back to Unknown, never a guessed status");
const cancelled = parseOfficialStreetliftingCompetitions(`<div class="group relative flex flex-col"><span>Cancelled</span><h3><a href="/competitions/cancelled-event">Cancelled Event</a></h3></div>`);
assert.equal(cancelled[0].sourceStatus, "Cancelled", "cancellation is represented only from an explicit source badge");

const first = buildOfficialStreetliftingSnapshot({ sourceUrl: "https://rankings.officialstreetlifting.com/results/", fetchedAt: "2026-08-30T00:00:00.000Z", httpStatus: 200, contentType: "text/html", body: table, sourceEntityType: "results-directory" });
const second = buildOfficialStreetliftingSnapshot({ sourceUrl: first.sourceUrl, fetchedAt: "2026-08-30T01:00:00.000Z", httpStatus: 200, contentType: "text/html", body: table, sourceEntityType: "results-directory" });
assert.equal(first.contentHash, second.contentHash, "unchanged source bytes must retain one content identity");

assert.throws(() => parseOfficialStreetliftingResults(table.replace("<th>Actions</th>", "")), /malformed row width/);
assert.throws(() => parseOfficialStreetliftingResults(table.replace(/<a href="\/results\/123">View<\/a>/, "")), /stable athlete or result identity/);
assert.throws(() => parseOfficialStreetliftingResults("<html></html>"), /expected one result table/);
await assert.rejects(
  fetchOfficialStreetliftingPage({ url: "https://example.com/results", sourceEntityType: "results-directory" }),
  /outside the reviewed public route boundary/,
);

console.log("Official Streetlifting provider validation passed: stable IDs, structured values, content hashing, and malformed/unsafe input rejection.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
