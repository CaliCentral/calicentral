import { createClient } from "@supabase/supabase-js";

// Read-only row-count snapshot against the Supabase preview project, used
// before and after a preview import to compare exact counts. Never selects
// or prints row content -- only count(*) per table -- so it can never leak
// PII regardless of what real data exists in the target tables.
const TABLES = [
  "athletes", "competitions", "sporting_results", "sporting_result_performances",
  "editorial_content", "editorial_publication_state", "stories", "videos",
  "ranking_providers", "ranking_systems", "ranking_snapshots", "ranking_entries",
  "members", "profiles", "member_roles", "submissions", "authors", "video_series",
  "site_settings", "external_athlete_identities", "audit_events", "source_records",
] as const;

const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const hostname = new URL(url).hostname;
  if (hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error(`Refusing to snapshot any host other than the approved preview project (${APPROVED_PREVIEW_HOSTNAME}). Got: ${hostname}.`);
  }

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const counts: Record<string, number | string> = {};
  for (const table of TABLES) {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    counts[table] = error ? `error: ${error.message}` : (count ?? 0);
  }
  process.stdout.write(`${JSON.stringify({ target: hostname, generatedAt: new Date().toISOString(), counts }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown snapshot error"}\n`);
  process.exitCode = 1;
});
