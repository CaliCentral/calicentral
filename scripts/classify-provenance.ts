import { createClient } from "@supabase/supabase-js";

// Deterministic provenance classification report, read-only by default.
// This only issues SELECTs, against either a local loopback stack or the
// one approved preview project, same host-lock discipline as
// scripts/migration/snapshot-preview-counts.ts -- unless run with
// --write --confirm-preview-write, in which case it backfills the stored
// provenance_status column using this exact classification, and only for
// rows currently stored as "unknown" (never overwrites or downgrades a
// value already set by this or any other process).
//
// Classification never inspects a name field. It relies only on structural
// evidence:
//   - a source_records.provider containing "(fictional)" is an explicit
//     provider/institution-attribution marker (not a person's name) used by
//     the known development seed data.
//   - a source-confirmed external identity or sporting-result link to a
//     non-fictional source record is real, verified evidence.
//   - a legacy_sanity_id with neither of the above is real content of
//     unconfirmed provenance (it migrated from the CMS, but nothing here
//     proves it isn't Sanity-side sample data either) -- never upgraded to
//     real_verified or downgraded to fictional_sample by guesswork.
//   - anything else is unknown. unknown is never collapsed into real or
//     fictional.
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

type ProvenanceStatus =
  | "real_verified"
  | "real_unverified"
  | "fictional_sample"
  | "unknown";

const PROVENANCE_STATUSES: readonly ProvenanceStatus[] = [
  "real_verified",
  "real_unverified",
  "fictional_sample",
  "unknown",
];

function emptyCounts(): Record<ProvenanceStatus, number> {
  return { real_verified: 0, real_unverified: 0, fictional_sample: 0, unknown: 0 };
}

