import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import { createOrganizationAction } from "@/lib/supabase/admin-actions";
import { organizationReviewStates } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Organizations (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

export default async function AdminSupabaseOrganizationsPage() {
  await requireEditor("/admin/db/organizations");
  const organizations = await repository.listOrganizations();

  return (
    <OperationsPage
      eyebrow="Internal / Organizations"
      title="Organizations"
      description="Federations, leagues, competition organizers, and gyms."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsPanel title="Create organization" eyebrow="New record" className="mt-6">
        <ActionForm action={createOrganizationAction} submitLabel="Create organization" pendingLabel="Creating…" className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="slug" label="Slug" required>
            <TextInput id="slug" name="slug" required />
          </FieldShell>
          <FieldShell id="name" label="Name" required>
            <TextInput id="name" name="name" required />
          </FieldShell>
          <FieldShell id="organizationType" label="Organization type">
            <TextInput id="organizationType" name="organizationType" />
          </FieldShell>
          <FieldShell id="website" label="Website">
            <TextInput id="website" name="website" type="url" />
          </FieldShell>
          <FieldShell id="country" label="Country">
            <TextInput id="country" name="country" />
          </FieldShell>
          <FieldShell id="reviewState" label="Review state" required>
            <SelectInput id="reviewState" name="reviewState" defaultValue="draft">
              {organizationReviewStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell id="description" label="Description">
              <TextArea id="description" name="description" rows={4} />
            </FieldShell>
          </div>
          <div className="sm:col-span-2">
            <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
              Create organization
            </PendingButton>
          </div>
        </ActionForm>
      </OperationsPanel>

      <OperationsPanel title={`All organizations (${organizations.length})`} className="mt-6">
        {organizations.length === 0 ? (
          <p className="text-sm text-muted">No organizations visible yet (or none exist in this local database).</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {organizations.map((organization) => (
              <li key={organization.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/db/organizations/${organization.id}`} className="font-bold text-ink hover:text-accent">
                    {organization.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {organization.organization_type ?? "—"} &middot; {organization.country ?? "—"} &middot; {organization.review_state}
                  </p>
                </div>
                <Link
                  href={`/admin/db/organizations/${organization.id}`}
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
