import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contributors = readFileSync("lib/operations/contributors.ts", "utf8");
const submissions = readFileSync("lib/operations/submissions.ts", "utf8");
const supabaseReads = readFileSync("lib/operations/supabase-read.ts", "utf8");
const supabaseWrites = readFileSync("lib/operations/supabase-write.ts", "utf8");
const locks = readFileSync("lib/operations/locks.ts", "utf8");

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
  [submissions, "getSubmissionForContributor", "getSupabaseSubmissionForContributor"],
  [submissions, "getSubmissionForReview", "getSupabaseSubmissionForReview"],
  [submissions, "getAuditEvents", "getSupabaseAuditEvents"],
  [submissions, "getContributorAuditEvents", "getSupabaseContributorAuditEvents"],
  [contributors, "getContributorForAdmin", "getSupabaseContributorForAdmin"],
  [contributors, "getContributorForEditor", "getSupabaseContributorForEditor"],
  [contributors, "getAssignableReviewers", "getSupabaseAssignableReviewers"],
  [submissions, "getSubmissionMutationTarget", "getSupabaseSubmissionMutationTarget"],
  [submissions, "createSubmissionRecord", "createSupabaseSubmissionRecord"],
  [submissions, "updateSubmissionRecord", "updateSupabaseSubmissionRecord"],
  [submissions, "transitionSubmissionRecord", "transitionSupabaseSubmissionRecord"],
  [submissions, "assignSubmissionReviewerRecord", "assignSupabaseSubmissionReviewer"],
  [submissions, "addPrivateEditorialNoteRecord", "addSupabasePrivateEditorialNote"],
  [submissions, "updateVisibleFeedbackRecord", "updateSupabaseVisibleFeedback"],
  [submissions, "updateSubmissionPriorityRecord", "updateSupabaseSubmissionPriority"],
  [contributors, "updateContributorProfileRecord", "updateSupabaseContributorProfileRecord"],
  [contributors, "updateContributorRoleRecord", "updateSupabaseContributorRoleRecord"],
  [contributors, "updateContributorAccessRecord", "updateSupabaseContributorAccessRecord"],
  [contributors, "updateContributorInternalNotesRecord", "updateSupabaseContributorInternalNotesRecord"],
  [contributors, "countOtherEffectiveAdministrators", "countSupabaseOtherEffectiveAdministrators"],
  [submissions, "getContributorAccountOverview", "getSupabaseContributorAccountOverview"],
  [contributors, "getContributorDirectory", "getSupabaseContributorDirectory"],
  [contributors, "countContributorProfiles", "countSupabaseContributorProfiles"],
  [contributors, "countActiveContributorSubmissions", "countSupabaseActiveContributorSubmissions"],
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

assert(
  locks.indexOf("if (useSupabaseAuth)") >= 0 &&
    locks.indexOf("if (useSupabaseAuth)") < locks.indexOf("requireOperationsClient()"),
  "getAdministratorMutationGuard must skip the Sanity-only lock document in Supabase mode, relying on the 202608300009 database trigger instead",
);

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
assert.match(
  supabaseWrites,
  /createSupabaseServerClient/,
  "protected Supabase writes must use the cookie-bound server client",
);
assert.doesNotMatch(
  supabaseWrites,
  /serviceRoleKey|createClient\s*\(/,
  "protected Supabase writes must not bypass RLS with a service-role client",
);

console.log(
  "Protected loader isolation validation passed: Supabase mode uses cookie-bound reads/writes and legacy Sanity dispatch remains available.",
);
