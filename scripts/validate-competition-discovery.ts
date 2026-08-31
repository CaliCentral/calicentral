import assert from "node:assert/strict";

import { discoverCompetitions } from "../lib/data-ops/competition-discovery";
import { buildOfficialStreetliftingSnapshot } from "../lib/data-ops/providers/official-streetlifting";
import { competitionSourceProviders } from "../lib/data-ops/provider-registry";

const provider = competitionSourceProviders[0];
const pages = new Map<string, string>([
  [provider.surfaces[0].initialUrl, `<h3>Upcoming Competitions</h3><div class="group relative flex flex-col"><h3><a href="/competitions/new-event">Duplicate Name</a></h3><time datetime="2026-10-01">Oct 1</time></div><div class="group relative flex flex-col"><h3><a href="/competitions/new-event-two">Duplicate Name</a></h3><time datetime="2026-10-02">Oct 2</time></div>`],
  [provider.surfaces[1].initialUrl, `<div class="group relative flex flex-col"><span>Completed</span><h3><a href="/competitions/old-event">Old Event</a></h3><time datetime="2026-01-01">Jan 1</time></div><a href="/competitions/past?page=2">Next</a>`],
  [`${provider.surfaces[1].initialUrl}?page=2`, `<div class="group relative flex flex-col"><span>Postponed</span><h3><a href="/competitions/moved-event">Moved Event</a></h3><time datetime="2026-02-01">Feb 1</time></div>`],
]);
const fetchPage = async (url: string) => {
  const body = pages.get(url);
  if (!body) throw new Error("timeout");
  return buildOfficialStreetliftingSnapshot({ sourceUrl: url, fetchedAt: "2026-08-30T00:00:00Z", httpStatus: 200, contentType: "text/html", body, sourceEntityType: "competition-directory" });
};

async function main() {
const first = await discoverCompetitions({ provider, fetchPage, existing: [
  { canonicalId: "old", provider: provider.id, externalId: "old-event", name: "Old Event", startDate: "2025-12-31", status: "upcoming", sourceUrl: "https://rankings.officialstreetlifting.com/competitions/old-event" },
  { canonicalId: "missing", provider: provider.id, externalId: "missing-event" },
] });
assert.deepEqual(first.surfaces.map((item) => item.pagesChecked), [1, 2]);
assert.equal(first.decisions.filter((item) => item.state === "new").length, 3);
assert.deepEqual(first.decisions.find((item) => item.externalId === "old-event")?.changedFields, ["startDate", "status"], "result arrival retains the same external competition and proposes its explicit completed state");
assert.equal(new Set(first.decisions.filter((item) => item.source.name === "Duplicate Name").map((item) => item.externalId)).size, 2, "same-name competitions remain distinct by provider ID");
assert.equal(first.missingFromCompleteDiscovery.length, 1, "disappearance creates review evidence, never cancellation");
assert.equal(first.resultPages.length, 1);
assert.equal(first.sourceHealth, "healthy");

const repeated = await discoverCompetitions({ provider, fetchPage });
assert.equal(repeated.runKey, (await discoverCompetitions({ provider, fetchPage })).runKey, "unchanged repeated discovery is idempotent");
assert.deepEqual(repeated.decisions.map((item) => item.externalId), ["moved-event", "new-event", "new-event-two", "old-event"]);

const partialProvider = { ...provider, surfaces: [...provider.surfaces, { key: "past" as const, initialUrl: "https://rankings.officialstreetlifting.com/competitions/past?page=99" }] };
const partial = await discoverCompetitions({ provider: partialProvider, fetchPage, existing: [{ canonicalId: "missing", provider: provider.id, externalId: "missing-event" }] });
assert.equal(partial.sourceHealth, "degraded");
assert.equal(partial.missingFromCompleteDiscovery.length, 0, "partial discovery cannot declare a source record missing");

console.log("Competition discovery validation passed: pagination, new/change/unchanged, explicit status, disappearance review, partial failure, and idempotency.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
