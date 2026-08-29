import type { Metadata } from "next";
import { ActionForm } from "@/components/operations/action-form";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { updateClaimedAthletePresentationAction } from "@/lib/community/actions/athlete-presentation";
import { getAthletePresentationRepository } from "@/lib/community/athlete-presentation-runtime";
import { getCommunityRepository } from "@/lib/community/runtime";
export const metadata: Metadata = { title: "Claimed athlete presentation" }; export const dynamic = "force-dynamic";
const inputClass = "mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-sm text-ink";
export default async function AthletePresentationPage() {
  const [user, community, presentations] = await Promise.all([requireAuthenticatedUser("/account/athlete-profile"), getCommunityRepository(), getAthletePresentationRepository()]);
  const member = community.availability.writable ? await community.getMemberProfileByPrincipalId(user.id) : null;
  const presentation = member?.linkedAthleteId ? await presentations.getForMember(member.id) : null;
  return <OperationsPage eyebrow="Account / Approved athlete control" title="Athlete presentation" description="Add athlete-controlled presentation fields beside the canonical profile. This form cannot edit official identity, provenance, rankings, results, or verification.">
    {!member?.linkedAthleteId ? <OperationsNotice title="Approved claim required" tone="warning"><p>This account does not have an active athlete control grant. Submitting a claim alone does not unlock this form.</p></OperationsNotice> : <OperationsPanel title="Presentation fields" description={`Canonical athlete reference: ${member.linkedAthleteId}`}><ActionForm action={updateClaimedAthletePresentationAction} submitLabel="Save athlete presentation">
      <Field label="Preferred display label"><input name="preferredDisplayName" defaultValue={presentation?.preferredDisplayName} maxLength={100} className={inputClass} /></Field>
      <Field label="Athlete-controlled biography"><textarea name="biography" defaultValue={presentation?.biography} rows={6} maxLength={1200} className={`${inputClass} py-3`} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Website (HTTPS)"><input type="url" name="website" defaultValue={presentation?.website} className={inputClass} /></Field><Field label="Training location"><input name="trainingLocation" defaultValue={presentation?.trainingLocation} maxLength={160} className={inputClass} /></Field></div>
      <Field label="Social links (one HTTPS URL per line)"><textarea name="socialLinks" defaultValue={presentation?.socialLinks.join("\n")} rows={4} className={`${inputClass} py-3`} /></Field>
      <Field label="Specialties (comma or newline separated)"><textarea name="specialties" defaultValue={presentation?.specialties.join(", ")} rows={3} className={`${inputClass} py-3`} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Approved athlete avatar media ID"><input name="profileMediaId" defaultValue={presentation?.profileMediaId} className={inputClass} /></Field><Field label="Approved athlete cover media ID"><input name="coverMediaId" defaultValue={presentation?.coverMediaId} className={inputClass} /></Field></div>
    </ActionForm></OperationsPanel>}
  </OperationsPage>;
}
function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) { return <label className="mt-4 block"><span className="font-mono text-xs font-bold uppercase text-muted">{label}</span>{children}</label>; }
