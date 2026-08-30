import assert from "node:assert/strict";

// CALI_CENTRAL_ADMIN_EMAILS / CALI_CENTRAL_EDITOR_EMAILS are read once at
// module load time (lib/auth/config.ts), so they must be set before the
// module graph is imported. Run via `npm run test:auth`, which registers
// scripts/test-shims/allow-server-only.mjs so this plain Node script can
// import the `import "server-only"`-guarded lib/auth/identity.ts module.
process.env.CALI_CENTRAL_ADMIN_EMAILS = "admin@example.test";
process.env.CALI_CENTRAL_EDITOR_EMAILS = "editor@example.test";
process.env.AUTH_MIGRATION_PROVIDER = "supabase";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
process.env.NEXT_PUBLIC_SITE_URL = "https://cali-central-preview.vercel.app";
process.env.SITE_STAGE = "production";
process.env.AUTH_URL = "https://cali-central-preview.vercel.app";
process.env.AUTH_SECRET = "";
process.env.GOOGLE_CLIENT_ID = "";
process.env.GOOGLE_CLIENT_SECRET = "";
process.env.GITHUB_CLIENT_ID = "";
process.env.GITHUB_CLIENT_SECRET = "";

type ResolveEffectiveRole = typeof import("@/lib/auth/identity").resolveEffectiveRole;
let resolveEffectiveRole: ResolveEffectiveRole;

async function validateSupabaseIncompleteProfileIsAValidAccountState() {
  const { buildSupabaseAccountOverview } = await import("@/lib/account/overview");
  const overview = buildSupabaseAccountOverview({
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      displayName: "Preview Member",
      email: "member@example.test",
      avatarUrl: null,
      role: "contributor",
      accessStatus: "active",
      authProvider: "google",
      profileConfigured: false,
    },
    profile: {
      display_name: "Preview Member",
      avatar_url: null,
      biography: "",
      country: null,
      administrative_area: null,
      city: null,
      interests: [],
      profile_configured: false,
      created_at: "2026-08-30T00:00:00.000Z",
    },
    submissions: [],
  });

  assert.equal(overview.profileComplete, false);
  assert.equal(overview.profile.accessStatus, "active");
  assert.equal(overview.profile.role, "contributor");
  assert.equal(overview.totalSubmissions, 0);
  assert.deepEqual(overview.latestSubmissions, []);
}

async function validateProviderReadinessBoundaries() {
  const [{ authConfiguration, isAuthConfigured }, supabase, providerSelection] =
    await Promise.all([
      import("@/lib/auth/config"),
      import("@/lib/supabase/config"),
      import("@/lib/auth/provider-selection"),
    ]);

  assert.equal(
    supabase.isSupabaseAuthConfigured,
    true,
    "Supabase mode with its public configuration and a canonical deployment origin must be available without Auth.js credentials",
  );
  assert.equal(
    isAuthConfigured,
    false,
    "Auth.js must remain unavailable when AUTH_SECRET and OAuth provider credentials are absent",
  );
  assert.equal(
    authConfiguration.authUrlConfigured,
    true,
    "the canonical Vercel origin must be accepted by AUTH_URL parsing for Auth.js dual-run readiness",
  );
  assert.deepEqual(
    providerSelection.authProviderSelection,
    { mode: "supabase", configured: true },
    "the sign-in readiness gate must select the configured Supabase path",
  );
  assert.deepEqual(
    providerSelection.resolveAuthProviderSelection({
      useSupabase: true,
      supabaseConfigured: false,
      authJsConfigured: true,
    }),
    { mode: "supabase", configured: false },
    "an incomplete selected Supabase path must fail closed instead of silently falling back to Auth.js",
  );
  assert.deepEqual(
    providerSelection.resolveAuthProviderSelection({
      useSupabase: false,
      supabaseConfigured: true,
      authJsConfigured: false,
    }),
    { mode: "authjs", configured: false },
    "Auth.js mode must fail closed when its own required configuration is absent",
  );
}

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
  await validateProviderReadinessBoundaries();
  await validateSupabaseIncompleteProfileIsAValidAccountState();

  console.log("validate-auth-bootstrap: all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
