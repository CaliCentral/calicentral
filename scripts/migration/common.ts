import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

export type PlannedRow = {
  readonly sourceKey: string;
  readonly table: string;
  readonly row: Readonly<Record<string, unknown>>;
  readonly onConflict?: string;
  // Append-only tables (e.g. audit_events, enforced by a database trigger
  // that rejects any update) must be inserted with ON CONFLICT DO NOTHING,
  // not DO UPDATE -- re-running an import against already-migrated rows
  // would otherwise hit that trigger and fail the whole batch, confirmed by
  // a real re-run.
  readonly ignoreDuplicates?: boolean;
};

export type MigrationReport = {
  readonly source: "sanity" | "d1";
  readonly mode: "dry-run" | "local-write";
  readonly generatedAt: string;
  readonly inputCounts: Readonly<Record<string, number>>;
  readonly outputCounts: Readonly<Record<string, number>>;
  readonly operations: readonly PlannedRow[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
};

export function stableUuid(namespace: string, sourceId: string): string {
  const bytes = createHash("sha256").update(`${namespace}\0${sourceId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function readJsonRecords(filePath: string): Promise<unknown[]> {
  const text = await readFile(filePath, "utf8");
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (isRecord(parsed) && Array.isArray(parsed.documents)) return parsed.documents;
      if (!trimmed.includes("\n")) {
        throw new Error("Expected a JSON array, a {documents: []} export, or NDJSON.");
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      // Multiple JSON objects beginning with `{` are a normal NDJSON export.
    }
  }

  return trimmed.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line) as unknown;
    } catch {
      throw new Error(`Invalid NDJSON at line ${index + 1}.`);
    }
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function referenceId(value: unknown): string | null {
  return isRecord(value) ? text(value._ref) : null;
}

export function slug(value: unknown): string | null {
  return isRecord(value) ? text(value.current) : text(value);
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter((item): item is string => item !== null) : [];
}

export function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function getArgument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function hasArgument(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// Tables are written in this order, not the order their source documents
// happened to appear in the export. Sanity/D1 exports have no guaranteed
// ordering, so a table that references another (e.g. audit_events.actor_member_id
// -> members.id) can otherwise land before the table it depends on, failing
// with a foreign-key violation purely because of NDJSON line order -- this
// isn't hypothetical, it's exactly what happened on the first real-data
// local-write attempt (a contributorProfile-derived members row created
// after an auditEvent that referenced it). Unlisted tables keep their
// natural discovered order and are written last, after everything listed
// here, since anything not enumerated is assumed to have no known
// dependency on the tables that are.
const TABLE_WRITE_ORDER = [
  "members", "profiles", "profile_social_accounts", "member_roles", "member_capabilities",
  "organizations", "athletes", "external_athlete_identities", "teams", "team_seasons", "rulesets",
  "authors", "video_series",
  "competitions", "external_competition_identities",
  "ranking_providers", "ranking_systems",
  "source_records",
  "sporting_results", "sporting_result_performances",
  "ranking_snapshots", "ranking_entries", "ranking_categories",
  "editorial_content", "stories", "videos", "editorial_publication_state",
  "submissions", "site_settings", "products",
  "audit_events", "moderation_events",
] as const;

function sortByWriteOrder(tables: readonly string[]): string[] {
  const priority = new Map<string, number>(TABLE_WRITE_ORDER.map((table, index) => [table, index]));
  return [...tables].sort((a, b) => (priority.get(a) ?? TABLE_WRITE_ORDER.length) - (priority.get(b) ?? TABLE_WRITE_ORDER.length));
}

// The ONLY non-local Supabase host this tool will ever write to. Hardcoded,
// not read from an env var someone could point anywhere -- an env var
// mistake (or a copy-pasted .env from the wrong project) must never be
// capable of directing a real write at production or an unrelated project.
// Any host that is neither this nor localhost/127.0.0.1 is refused
// unconditionally, with no override flag.
const APPROVED_PREVIEW_HOSTNAME = "pwgpthnhopmquvuqqqys.supabase.co";

export async function applyMigrationPlan(report: MigrationReport): Promise<void> {
  if (!hasArgument("write")) return;

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for a write.");

  const parsedUrl = new URL(url);
  const isLocal = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
  const isApprovedPreview = parsedUrl.hostname === APPROVED_PREVIEW_HOSTNAME;

  if (isLocal) {
    if (!hasArgument("confirm-local-migration")) {
      throw new Error("Local writes require --write --confirm-local-migration.");
    }
  } else if (isApprovedPreview) {
    if (!hasArgument("confirm-preview-migration")) {
      throw new Error(`Preview writes require --write --confirm-preview-migration, and only ever target ${APPROVED_PREVIEW_HOSTNAME}.`);
    }
  } else {
    throw new Error(`This migration tool refuses writes to any Supabase host other than localhost/127.0.0.1 or the approved preview project (${APPROVED_PREVIEW_HOSTNAME}). Got: ${parsedUrl.hostname}. A real production migration requires a separately approved tool/run.`);
  }
  if (report.errors.length) throw new Error("Migration plan contains validation errors; no rows were written.");

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const tableOrder = sortByWriteOrder([...new Set(report.operations.map((operation) => operation.table))]);
  for (const table of tableOrder) {
    const rows = report.operations.filter((operation) => operation.table === table);
    for (let offset = 0; offset < rows.length; offset += 100) {
      const chunk = rows.slice(offset, offset + 100);
      const onConflict = chunk[0]?.onConflict;
      const ignoreDuplicates = chunk[0]?.ignoreDuplicates ?? false;
      const result = await client.from(table).upsert(chunk.map((operation) => operation.row), {
        ...(onConflict ? { onConflict } : {}),
        ignoreDuplicates,
      });
      if (result.error) throw new Error(`Failed writing ${table}: ${result.error.message}`);
    }
  }
}

export async function emitReport(report: MigrationReport): Promise<void> {
  const serializable = { ...report, operations: hasArgument("include-rows") ? report.operations : undefined };
  const output = `${JSON.stringify(serializable, null, 2)}\n`;
  const reportPath = getArgument("report");
  if (reportPath) {
    const resolved = path.resolve(reportPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, output, "utf8");
  }
  process.stdout.write(output);
}
