import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import { createAthleteAction } from "@/lib/supabase/admin-actions";
import { athleteEditorialStates, athleteIdentityStates } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Athletes (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

export default async function AdminSupabaseAthletesPage() {
  await requireEditor("/admin/db/athletes");
  const athletes = await repository.listAthletes();

  return (
    <OperationsPage
      eyebrow="Internal / Canonical athletes"
      title="Athletes"
      description="Canonical athlete identity. See docs/data-provenance.md before touching identity_state."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsNotice title="Never merge by name" tone="warning">
        There is no merge operation here on purpose. Two records that appear
        to be the same person are linked through a reviewed
        external_athlete_identity or athlete_claim, each carrying its own
        verification_state -- never by editing one athlete&apos;s name to
        match another&apos;s.
      </OperationsNotice>

      <OperationsPanel title="Create athlete" eyebrow="New canonical record" className="mt-6">
        <ActionForm action={createAthleteAction} submitLabel="Create athlete" pendingLabel="Creating…" className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="permanentId" label="Permanent ID" required description="Stable identifier, never reused or changed.">
            <TextInput id="permanentId" name="permanentId" required />
          </FieldShell>
          <FieldShell id="slug" label="Slug" required>
            <TextInput id="slug" name="slug" required />
          </FieldShell>
          <FieldShell id="name" label="Name" required>
            <TextInput id="name" name="name" required />
          </FieldShell>
          <FieldShell id="displayName" label="Display name">
            <TextInput id="displayName" name="displayName" />
          </FieldShell>
          <FieldShell id="country" label="Country">
            <TextInput id="country" name="country" />
          </FieldShell>
          <FieldShell id="city" label="City">
            <TextInput id="city" name="city" />
          </FieldShell>
          <FieldShell id="disciplines" label="Disciplines" description="Comma-separated.">
            <TextInput id="disciplines" name="disciplines" />
          </FieldShell>
          <FieldShell id="specialties" label="Specialties" description="Comma-separated.">
            <TextInput id="specialties" name="specialties" />
          </FieldShell>
          <FieldShell id="biography" label="Biography" description="Optional.">
            <TextArea id="biography" name="biography" rows={4} />
          </FieldShell>
          <FieldShell id="identityState" label="Identity state" required>
            <SelectInput id="identityState" name="identityState" defaultValue="unconfirmed">
              {athleteIdentityStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="editorialState" label="Editorial state" required>
            <SelectInput id="editorialState" name="editorialState" defaultValue="draft">
              {athleteEditorialStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <div className="sm:col-span-2">
            <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
              Create athlete
            </PendingButton>
          </div>
        </ActionForm>
      </OperationsPanel>

      <OperationsPanel title={`All athletes (${athletes.length})`} className="mt-6">
        {athletes.length === 0 ? (
          <p className="text-sm text-muted">No athletes visible yet (or none exist in this local database).</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {athletes.map((athlete) => (
              <li key={athlete.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/db/athletes/${athlete.id}`} className="font-bold text-ink hover:text-accent">
                    {athlete.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {athlete.permanent_id} &middot; {athlete.identity_state} &middot; {athlete.editorial_state}
                  </p>
                </div>
                <Link
                  href={`/admin/db/athletes/${athlete.id}`}
                  className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </OperationsPanel>
    </OperationsPage>
  );
}
