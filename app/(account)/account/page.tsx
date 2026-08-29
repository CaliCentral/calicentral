import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { ContributorSubmissionList } from "@/components/operations/submission-list";
import { requireContributor } from "@/lib/auth";
import { getContributorAccountOverview } from "@/lib/operations/submissions";
import { formatOperationsDate } from "@/lib/presentation/operations";
import { getCommunityRepository } from "@/lib/community/runtime";
import { getTrainingRepository } from "@/lib/training/runtime";
import { getCompetitions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contributor account",
};

export default async function AccountPage() {
  const user = await requireContributor("/account");
  const overview = await getContributorAccountOverview(user.id);

  if (!overview) {
    notFound();
  }
  const [community, training] = await Promise.all([getCommunityRepository(), getTrainingRepository()]);
  const member = community.availability.writable ? await community.getMemberProfileByPrincipalId(user.id) : null;
  const [daily, notifications, following, competitions] = member
    ? await Promise.all([
        training.available ? training.getDailySummary(member.id) : Promise.resolve(null),
        community.listNotifications(member.id, 5),
        community.listFollowing(member.id, 100),
        getCompetitions({ publishedOnly: true, stega: false }),
      ])
    : [null, [], [], []];
  const followedCompetitionIds = new Set(following.filter((item) => item.targetType === "competition").map((item) => item.targetId));
  const upcomingFollowed = competitions.filter((competition) => followedCompetitionIds.has(competition.canonicalId) && competition.startDate.slice(0, 10) >= new Date().toISOString().slice(0, 10)).sort((left, right) => left.startDate.localeCompare(right.startDate)).slice(0, 4);

  const activeReviewCount =
    overview.counts.submitted +
    overview.counts.inReview +
    overview.counts.revisionRequested;

  return (
    <OperationsPage
      eyebrow="Contributor portal / Overview"
      title={`Welcome, ${overview.profile.displayName}`}
      description="Manage your contributor profile, build structured pitches, and follow editorial review without exposing internal newsroom records."
      actions={
        <>
          <Link
            href="/account/submissions/new"
            className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Start a submission
          </Link>
          <Link
            href="/account/profile"
            className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Edit profile
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All submissions"
          value={overview.totalSubmissions}
          detail="Only records owned by this contributor"
        />
        <MetricCard
          label="Active review"
          value={activeReviewCount}
          detail="Submitted, in review, or awaiting revision"
        />
        <MetricCard
          label="Drafts"
          value={overview.counts.draft}
          detail="Editable working submissions"
        />
        <MetricCard
          label="Revision alerts"
          value={overview.feedbackAlertCount}
          detail="Contributor-visible feedback requiring attention"
        />
      </div>

      <section aria-labelledby="daily-athlete-dashboard-heading" className="mt-7">
        <h2 id="daily-athlete-dashboard-heading" className="font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">Daily athlete dashboard</h2>
        {!member ? <OperationsNotice title="Member profile required"><p>Create a public member profile to unlock private training, PR, skill, follow, and notification utilities.</p></OperationsNotice> : <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <OperationsPanel title="Recent training" description="Private application data; never official results.">{daily?.recentSessions.length ? <ul className="space-y-3">{daily.recentSessions.map((session) => <li key={session.id}><p className="font-semibold text-ink">{session.title || "Training session"}</p><p className="text-sm text-muted">{session.sessionDate} · {session.movements.length} movements</p></li>)}</ul> : <p className="text-sm text-muted">No training sessions yet.</p>}<Link href="/account/training" className="mt-4 inline-flex text-sm font-bold text-accent">Open training log →</Link></OperationsPanel>
          <OperationsPanel title="Current PRs and skills" description="Every entry retains a self-entered or linked provenance label."><p className="font-display text-3xl font-black text-ink">{daily?.currentRecords.length ?? 0} <span className="text-sm font-normal text-muted">current PRs</span></p><p className="mt-3 font-display text-3xl font-black text-ink">{daily?.skills.length ?? 0} <span className="text-sm font-normal text-muted">tracked skills</span></p><div className="mt-4 flex gap-4"><Link href="/account/records" className="text-sm font-bold text-accent">PRs →</Link><Link href="/account/skills" className="text-sm font-bold text-accent">Skills →</Link></div></OperationsPanel>
          <OperationsPanel title="Upcoming followed competitions" description="Only currently public canonical competitions are eligible.">{upcomingFollowed.length ? <ul className="space-y-3">{upcomingFollowed.map((competition) => <li key={competition.canonicalId}><Link href={`/competitions/${competition.slug}`} className="font-semibold text-ink hover:text-accent">{competition.name}</Link><p className="text-sm text-muted">{competition.dateDisplay}</p></li>)}</ul> : <p className="text-sm text-muted">No upcoming followed competitions.</p>}</OperationsPanel>
          <OperationsPanel className="lg:col-span-3" title="Recent notifications" description="In-app only; no email or push delivery is claimed.">{notifications.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{notifications.map((notification) => <li key={notification.id} className="border border-white/10 p-3 text-sm text-muted"><span className="font-semibold uppercase text-ink">{notification.notificationType.replaceAll("-", " ")}</span><br />{new Date(notification.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</li>)}</ul> : <p className="text-sm text-muted">No notifications yet.</p>}<Link href="/account/notifications" className="mt-4 inline-flex text-sm font-bold text-accent">Open notifications →</Link></OperationsPanel>
        </div>}
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <OperationsPanel
          title="Latest submissions"
          description="The editorial desk cannot see an unsent draft as a reviewed or approved item."
        >
          <ContributorSubmissionList submissions={overview.latestSubmissions} />
          {overview.totalSubmissions > overview.latestSubmissions.length ? (
            <Link
              href="/account/submissions"
              className="mt-5 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View all submissions
            </Link>
          ) : null}
        </OperationsPanel>

        <div className="space-y-6">
          <OperationsPanel
            title="Contributor identity"
            description="Private portal identity is separate from public athlete and author profiles."
          >
            <dl className="space-y-5">
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Role and access
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  <StatusLabel kind="role" value={user.role} />
                  <StatusLabel
                    kind="access"
                    value={overview.profile.accessStatus}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Profile
                </dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  {overview.profileComplete
                    ? "Core contributor details are complete."
                    : "Add a biography, location, or area of interest to complete the profile."}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Contributor since
                </dt>
                <dd className="mt-2 text-sm text-muted">
                  {formatOperationsDate(overview.profile.contributorSince)}
                </dd>
              </div>
            </dl>
          </OperationsPanel>

          <OperationsNotice title="Operational boundaries">
            <p>
              Submission is not publication. Claims must be verified before
              public use, and approval only moves a record into editorial
              development.
            </p>
          </OperationsNotice>
        </div>
      </div>
    </OperationsPage>
  );
}