function classify(input: {
  readonly hasFictionalSourceLink: boolean;
  readonly hasSourceConfirmedIdentity: boolean;
  readonly hasLegacySanityId: boolean;
}): ProvenanceStatus {
  if (input.hasFictionalSourceLink) return "fictional_sample";
  if (input.hasSourceConfirmedIdentity) return "real_verified";
  if (input.hasLegacySanityId) return "real_unverified";
  return "unknown";
}

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  const hostname = new URL(url).hostname;
  if (!LOOPBACK_HOSTNAMES.has(hostname) && hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error(
      `Refusing to classify any host other than loopback or the approved preview project. Got: ${hostname}.`,
    );
  }
  if (has("write") && !has("confirm-preview-write")) {
    throw new Error("Backfill writes require --write --confirm-preview-write.");
  }

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const sourceRecords = await client
    .from("source_records")
    .select("id, provider, external_record_id, verification_state");
  if (sourceRecords.error) throw new Error(sourceRecords.error.message);
  const fictionalSourceRecordIds = new Set(
    (sourceRecords.data ?? [])
      .filter((row) => /\(fictional\)/i.test(row.provider ?? ""))
      .map((row) => row.id as string),
  );
  const confirmedSourceRecords = (sourceRecords.data ?? []).filter(
    (row) => row.verification_state === "source-confirmed" && !fictionalSourceRecordIds.has(row.id),
  );
  const confirmedSourceRecordIds = new Set(confirmedSourceRecords.map((row) => row.id as string));
  // The Sanity -> Supabase migration did not always populate
  // external_*_identities.source_record_id, so a confirmed source record
  // that shares the same (provider, external id) tuple as an identity row is
  // also treated as a match -- the same (provider, externalId) pair this
  // codebase already uses elsewhere as the sole identity key (see
  // lib/data-ops/identity.ts), not a new ad hoc rule.
  const confirmedByProviderAndExternalId = new Set(
    confirmedSourceRecords
      .filter((row) => row.external_record_id)
      .map((row) => `${row.provider} ${row.external_record_id}`),
  );

  const athletes = await client.from("athletes").select("id, legacy_sanity_id, provenance_status");
  if (athletes.error) throw new Error(athletes.error.message);
  const competitions = await client.from("competitions").select("id, legacy_sanity_id, provenance_status");
  if (competitions.error) throw new Error(competitions.error.message);
  const organizations = await client.from("organizations").select("id, legacy_sanity_id");
  if (organizations.error) throw new Error(organizations.error.message);
  const teams = await client.from("teams").select("id, legacy_sanity_id");
  if (teams.error) throw new Error(teams.error.message);
  const products = await client.from("products").select("id, legacy_sanity_id");
  if (products.error) throw new Error(products.error.message);

  const athleteIdentities = await client
    .from("external_athlete_identities")
    .select("athlete_id, provider, external_id, source_record_id, verification_state");
  if (athleteIdentities.error) throw new Error(athleteIdentities.error.message);
  const competitionIdentities = await client
    .from("external_competition_identities")
    .select("competition_id, provider, external_id, source_record_id");
  if (competitionIdentities.error) throw new Error(competitionIdentities.error.message);
  const sportingResults = await client
    .from("sporting_results")
    .select("athlete_id, competition_id, source_record_id");
  if (sportingResults.error) throw new Error(sportingResults.error.message);

  const athleteFictionalIds = new Set<string>();
  const athleteVerifiedIds = new Set<string>();
  for (const row of athleteIdentities.data ?? []) {
    const byId = row.source_record_id;
    const byPair = `${row.provider} ${row.external_id}`;
    if (byId && fictionalSourceRecordIds.has(byId)) athleteFictionalIds.add(row.athlete_id);
    if ((byId && confirmedSourceRecordIds.has(byId)) || confirmedByProviderAndExternalId.has(byPair)) {
      athleteVerifiedIds.add(row.athlete_id);
    }
  }
  const competitionFictionalIds = new Set<string>();
  const competitionVerifiedIds = new Set<string>();
  for (const row of competitionIdentities.data ?? []) {
    const byId = row.source_record_id;
    const byPair = `${row.provider} ${row.external_id}`;
    if (byId && fictionalSourceRecordIds.has(byId)) competitionFictionalIds.add(row.competition_id);
    if ((byId && confirmedSourceRecordIds.has(byId)) || confirmedByProviderAndExternalId.has(byPair)) {
      competitionVerifiedIds.add(row.competition_id);
    }
  }
  for (const row of sportingResults.data ?? []) {
    if (!row.source_record_id) continue;
    const fictional = fictionalSourceRecordIds.has(row.source_record_id);
    const verified = confirmedSourceRecordIds.has(row.source_record_id);
    if (row.athlete_id && fictional) athleteFictionalIds.add(row.athlete_id);
    if (row.athlete_id && verified) athleteVerifiedIds.add(row.athlete_id);
    if (row.competition_id && fictional) competitionFictionalIds.add(row.competition_id);
    if (row.competition_id && verified) competitionVerifiedIds.add(row.competition_id);
  }

  const results: Record<string, { counts: Record<ProvenanceStatus, number>; manualReview: string[] }> = {};
  const backfillTargets: { table: string; id: string; status: ProvenanceStatus }[] = [];

  function classifyTable(
    name: string,
    rows: readonly { id: string; legacy_sanity_id: string | null; provenance_status?: string }[],
    fictionalIds: ReadonlySet<string>,
    verifiedIds: ReadonlySet<string>,
  ) {
    const counts = emptyCounts();
    const manualReview: string[] = [];
    for (const row of rows) {
      const hasFictionalSourceLink = fictionalIds.has(row.id);
      const hasSourceConfirmedIdentity = verifiedIds.has(row.id);
      if (hasFictionalSourceLink && hasSourceConfirmedIdentity) {
        // Conflicting evidence: never silently resolved one way or the
        // other -- flagged for a human, counted as unknown.
        manualReview.push(row.id);
        counts.unknown += 1;
        continue;
      }
      const status = classify({
        hasFictionalSourceLink,
        hasSourceConfirmedIdentity,
        hasLegacySanityId: Boolean(row.legacy_sanity_id),
      });
      counts[status] += 1;
      // Only ever backfills a row currently stored as "unknown" -- a row
      // already carrying any other stored value was set deliberately by
      // some other process and is never overwritten here, even if this
      // classification would compute something different.
      if (status !== "unknown" && row.provenance_status === "unknown") {
        backfillTargets.push({ table: name, id: row.id, status });
      }
    }
    results[name] = { counts, manualReview };
  }

  classifyTable("athletes", athletes.data ?? [], athleteFictionalIds, athleteVerifiedIds);
  classifyTable("competitions", competitions.data ?? [], competitionFictionalIds, competitionVerifiedIds);
  // organizations/teams/products have no external-identity or
  // sporting-result join table yet -- only legacy_sanity_id evidence exists,
  // so these can only ever resolve to real_unverified or unknown here.
  classifyTable("organizations", organizations.data ?? [], new Set(), new Set());
  classifyTable("teams", teams.data ?? [], new Set(), new Set());
  classifyTable("products", products.data ?? [], new Set(), new Set());

  let backfilled: Record<string, number> | undefined;
  if (has("write")) {
    backfilled = { athletes: 0, competitions: 0 };
    for (const target of backfillTargets) {
      const response = await client
        .from(target.table)
        .update({ provenance_status: target.status })
        .eq("id", target.id)
        .eq("provenance_status", "unknown");
      if (response.error) throw new Error(`Backfill failed for ${target.table} ${target.id}: ${response.error.message}`);
      backfilled[target.table] = (backfilled[target.table] ?? 0) + 1;
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        target: hostname,
        generatedAt: new Date().toISOString(),
        mode: has("write") ? "write" : "read-only",
        statuses: PROVENANCE_STATUSES,
        results,
        ...(backfilled ? { backfilled } : { backfillCandidates: backfillTargets.length }),
      },
      null,
      2,
    )}\n`,
  );
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown classification error"}\n`);
  process.exitCode = 1;
});
