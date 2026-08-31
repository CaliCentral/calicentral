import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import {
  createRankingProviderAction,
  createRankingSnapshotAction,
  createRankingSystemAction,
  updateRankingProviderAction,
  updateRankingSystemStatusAction,
} from "@/lib/supabase/admin-actions";
import {
  rankingKinds,
  rankingProviderIntegrationMethods,
  rankingProviderStatuses,
  rankingSnapshotPublicationStatuses,
  rankingSystemStatuses,
} from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Rankings (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

// Supabase-js infers a nested single-row FK join as an array without
// generated Database types to tell it otherwise -- see
// components/admin-db/provenance-panel.tsx for the same pattern.
function firstOf<T>(value: T | readonly T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return (value as T | null | undefined) ?? null;
}

export default async function AdminSupabaseRankingsPage() {
  await requireEditor("/admin/db/rankings");

  const [providers, systems, snapshots, systemOptions, sourceRecords, matchReviews] = await Promise.all([
    repository.listRankingProviders(),
    repository.listRankingSystems(),
    repository.listRankingSnapshots(),
    repository.listRankingSystemOptions(),
    repository.listSourceRecords(),
    repository.listRankingSystemMatchReviews(),
  ]);

  return (
    <OperationsPage
      eyebrow="Internal / Rankings"
      title="Rankings"
      description="Ranking providers, the ranking systems they publish, and the dated snapshots pulled from each system. Providers and systems are low-volume reference data managed here together; snapshots (and their entries) get their own detail page."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsPanel title={`Ranking providers (${providers.length})`} eyebrow="Step 1 — who publishes rankings">
        {providers.length === 0 ? (
          <p className="text-sm text-muted">No ranking providers yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {providers.map((provider) => (
              <li key={provider.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{provider.name}</p>
                    <p className="text-xs text-muted">
                      {provider.slug} &middot; {provider.status} &middot; {provider.integration_method} &middot; reviewed{" "}
                      {formatDate(provider.last_reviewed_at)}
                    </p>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-accent">
                    Update provider
                  </summary>
                  <ActionForm
                    action={updateRankingProviderAction}
                    submitLabel="Save changes"
                    pendingLabel="Saving…"
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                    onSuccess="refresh"
                  >
                    <input type="hidden" name="id" value={provider.id} />
                    <FieldShell id={`provider-status-${provider.id}`} label="Status">
                      <SelectInput id={`provider-status-${provider.id}`} name="status" defaultValue={provider.status}>
                        {rankingProviderStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </SelectInput>
                    </FieldShell>
                    <FieldShell id={`provider-website-${provider.id}`} label="Website" description="Not returned by the providers list, so this starts blank -- fill it in to change it.">
                      <TextInput id={`provider-website-${provider.id}`} name="website" />
                    </FieldShell>
                    <div className="sm:col-span-2">
                      <FieldShell id={`provider-notes-${provider.id}`} label="Source policy notes" description="Not returned by the providers list, so this starts blank -- fill it in to change it.">
                        <TextArea id={`provider-notes-${provider.id}`} name="sourcePolicyNotes" rows={3} />
                      </FieldShell>
                    </div>
                    <div className="sm:col-span-2">
                      <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                        Save changes
                      </PendingButton>
                    </div>
                  </ActionForm>
                </details>
              </li>
            ))}
          </ul>
        )}

        <details className="mt-6 border border-white/10 p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
            Create ranking provider
          </summary>
          <ActionForm
            action={createRankingProviderAction}
            submitLabel="Create provider"
            pendingLabel="Creating…"
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSuccess="refresh"
          >
            <FieldShell id="provider-slug" label="Slug" required>
              <TextInput id="provider-slug" name="slug" required />
            </FieldShell>
            <FieldShell id="provider-name" label="Name" required>
              <TextInput id="provider-name" name="name" required />
            </FieldShell>
            <FieldShell id="provider-new-website" label="Website">
              <TextInput id="provider-new-website" name="website" type="url" />
            </FieldShell>
            <FieldShell id="provider-new-status" label="Status" required>
              <SelectInput id="provider-new-status" name="status" defaultValue="under-review">
                {rankingProviderStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="provider-integration-method" label="Integration method" required>
              <SelectInput id="provider-integration-method" name="integrationMethod" defaultValue="" required>
                <option value="" disabled>
                  Choose an integration method…
                </option>
                {rankingProviderIntegrationMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="provider-attribution" label="Attribution requirement" required description="How this provider must be credited when its rankings are shown.">
              <TextInput id="provider-attribution" name="attributionRequirement" required />
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell id="provider-new-notes" label="Source policy notes">
                <TextArea id="provider-new-notes" name="sourcePolicyNotes" rows={3} />
              </FieldShell>
            </div>
            <div className="sm:col-span-2">
              <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
                Create provider
              </PendingButton>
            </div>
          </ActionForm>
        </details>
      </OperationsPanel>

      <OperationsPanel title={`Ranking systems (${systems.length})`} eyebrow="Step 2 — what each provider ranks" className="mt-6">
        {systems.length === 0 ? (
          <p className="text-sm text-muted">No ranking systems yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {systems.map((system) => {
              const provider = firstOf(system.ranking_providers);
              return (
                <li key={system.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{system.name}</p>
                      <p className="text-xs text-muted">
                        {system.slug} &middot; {system.ranking_kind} &middot; {system.discipline} &middot; {system.status}
                        {provider ? <> &middot; {provider.name}</> : null}
                      </p>
                      <p className="mt-1 font-mono text-[0.65rem] text-muted">
                        {[system.external_system_key, system.sex_division, system.lift_format, system.division, system.weight_class, system.methodology_category, system.equipment, system.system_authority].filter(Boolean).join(" · ") || "No structured external dimensions recorded"}
                      </p>
                    </div>
                  </div>
                  <ActionForm
                    action={updateRankingSystemStatusAction}
                    submitLabel="Update status"
                    pendingLabel="Saving…"
                    className="mt-3 flex flex-wrap items-end gap-3"
                    onSuccess="refresh"
                  >
                    <input type="hidden" name="id" value={system.id} />
                    <FieldShell id={`system-status-${system.id}`} label="Status">
                      <SelectInput id={`system-status-${system.id}`} name="status" defaultValue={system.status}>
                        {rankingSystemStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </SelectInput>
                    </FieldShell>
                    <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                      Update status
                    </PendingButton>
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        )}

        <details className="mt-6 border border-white/10 p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
            Create ranking system
          </summary>
          <ActionForm
            action={createRankingSystemAction}
            submitLabel="Create system"
            pendingLabel="Creating…"
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSuccess="refresh"
          >
            <FieldShell id="system-provider" label="Provider" required>
              <SelectInput id="system-provider" name="providerId" defaultValue="" required>
                <option value="" disabled>
                  Choose a provider…
                </option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="system-slug" label="Slug" required>
              <TextInput id="system-slug" name="slug" required />
            </FieldShell>
            <FieldShell id="system-name" label="Name" required>
              <TextInput id="system-name" name="name" required />
            </FieldShell>
            <FieldShell id="system-kind" label="Ranking kind" required>
              <SelectInput id="system-kind" name="rankingKind" defaultValue="" required>
                <option value="" disabled>
                  Choose a ranking kind…
                </option>
                {rankingKinds.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="system-discipline" label="Discipline" required>
              <TextInput id="system-discipline" name="discipline" required />
            </FieldShell>
            <FieldShell id="system-scope" label="Geographic scope" required>
              <TextInput id="system-scope" name="geographicScope" required />
            </FieldShell>
            <FieldShell id="system-movement" label="Movement">
              <TextInput id="system-movement" name="movement" />
            </FieldShell>
            <FieldShell id="system-division" label="Division">
              <TextInput id="system-division" name="division" />
            </FieldShell>
            <FieldShell id="system-weight-class" label="Weight class">
              <TextInput id="system-weight-class" name="weightClass" />
            </FieldShell>
            <FieldShell id="system-sex-division" label="Sex division">
              <TextInput id="system-sex-division" name="sexDivision" />
            </FieldShell>
            <FieldShell id="system-age-group" label="Age group">
              <TextInput id="system-age-group" name="ageGroup" />
            </FieldShell>
            <FieldShell id="system-status" label="Status" required>
              <SelectInput id="system-status" name="status" defaultValue="draft">
                {rankingSystemStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell id="system-methodology-notes" label="Methodology notes">
                <TextArea id="system-methodology-notes" name="methodologyNotes" rows={3} />
              </FieldShell>
            </div>
            <div className="sm:col-span-2">
              <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
                Create system
              </PendingButton>
            </div>
          </ActionForm>
        </details>
      </OperationsPanel>

      <OperationsPanel title={`System mapping review (${matchReviews.length})`} eyebrow="Explicit ambiguity queue" className="mt-6">
        {matchReviews.length === 0 ? (
          <p className="text-sm text-muted">No ranking-system mappings require review.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {matchReviews.map((review) => {
              const provider = firstOf(review.ranking_providers);
              return (
                <li key={review.id} className="py-4">
                  <p className="font-bold text-ink">{provider?.name ?? "Unknown provider"} — {review.external_system_key}</p>
                  <p className="mt-1 text-xs text-muted">{review.match_outcome} · {review.review_state} · candidates: {review.candidate_system_ids.length || 0}</p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted">{JSON.stringify(review.source_dimensions, null, 2)}</pre>
                  <a href={review.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline">Open source ↗</a>
                </li>
              );
            })}
          </ul>
        )}
      </OperationsPanel>

      <OperationsPanel title={`Ranking snapshots (${snapshots.length})`} eyebrow="Step 3 — dated pulls with entries" className="mt-6">
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted">No ranking snapshots yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {snapshots.map((snapshot) => {
              const system = firstOf(snapshot.ranking_systems);
              return (
                <li key={snapshot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/db/rankings/snapshots/${snapshot.id}`} className="font-bold text-ink hover:text-accent">
                      {system ? system.name : "Untitled ranking system"} &middot; {snapshot.ranking_date}
                    </Link>
                    <p className="text-xs text-muted">
                      {snapshot.season ?? "No season"} &middot; {snapshot.publication_status}
                    </p>
                  </div>
                  <Link
                    href={`/admin/db/rankings/snapshots/${snapshot.id}`}
                    className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline"
                  >
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <details className="mt-6 border border-white/10 p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
            Create ranking snapshot
          </summary>
          <ActionForm
            action={createRankingSnapshotAction}
            submitLabel="Create snapshot"
            pendingLabel="Creating…"
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <FieldShell id="snapshot-system" label="Ranking system" required>
              <SelectInput id="snapshot-system" name="rankingSystemId" defaultValue="" required>
                <option value="" disabled>
                  Choose a ranking system…
                </option>
                {systemOptions.map((system) => (
                  <option key={system.id} value={system.id}>{system.name}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="snapshot-date" label="Ranking date" required>
              <TextInput id="snapshot-date" name="rankingDate" type="date" required />
            </FieldShell>
            <FieldShell id="snapshot-source" label="Source record" required>
              <SelectInput id="snapshot-source" name="sourceRecordId" defaultValue="" required>
                <option value="" disabled>
                  Choose a source record…
                </option>
                {sourceRecords.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.provider} — {source.title ?? source.source_type}
                  </option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="snapshot-checked-at" label="Checked at" required description="When this snapshot was pulled/verified from the source.">
              <TextInput id="snapshot-checked-at" name="checkedAt" type="datetime-local" required />
            </FieldShell>
            <FieldShell id="snapshot-season" label="Season">
              <TextInput id="snapshot-season" name="season" />
            </FieldShell>
            <FieldShell id="snapshot-methodology-version" label="Methodology version">
              <TextInput id="snapshot-methodology-version" name="methodologyVersion" />
            </FieldShell>
            <FieldShell id="snapshot-publication-status" label="Publication status" required>
              <SelectInput id="snapshot-publication-status" name="publicationStatus" defaultValue="draft">
                {rankingSnapshotPublicationStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <div className="sm:col-span-2">
              <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
                Create snapshot
              </PendingButton>
            </div>
          </ActionForm>
        </details>
      </OperationsPanel>
    </OperationsPage>
  );
}
