import Link from "next/link";

import { OperationsEmptyState } from "@/components/operations/operations-empty-state";
import { StatusLabel } from "@/components/operations/status-label";
import {
  formatOperationsDate,
  submissionTypeLabel,
} from "@/lib/presentation/operations";
import type {
  AdminSubmissionSummary,
  ContributorSubmissionSummary,
} from "@/lib/operations/types";

type ContributorSubmissionListProps = {
  readonly submissions: readonly ContributorSubmissionSummary[];
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly detailBasePath?: "/account/submissions" | "/admin/submissions";
};

export function ContributorSubmissionList({
  submissions,
  emptyTitle = "No submissions yet",
  emptyDescription = "Start a structured pitch and save it as a draft before sending it to the editorial desk.",
  detailBasePath = "/account/submissions",
}: ContributorSubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <OperationsEmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={detailBasePath === "/account/submissions" ? (
          <Link
            href="/account/submissions/new"
            className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Start a submission
          </Link>
        ) : undefined}
      />
    );
  }

  return (
    <ul className="divide-y divide-white/10 border border-white/15 bg-surface">
      {submissions.map((submission) => (
        <li key={submission.id}>
          <Link
            href={`${detailBasePath}/${encodeURIComponent(submission.id)}`}
            className="grid gap-4 p-5 transition-colors hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="break-all font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">
                  {submission.submissionNumber}
                </span>
                {submission.hasVisibleFeedback ? (
                  <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-amber-100">
                    Feedback available
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 break-words text-lg font-black uppercase tracking-[-0.02em] text-ink">
                {submission.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted">
                {submissionTypeLabel(submission.submissionType)} · Revision{" "}
                {submission.revisionNumber} · Updated{" "}
                {formatOperationsDate(submission.updatedAt)}
                {submission.assignedForReview
                  ? " · Assigned for editorial review"
                  : ""}
              </p>
            </div>
            <StatusLabel kind="submission" value={submission.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminSubmissionList({
  submissions,
}: {
  readonly submissions: readonly AdminSubmissionSummary[];
}) {
  if (submissions.length === 0) {
    return (
      <OperationsEmptyState
        title="No submissions match"
        description="Adjust the secure queue filters or wait for a contributor to send a submission."
        action={
          <Link
            href="/admin/submissions"
            className="inline-flex min-h-11 items-center border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear filters
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {submissions.map((submission) => (
          <li key={submission.id} className="border border-white/15 bg-surface p-5">
            <p className="break-all font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-accent">
              {submission.submissionNumber}
            </p>
            <h2 className="mt-2 break-words text-lg font-black uppercase tracking-[-0.02em] text-ink">
              {submission.title}
            </h2>
            <p className="mt-2 break-words text-sm text-muted">
              {submissionTypeLabel(submission.submissionType)} ·{" "}
              {submission.submitter.displayName}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusLabel kind="submission" value={submission.status} />
              <StatusLabel kind="priority" value={submission.priority} />
            </div>
            <dl className="mt-4 grid gap-3 text-xs text-muted">
              <div>
                <dt className="font-mono uppercase tracking-[0.08em] text-white/45">
                  Reviewer
                </dt>
                <dd className="mt-1 break-words">
                  {submission.assignedReviewer?.displayName ?? "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.08em] text-white/45">
                  Submitted
                </dt>
                <dd className="mt-1">
                  {formatOperationsDate(submission.submittedAt)}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.08em] text-white/45">
                  Updated
                </dt>
                <dd className="mt-1">
                  {formatOperationsDate(submission.updatedAt)}
                </dd>
              </div>
            </dl>
            <Link
              href={`/admin/submissions/${encodeURIComponent(submission.id)}`}
              className="mt-5 inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Review submission
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto border border-white/15 bg-surface md:block">
        <table className="w-full min-w-[66rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Protected editorial submission queue
        </caption>
        <thead className="border-b border-white/15 bg-canvas/60 font-mono text-[0.68rem] font-bold uppercase tracking-[0.11em] text-white/55">
          <tr>
            <th scope="col" className="px-4 py-4">Submission</th>
            <th scope="col" className="px-4 py-4">Contributor</th>
            <th scope="col" className="px-4 py-4">Workflow</th>
            <th scope="col" className="px-4 py-4">Reviewer</th>
            <th scope="col" className="px-4 py-4">Priority</th>
            <th scope="col" className="px-4 py-4">Submitted</th>
            <th scope="col" className="px-4 py-4">Updated</th>
            <th scope="col" className="px-4 py-4">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {submissions.map((submission) => (
            <tr key={submission.id} className="align-top">
              <th scope="row" className="max-w-xs px-4 py-5">
                <span className="block break-all font-mono text-[0.68rem] uppercase tracking-[0.1em] text-accent">
                  {submission.submissionNumber}
                </span>
                <span className="mt-2 block break-words font-bold text-ink">
                  {submission.title}
                </span>
                <span className="mt-1 block font-normal text-muted">
                  {submissionTypeLabel(submission.submissionType)}
                </span>
              </th>
              <td className="max-w-48 break-words px-4 py-5 text-muted">
                {submission.submitter.displayName}
              </td>
              <td className="px-4 py-5">
                <StatusLabel kind="submission" value={submission.status} />
              </td>
              <td className="max-w-44 break-words px-4 py-5 text-muted">
                {submission.assignedReviewer?.displayName ?? "Unassigned"}
              </td>
              <td className="px-4 py-5">
                <StatusLabel kind="priority" value={submission.priority} />
              </td>
              <td className="whitespace-nowrap px-4 py-5 text-muted">
                {formatOperationsDate(submission.submittedAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-5 text-muted">
                {formatOperationsDate(submission.updatedAt)}
              </td>
              <td className="px-4 py-5 text-right">
                <Link
                  href={`/admin/submissions/${encodeURIComponent(submission.id)}`}
                  className="inline-flex min-h-10 items-center border border-white/20 px-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}
