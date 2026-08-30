import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextInput } from "@/components/operations/field";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import { createSportingResultAction } from "@/lib/supabase/admin-actions";
import { sportingResultStatuses } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Sporting results (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { readonly searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function oneOf<const Values extends readonly string[]>(
  value: string,
  values: Values,
): Values[number] | undefined {
  return values.includes(value) ? (value as Values[number]) : undefined;
}

// Supabase-js infers a nested single-row FK join (e.g. competitions(name)) as
// an array without generated Database types to tell it otherwise -- see
// components/admin-db/provenance-panel.tsx's `source` handling for the same
// pattern this repo already uses.
function unwrapJoin<T>(value: T | readonly T[] | null | undefined): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T | null) ?? null;
}

export default async function AdminSupabaseSportingResultsPage({ searchParams }: Props) {
  await requireEditor("/admin/db/sporting-results");
  const params = await searchParams;
  const statusFilter = oneOf(first(params.status), sportingResultStatuses);

  const [results, competitionOptions, athleteOptions, sourceOptions] = await Promise.all([
    repository.listSportingResults(statusFilter ? { resultStatus: statusFilter } : undefined),
    repository.listCompetitionOptions(),
    repository.listAthleteOptions(),
    repository.listSourceRecords(),
  ]);

  return (
    <OperationsPage
      eyebrow="Internal / Official result review"
      title="Sporting results"
      description="Official result review queue. Results move through a trust state machine (imported -> submitted -> provisional -> source-confirmed -> official -> corrected/disputed/disqualified/withdrawn/superseded); each transition is a deliberate editorial decision, not automatic."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsNotice title="Individual results only, for now" tone="neutral">
        This create form only supports athlete (individual) results. Team
        results are supported by the schema and Server Action, but there is
        no team picker wired into this UI yet.
      </OperationsNotice>

      <OperationsPanel title="Review queue" eyebrow="Filter by result status" className="mt-6">
        <form
          method="get"
          className="mb-6 flex flex-wrap items-end gap-3 border border-white/12 bg-canvas p-4"
        >
          <label className="min-w-[16rem]">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Result status
            </span>
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All statuses</option>
              {sportingResultStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas"
          >
            Apply filter
          </button>
          <Link
            href="/admin/db/sporting-results"
            className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
          >
            Clear
          </Link>
        </form>

        {results.length === 0 ? (
          <p className="border border-dashed border-white/20 p-5 text-sm text-muted">
            No sporting results match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                  <th className="px-3 py-3">Division / event</th>
                  <th className="px-3 py-3">Placement</th>
                  <th className="px-3 py-3">Result status</th>
                  <th className="px-3 py-3">Competition</th>
                  <th className="px-3 py-3">Athlete / team</th>
                  <th className="px-3 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const competition = unwrapJoin(result.competitions);
                  const athlete = unwrapJoin(result.athletes);
                  const team = unwrapJoin(result.teams);
                  return (
                    <tr key={result.id} className="border-b border-white/10">
                      <td className="px-3 py-4 align-top">
                        <Link
                          href={`/admin/db/sporting-results/${result.id}`}
                          className="font-bold text-ink hover:text-accent"
                        >
                          {result.division}
                        </Link>
                        <p className="mt-1 text-xs text-muted">{result.event}</p>
                      </td>
                      <td className="px-3 py-4 align-top text-muted">
                        {result.placement ?? "—"}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-accent">
                          {result.result_status}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-muted">
                        {competition?.name ?? "—"}
                      </td>
                      <td className="px-3 py-4 align-top text-muted">
                        {athlete?.name ?? team?.name ?? "—"}
                      </td>
                      <td className="px-3 py-4 align-top text-muted">
                        {new Date(result.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>

      <OperationsPanel title="Create sporting result" eyebrow="Individual (athlete) results only" className="mt-6">
        <ActionForm action={createSportingResultAction} submitLabel="Create result" pendingLabel="Creating…" className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="competitionId" label="Competition" required>
            <SelectInput id="competitionId" name="competitionId" required defaultValue="">
              <option value="" disabled>
                Choose a competition…
              </option>
              {competitionOptions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="athleteId" label="Athlete" required description="Team results aren't supported in this form yet.">
            <SelectInput id="athleteId" name="athleteId" required defaultValue="">
              <option value="" disabled>
                Choose an athlete…
              </option>
              {athleteOptions.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name} ({athlete.permanent_id})
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="division" label="Division" required>
            <TextInput id="division" name="division" required />
          </FieldShell>
          <FieldShell id="event" label="Event" required>
            <TextInput id="event" name="event" required />
          </FieldShell>
          <FieldShell id="placement" label="Placement" description="Optional. Leave blank if not applicable.">
            <TextInput id="placement" name="placement" type="number" min={1} step={1} />
          </FieldShell>
          <FieldShell id="resultStatus" label="Result status" required>
            <SelectInput id="resultStatus" name="resultStatus" defaultValue="imported">
              {sportingResultStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="sourceRecordId" label="Source record" required description="The source truth this result is written from.">
            <SelectInput id="sourceRecordId" name="sourceRecordId" required defaultValue="">
              <option value="" disabled>
                Choose a source record…
              </option>
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.provider} — {source.title ?? source.source_type}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <div className="sm:col-span-2">
            <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
              Create result
            </PendingButton>
          </div>
        </ActionForm>
      </OperationsPanel>
    </OperationsPage>
  );
}
