import type { Metadata } from "next";
import Link from "next/link";

import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { FieldShell, SelectInput, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin — Provenance lookup (Supabase)" };
export const dynamic = "force-dynamic";

const TARGET_TYPES = [
  "athletes",
  "organizations",
  "competitions",
  "sporting_results",
  "ranking_snapshots",
  "editorial_content",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { readonly searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminSupabaseProvenanceLookupPage({ searchParams }: Props) {
  await requireEditor("/admin/db/provenance");
  const params = await searchParams;
  const targetType = first(params.targetType);
  const targetId = first(params.targetId);
  const hasQuery = Boolean(targetType && targetId);

  return (
    <OperationsPage
      eyebrow="Internal / Trust boundary"
      title="Provenance lookup"
      description="Look up the source-truth trail for any record by its table name and id. This is a read-only inspector; attaching new provenance happens from the record's own detail page."
      actions={
        <Link href="/admin/db" className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent">
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsPanel title="Find a record" eyebrow="Lookup">
        <form method="get" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <FieldShell id="targetType" label="Target type" required>
            <SelectInput id="targetType" name="targetType" defaultValue={targetType || ""} required>
              <option value="" disabled>
                Choose a table…
              </option>
              {TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="targetId" label="Target id (UUID)" required>
            <TextInput id="targetId" name="targetId" defaultValue={targetId} required />
          </FieldShell>
          <button
            type="submit"
            className="clip-corner inline-flex min-h-12 items-center justify-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong"
          >
            Look up
          </button>
        </form>
      </OperationsPanel>

      {hasQuery ? (
        <div className="mt-6">
          <ProvenancePanel targetType={targetType} targetId={targetId} />
        </div>
      ) : null}
    </OperationsPage>
  );
}
