import type {Metadata} from "next";
import Link from "next/link";

import {OperationsNotice, OperationsPage, OperationsPanel} from "@/components/operations/page-shell";
import {ActionForm} from "@/components/operations/action-form";
import {ContributorSubmissionList} from "@/components/operations/submission-list";
import {requireContributor} from "@/lib/auth";
import {updateTeamAffiliationVisibilityAction} from "@/lib/community/actions/team-affiliations";
import {getCommunityRepository} from "@/lib/community/runtime";
import {resolveCommunityTargets} from "@/lib/community/targets";
import {featureConfig} from "@/lib/features/config";
import {getContributorSubmissions} from "@/lib/operations/submissions";

export const metadata: Metadata = {title: "Team workspace"};
export const dynamic = "force-dynamic";

export default async function AccountTeamsPage() {
  const user = await requireContributor("/account/teams");
  const repository = await getCommunityRepository();
  const member = repository.availability.writable ? await repository.getMemberProfileByPrincipalId(user.id) : null;
  const affiliations = member ? await repository.listMemberTeamAffiliations(member.id) : [];
  const teamTargets = await resolveCommunityTargets(affiliations.map((affiliation) => ({type: "team" as const, id: affiliation.teamId})));
  const applications = featureConfig.teamApplications
    ? (await getContributorSubmissions(user.id)).filter((submission) => submission.submissionType === "teamApplication")
    : [];

  return (
    <OperationsPage
      eyebrow="Account / Teams"
      title="Team workspace"
      description="Private applications, consent-aware roster intake, and readiness boundaries for team managers using individual accounts."
      actions={featureConfig.teamApplications ? <Link href="/account/submissions/new?type=teamApplication" className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas">Create / register a team</Link> : undefined}
    >
      <OperationsPanel title="Confirmed team affiliations" description="Only active D1 memberships appear. You choose whether each one is shown on your public member profile.">
        {affiliations.length ? <ul className="space-y-4">{affiliations.map((affiliation) => { const team = teamTargets.get(`team:${affiliation.teamId}`); return <li key={affiliation.id} className="flex flex-wrap items-center justify-between gap-4 border border-white/12 p-4"><div><p className="font-semibold text-ink">{team?.title ?? affiliation.teamId}</p><p className="mt-1 text-xs uppercase text-muted">{affiliation.role.replaceAll("-", " ")} · active</p></div><ActionForm action={updateTeamAffiliationVisibilityAction} submitLabel={affiliation.publicVisible ? "Make private" : "Show publicly"} submitClassName="mt-0"><input type="hidden" name="membershipId" value={affiliation.id} /><input type="hidden" name="publicVisible" value={affiliation.publicVisible ? "false" : "true"} /></ActionForm></li>; })}</ul> : <p className="border border-dashed border-white/20 p-5 text-sm text-muted">No active confirmed team affiliation is stored for this account.</p>}
      </OperationsPanel>
      {!featureConfig.teamApplications ? (
        <div className="mt-6"><OperationsNotice title="Team applications are currently closed" tone="warning">
          <p>The workflow and validation are installed but fail closed until TEAM_APPLICATIONS_ENABLED is configured. No team, invitation, or roster state is being persisted from this page.</p>
        </OperationsNotice></div>
      ) : (
        <>
          <OperationsNotice title="Publication boundary" tone="warning">
            <p>Approved means accepted for editorial development. It is not public-team creation, branding approval, WCL admission, season registration, or competition eligibility.</p>
          </OperationsNotice>
          <OperationsPanel title="Your team applications" description="Only private submissions owned by this contributor are listed." className="mt-6">
            <ContributorSubmissionList submissions={applications} />
          </OperationsPanel>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Roster consent", "Proposed roster entries remain pending until each person accepts."],
              ["Branding", "Colors and marks require separate review and do not imply trademark clearance."],
              ["League admission", "A prospective listing is not an official WCL franchise."],
              ["Competition readiness", "Eligibility is determined by server/domain checks, not client checkboxes."],
            ].map(([title, body]) => <section key={title} className="border border-white/15 bg-surface p-5"><h2 className="font-bold uppercase text-ink">{title}</h2><p className="mt-3 text-sm leading-6 text-muted">{body}</p></section>)}
          </div>
        </>
      )}
    </OperationsPage>
  );
}
