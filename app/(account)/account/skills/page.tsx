import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { updateSkillProgressAction } from "@/lib/training/actions";
import { getTrainingRepository } from "@/lib/training/runtime";

export const metadata: Metadata = { title: "Skill progress" };
export const dynamic = "force-dynamic";

const inputClass = "mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none";

export default async function SkillsPage() {
  const [user, community, training] = await Promise.all([
    requireAuthenticatedUser("/account/skills"), getCommunityRepository(), getTrainingRepository(),
  ]);
  const member = community.availability.writable ? await community.getMemberProfileByPrincipalId(user.id) : null;
  const [movements, skills] = member && training.available
    ? await Promise.all([training.listMovements(), training.listSkills(member.id)])
    : [[], []];
  const skillMovements = movements.filter((movement) => ["skill", "hold", "freestyle"].includes(movement.category));

  return (
    <OperationsPage eyebrow="Account / Daily athlete utility" title="Skill progress" description="Track goals, working progressions, and achieved dates. Member-entered status is not sporting verification.">
      {!member || !training.available ? (
        <OperationsPanel title="Skills unavailable" description="Create a public member profile and configure the reviewed application database first."><Link href="/account/profile#public-member-profile" className="text-accent">Open profile settings →</Link></OperationsPanel>
      ) : (
        <>
          <OperationsPanel title="Update a skill" description="Each catalog skill has one current progress row; updates preserve the latest honest status.">
            <ActionForm action={updateSkillProgressAction} submitLabel="Save skill progress" pendingLabel="Saving progress…">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Skill"><select name="movementId" required defaultValue="" className={inputClass}><option value="" disabled>Choose a skill</option>{skillMovements.map((movement) => <option key={movement.id} value={movement.id}>{movement.name}</option>)}</select></Field>
                <Field label="Status"><select name="status" defaultValue="working-on" className={inputClass}><option value="not-started">Not started</option><option value="working-on">Working on</option><option value="achieved">Achieved</option></select></Field>
                <Field label="Achieved on"><input type="date" name="achievedOn" className={inputClass} /></Field>
              </div>
              <Field label="Progression notes"><textarea name="notes" rows={3} maxLength={1000} className={`${inputClass} py-3`} /></Field>
              <Field label="Approved proof media ID (optional)"><input name="proofMediaId" maxLength={200} className={inputClass} /></Field>
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-muted"><input type="checkbox" name="publicVisible" className="size-5 accent-[var(--color-accent)]" /> Show this progress on my public member profile</label>
            </ActionForm>
          </OperationsPanel>
          <OperationsPanel className="mt-7" title="Your skills" description="Empty states are real; the platform does not seed achievements.">
            {skills.length ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{skills.map((skill) => <li key={skill.id} className="border border-white/12 p-5"><p className="font-bold uppercase text-ink">{skill.movementName}</p><p className="mt-2 font-mono text-xs uppercase text-accent">{skill.status.replaceAll("-", " ")}</p>{skill.achievedOn ? <p className="mt-2 text-sm text-muted">Achieved {skill.achievedOn}</p> : null}{skill.notes ? <p className="mt-3 text-sm leading-6 text-muted">{skill.notes}</p> : null}<p className="mt-3 text-xs text-muted">{skill.publicVisible ? "Public" : "Private"}</p></li>)}</ul> : <p className="border border-dashed border-white/20 p-6 text-sm text-muted">No skill progress recorded yet.</p>}
          </OperationsPanel>
        </>
      )}
    </OperationsPage>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="mt-4 block"><span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>{children}</label>;
}
