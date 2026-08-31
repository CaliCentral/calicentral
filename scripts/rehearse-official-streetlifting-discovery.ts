import { discoverCompetitions } from "../lib/data-ops/competition-discovery";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { planOfficialStreetliftingImport } from "../lib/data-ops/official-streetlifting-plan";
import { competitionSourceProviders } from "../lib/data-ops/provider-registry";
import {
  fetchOfficialStreetliftingPage,
  isOfficialStreetliftingRankingPageReset,
  parseOfficialStreetliftingPagination,
  parseOfficialStreetliftingRanking,
  parseOfficialStreetliftingRankingTaxonomy,
} from "../lib/data-ops/providers/official-streetlifting";
import type { OfficialStreetliftingRanking, RawSourceSnapshot } from "../lib/data-ops/providers/types";
import type { ExistingCompetitionRecord } from "../lib/data-ops/competition-discovery";
import type { ExistingExternalIdentity } from "../lib/data-ops/identity";
import type { ExistingRankingSystem } from "../lib/data-ops/ranking-system-matcher";

const REQUEST_SPACING_MS = 250;
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchPage(url: string, entityType: RawSourceSnapshot["sourceEntityType"]): Promise<RawSourceSnapshot> {
  await wait(REQUEST_SPACING_MS);
  return fetchOfficialStreetliftingPage({ url, sourceEntityType: entityType });
}

async function fetchRankingPages(sourceUrl: string): Promise<{ rankings: OfficialStreetliftingRanking[]; snapshots: RawSourceSnapshot[]; pages: number }> {
  const pending = [sourceUrl];
  const visited = new Set<string>();
  const rankings: OfficialStreetliftingRanking[] = [];
  const snapshots: RawSourceSnapshot[] = [];
  while (pending.length) {
    const url = pending.shift()!;
    if (visited.has(url)) continue;
    if (visited.size >= 250) throw new Error(`Ranking pagination exceeded the reviewed 250-page cap for ${sourceUrl}.`);
    visited.add(url);
    const snapshot = await fetchPage(url, "ranking-table");
    const ranking = parseOfficialStreetliftingRanking(snapshot.body, snapshot.sourceUrl);
    if (isOfficialStreetliftingRankingPageReset(url, ranking)) {
      break;
    }
    snapshots.push(snapshot);
    rankings.push(ranking);
    for (const next of parseOfficialStreetliftingPagination(snapshot.body, snapshot.sourceUrl)) {
      if (!visited.has(next)) pending.push(next);
    }
  }
  return { rankings, snapshots, pages: visited.size };
}

async function previewState(): Promise<{
  athletes: ExistingExternalIdentity[];
  competitions: ExistingCompetitionRecord[];
  rankingSystems: ExistingRankingSystem[];
}> {
  if (!process.argv.includes("--preview-plan")) return { athletes: [], competitions: [], rankingSystems: [] };
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || new URL(url).hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error("--preview-plan requires the approved preview Supabase URL and service role key.");
  }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [athletesResult, competitionsResult, systemsResult] = await Promise.all([
    client.from("external_athlete_identities").select("athlete_id, provider, external_id"),
    client.from("external_competition_identities").select("competition_id, provider, external_id, external_url, competitions(name, start_date, status)"),
    client.from("ranking_systems").select("id, name, sex_division, division, weight_class, category, geographic_scope, ranking_providers(slug)"),
  ]);
  const error = athletesResult.error ?? competitionsResult.error ?? systemsResult.error;
  if (error) throw new Error(`Preview read failed: ${error.message}`);
  return {
    athletes: (athletesResult.data ?? []).map((row) => ({ canonicalId: row.athlete_id, provider: row.provider, externalId: row.external_id })),
    competitions: (competitionsResult.data ?? []).map((row) => {
      const joined = row.competitions as unknown as { name?: string | null; start_date?: string | null; status?: string | null } | readonly { name?: string | null; start_date?: string | null; status?: string | null }[] | null;
      const competition = Array.isArray(joined) ? joined[0] : joined;
      return {
        canonicalId: row.competition_id, provider: row.provider, externalId: row.external_id,
        ...(competition?.name ? { name: competition.name } : {}),
        ...(competition?.start_date ? { startDate: competition.start_date } : {}),
        ...(competition?.status ? { status: competition.status } : {}),
        ...(row.external_url ? { sourceUrl: row.external_url } : {}),
      };
    }),
    rankingSystems: (systemsResult.data ?? []).map((row) => {
      const joined = row.ranking_providers as unknown as { slug?: string } | readonly { slug?: string }[] | null;
      const provider = Array.isArray(joined) ? joined[0] : joined;
      return {
        id: row.id, providerSlug: provider?.slug ?? "", title: row.name,
        dimensions: {
          ...(row.sex_division ? { gender: row.sex_division } : {}),
          ...(row.division ? { division: row.division } : {}),
          ...(row.weight_class ? { weightClass: row.weight_class } : {}),
          ...(row.category ? { category: row.category } : {}),
          geographicScope: row.geographic_scope,
        },
      };
    }),
  };
}

