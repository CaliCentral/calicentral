import type { Metadata } from "next";
import Link from "next/link";

import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { TrainingSessionForm } from "@/components/training/training-session-form";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { createTrainingRecordAction } from "@/lib/training/actions";
import { getTrainingRepository } from "@/lib/training/runtime";
import type { TrainingSet } from "@/lib/training/types";

export const metadata: Metadata = { title: "Training log" };
export const dynamic = "force-dynamic";

type Props = { readonly searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TrainingPage({ searchParams }: Props) {
  const [user, params, community, training] = await Promise.all([
    requireAuthenticatedUser("/account/training"), searchParams,
    getCommunityRepository(), getTrainingRepository(),
  ]);
  const member = community.availability.writable
    ? await community.getMemberProfileByPrincipalId(user.id)
    : null;
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.min(200, Math.max(1, Number(pageValue) || 1));
  const [movements, sessions] = member && training.available
    ? await Promise.all([training.listMovements(), training.listSessions(member.id, 20, (page - 1) * 20)])
    : [[], []];
  return (
    <OperationsPage eyebrow="Account / Daily athlete utility" title="Training log" description="Record calisthenics sessions without turning self-entered training into official sporting data.">
      {!member || !training.available ? (
        <OperationsPanel title="Training unavailable" description="Create a public member profile and configure the reviewed application database before logging sessions."><Link href="/account/profile#public-member-profile" className="text-accent">Open profile settings →</Link></OperationsPanel>
      ) : (
        <>
          <OperationsPanel title="Log a session" description="Use only the measurements that make sense for each movement. Empty movement rows are ignored."><TrainingSessionForm movements={movements} /></OperationsPanel>
          <div className="mt-7 space-y-5">
            {sessions.length ? sessions.map((session) => (
              <OperationsPanel key={session.id} title={session.title || "Training session"} description={`${session.sessionDate} · ${session.visibility} · ${session.movements.length} movements`}>
                {session.notes ? <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-muted">{session.notes}</p> : null}
                <div className="space-y-4">{session.movements.map((movement) => (
                  <section key={movement.id} className="border border-white/12 p-4">
                    <h3 className="font-bold uppercase text-ink">{movement.name}</h3>
                    <ul className="mt-3 space-y-2">{movement.sets.map((set) => (
                      <li key={set.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2 text-sm text-muted">
                        <span>Set {set.setOrder}: {setSummary(set)}</span>
                        <form action={createTrainingRecordAction}><input type="hidden" name="trainingSetId" value={set.id} /><button className="font-mono text-[0.65rem] font-bold uppercase text-accent">Record as training PR</button></form>
                      </li>
                    ))}</ul>
                  </section>
                ))}</div>
              </OperationsPanel>
            )) : <OperationsPanel title="No workouts logged yet" description="Your first session will appear here; no fake activity is generated."><span /></OperationsPanel>}
          </div>
          <nav className="mt-6 flex gap-4" aria-label="Training pages">{page > 1 ? <Link href={`/account/training?page=${page - 1}`} className="text-accent">← Previous</Link> : null}{sessions.length === 20 ? <Link href={`/account/training?page=${page + 1}`} className="text-accent">Next →</Link> : null}</nav>
        </>
      )}
    </OperationsPage>
  );
}

function setSummary(set: TrainingSet): string {
  return [
    set.reps !== undefined ? `${set.reps} reps` : "",
    set.addedLoadKg !== undefined ? `${set.addedLoadKg >= 0 ? "+" : ""}${set.addedLoadKg} kg` : "",
    set.totalWeightKg !== undefined ? `${set.totalWeightKg} kg total` : "",
    set.durationSeconds !== undefined ? `${set.durationSeconds}s` : "",
    set.distanceMeters !== undefined ? `${set.distanceMeters}m` : "",
    set.progression ?? "",
    set.rpe !== undefined ? `RPE ${set.rpe}` : "",
  ].filter(Boolean).join(" · ");
}
