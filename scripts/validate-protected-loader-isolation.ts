import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contributors = readFileSync("lib/operations/contributors.ts", "utf8");
const submissions = readFileSync("lib/operations/submissions.ts", "utf8");
const supabaseReads = readFileSync("lib/operations/supabase-read.ts", "utf8");

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} must remain exported`);
  const next = source.indexOf("\nexport ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

for (const [source, name, supabaseFunction] of [
  [contributors, "getOwnContributorProfile", "getSupabaseOwnContributorProfile"],
  [submissions, "getContributorSubmissions", "getSupabaseContributorSubmissions"],
  [submissions, "countContributorSubmissions", "countSupabaseContributorSubmissions"],
  [submissions, "getAdminSubmissionQueue", "getSupabaseAdminSubmissionQueue"],
  [submissions, "countAdminSubmissions", "countSupabaseAdminSubmissions"],
  [submissions, "getAdminActionableSubmissionCounts", "getSupabaseAdminActionableSubmissionCounts"],
  [submissions, "getAdminDashboard", "getSupabaseAdminDashboard"],
] as const) {
  const body = functionBody(source, name);
  const providerBranch = body.indexOf("if (useSupabaseAuth)");
  const supabaseCall = body.indexOf(supabaseFunction);
  const legacyClient = body.indexOf("requireOperationsClient()");
  assert(providerBranch >= 0, `${name} must branch on the active auth provider`);
  assert(supabaseCall > providerBranch, `${name} must dispatch to ${supabaseFunction}`);
  assert(
    legacyClient === -1 || legacyClient > supabaseCall,
    `${name} must dispatch to Supabase before constructing the legacy Sanity client`,
  );
}

assert.match(
  supabaseReads,
  /createSupabaseServerClient/,
  "protected Supabase reads must use the cookie-bound server client",
);
assert.doesNotMatch(
  supabaseReads,
  /serviceRoleKey|createClient\s*\(/,
  "protected Supabase reads must not bypass RLS with a service-role client",
);

console.log(
  "Protected loader isolation validation passed: Supabase mode uses cookie-bound reads and legacy Sanity dispatch remains available.",
);
