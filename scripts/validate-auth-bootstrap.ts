import assert from "node:assert/strict";

// CALI_CENTRAL_ADMIN_EMAILS / CALI_CENTRAL_EDITOR_EMAILS are read once at
// module load time (lib/auth/config.ts), so they must be set before the
// module graph is imported. Run via `npm run test:auth`, which registers
// scripts/test-shims/allow-server-only.mjs so this plain Node script can
// import the `import "server-only"`-guarded lib/auth/identity.ts module.
process.env.CALI_CENTRAL_ADMIN_EMAILS = "admin@example.test";
process.env.CALI_CENTRAL_EDITOR_EMAILS = "editor@example.test";

type ResolveEffectiveRole = typeof import("@/lib/auth/identity").resolveEffectiveRole;
let resolveEffectiveRole: ResolveEffectiveRole;

// This is the exact function the Supabase auth bridge
// (lib/auth/supabase-session.ts's getSupabasePortalUser) was fixed to call,
// mirroring what the Auth.js session callback has always done. Auth.js and
// Supabase now share this single implementation rather than each carrying
// their own bootstrap-role logic that could drift apart.
function validateFirstLoginBootstrapUpgrade() {
  assert.equal(
    resolveEffectiveRole("contributor", "admin@example.test"),
    "admin",
    "a first-time sign-in from an admin-allowlisted email must resolve to admin on first login, before any member_roles row exists",
  );
  assert.equal(
    resolveEffectiveRole("contributor", "editor@example.test"),
    "editor",
    "a first-time sign-in from an editor-allowlisted email must resolve to editor on first login",
  );
  assert.equal(
    resolveEffectiveRole("contributor", "ADMIN@EXAMPLE.TEST"),
    "admin",
    "allowlist matching must be case-insensitive, since OAuth providers do not normalize email casing consistently",
  );
}

function validateNonAdminEmailsStayNonAdmin() {
  assert.equal(
    resolveEffectiveRole("contributor", "member@example.test"),
    "contributor",
    "an email absent from both allowlists must not be elevated",
  );
  assert.equal(
    resolveEffectiveRole("contributor", null),
    "contributor",
    "a missing/unverified email must not be elevated",
  );
  assert.equal(
    resolveEffectiveRole("contributor", undefined),
    "contributor",
    "an undefined email must not be elevated",
  );
}

function validateBootstrapNeverDowngradesADatabaseGrant() {
  assert.equal(
    resolveEffectiveRole("admin", "member@example.test"),
    "admin",
    "a real member_roles-granted admin must never be downgraded because the signed-in email later drops off (or was never on) the bootstrap allowlist",
  );
  assert.equal(
    resolveEffectiveRole("editor", "admin@example.test"),
    "admin",
    "bootstrap role and stored role must combine via the higher of the two, never the bootstrap value overriding a lower explicit grant incorrectly or vice versa",
  );
}

async function main() {
  ({ resolveEffectiveRole } = await import("@/lib/auth/identity"));

  validateFirstLoginBootstrapUpgrade();
  validateNonAdminEmailsStayNonAdmin();
  validateBootstrapNeverDowngradesADatabaseGrant();

  console.log("validate-auth-bootstrap: all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
