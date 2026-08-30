import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Regression coverage for the local-only rehearsal importer's write gate:
// it must never write to any non-loopback Supabase host, no matter what
// flags or credentials are supplied, because it derives connection details
// exclusively from the local `supabase status` CLI output rather than from
// environment variables or command-line overrides. This invokes the real
// script against a fake `supabase` binary that reports a cloud project, the
// same way validate-migration-credential-isolation.ts proves the migration
// tool's host refusal.
const ENTRY = "scripts/import-official-streetlifting-supabase.ts";

const FIXTURE_HTML = `<h1>Male Classic -80kg Rankings</h1><table><thead><tr>
  <th>Lifter</th><th>Gender</th><th>Class</th><th>Body Weight (kg)</th><th>Style</th>
  <th>Muscle Up (kg)</th><th>Pull (kg)</th><th>Dip (kg)</th><th>Squat (kg)</th>
  <th>Total (kg)</th><th>Ris Score</th><th>Competition</th><th>Date</th><th>Actions</th>
</tr></thead><tbody><tr>
  <td><span>1</span><a href="/athletes/safety-test-athlete">Safety Test Athlete</a></td>
  <td>Male</td><td><a href="/records/male/classes/-80kg">-80kg</a></td>
  <td>79.50</td><td>Classic</td><td>0.00</td><td>80.00</td><td>100.00</td><td>0.00</td>
  <td>180.00</td><td>42.50</td><td><a href="/competitions/safety-test-event">Safety Test Event</a></td>
  <td><time datetime="2026-08-01T00:00:00Z">Aug 1</time></td>
  <td><a href="/results/999001">View</a></td>
</tr></tbody></table>`;

const workDir = mkdtempSync(path.join(tmpdir(), "osl-import-safety-"));
const fixtureFile = path.join(workDir, "ranking.html");
writeFileSync(fixtureFile, FIXTURE_HTML, "utf8");
const inputArg = `--input=ranking-table,${fixtureFile},https://rankings.officialstreetlifting.com/rankings/classic?gender=male`;

const fakeBinDir = path.join(workDir, "bin");
mkdirSync(fakeBinDir, { recursive: true });
const fakeSupabasePath = path.join(fakeBinDir, "supabase");
writeFileSync(
  fakeSupabasePath,
  // Deliberately not shaped like a real Supabase secret-key prefix (secret
  // scanners flag that shape even in fixture data) -- the test only needs a
  // non-empty credential-looking string to prove the host check runs first.
  `#!/bin/sh\ncat <<'EOF'\n{"API_URL":"https://pwgpthnhopmquvuqqqys.supabase.co","SECRET_KEY":"test-fixture-credential-not-a-real-key-000000000000"}\nEOF\n`,
  "utf8",
);
chmodSync(fakeSupabasePath, 0o755);

function run(pathEnv: string, extraArgs: readonly string[]): { stderr: string; failed: boolean } {
  try {
    execFileSync(
      process.execPath,
      ["--import", "tsx", ENTRY, inputArg, "--observed-on=2026-08-30", ...extraArgs],
      { env: { ...process.env, PATH: pathEnv }, stdio: ["ignore", "ignore", "pipe"] },
    );
    return { stderr: "", failed: false };
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    return { stderr, failed: true };
  }
}

function validateCloudHostRefusedEvenWithFlagsAndCredentials() {
  // Even with --write, --confirm-local-import, and a plausible-looking
  // secret key present, a cloud `supabase status` response must be refused.
  const result = run(`${fakeBinDir}:${process.env.PATH ?? ""}`, ["--write", "--confirm-local-import"]);
  assert.equal(result.failed, true, "a cloud-reporting local Supabase CLI must still be refused");
  assert.match(result.stderr, /loopback/i, "the refusal must be the categorical loopback-only message");
}

function validateWriteWithoutConfirmationNeverInvokesSupabase() {
  // No `supabase` binary is reachable at all here -- if this succeeds in
  // failing with the flag-specific message (rather than an ENOENT spawn
  // error), the gate gets checked before the CLI is ever shelled out to.
  const result = run("/usr/bin:/bin", ["--write"]);
  assert.equal(result.failed, true, "--write without --confirm-local-import must be refused");
  assert.match(result.stderr, /confirm-local-import/, "the refusal must name the required confirmation flag");
}

function validateDryRunNeverInvokesSupabase() {
  // Same empty PATH: a plain dry-run (no --write) must succeed without ever
  // needing the `supabase` CLI at all.
  const result = run("/usr/bin:/bin", []);
  assert.equal(result.failed, false, "a plain dry-run must succeed with no Supabase CLI reachable");
}

validateCloudHostRefusedEvenWithFlagsAndCredentials();
validateWriteWithoutConfirmationNeverInvokesSupabase();
validateDryRunNeverInvokesSupabase();

process.stdout.write(
  "Official Streetlifting import safety validation passed: categorical non-loopback host refusal, confirmation-flag gating, and dry-run isolation from the Supabase CLI.\n",
);
