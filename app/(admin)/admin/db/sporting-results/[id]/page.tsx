import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { requireEditor } from "@/lib/auth";
import { updateSportingResultStatusAction } from "@/lib/supabase/admin-actions";
import { sportingResultStatuses } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Sporting result (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

// Supabase-js infers a nested single-row FK join (e.g. competitions(name)) as
// an array without generated Database types to tell it otherwise -- see
// components/admin-db/provenance-panel.tsx's `source` handling for the same
// pattern this repo already uses. sporting_result_performances(*) below is a
// REAL array (a result can have many performances) and is mapped directly,
// with no unwrap.
function unwrapJoin<T>(value: T | readonly T[] | null | undefined): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T | null) ?? null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

type PerformanceRow = {
  readonly id: string;
  readonly performance_order: number;
  readonly movement: string;
  readonly value: number | null;
  readonly unit: string | null;
  readonly status: string | null;
};

function Field({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function AdminSupabaseSportingResultDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/sporting-results/${id}`);

  const result = await repository.getSportingResult(id);
  if (!result) notFound();

  const competition = unwrapJoin(result.competitions);
  const athlete = unwrapJoin(result.athletes);
  const team = unwrapJoin(result.teams);
  const performances = result.sporting_result_performances ?? [];

  return (
    <OperationsPage
      eyebrow="Internal / Official result review"
      title={`${result.division} — ${result.event}`}
      description="The result_status CHECK constraint only enforces which values are valid -- it does not restrict transition direction. Nothing stops an arbitrary backward move (e.g. official -> imported); the only real gate is holding the sport.write_source_truth capability. Use this judgment carefully."
      actions={
        <Link
          href="/admin/db/sporting-results"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to sporting results
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Result record" eyebrow="Read-only">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Result ID" value={<span className="font-mono text-xs">{result.id}</span>} />
              <Field label="Legacy Sanity ID" value={result.legacy_sanity_id ?? "—"} />
              <Field label="Competition" value={competition?.name ?? "—"} />
              <Field
                label="Athlete / team"
                value={
                  athlete
                    ? `${athlete.name} (${athlete.permanent_id})`
                    : (team?.name ?? "—")
                }
              />
              <Field label="Division" value={result.division} />
              <Field label="Event" value={result.event} />
              <Field label="Placement" value={result.placement ?? "—"} />
              <Field label="Penalties" value={result.penalties ?? "—"} />
              <Field
                label="Result status"
                value={
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent">
                    {result.result_status}
                  </span>
                }
              />
              <Field label="Source record ID" value={<span className="font-mono text-xs">{result.source_record_id}</span>} />
              <Field label="Ruleset ID" value={result.ruleset_id ? <span className="font-mono text-xs">{result.ruleset_id}</span> : "—"} />
              <Field label="Supersedes ID" value={result.supersedes_id ? <span className="font-mono text-xs">{result.supersedes_id}</span> : "—"} />
              <Field label="Created" value={formatDate(result.created_at)} />
              <Field label="Updated" value={formatDate(result.updated_at)} />
            </dl>
          </OperationsPanel>

          <OperationsPanel title="Performances" eyebrow="Read-only / sporting_result_performances">
            {performances.length === 0 ? (
              <p className="text-sm text-muted">No recorded performances.</p>
            ) : (
              <ul className="space-y-3">
                {performances
                  .slice()
                  .sort((a: PerformanceRow, b: PerformanceRow) => a.performance_order - b.performance_order)
                  .map((performance: PerformanceRow) => (
                    <li key={performance.id} className="border border-white/10 p-3 text-sm">
                      <p className="font-bold text-ink">{performance.movement}</p>
                      <p className="mt-1 text-xs text-muted">
                        {performance.value !== null && performance.value !== undefined
                          ? `${performance.value} ${performance.unit ?? ""}`.trim()
                          : "No value recorded"}
                        {performance.status ? ` · ${performance.status}` : ""}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </OperationsPanel>
        </div>

        <div className="space-y-6">
          <OperationsPanel title="Update result status" eyebrow="Trust-boundary transition">
            <ActionForm
              action={updateSportingResultStatusAction}
              submitLabel="Update status"
              pendingLabel="Updating…"
              onSuccess="refresh"
            >
              <input type="hidden" name="id" value={result.id} />
              <FieldShell id="resultStatus" label="Result status" required>
                <SelectInput id="resultStatus" name="resultStatus" defaultValue={result.result_status}>
                  {sportingResultStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </SelectInput>
              </FieldShell>
              <div className="mt-4">
                <PendingButton pendingLabel="Updating…" className="bg-accent text-canvas hover:bg-accent-strong">
                  Update status
                </PendingButton>
              </div>
            </ActionForm>
          </OperationsPanel>

          <ProvenancePanel targetType="sporting_results" targetId={result.id} />
        </div>
      </div>
    </OperationsPage>
  );
}
