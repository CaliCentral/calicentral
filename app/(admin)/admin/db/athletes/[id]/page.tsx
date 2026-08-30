import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { requireEditor } from "@/lib/auth";
import { updateAthleteAction } from "@/lib/supabase/admin-actions";
import { athleteEditorialStates, athleteIdentityStates } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Athlete (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

export default async function AdminSupabaseAthleteDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/athletes/${id}`);

  const [athlete, externalIdentities] = await Promise.all([
    repository.getAthlete(id),
    repository.listExternalIdentitiesForAthlete(id),
  ]);
  if (!athlete) notFound();

  return (
    <OperationsPage
      eyebrow="Internal / Canonical athlete"
      title={athlete.name}
      description="Editing this record changes canonical source truth. It does not, by itself, prove identity or endorse any self-reported claim."
      actions={
        <Link href="/admin/db/athletes" className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent">
          Back to athletes
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OperationsPanel title="Edit record" eyebrow={`Permanent ID: ${athlete.permanent_id}`}>
          <ActionForm action={updateAthleteAction} submitLabel="Save changes" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
            <input type="hidden" name="id" value={athlete.id} />
            <FieldShell id="slug" label="Slug" required>
              <TextInput id="slug" name="slug" defaultValue={athlete.slug} required />
            </FieldShell>
            <FieldShell id="name" label="Name" required>
              <TextInput id="name" name="name" defaultValue={athlete.name} required />
            </FieldShell>
            <FieldShell id="displayName" label="Display name">
              <TextInput id="displayName" name="displayName" defaultValue={athlete.display_name ?? ""} />
            </FieldShell>
            <FieldShell id="country" label="Country">
              <TextInput id="country" name="country" defaultValue={athlete.country ?? ""} />
            </FieldShell>
            <FieldShell id="administrativeArea" label="Administrative area">
              <TextInput id="administrativeArea" name="administrativeArea" defaultValue={athlete.administrative_area ?? ""} />
            </FieldShell>
            <FieldShell id="city" label="City">
              <TextInput id="city" name="city" defaultValue={athlete.city ?? ""} />
            </FieldShell>
            <FieldShell id="disciplines" label="Disciplines" description="Comma-separated.">
              <TextInput id="disciplines" name="disciplines" defaultValue={(athlete.disciplines ?? []).join(", ")} />
            </FieldShell>
            <FieldShell id="specialties" label="Specialties" description="Comma-separated.">
              <TextInput id="specialties" name="specialties" defaultValue={(athlete.specialties ?? []).join(", ")} />
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell id="biography" label="Biography">
                <TextArea id="biography" name="biography" defaultValue={athlete.biography ?? ""} rows={5} />
              </FieldShell>
            </div>
            <FieldShell id="identityState" label="Identity state" required description="source-confirmed != identity-confirmed. Changing this does not itself verify anything.">
              <SelectInput id="identityState" name="identityState" defaultValue={athlete.identity_state}>
                {athleteIdentityStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="editorialState" label="Editorial state" required description="Gates public visibility (public_athletes_select requires 'approved').">
              <SelectInput id="editorialState" name="editorialState" defaultValue={athlete.editorial_state}>
                {athleteEditorialStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <div className="sm:col-span-2">
              <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                Save changes
              </PendingButton>
            </div>
          </ActionForm>
        </OperationsPanel>

        <div className="space-y-6">
          <OperationsPanel title="External identities" eyebrow="Read-only" description="Provider-to-canonical matches, each independently reviewed. Never used to auto-merge this record.">
            {externalIdentities.length === 0 ? (
              <p className="text-sm text-muted">No external identities linked yet.</p>
            ) : (
              <ul className="space-y-3">
                {externalIdentities.map((identity) => (
                  <li key={identity.id} className="border border-white/10 p-3 text-sm">
                    <p className="font-bold text-ink">{identity.provider}</p>
                    <p className="text-xs text-muted">
                      {identity.external_id} &middot; {identity.verification_state}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </OperationsPanel>

          <ProvenancePanel targetType="athletes" targetId={athlete.id} />
        </div>
      </div>
    </OperationsPage>
  );
}
