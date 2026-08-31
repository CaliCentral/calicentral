import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Regression coverage for classify-provenance.ts's additive backfill mode:
// it must refuse to write without both --write and --confirm-preview-write,
// and it must keep the same host-lock as the read-only report (loopback or
// the one approved preview project) even when writing.
const ENTRY = "scripts/classify-provenance.ts";

function run(env: Record<string, string | undefined>, extraArgs: readonly string[]): { stderr: string; failed: boolean } {
  try {
    execFileSync(
      process.execPath,
      ["--import", "tsx", ENTRY, ...extraArgs],
      { env: { ...process.env, PATH: "/usr/bin:/bin", ...env }, stdio: ["ignore", "ignore", "pipe"] },
    );
    return { stderr: "", failed: false };
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    return { stderr, failed: true };
  }
}

function validateWriteWithoutConfirmationIsRefused() {
  const result = run(
    { SUPABASE_URL: "https://pwgpthnhopmquvuqqqys.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-fixture-credential-not-a-real-key" },
    ["--write"],
  );
  assert.equal(result.failed, true, "--write without --confirm-preview-write must be refused before any query runs");
  assert.match(result.stderr, /confirm-preview-write/, "the refusal must name the required confirmation flag");
}

function validateWriteStillRefusesUnapprovedHost() {
  const result = run(
    { SUPABASE_URL: "https://some-other-project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-fixture-credential-not-a-real-key" },
    ["--write", "--confirm-preview-write"],
  );
  assert.equal(result.failed, true, "an unapproved host must be refused even in write mode");
  assert.match(result.stderr, /approved preview project/i, "the refusal must name the approved-preview-project allowlist");
}

validateWriteWithoutConfirmationIsRefused();
validateWriteStillRefusesUnapprovedHost();

process.stdout.write(
  "Provenance classification write-safety validation passed: confirmation-flag gating and host-lock hold in write mode.\n",
);
