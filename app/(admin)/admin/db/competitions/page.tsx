import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import { createCompetitionAction } from "@/lib/supabase/admin-actions";
import { competitionPublicStates } from "@/lib/supabase/admin-validation";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Competitions (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

export default async function AdminSupabaseCompetitionsPage() {
  await requireEditor("/admin/db/competitions");
  const [competitions, organizationOptions, rulesetOptions] = await Promise.all([
    repository.listCompetitions(),
    repository.listOrganizationOptions(),
    repository.listRulesetOptions(),
  ]);

  return (
    <OperationsPage
      eyebrow="Internal / Competitions"
      title="Competitions"
      description="Competition editions and their public visibility."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsPanel title="Create competition" eyebrow="New record" className="mt-6">
        <ActionForm action={createCompetitionAction} submitLabel="Create competition" pendingLabel="Creating…" className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="permanentId" label="Permanent ID" required description="Stable identifier, never reused or changed.">
            <TextInput id="permanentId" name="permanentId" required />
          </FieldShell>
          <FieldShell id="slug" label="Slug" required>
            <TextInput id="slug" name="slug" required />
          </FieldShell>
          <FieldShell id="name" label="Name" required>
            <TextInput id="name" name="name" required />
          </FieldShell>
          <FieldShell id="shortName" label="Short name">
            <TextInput id="shortName" name="shortName" />
          </FieldShell>
          <FieldShell id="status" label="Status" required>
            <TextInput id="status" name="status" required />
          </FieldShell>
          <FieldShell id="organizationId" label="Organization">
            <SelectInput id="organizationId" name="organizationId" defaultValue="">
              <option value="">None</option>
              {organizationOptions.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="rulesetId" label="Ruleset">
            <SelectInput id="rulesetId" name="rulesetId" defaultValue="">
              <option value="">None</option>
              {rulesetOptions.map((ruleset) => (
                <option key={ruleset.id} value={ruleset.id}>{ruleset.name}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="startDate" label="Start date">
            <TextInput id="startDate" name="startDate" type="date" />
          </FieldShell>
          <FieldShell id="endDate" label="End date">
            <TextInput id="endDate" name="endDate" type="date" />
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
          <FieldShell id="publicState" label="Public state" required>
            <SelectInput id="publicState" name="publicState" defaultValue="draft">
              {competitionPublicStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell id="summary" label="Summary">
              <TextArea id="summary" name="summary" rows={4} />
            </FieldShell>
          </div>
          <div className="sm:col-span-2">
            <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
              Create competition
            </PendingButton>
          </div>
        </ActionForm>
      </OperationsPanel>

      <OperationsPanel title={`All competitions (${competitions.length})`} className="mt-6">
        {competitions.length === 0 ? (
          <p className="text-sm text-muted">No competitions visible yet (or none exist in this local database).</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {competitions.map((competition) => (
              <li key={competition.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/db/competitions/${competition.id}`} className="font-bold text-ink hover:text-accent">
                    {competition.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {competition.status} &middot; {competition.public_state} &middot; {competition.country ?? "—"}
                  </p>
                </div>
                <Link
                  href={`/admin/db/competitions/${competition.id}`}
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
