import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { requireEditor } from "@/lib/auth";
import { addRankingEntryAction, updateRankingSnapshotStatusAction } from "@/lib/supabase/admin-actions";
import { rankingEntryStatuses, rankingSnapshotPublicationStatuses } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Ranking snapshot (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

// Supabase-js infers a nested single-row FK join as an array without
// generated Database types to tell it otherwise -- see
// components/admin-db/provenance-panel.tsx for the same pattern.
function firstOf<T>(value: T | readonly T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return (value as T | null | undefined) ?? null;
}

export default async function AdminSupabaseRankingSnapshotDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/rankings/snapshots/${id}`);

  const [snapshot, athleteOptions] = await Promise.all([
    repository.getRankingSnapshot(id),
    repository.listAthleteOptions(),
  ]);
  if (!snapshot) notFound();

  const system = firstOf(snapshot.ranking_systems);
  const entries = (snapshot.ranking_entries ?? []) as readonly {
    readonly id: string;
    readonly athlete_id: string;
    readonly rank: number | null;
    readonly points: number | null;
    readonly rating: number | null;
    readonly entry_status: string;
    readonly athletes: unknown;
  }[];

  return (
    <OperationsPage
      eyebrow="Internal / Ranking snapshot"
      title={system ? `${system.name} — ${snapshot.ranking_date}` : snapshot.ranking_date}
      description="A dated pull from one ranking system, made of individual ranking_entries. Publishing a snapshot does not itself verify any single entry -- each entry carries its own entry_status."
      actions={
        <Link
          href="/admin/db/rankings"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to rankings
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Snapshot" eyebrow={`Ranking date: ${snapshot.ranking_date}`}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Ranking system</dt>
                <dd className="mt-1 text-ink">{system ? system.name : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Publication status</dt>
                <dd className="mt-1 text-ink">{snapshot.publication_status}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Season</dt>
                <dd className="mt-1 text-ink">{snapshot.season ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Methodology version</dt>
                <dd className="mt-1 text-ink">{snapshot.methodology_version ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Checked at</dt>
                <dd className="mt-1 text-ink">{snapshot.checked_at ? new Date(snapshot.checked_at).toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Source record</dt>
                <dd className="mt-1 text-ink">{snapshot.source_record_id}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Transition publication status</h3>
              <ActionForm
                action={updateRankingSnapshotStatusAction}
                submitLabel="Update status"
                pendingLabel="Saving…"
                className="mt-3 flex flex-wrap items-end gap-3"
                onSuccess="refresh"
              >
                <input type="hidden" name="id" value={snapshot.id} />
                <FieldShell id="snapshot-publication-status" label="Publication status">
                  <SelectInput id="snapshot-publication-status" name="publicationStatus" defaultValue={snapshot.publication_status}>
                    {rankingSnapshotPublicationStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </SelectInput>
                </FieldShell>
                <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                  Update status
                </PendingButton>
              </ActionForm>
            </div>
          </OperationsPanel>

          <OperationsPanel title={`Ranking entries (${entries.length})`} eyebrow="Athlete, rank, points, rating">
            {entries.length === 0 ? (
              <p className="text-sm text-muted">No entries recorded for this snapshot yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/15 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted">
                      <th className="py-2 pr-4">Athlete</th>
                      <th className="py-2 pr-4">Rank</th>
                      <th className="py-2 pr-4">Points</th>
                      <th className="py-2 pr-4">Rating</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {entries.map((entry) => {
                      const athlete = firstOf(entry.athletes) as { name?: string; permanent_id?: string } | null;
                      return (
                        <tr key={entry.id}>
                          <td className="py-2 pr-4 text-ink">
                            {athlete ? athlete.name : entry.athlete_id}
                            {athlete?.permanent_id ? (
                              <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
                                {athlete.permanent_id}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2 pr-4 text-ink">{entry.rank ?? "—"}</td>
                          <td className="py-2 pr-4 text-ink">{entry.points ?? "—"}</td>
                          <td className="py-2 pr-4 text-ink">{entry.rating ?? "—"}</td>
                          <td className="py-2 pr-4 text-ink">{entry.entry_status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <details className="mt-6 border border-white/10 p-3">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
                Add ranking entry
              </summary>
              <ActionForm
                action={addRankingEntryAction}
                submitLabel="Add entry"
                pendingLabel="Adding…"
                className="mt-4 grid gap-4 sm:grid-cols-2"
                onSuccess="refresh"
              >
                <input type="hidden" name="rankingSnapshotId" value={snapshot.id} />
                <FieldShell id="entry-athlete" label="Athlete" required>
                  <SelectInput id="entry-athlete" name="athleteId" defaultValue="" required>
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
                <FieldShell id="entry-status" label="Entry status" required>
                  <SelectInput id="entry-status" name="entryStatus" defaultValue="ranked">
                    {rankingEntryStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </SelectInput>
                </FieldShell>
                <FieldShell id="entry-rank" label="Rank">
                  <TextInput id="entry-rank" name="rank" type="number" min={1} step={1} />
                </FieldShell>
                <FieldShell id="entry-points" label="Points">
                  <TextInput id="entry-points" name="points" type="number" step="any" />
                </FieldShell>
                <FieldShell id="entry-rating" label="Rating">
                  <TextInput id="entry-rating" name="rating" type="number" step="any" />
                </FieldShell>
                <div className="sm:col-span-2">
                  <PendingButton pendingLabel="Adding…" className="bg-accent text-canvas hover:bg-accent-strong">
                    Add entry
                  </PendingButton>
                </div>
              </ActionForm>
            </details>
          </OperationsPanel>
        </div>

        <ProvenancePanel targetType="ranking_snapshots" targetId={snapshot.id} />
      </div>
    </OperationsPage>
  );
}
