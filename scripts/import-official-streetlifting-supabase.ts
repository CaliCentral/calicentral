import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { stableDataOpsUuid, type ExistingExternalIdentity } from "../lib/data-ops/identity";
import { planOfficialStreetliftingImport, type ExistingCompetitionIdentity } from "../lib/data-ops/official-streetlifting-plan";
import {
  buildOfficialStreetliftingSnapshot,
  OFFICIAL_STREETLIFTING_PROVIDER,
  parseOfficialStreetliftingCompetitions,
  parseOfficialStreetliftingRanking,
  parseOfficialStreetliftingResults,
} from "../lib/data-ops/providers/official-streetlifting";
import type {
  OfficialStreetliftingCompetition,
  OfficialStreetliftingRanking,
  OfficialStreetliftingResult,
  RawSourceSnapshot,
  SourceEntityType,
} from "../lib/data-ops/providers/types";

type InputSpec = { readonly entityType: SourceEntityType; readonly file: string; readonly sourceUrl: string };
type ParsedInput = {
  readonly snapshot: RawSourceSnapshot;
  readonly competitions: readonly OfficialStreetliftingCompetition[];
  readonly results: readonly OfficialStreetliftingResult[];
  readonly rankings: readonly OfficialStreetliftingRanking[];
};

const TABLES = [
  "raw_source_snapshots", "source_extractions", "source_records", "athletes",
  "external_athlete_identities", "competitions", "external_competition_identities",
  "sporting_results", "sporting_result_performances", "ranking_providers",
  "ranking_systems", "ranking_snapshots", "ranking_entries", "provenance",
] as const;

function argumentsFor(name: string): string[] {
  const prefix = `--${name}=`;
  return process.argv.filter((argument) => argument.startsWith(prefix)).map((argument) => argument.slice(prefix.length));
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function inputSpecs(): InputSpec[] {
  return argumentsFor("input").map((value) => {
    const first = value.indexOf(",");
    const second = value.indexOf(",", first + 1);
    if (first < 1 || second < first + 2) throw new Error("Each --input must be entity-type,file,source-url.");
    const entityType = value.slice(0, first) as SourceEntityType;
    if (!["competition-directory", "results-directory", "ranking-table"].includes(entityType)) {
      throw new Error(`Unsupported input entity type: ${entityType}`);
    }
    const file = path.resolve(value.slice(first + 1, second));
    const sourceUrl = value.slice(second + 1);
    const url = new URL(sourceUrl);
    if (url.origin !== "https://rankings.officialstreetlifting.com") throw new Error("Input source URL must use the reviewed Official Streetlifting origin.");
    return { entityType, file, sourceUrl: url.toString() };
  });
}

async function parseInput(spec: InputSpec, observedAt: string): Promise<ParsedInput> {
  const body = await readFile(spec.file, "utf8");
  const snapshot = buildOfficialStreetliftingSnapshot({
    sourceUrl: spec.sourceUrl,
    fetchedAt: observedAt,
    httpStatus: 200,
    contentType: "text/html",
    body,
    sourceEntityType: spec.entityType,
  });
  if (spec.entityType === "competition-directory") {
    return { snapshot, competitions: parseOfficialStreetliftingCompetitions(body), results: [], rankings: [] };
  }
  if (spec.entityType === "ranking-table") {
    return { snapshot, competitions: [], results: [], rankings: [parseOfficialStreetliftingRanking(body, spec.sourceUrl)] };
  }
  return { snapshot, competitions: [], results: parseOfficialStreetliftingResults(body), rankings: [] };
}

function resultCompetitions(results: readonly OfficialStreetliftingResult[]): OfficialStreetliftingCompetition[] {
  const records = new Map<string, OfficialStreetliftingCompetition>();
  for (const result of results) {
    if (!result.competitionExternalId || !result.competitionSourceUrl || !result.competitionName) continue;
    const candidate: OfficialStreetliftingCompetition = {
      externalId: result.competitionExternalId,
      sourceUrl: result.competitionSourceUrl,
      name: result.competitionName,
      sourceStatus: result.resultDate ? "Completed" : "Unknown",
      ...(result.resultDate ? { startDate: result.resultDate } : {}),
      ...(result.style ? { style: result.style } : {}),
    };
    const existing = records.get(candidate.externalId);
    if (!existing || (!existing.startDate && candidate.startDate)) records.set(candidate.externalId, candidate);
  }
  return [...records.values()];
}

function dedupeCompetitions(records: readonly OfficialStreetliftingCompetition[]): OfficialStreetliftingCompetition[] {
  const result = new Map<string, OfficialStreetliftingCompetition>();
  for (const record of records) {
    const existing = result.get(record.externalId);
    if (!existing || (!existing.startDate && record.startDate)) result.set(record.externalId, record);
  }
  return [...result.values()];
}

function localConfiguration(): { url: string; serviceRoleKey: string } {
  const raw = execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const status = JSON.parse(raw) as { API_URL?: string; SERVICE_ROLE_KEY?: string; SECRET_KEY?: string };
  const url = status.API_URL;
  const serviceRoleKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    throw new Error("Local import refused: a running loopback Supabase stack is required.");
  }
  return { url, serviceRoleKey };
}

