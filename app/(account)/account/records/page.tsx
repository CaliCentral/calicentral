import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { createPersonalRecordAction } from "@/lib/training/actions";
import { getTrainingRepository } from "@/lib/training/runtime";
import type { PersonalRecord } from "@/lib/training/types";

export const metadata: Metadata = { title: "Personal records" };
export const dynamic = "force-dynamic";

const inputClass = "mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none";

export default async function PersonalRecordsPage() {
  const [user, community, training] = await Promise.all([
    requireAuthenticatedUser("/account/records"),
    getCommunityRepository(),
    getTrainingRepository(),
  ]);
  const member = community.availability.writable
    ? await community.getMemberProfileByPrincipalId(user.id)
    : null;
  const [movements, records] = member && training.available
    ? await Promise.all([training.listMovements(), training.listRecords(member.id, { limit: 100 })])
    : [[], []];

  return (
    <OperationsPage eyebrow="Account / Daily athlete utility" title="Personal records" description="Track current bests and history with an explicit source label. Self-entered and linked records never become official provider data.">
      {!member || !training.available ? (
        <OperationsPanel title="Records unavailable" description="Create a public member profile and configure the reviewed application database first."><Link href="/account/profile#public-member-profile" className="text-accent">Open profile settings →</Link></OperationsPanel>
      ) : (
        <>
          <OperationsPanel title="Add a personal record" description="Competition-linked means the referenced public competition exists; it does not verify the performance.">
            <ActionForm action={createPersonalRecordAction} submitLabel="Add personal record" pendingLabel="Saving record…">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Movement"><select name="movementId" defaultValue="" className={inputClass}><option value="">Choose or enter custom</option>{movements.map((movement) => <option key={movement.id} value={movement.id}>{movement.name}</option>)}</select></Field>
                <Field label="Custom movement"><input name="customMovementName" maxLength={120} className={inputClass} /></Field>
                <Field label="Record type"><select name="recordType" defaultValue="maximum-added-weight" className={inputClass}>{recordTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                <Field label="Value"><input type="number" name="value" step="0.01" required className={inputClass} /></Field>
                <Field label="Unit"><select name="unit" defaultValue="kg" className={inputClass}>{["kg", "lb", "reps", "seconds", "points", "completion"].map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
                <Field label="Repetitions (optional)"><input type="number" name="repetitions" min={1} max={10000} className={inputClass} /></Field>
                <Field label="Achieved on"><input type="date" name="achievedOn" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} /></Field>
                <Field label="Provenance"><select name="sourceType" defaultValue="self-reported" className={inputClass}><option value="self-reported">Self-reported</option><option value="competition-linked">Competition-linked</option></select></Field>
                <Field label="Competition ID or slug"><input name="canonicalCompetitionId" maxLength={200} placeholder="Only for competition-linked" className={inputClass} /></Field>
              </div>
              <Field label="Notes"><textarea name="notes" rows={3} maxLength={1000} className={`${inputClass} py-3`} /></Field>
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-muted"><input type="checkbox" name="publicVisible" className="size-5 accent-[var(--color-accent)]" /> Show this record on my public member profile</label>
            </ActionForm>
          </OperationsPanel>
          <OperationsPanel className="mt-7" title="Record history" description="History is append-only. Dates and provenance are shown so a latest entry is not mistaken for a verified record.">
            {records.length ? <ul className="divide-y divide-white/10 border-y border-white/10">{records.map((record) => <li key={record.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-bold uppercase text-ink">{record.movementName}</p><p className="mt-1 text-sm text-muted">{recordTypeLabel(record)} · {record.achievedOn}</p></div><div className="sm:text-right"><p className="font-display text-2xl font-black text-ink">{record.value} {record.unit}</p><p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-accent">{record.sourceType} · {record.verificationStatus}</p></div></li>)}</ul> : <p className="border border-dashed border-white/20 p-6 text-sm text-muted">No personal records yet. No placeholder achievements are generated.</p>}
          </OperationsPanel>
        </>
      )}
    </OperationsPage>
  );
}

const recordTypes = [
  ["maximum-added-weight", "Maximum added weight"], ["total-system-weight", "Total system weight"],
  ["repetition-maximum", "Repetition maximum"], ["max-repetitions", "Max repetitions"],
  ["hold-duration", "Hold duration"], ["skill-achievement", "Skill achievement"],
  ["competition-total", "Competition total"], ["competition-score", "Competition score"],
] as const;

function recordTypeLabel(record: PersonalRecord): string {
  return recordTypes.find(([value]) => value === record.recordType)?.[1] ?? record.recordType;
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="mt-4 block"><span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>{children}</label>;
}
