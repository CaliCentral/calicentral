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

export const metadata: Metadata = {
  title: "Contributor account",
};

export default async function AccountPage() {
  const user = await requireContributor("/account");
  const overview = await getContributorAccountOverview(user.id);

  if (!overview) {
    notFound();
  }

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
