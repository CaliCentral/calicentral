import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { requireEditor } from "@/lib/auth";
import { updateOrganizationAction } from "@/lib/supabase/admin-actions";
import { organizationReviewStates, provenanceStatuses } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Organization (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

export default async function AdminSupabaseOrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/organizations/${id}`);

  const organization = await repository.getOrganization(id);
  if (!organization) notFound();

  return (
    <OperationsPage
      eyebrow="Internal / Organization"
      title={organization.name}
      description="Editing this record changes canonical source truth for this organization."
      actions={
        <Link href="/admin/db/organizations" className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent">
          Back to organizations
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OperationsPanel title="Edit record" eyebrow={`ID: ${organization.id}`}>
          <ActionForm action={updateOrganizationAction} submitLabel="Save changes" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
            <input type="hidden" name="id" value={organization.id} />
            <FieldShell id="slug" label="Slug" required>
              <TextInput id="slug" name="slug" defaultValue={organization.slug} required />
            </FieldShell>
            <FieldShell id="name" label="Name" required>
              <TextInput id="name" name="name" defaultValue={organization.name} required />
            </FieldShell>
            <FieldShell id="organizationType" label="Organization type">
              <TextInput id="organizationType" name="organizationType" defaultValue={organization.organization_type ?? ""} />
            </FieldShell>
            <FieldShell id="website" label="Website">
              <TextInput id="website" name="website" type="url" defaultValue={organization.website ?? ""} />
            </FieldShell>
            <FieldShell id="country" label="Country">
              <TextInput id="country" name="country" defaultValue={organization.country ?? ""} />
            </FieldShell>
            <FieldShell id="reviewState" label="Review state" required>
              <SelectInput id="reviewState" name="reviewState" defaultValue={organization.review_state}>
                {organizationReviewStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="provenanceStatus" label="Provenance status" required description="Whole-record real-vs-sample classification -- see docs/data-provenance.md. Never inferred from name.">
              <SelectInput id="provenanceStatus" name="provenanceStatus" defaultValue={organization.provenance_status ?? "unknown"}>
                {provenanceStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell id="description" label="Description">
                <TextArea id="description" name="description" defaultValue={organization.description ?? ""} rows={5} />
              </FieldShell>
            </div>
            <div className="sm:col-span-2">
              <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                Save changes
              </PendingButton>
            </div>
          </ActionForm>
        </OperationsPanel>

        <div className="space-y-6">
          <ProvenancePanel targetType="organizations" targetId={organization.id} />
        </div>
      </div>
    </OperationsPage>
  );
}
