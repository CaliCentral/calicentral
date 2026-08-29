import type { Metadata } from "next";
import Link from "next/link";

import { AuditList } from "@/components/operations/audit-list";
import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import {
  getAdminActionableSubmissionCounts,
  getAdminDashboard,
} from "@/lib/operations/submissions";
import type { SubmissionType } from "@/lib/operations/types";
import { studioUrl } from "@/lib/site/studio";

export const metadata: Metadata = {
  title: "Editorial operations",
};

const submissionTypeLabels = {
  storyPitch: "Story pitches",
  athleteNomination: "Athlete claims & nominations",
  competitionListing: "Competition listings",
  teamApplication: "Team applications",
  organizationClaim: "Organization claims",
  videoSubmission: "Video submissions",
  mediaPitch: "Photo & media pitches",
  productSubmission: "Product submissions",
  correctionRequest: "Corrections & disputes",
} as const satisfies Readonly<Record<SubmissionType, string>>;

export default async function AdminDashboardPage() {
  await requireEditor("/admin");
  const [dashboard, actionableCounts] = await Promise.all([
    getAdminDashboard(),
    getAdminActionableSubmissionCounts(),
  ]);

  return (
    <OperationsPage
      eyebrow="Internal / Editorial operations"
      title="Editorial desk overview"
      description="A secure operational view of contributor intake and moderation. Counts come from Sanity records—not public traffic or invented analytics."
      actions={
        <>
          <Link
            href="/admin/submissions"
            className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Open submission queue
          </Link>
          <Link
            href="/admin/contributors"
            className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Manage contributors
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Awaiting review"
          value={dashboard.submissions.awaitingReview}
        />
        <MetricCard
          label="In review"
          value={dashboard.submissions.inReview}
        />
        <MetricCard
          label="Revision requests"
          value={dashboard.submissions.revisionRequested}
        />
        <MetricCard
          label="Approved"
          value={dashboard.submissions.approved}
          detail="Editorial development—not publication"
        />
        <MetricCard
          label="Rejected"
          value={dashboard.submissions.rejected}
        />
        <MetricCard
          label="Active contributors"
          value={dashboard.contributors.active}
        />
        <MetricCard
          label="Suspended contributors"
          value={dashboard.contributors.suspended}
        />
      </div>

      <OperationsPanel
        className="mt-7"
        eyebrow="Current intake / Submitted or in review"
        title="Actionable work by submission type"
        description="Counts come from the existing generic Sanity intake. They do not imply that a claim is verified, a team is admitted, a product is endorsed, or a public record has been created."
      >
        <ul className="grid gap-px border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
          {actionableCounts.map(({ submissionType, count }) => (
            <li
              key={submissionType}
              className="flex min-h-20 items-center justify-between gap-5 bg-canvas px-4 py-3"
            >
              <span className="text-sm font-bold uppercase tracking-[0.03em] text-ink">
                {submissionTypeLabels[submissionType]}
              </span>
              <span className="font-display text-3xl font-black text-accent">
                {count}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Community reports remain in the separately protected D1 Trust &amp;
            Safety queue and are not folded into these Sanity counts.
          </p>
          <Link
            href="/admin/community"
            className="inline-flex min-h-11 shrink-0 items-center font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
          >
            Open Trust &amp; Safety →
          </Link>
        </div>
      </OperationsPanel>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.5fr)]">
        <OperationsPanel
          title="Recent moderation activity"
          description="A limited operational snapshot. Administrators can inspect the protected full audit history."
        >
          <AuditList events={dashboard.recentAuditEvents} compact />
        </OperationsPanel>
        <div className="space-y-6">
          <OperationsPanel
            title="Editorial tools"
            description="Studio membership is separately enforced by Sanity."
          >
            <div className="grid gap-3">
              <Link
                href="/admin/submissions"
                className="inline-flex min-h-12 items-center justify-between border border-white/15 px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Submission queue <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/admin/contributors"
                className="inline-flex min-h-12 items-center justify-between border border-white/15 px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Contributor directory <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/admin/community"
                className="inline-flex min-h-12 items-center justify-between border border-white/15 px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Trust &amp; Safety queue <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={studioUrl}
                className="inline-flex min-h-12 items-center justify-between border border-accent/40 px-4 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Open Sanity Studio <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </OperationsPanel>
          <OperationsNotice title="Approval boundary">
            <p>
              Approval accepts a submission for editorial development. It does
              not publish content, verify claims, update rankings, or create an
              official athlete, team, organization, competition, media, or
              product record.
            </p>
          </OperationsNotice>
        </div>
      </div>
    </OperationsPage>
  );
}
