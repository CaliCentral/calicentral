import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Regression coverage for the local-vs-preview write gate in
// scripts/migration/common.ts's applyMigrationPlan: a cloud preview
// migration must never be able to silently proceed using local credentials,
// or against any host other than the one approved preview project. These
// invoke the real CLI entry point with controlled env/flags and assert on
// its refusal, the same checks that were previously done by hand.
const SANITY_ENTRY = "scripts/migration/sanity-to-supabase.ts";
const FIXTURE = "scripts/migration/fixtures/sanity.ndjson";
const PREVIEW_HOST = "https://pwgpthnhopmquvuqqqys.supabase.co";

function runMigration(env: Record<string, string>, extraArgs: readonly string[]): { stderr: string; failed: boolean } {
  try {
    execFileSync(
      "node",
      ["--import", "tsx", SANITY_ENTRY, `--input=${FIXTURE}`, ...extraArgs],
      { env: { ...process.env, ...env }, stdio: ["ignore", "ignore", "pipe"] },
    );
    return { stderr: "", failed: false };
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    return { stderr, failed: true };
  }
}

function validateGitignored() {
  assert.equal(existsSync(".gitignore"), true, ".gitignore must exist");
  // .env.preview-migration.local matches the repo's existing `.env*` gitignore
  // pattern (with only .env.example excluded) -- this asserts that pattern is
  // still present and unweakened, rather than re-implementing git's own
  // ignore-matching logic.
  const gitignore = readFileSync(".gitignore", "utf8");
  const lines = gitignore.split("\n").map((line) => line.trim());
  assert.equal(lines.includes(".env*"), true, ".gitignore must still ignore all .env* files, which is what protects .env.preview-migration.local");
}

function validateLocalUrlWithoutLocalFlag() {
  const result = runMigration({ SUPABASE_URL: "http://127.0.0.1:55321", SUPABASE_SERVICE_ROLE_KEY: "dummy" }, ["--write"]);
  assert.equal(result.failed, true, "a local-host write with no confirmation flag at all must be refused");
  assert.match(result.stderr, /confirm-local-migration/, "the refusal must name the local confirmation flag");
}

function validatePreviewUrlRequiresPreviewFlagNotLocalFlag() {
  // The exact failure mode this file exists to prevent: SUPABASE_URL resolves
  // to the approved preview host (e.g. because a preview env file was loaded)
  // but the command was run with the LOCAL confirmation flag (e.g. because a
  // developer's muscle memory, or a copy-pasted local command, supplied the
  // wrong one) -- this must be refused, not silently treated as a local write.
  const result = runMigration({ SUPABASE_URL: PREVIEW_HOST, SUPABASE_SERVICE_ROLE_KEY: "dummy" }, ["--write", "--confirm-local-migration"]);
  assert.equal(result.failed, true, "a preview-host write with only the LOCAL confirmation flag must be refused");
  assert.match(result.stderr, /confirm-preview-migration/, "the refusal must name the preview confirmation flag, not silently proceed as a local write");
}

function validatePreviewUrlWithoutAnyFlag() {
  const result = runMigration({ SUPABASE_URL: PREVIEW_HOST, SUPABASE_SERVICE_ROLE_KEY: "dummy" }, ["--write"]);
  assert.equal(result.failed, true, "a preview-host write with no confirmation flag at all must be refused");
  assert.match(result.stderr, /confirm-preview-migration/);
}

function validateArbitraryHostRefusedEvenWithBothFlags() {
  const result = runMigration(
    { SUPABASE_URL: "https://some-other-project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "dummy" },
    ["--write", "--confirm-local-migration", "--confirm-preview-migration"],
  );
  assert.equal(result.failed, true, "a write to any host other than localhost or the one approved preview project must be refused, with no override flag");
  assert.match(result.stderr, /refuses to contact/, "the refusal must be the categorical host-refusal message, not a flag-specific one");
}

function validateDryRunNeverNeedsAnyCredentialCheck() {
  // Confirms the gate only activates for --write -- a dry-run (this session's
  // default, safe mode) must never require any of these flags or even a
  // valid-looking SUPABASE_URL, so read-only classification/planning work is
  // never accidentally blocked by this credential-isolation guard.
  const result = runMigration({}, []);
  assert.equal(result.failed, false, "a plain dry-run (no --write) must succeed with zero Supabase configuration at all");
}

validateGitignored();
validateLocalUrlWithoutLocalFlag();
validatePreviewUrlRequiresPreviewFlagNotLocalFlag();
validatePreviewUrlWithoutAnyFlag();
validateArbitraryHostRefusedEvenWithBothFlags();
validateDryRunNeverNeedsAnyCredentialCheck();

process.stdout.write("Migration credential-isolation validation passed: gitignore coverage, local/preview flag separation, categorical host refusal, dry-run unaffected.\n");
