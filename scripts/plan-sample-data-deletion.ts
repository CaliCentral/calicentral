import { createClient } from "@supabase/supabase-js";

// Read-only sample-data deletion PLANNER. This never deletes anything --
// there is no write path in this file at all, deliberately, because
// executing a hosted deletion requires separate owner approval. It reports,
// for every athlete/competition/organization/team/product classified
// fictional_sample (see scripts/classify-provenance.ts; classification
// itself never uses a name field), every dependent row across the schema
// that would need handling first, in FK-safe order, derived from the actual
// `references ... on delete ...` constraints declared in
// supabase/migrations/202608290002_editorial_and_sport.sql and
// 202608290003_community_training_media.sql -- not guessed.
//
// A fixed set of tables is never included in the plan, regardless of any FK
// path: real identity/authorization data (members, profiles, roles),
// immutable history (audit_events), and source/provider configuration. If
// deleting a fictional entity would require touching one of those (for
// example because a real member holds an athlete_claims row against a
// fictional athlete), that dependency is reported under
// "requiresManualReview" instead of being silently included.
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

const PROTECTED_TABLES = new Set([
  "members", "profiles", "profile_social_accounts", "submissions", "audit_events",
  "source_adapters", "ranking_providers", "roles", "capabilities",
  "member_roles", "member_capabilities", "raw_source_snapshots", "source_extractions",
  "identity_resolution_attempts", "change_proposals", "auto_apply_policies",
  "operational_locks",
]);

type Dependent = {
  readonly table: string;
  readonly column: string;
  readonly onDelete: "restrict" | "cascade" | "set null";
  // A column on this same table that, if non-null, points at a real member
  // and must be surfaced for manual review rather than deleted silently.
  readonly realMemberColumn?: string;
};

// Direct dependents of each seed table, verified against the migrations
// (grep "references public.<table>(" in supabase/migrations/*.sql).
const DEPENDENTS: Record<"athletes" | "competitions" | "organizations" | "teams" | "products", readonly Dependent[]> = {
  athletes: [
    { table: "external_athlete_identities", column: "athlete_id", onDelete: "restrict" },
    { table: "athlete_claims", column: "athlete_id", onDelete: "restrict", realMemberColumn: "claimant_member_id" },
    { table: "athlete_profile_controls", column: "athlete_id", onDelete: "cascade" },
    { table: "claimed_athlete_presentations", column: "athlete_id", onDelete: "cascade" },
    { table: "team_affiliations", column: "athlete_id", onDelete: "restrict" },
    { table: "sporting_results", column: "athlete_id", onDelete: "restrict" },
    { table: "ranking_entries", column: "athlete_id", onDelete: "restrict" },
  ],
  competitions: [
    { table: "external_competition_identities", column: "competition_id", onDelete: "restrict" },
    { table: "sporting_results", column: "competition_id", onDelete: "restrict" },
    { table: "personal_records", column: "competition_id", onDelete: "restrict", realMemberColumn: "member_id" },
  ],
  organizations: [
    { table: "teams", column: "organization_id", onDelete: "set null" },
    { table: "rulesets", column: "organization_id", onDelete: "set null" },
    { table: "competitions", column: "organization_id", onDelete: "set null" },
    { table: "ranking_providers", column: "organization_id", onDelete: "set null" },
    { table: "products", column: "organization_id", onDelete: "set null" },
    { table: "organization_memberships", column: "organization_id", onDelete: "restrict", realMemberColumn: "member_id" },
  ],
  teams: [
    { table: "team_seasons", column: "team_id", onDelete: "cascade" },
    { table: "team_affiliations", column: "team_id", onDelete: "cascade" },
    { table: "sporting_results", column: "team_id", onDelete: "restrict" },
    { table: "team_memberships", column: "team_id", onDelete: "restrict", realMemberColumn: "member_id" },
    { table: "team_invitations", column: "team_id", onDelete: "restrict" },
  ],
  products: [],
};