async function main() {
  const observedOn = new Date().toISOString().slice(0, 10);
  const homepage = await fetchPage("https://rankings.officialstreetlifting.com/", "ranking-table");
  const taxonomy = parseOfficialStreetliftingRankingTaxonomy(homepage.body);
  const supported = taxonomy.filter((item) => item.importSupport === "supported");
  const rankingFetches = [] as { category: string; pages: number; rankings: OfficialStreetliftingRanking[]; snapshots: RawSourceSnapshot[] }[];
  for (const category of supported) {
    const fetched = await fetchRankingPages(category.sourceUrl);
    rankingFetches.push({ category: category.stableKey, ...fetched });
  }

  const rankings = rankingFetches.flatMap((item) => item.rankings);
  const existing = await previewState();
  const planInput = { competitions: [], results: [], rankings, observedOn, existingAthleteIdentities: existing.athletes, existingRankingSystems: existing.rankingSystems };
  const firstPlan = planOfficialStreetliftingImport(planInput);
  const repeatedPlan = planOfficialStreetliftingImport(planInput);
  const firstRanking = rankings[0];
  const firstEntry = firstRanking?.entries[0];
  const changedRankings = firstRanking && firstEntry ? [
    { ...firstRanking, entries: [{ ...firstEntry, position: (firstEntry.position ?? 1) + 1 }, ...firstRanking.entries.slice(1)] },
    ...rankings.slice(1),
  ] : rankings;
  const changedPlan = planOfficialStreetliftingImport({ ...planInput, rankings: changedRankings });

  const provider = competitionSourceProviders[0];
  const competitionReport = await discoverCompetitions({
    provider,
    fetchPage: (url) => fetchPage(url, "competition-directory"),
    existing: existing.competitions,
  });

  const cacheDirectoryArgument = process.argv.find((argument) => argument.startsWith("--cache-dir="))?.slice("--cache-dir=".length);
  let inputManifest: string | undefined;
  if (cacheDirectoryArgument) {
    const cacheDirectory = path.resolve(cacheDirectoryArgument);
    await mkdir(cacheDirectory, { recursive: true });
    const cacheable = [
      ...rankingFetches.flatMap((item) => item.snapshots),
      ...competitionReport.snapshots,
    ];
    const inputs = [] as { entityType: string; file: string; sourceUrl: string }[];
    for (const snapshot of cacheable) {
      const file = path.join(cacheDirectory, `${snapshot.contentHash}.html`);
      await writeFile(file, snapshot.body, "utf8");
      inputs.push({ entityType: snapshot.sourceEntityType, file, sourceUrl: snapshot.sourceUrl });
    }
    inputManifest = path.join(cacheDirectory, "input-manifest.json");
    await writeFile(inputManifest, `${JSON.stringify({ inputs }, null, 2)}\n`, "utf8");
  }

  const bySurface = Object.fromEntries(competitionReport.surfaces.map((surface) => [surface.key, surface]));
  const outcomeCounts = Object.fromEntries(
    ["EXACT_MATCH", "EXTERNAL_ONLY_NEW_SYSTEM", "AMBIGUOUS_REVIEW", "UNSUPPORTED", "UNKNOWN"]
      .map((outcome) => [outcome, firstPlan.rankingSystems.filter((item) => item.outcome === outcome).length]),
  );
  process.stdout.write(`${JSON.stringify({
    mode: process.argv.includes("--preview-plan") ? "hosted-preview-read-only-plan" : "local-read-only-rehearsal",
    writesEnabled: false,
    ...(inputManifest ? { inputManifest } : {}),
    taxonomy: {
      categories: taxonomy.length,
      supported: supported.length,
      unsupported: taxonomy.filter((item) => item.importSupport === "unsupported").length,
      unknown: taxonomy.filter((item) => item.importSupport === "unknown").length,
      items: taxonomy,
    },
    rankings: {
      pages: rankingFetches.reduce((sum, item) => sum + item.pages, 0),
      pagesByCategory: Object.fromEntries(rankingFetches.map((item) => [item.category, item.pages])),
      ...outcomeCounts,
      snapshots: firstPlan.rankingSnapshots.length,
      entries: firstPlan.rankingSnapshots.reduce((sum, snapshot) => sum + snapshot.entries.length, 0),
      matchedAthletes: firstPlan.athletes.filter((item) => item.state === "matched").length,
      newExternalAthletes: firstPlan.athletes.filter((item) => item.state === "new").length,
      ambiguousAthletes: firstPlan.athletes.filter((item) => item.state === "ambiguous").length,
      warnings: firstPlan.warnings,
      errors: firstPlan.errors,
      idempotent: JSON.stringify(firstPlan) === JSON.stringify(repeatedPlan),
      historyChangeCreatesSnapshot: firstPlan.rankingSnapshots[0]?.id !== changedPlan.rankingSnapshots[0]?.id,
    },
    competitions: {
      upcomingPages: bySurface.upcoming?.pagesChecked ?? 0,
      upcomingEvents: bySurface.upcoming?.eventsFound ?? 0,
      pastPages: bySurface.past?.pagesChecked ?? 0,
      pastEvents: bySurface.past?.eventsFound ?? 0,
      resultPages: competitionReport.resultPages.length,
      new: competitionReport.decisions.filter((item) => item.state === "new").length,
      matched: competitionReport.decisions.filter((item) => item.state === "matched").length,
      updated: competitionReport.decisions.filter((item) => item.state === "updated").length,
      unchanged: competitionReport.decisions.filter((item) => item.state === "unchanged").length,
      ambiguous: competitionReport.decisions.filter((item) => item.state === "ambiguous").length,
      failedPages: competitionReport.surfaces.reduce((sum, surface) => sum + surface.failedPages.length, 0),
      sourceHealth: competitionReport.sourceHealth,
      runKey: competitionReport.runKey,
    },
  }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown rehearsal error"}\n`);
  process.exitCode = 1;
});
