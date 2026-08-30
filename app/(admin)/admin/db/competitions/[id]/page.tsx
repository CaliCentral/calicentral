import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { requireEditor } from "@/lib/auth";
import { updateCompetitionAction } from "@/lib/supabase/admin-actions";
import { competitionPublicStates } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Competition (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

export default async function AdminSupabaseCompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/competitions/${id}`);

  const [competition, organizationOptions, rulesetOptions] = await Promise.all([
    repository.getCompetition(id),
    repository.listOrganizationOptions(),
    repository.listRulesetOptions(),
  ]);
  if (!competition) notFound();

  return (
    <OperationsPage
      eyebrow="Internal / Competition"
      title={competition.name}
      description="Editing this record changes canonical source truth for this competition."
      actions={
        <Link href="/admin/db/competitions" className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent">
          Back to competitions
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OperationsPanel title="Edit record" eyebrow={`Permanent ID: ${competition.permanent_id}`}>
          <ActionForm action={updateCompetitionAction} submitLabel="Save changes" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
            <input type="hidden" name="id" value={competition.id} />
            <FieldShell id="permanentId" label="Permanent ID" description="Immutable once created.">
              <TextInput id="permanentId" name="permanentId" defaultValue={competition.permanent_id} disabled readOnly />
            </FieldShell>
            <FieldShell id="slug" label="Slug" required>
              <TextInput id="slug" name="slug" defaultValue={competition.slug} required />
            </FieldShell>
            <FieldShell id="name" label="Name" required>
              <TextInput id="name" name="name" defaultValue={competition.name} required />
            </FieldShell>
            <FieldShell id="shortName" label="Short name">
              <TextInput id="shortName" name="shortName" defaultValue={competition.short_name ?? ""} />
            </FieldShell>
            <FieldShell id="status" label="Status" required>
              <TextInput id="status" name="status" defaultValue={competition.status} required />
            </FieldShell>
            <FieldShell id="organizationId" label="Organization">
              <SelectInput id="organizationId" name="organizationId" defaultValue={competition.organization_id ?? ""}>
                <option value="">None</option>
                {organizationOptions.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="rulesetId" label="Ruleset">
              <SelectInput id="rulesetId" name="rulesetId" defaultValue={competition.ruleset_id ?? ""}>
                <option value="">None</option>
                {rulesetOptions.map((ruleset) => (
                  <option key={ruleset.id} value={ruleset.id}>{ruleset.name}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="startDate" label="Start date">
              <TextInput id="startDate" name="startDate" type="date" defaultValue={competition.start_date ?? ""} />
            </FieldShell>
            <FieldShell id="endDate" label="End date">
              <TextInput id="endDate" name="endDate" type="date" defaultValue={competition.end_date ?? ""} />
            </FieldShell>
            <FieldShell id="country" label="Country">
              <TextInput id="country" name="country" defaultValue={competition.country ?? ""} />
            </FieldShell>
            <FieldShell id="city" label="City">
              <TextInput id="city" name="city" defaultValue={competition.city ?? ""} />
            </FieldShell>
            <FieldShell id="disciplines" label="Disciplines" description="Comma-separated.">
              <TextInput id="disciplines" name="disciplines" defaultValue={(competition.disciplines ?? []).join(", ")} />
            </FieldShell>
            <FieldShell id="publicState" label="Public state" required>
              <SelectInput id="publicState" name="publicState" defaultValue={competition.public_state}>
                {competitionPublicStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </SelectInput>
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell id="summary" label="Summary">
                <TextArea id="summary" name="summary" defaultValue={competition.summary ?? ""} rows={5} />
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
          <ProvenancePanel targetType="competitions" targetId={competition.id} />
        </div>
      </div>
    </OperationsPage>
  );
}