// Mirrors the narrowly-scoped preview-write pattern already established in
// scripts/migration/common.ts (APPROVED_PREVIEW_HOSTNAME, --confirm-preview-
// migration): credentials come exclusively from the environment (run with
// --env-file=.env.preview-migration.local, never from a CLI-detected host),
// and the hostname is checked against an allowlist of exactly one project --
// this never falls back to accepting any other cloud host.
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";

function previewConfiguration(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("Preview import requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.preview-migration.local).");
  }
  const hostname = new URL(url).hostname;
  if (hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error(`Preview import refuses any host other than the approved preview project (${APPROVED_PREVIEW_HOSTNAME}). Got: ${hostname}.`);
  }
  return { url, serviceRoleKey };
}

async function counts(client: SupabaseClient): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const table of TABLES) {
    const response = await client.from(table).select("*", { count: "exact", head: true });
    if (response.error) throw new Error(`Count failed for ${table}: ${response.error.message}`);
    result[table] = response.count ?? 0;
  }
  return result;
}

async function insertIgnore(client: SupabaseClient, table: string, rows: readonly Record<string, unknown>[]) {
  if (!rows.length) return;
  const response = await client.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (response.error) throw new Error(`Local import failed for ${table}: ${response.error.message}`);
}

function slug(prefix: string, externalId: string): string {
  return `${prefix}-${externalId}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96);
}

async function writeLocal(input: {
  readonly parsed: readonly ParsedInput[];
  readonly observedOn: string;
  readonly plan: ReturnType<typeof planOfficialStreetliftingImport>;
  readonly client: SupabaseClient;
  readonly skipRankingWrites: boolean;
}) {
  const adapterResult = await input.client.from("source_adapters").select("id").eq("slug", OFFICIAL_STREETLIFTING_PROVIDER).single();
  if (adapterResult.error) throw new Error(`Official Streetlifting adapter is unavailable locally: ${adapterResult.error.message}`);
  const adapterId = adapterResult.data.id as string;
  const sourceIds = new Map<string, string>();
  const rawDirectory = path.resolve(".tmp/data-ops/raw/official-streetlifting");
  await mkdir(rawDirectory, { recursive: true });

  for (const item of input.parsed) {
    const snapshotId = stableDataOpsUuid("calicentral:data-ops:raw-snapshot", `${item.snapshot.sourceUrl}:${item.snapshot.contentHash}`);
    const extractionId = stableDataOpsUuid("calicentral:data-ops:extraction", `${snapshotId}:${item.snapshot.parserVersion}`);
    const sourceRecordId = stableDataOpsUuid("calicentral:data-ops:source-record", `${item.snapshot.sourceUrl}:${item.snapshot.contentHash}`);
    const rawFile = path.join(rawDirectory, `${item.snapshot.contentHash}.html`);
    await writeFile(rawFile, item.snapshot.body, { encoding: "utf8", flag: "wx" }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
    sourceIds.set(item.snapshot.sourceUrl, sourceRecordId);
    await insertIgnore(input.client, "raw_source_snapshots", [{
      id: snapshotId, source_adapter_id: adapterId, source_url: item.snapshot.sourceUrl,
      source_entity_type: item.snapshot.sourceEntityType, fetched_at: item.snapshot.fetchedAt,
      content_hash: item.snapshot.contentHash, content_type: item.snapshot.contentType,
      raw_payload_ref: path.relative(process.cwd(), rawFile), http_status: item.snapshot.httpStatus,
      parser_version: item.snapshot.parserVersion,
    }]);
    await insertIgnore(input.client, "source_extractions", [{
      id: extractionId, raw_snapshot_id: snapshotId, extraction_method: "deterministic-parser",
      parser_version: item.snapshot.parserVersion, extracted_payload: {
        competitions: item.competitions, results: item.results, rankings: item.rankings,
      }, extraction_confidence: 1, extraction_status: "succeeded",
    }]);
    await insertIgnore(input.client, "source_records", [{
      id: sourceRecordId, provider: OFFICIAL_STREETLIFTING_PROVIDER,
      source_type: item.snapshot.sourceEntityType, public_url: item.snapshot.sourceUrl,
      external_record_id: `${item.snapshot.sourceEntityType}:${item.snapshot.contentHash}`,
      checked_at: item.snapshot.fetchedAt, verification_state: "source-confirmed",
      source_payload: { rawSnapshotId: snapshotId, contentHash: item.snapshot.contentHash, parserVersion: item.snapshot.parserVersion },
    }]);
  }
  const fallbackSourceId = sourceIds.values().next().value as string | undefined;
  if (!fallbackSourceId) throw new Error("Local import requires at least one source snapshot.");

  // ranking_providers.slug is a unique natural key -- if a row for this
  // provider already exists (for example, migrated from Sanity with an
  // unrelated legacy id), reuse its id rather than inserting a second row
  // for the same real-world provider under a different id.
  const existingProvider = await input.client.from("ranking_providers").select("id").eq("slug", OFFICIAL_STREETLIFTING_PROVIDER).maybeSingle();
  if (existingProvider.error) throw new Error(`Preview import failed to check for an existing ranking provider: ${existingProvider.error.message}`);
  const providerId = existingProvider.data?.id ?? stableDataOpsUuid("calicentral:ranking-provider", OFFICIAL_STREETLIFTING_PROVIDER);
  if (!existingProvider.data) {
    await insertIgnore(input.client, "ranking_providers", [{
      id: providerId, slug: OFFICIAL_STREETLIFTING_PROVIDER, name: "Official Streetlifting",
      website: "https://rankings.officialstreetlifting.com/", status: "under-review",
      integration_method: "reviewed-server-rendered-html", attribution_requirement: "Source URL and provider label required",
      source_policy_notes: "Automated reuse authorization remains unresolved; local rehearsal only.",
    }]);
  }

  await insertIgnore(input.client, "athletes", input.plan.athletes.filter((item) => item.state === "new" && item.canonicalId).map((item) => ({
    id: item.canonicalId, permanent_id: `official-streetlifting:${item.externalId}`,
    slug: slug("osl-athlete", item.externalId), name: item.sourceName, biography: "",
    identity_state: "unconfirmed", editorial_state: "draft",
  })));
  await insertIgnore(input.client, "external_athlete_identities", input.plan.athletes.filter((item) => item.state === "new" && item.canonicalId).map((item) => ({
    id: stableDataOpsUuid("calicentral:official-streetlifting:athlete-identity", item.externalId),
    athlete_id: item.canonicalId, provider: OFFICIAL_STREETLIFTING_PROVIDER,
    external_id: item.externalId, external_url: item.sourceUrl,
    verification_state: "source-confirmed", source_record_id: sourceIds.get(item.sourceUrl) ?? fallbackSourceId,
  })));

  await insertIgnore(input.client, "competitions", input.plan.competitions.filter((item) => item.state === "new" && item.canonicalId).map((item) => ({
    id: item.canonicalId, permanent_id: `official-streetlifting:${item.externalId}`,
    slug: slug("osl-competition", item.externalId), name: item.name,
    status: item.status, start_date: item.startDate ?? null, summary: "", public_state: "draft",
  })));
  await insertIgnore(input.client, "external_competition_identities", input.plan.competitions.filter((item) => item.state === "new" && item.canonicalId).map((item) => ({
    id: stableDataOpsUuid("calicentral:official-streetlifting:competition-identity", item.externalId),
    competition_id: item.canonicalId, provider: OFFICIAL_STREETLIFTING_PROVIDER,
    external_id: item.externalId, external_url: item.sourceUrl,
    source_record_id: sourceIds.get(item.sourceUrl) ?? fallbackSourceId,
  })));

  const importableResults = input.plan.results.filter((item) => !item.blocked && item.athleteCanonicalId && item.competitionCanonicalId);
  await insertIgnore(input.client, "sporting_results", importableResults.map((item) => ({
    id: item.id, competition_id: item.competitionCanonicalId, athlete_id: item.athleteCanonicalId,
    division: item.source.weightClass ?? item.source.gender ?? "unknown",
    event: item.source.style ?? "streetlifting", placement: item.source.position ?? null,
    result_status: "source-confirmed", source_record_id: sourceIds.get(item.source.sourceUrl) ?? fallbackSourceId,
  })));
  const performanceRows = importableResults.flatMap((item) => {
    const values = [
      ...(item.source.totalKg !== undefined ? [{ movement: "total", value: item.source.totalKg, unit: "kg" }] : []),
      ...(item.source.bodyweightKg !== undefined ? [{ movement: "bodyweight", value: item.source.bodyweightKg, unit: "kg" }] : []),
      ...Object.entries(item.source.liftsKg).map(([movement, value]) => ({ movement, value, unit: "kg" })),
    ];
    return values.map((value, index) => ({
      id: stableDataOpsUuid("calicentral:official-streetlifting:performance", `${item.externalResultId}:${value.movement}`),
      sporting_result_id: item.id, performance_order: index, ...value, status: "source-confirmed",
    }));
  });
  await insertIgnore(input.client, "sporting_result_performances", performanceRows);

  // ranking_systems has no reliable natural-key match against pre-existing,
  // manually-curated rows yet (category/gender/weight-class matching would
  // require guessing rather than an exact key) -- skippable so a hosted
  // write can proceed with the unambiguous athlete/competition/result data
  // while this stays deferred rather than risking a duplicate ranking
  // system for the same real-world ranking table.
  if (input.skipRankingWrites) return;
  for (const [index, snapshot] of input.plan.rankingSnapshots.entries()) {
    const ranking = input.parsed.flatMap((item) => item.rankings)[index];
    if (!ranking) continue;
    await insertIgnore(input.client, "ranking_systems", [{
      id: snapshot.systemId, provider_id: providerId,
      slug: slug("osl-ranking", [ranking.category, ranking.gender, ranking.weightClass, ranking.division].filter(Boolean).join("-")),
      name: ranking.title, ranking_kind: "external-source-order", discipline: "streetlifting",
      category: ranking.category, division: ranking.division ?? null, weight_class: ranking.weightClass ?? null,
      sex_division: ranking.gender ?? null, geographic_scope: "world", methodology_version: "source-order-v1",
      methodology_notes: "External Official Streetlifting source order; not a Cali Central ranking.", status: "draft",
    }]);
    const sourceRecordId = sourceIds.get(snapshot.sourceUrl) ?? fallbackSourceId;
    await insertIgnore(input.client, "ranking_snapshots", [{
      id: snapshot.id, ranking_system_id: snapshot.systemId, ranking_date: input.observedOn,
      checked_at: `${input.observedOn}T00:00:00.000Z`, source_record_id: sourceRecordId,
      methodology_version: "source-order-v1", publication_status: "draft",
    }]);
    await insertIgnore(input.client, "ranking_entries", snapshot.entries.flatMap((entry, entryIndex) => {
      if (entry.blocked || !entry.athleteCanonicalId) return [];
      const source = ranking.entries[entryIndex];
      return [{
        id: stableDataOpsUuid("calicentral:official-streetlifting:ranking-entry", `${snapshot.id}:${entry.athleteCanonicalId}`),
        ranking_snapshot_id: snapshot.id, athlete_id: entry.athleteCanonicalId,
        rank: entry.rank ?? null, source_value: { totalKg: source?.totalKg, score: source?.score, externalResultId: source?.externalResultId },
        entry_status: "ranked",
      }];
    }));
  }
}

async function main() {
  const specs = inputSpecs();
  if (!specs.length) throw new Error("At least one --input=entity-type,file,source-url is required.");
  const observedOn = argumentsFor("observed-on")[0];
  if (!observedOn || !/^\d{4}-\d{2}-\d{2}$/.test(observedOn)) throw new Error("--observed-on=YYYY-MM-DD is required.");
  const observedAt = `${observedOn}T00:00:00.000Z`;
  const parsed = await Promise.all(specs.map((spec) => parseInput(spec, observedAt)));
  const parsedResults = parsed.flatMap((item) => [...item.results, ...item.rankings.flatMap((ranking) => ranking.entries)]);
  const competitions = dedupeCompetitions([...parsed.flatMap((item) => item.competitions), ...resultCompetitions(parsedResults)]);
  const wantsWrite = has("write");
  const wantsPreviewPlan = has("preview-plan");
  let client: SupabaseClient | undefined;
  let readClient: SupabaseClient | undefined;
  let before: Record<string, number> | undefined;
  let existingAthletes: ExistingExternalIdentity[] = [];
  let existingCompetitions: ExistingCompetitionIdentity[] = [];
  if (wantsWrite) {
    const wantsLocal = has("confirm-local-import");
    const wantsPreview = has("confirm-preview-import");
    if (wantsLocal === wantsPreview) {
      throw new Error("Writes require exactly one of --confirm-local-import or --confirm-preview-import.");
    }
    const config = wantsLocal ? localConfiguration() : previewConfiguration();
    client = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    readClient = client;
    before = await counts(client);
  } else if (wantsPreviewPlan) {
    const config = previewConfiguration();
    readClient = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (readClient) {
    const [athleteResult, competitionResult] = await Promise.all([
      readClient.from("external_athlete_identities").select("athlete_id, provider, external_id"),
      readClient.from("external_competition_identities").select("competition_id, provider, external_id, competitions(start_date, status)"),
    ]);
    if (athleteResult.error || competitionResult.error) throw new Error(athleteResult.error?.message ?? competitionResult.error?.message);
    existingAthletes = (athleteResult.data ?? []).map((row) => ({ canonicalId: row.athlete_id, provider: row.provider, externalId: row.external_id }));
    existingCompetitions = (competitionResult.data ?? []).map((row) => {
      const competition = row.competitions as unknown as { start_date?: string | null; status?: string | null } | null;
      return {
        canonicalId: row.competition_id, provider: row.provider, externalId: row.external_id,
        ...(competition?.start_date ? { startDate: competition.start_date } : {}),
        ...(competition?.status ? { status: competition.status } : {}),
      };
    });
  }
  const plan = planOfficialStreetliftingImport({
    competitions, results: parsed.flatMap((item) => item.results), rankings: parsed.flatMap((item) => item.rankings),
    observedOn, existingAthleteIdentities: existingAthletes, existingCompetitionIdentities: existingCompetitions,
  });
  if (plan.errors.length) throw new Error(`Import planning failed: ${plan.errors.join(" ")}`);
  if (client) await writeLocal({ parsed, observedOn, plan, client, skipRankingWrites: has("skip-ranking-writes") });
  const after = client ? await counts(client) : undefined;
  const created = before && after ? Object.fromEntries(TABLES.map((table) => [table, after[table] - before[table]])) : undefined;
  const mode = client
    ? (has("confirm-preview-import") ? "preview-write" : "local-write")
    : (wantsPreviewPlan ? "preview-plan" : "dry-run");
  process.stdout.write(`${JSON.stringify({
    mode, sourceSnapshots: parsed.length,
    parsedCounts: { competitions: competitions.length, results: parsed.flatMap((item) => item.results).length, rankingSystems: plan.rankingSnapshots.length, rankingEntries: plan.rankingSnapshots.reduce((sum, snapshot) => sum + snapshot.entries.length, 0) },
    normalizedCounts: { athletes: plan.athletes.length, competitions: plan.competitions.length, results: plan.results.length, rankingSnapshots: plan.rankingSnapshots.length },
    newAthletes: plan.athletes.filter((item) => item.state === "new").length,
    matchedAthletes: plan.athletes.filter((item) => item.state === "matched").length,
    ambiguousAthletes: plan.athletes.filter((item) => item.state === "ambiguous").length,
    newCompetitions: plan.competitions.filter((item) => item.state === "new").length,
    matchedCompetitions: plan.competitions.filter((item) => item.state === "matched").length,
    blockedResults: plan.results.filter((item) => item.blocked).length,
    warnings: plan.warnings, errors: plan.errors, ...(created ? { created } : {}),
  }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown import error"}\n`);
  process.exitCode = 1;
});