// sporting_result_performances references sporting_results.id (not an
// athlete/competition id directly), so it is only reachable one level down
// -- handled separately below once fictional sporting_results ids are known.

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const hostname = new URL(url).hostname;
  if (!LOOPBACK_HOSTNAMES.has(hostname) && hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error(`Refusing to plan against any host other than loopback or the approved preview project. Got: ${hostname}.`);
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

  const athletes = await client.from("athletes").select("id");
  if (athletes.error) throw new Error(athletes.error.message);
  const competitions = await client.from("competitions").select("id");
  if (competitions.error) throw new Error(competitions.error.message);

  const athleteIdentities = await client
    .from("external_athlete_identities")
    .select("athlete_id, source_record_id");
  if (athleteIdentities.error) throw new Error(athleteIdentities.error.message);
  const competitionIdentities = await client
    .from("external_competition_identities")
    .select("competition_id, source_record_id");
  if (competitionIdentities.error) throw new Error(competitionIdentities.error.message);
  const sportingResults = await client
    .from("sporting_results")
    .select("athlete_id, competition_id, source_record_id");
  if (sportingResults.error) throw new Error(sportingResults.error.message);

  const fictionalAthletes = new Set<string>();
  const fictionalCompetitions = new Set<string>();
  for (const row of athleteIdentities.data ?? []) {
    if (row.source_record_id && fictionalSourceRecordIds.has(row.source_record_id)) fictionalAthletes.add(row.athlete_id);
  }
  for (const row of competitionIdentities.data ?? []) {
    if (row.source_record_id && fictionalSourceRecordIds.has(row.source_record_id)) fictionalCompetitions.add(row.competition_id);
  }
  for (const row of sportingResults.data ?? []) {
    if (!row.source_record_id || !fictionalSourceRecordIds.has(row.source_record_id)) continue;
    if (row.athlete_id) fictionalAthletes.add(row.athlete_id);
    if (row.competition_id) fictionalCompetitions.add(row.competition_id);
  }

  // Only athletes/competitions have a source-linkage path today (see the
  // classify-provenance.ts note on organizations/teams/products lacking any
  // identity/source join table) -- those three remain empty here, matching
  // the same evidence gap, not a different rule.
  const fictional = {
    athletes: [...fictionalAthletes],
    competitions: [...fictionalCompetitions],
    organizations: [] as string[],
    teams: [] as string[],
    products: [] as string[],
  };
  const seedCounts = {
    athletes: fictional.athletes.length,
    competitions: fictional.competitions.length,
    organizations: fictional.organizations.length,
    teams: fictional.teams.length,
    products: fictional.products.length,
  };

  const dependents: Array<{
    seedTable: string;
    table: string;
    column: string;
    onDelete: string;
    matchingRows: number;
    requiresManualReview: { realMemberColumn: string; distinctRealMembers: number } | null;
  }> = [];
  const notices: string[] = [];

  for (const [seedTable, ids] of Object.entries(fictional) as [keyof typeof DEPENDENTS, string[]][]) {
    if (!ids.length) continue;
    for (const dependent of DEPENDENTS[seedTable]) {
      if (PROTECTED_TABLES.has(dependent.table)) {
        notices.push(
          `${seedTable} -> ${dependent.table}.${dependent.column} is a protected table and was skipped entirely, not just its real-member column.`,
        );
        continue;
      }
      const columns = dependent.realMemberColumn
        ? `${dependent.column}, ${dependent.realMemberColumn}`
        : dependent.column;
      const result = await client.from(dependent.table).select(columns).in(dependent.column, ids);
      if (result.error) throw new Error(`${dependent.table}: ${result.error.message}`);
      const rows = (result.data ?? []) as unknown as Record<string, unknown>[];
      const requiresManualReview = dependent.realMemberColumn
        ? {
            realMemberColumn: dependent.realMemberColumn,
            distinctRealMembers: new Set(
              rows.map((row) => row[dependent.realMemberColumn as string]).filter(Boolean),
            ).size,
          }
        : null;
      dependents.push({
        seedTable,
        table: dependent.table,
        column: dependent.column,
        onDelete: dependent.onDelete,
        matchingRows: rows.length,
        requiresManualReview: requiresManualReview && requiresManualReview.distinctRealMembers > 0 ? requiresManualReview : null,
      });
    }
  }

  // One level deeper: sporting_result_performances references
  // sporting_results.id, discovered from the sporting_results rows already
  // found above rather than a second seed-id lookup.
  const sportingResultsDependent = dependents.find((row) => row.table === "sporting_results");
  if (sportingResultsDependent && fictional.athletes.length + fictional.competitions.length > 0) {
    const resultIdsResult = await client
      .from("sporting_results")
      .select("id")
      .or(
        [
          fictional.athletes.length ? `athlete_id.in.(${fictional.athletes.join(",")})` : null,
          fictional.competitions.length ? `competition_id.in.(${fictional.competitions.join(",")})` : null,
        ]
          .filter(Boolean)
          .join(","),
      );
    if (resultIdsResult.error) throw new Error(resultIdsResult.error.message);
    const resultIds = (resultIdsResult.data ?? []).map((row) => row.id as string);
    if (resultIds.length) {
      const performances = await client
        .from("sporting_result_performances")
        .select("id")
        .in("sporting_result_id", resultIds);
      if (performances.error) throw new Error(performances.error.message);
      dependents.push({
        seedTable: "sporting_results (indirect)",
        table: "sporting_result_performances",
        column: "sporting_result_id",
        onDelete: "restrict",
        matchingRows: (performances.data ?? []).length,
        requiresManualReview: null,
      });
    }
  }

  // follows is a polymorphic (target_type, target_id) table with no FK
  // constraint at all -- Postgres would happily leave these rows dangling,
  // so they are surfaced explicitly rather than relying on a foreign key to
  // catch them.
  const followRows: Array<{ targetType: string; count: number }> = [];
  for (const [targetType, ids] of [
    ["athlete", fictional.athletes],
    ["competition", fictional.competitions],
    ["organization", fictional.organizations],
    ["team", fictional.teams],
  ] as const) {
    if (!ids.length) continue;
    const result = await client.from("follows").select("target_id").eq("target_type", targetType).in("target_id", ids);
    if (result.error) throw new Error(result.error.message);
    followRows.push({ targetType, count: (result.data ?? []).length });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        target: hostname,
        generatedAt: new Date().toISOString(),
        mode: "PLAN ONLY -- no deletion performed or possible from this script",
        seedCounts,
        seedIds: { athletes: fictional.athletes, competitions: fictional.competitions },
        dependents,
        follows: followRows,
        notices,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown planning error"}\n`);
  process.exitCode = 1;
});
