import { createClient } from "@supabase/supabase-js";

// One-time, narrowly-scoped repair for the single real preview account
// affected by the missing Supabase-mode bootstrap-activation logic (see
// this session's auth-bug report). Updates exactly one members row by id,
// only if it is currently 'pending', and records an audit_events row for
// the same reason the legacy Sanity path already does ("Bootstrap access
// activated the contributor profile"). Never touches any other row, never
// creates a member, never grants a member_roles capability -- RLS role
// grants remain a separate, deliberate action.
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  if (new URL(url).hostname !== APPROVED_PREVIEW_HOSTNAME) {
    throw new Error(`Refusing to run against any host other than the approved preview project (${APPROVED_PREVIEW_HOSTNAME}).`);
  }

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: members, error: selectError } = await client.from("members").select("id, access_status");
  if (selectError) throw new Error(`Failed reading members: ${selectError.message}`);
  if (members.length !== 1) throw new Error(`Expected exactly one member row in preview, found ${members.length}. Refusing to guess which one to repair.`);

  const member = members[0];
  if (member.access_status !== "pending") {
    console.log(`Member access_status is already "${member.access_status}", not "pending" -- no repair needed.`);
    return;
  }

  const { error: updateError } = await client.from("members").update({ access_status: "active" }).eq("id", member.id);
  if (updateError) throw new Error(`Failed activating member: ${updateError.message}`);

  const { error: auditError } = await client.from("audit_events").insert({
    event_type: "contributorReactivated",
    actor_principal: "manual-preview-repair",
    target_type: "member",
    target_id: member.id,
    summary: "Manual repair: bootstrap access activated after the Supabase-mode migration bug left the account pending (Auth.js path had equivalent logic; Supabase path did not).",
    metadata: { previous_access_status: "pending", next_access_status: "active", repair: "manual-preview-account-repair" },
  });
  if (auditError) throw new Error(`Activated the member but failed to record the audit event: ${auditError.message}`);

  console.log("Repaired: member access_status pending -> active. Audit event recorded.");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown repair error"}\n`);
  process.exitCode = 1;
});
