import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { SubmissionContent } from "@/components/operations/submission-content";
import {
  SubmissionForm,
  type SubmissionFormInitial,
} from "@/components/operations/submission-form";
import { requireContributor } from "@/lib/auth";
import {
  resubmitSubmissionAction,
  submitSubmissionAction,
  updateSubmissionAction,
  withdrawSubmissionAction,
} from "@/lib/operations/actions";
import { getSubmissionForContributor } from "@/lib/operations/submissions";
import type { ContributorSubmissionDetail } from "@/lib/operations/types";
import {
  isContributorEditableStatus,
  isContributorWithdrawableStatus,
} from "@/lib/operations/workflow";
import {
  formatOperationsDate,
  submissionStatusDescription,
  submissionTypeLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Submission detail",
};

type ContributorSubmissionPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function ContributorSubmissionPage({
  params,
}: ContributorSubmissionPageProps) {
  const { id } = await params;
  const user = await requireContributor(`/account/submissions/${id}`);

  if (!isValidRecordId(id)) {
    notFound();
  }

  const submission = await getSubmissionForContributor(id, user.id);

  if (!submission) {
    // Ownership failures deliberately use the same response as missing records.
    notFound();
  }

  const canEdit = isContributorEditableStatus(submission.status);
  const canWithdraw = isContributorWithdrawableStatus(submission.status);

  return (
    <OperationsPage
      eyebrow={`Account / ${submission.submissionNumber}`}
      title={submission.title}
      description={`${submissionTypeLabel(submission.submissionType)} · Revision ${submission.revisionNumber}`}
      actions={
        <Link
          href="/account/submissions"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Back to submissions
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.48fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Submission record">
            <SubmissionContent submission={submission} />
          </OperationsPanel>

          {canEdit ? (
            <OperationsPanel
              title={
                submission.status === "revisionRequested"
                  ? "Prepare requested revision"
                  : "Edit working draft"
              }
              description="Saving validates and increments the concise revision record. It does not submit or publish the content."
            >
              <SubmissionForm
                action={updateSubmissionAction}
                initialSubmission={editableSubmission(submission)}
                mode="edit"
                operationKey={crypto.randomUUID()}
              />
            </OperationsPanel>
          ) : null}
        </div>

        <aside className="space-y-6">
          <OperationsPanel
            title="Workflow"
            description={submissionStatusDescription(submission.status)}
          >
            <StatusLabel kind="submission" value={submission.status} />
            <dl className="mt-5 space-y-4">
              <DetailRow
                label="Submission number"
                value={submission.submissionNumber}
                mono
              />
              <DetailRow
                label="Updated"
                value={formatOperationsDate(submission.updatedAt, true)}
              />
              <DetailRow
                label="Submitted"
                value={formatOperationsDate(submission.submittedAt, true)}
              />
              <DetailRow
                label="Revision history"
                value={`Revision ${submission.revisionNumber}; concise audit events preserve meaningful changes.`}
              />
              <DetailRow
                label="Assignment"
                value={
                  submission.assignedForReview
                    ? "Assigned for editorial review"
                    : "No reviewer assignment shown"
                }
              />
            </dl>
          </OperationsPanel>

          {submission.contributorVisibleFeedback ? (
            <OperationsNotice title="Visible editorial feedback" tone="warning">
              <p className="break-words whitespace-pre-wrap">
                {submission.contributorVisibleFeedback}
              </p>
            </OperationsNotice>
          ) : (
            <OperationsNotice title="Visible editorial feedback">
              <p>No contributor-visible feedback has been added.</p>
            </OperationsNotice>
          )}

          {submission.status === "draft" ? (
            <OperationsPanel
              title="Send to editorial desk"
              description="Complete all required fields and acknowledge the submission terms."
            >
              <ActionForm
                action={submitSubmissionAction}
                submitLabel="Submit for review"
                pendingLabel="Submitting…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <TermsCheckbox />
              </ActionForm>
            </OperationsPanel>
          ) : null}

          {submission.status === "revisionRequested" ? (
            <OperationsPanel
              title="Return revised submission"
              description="Save the requested changes first, then send the revision back to the desk."
            >
              <ActionForm
                action={resubmitSubmissionAction}
                submitLabel="Resubmit for review"
                pendingLabel="Resubmitting…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <TermsCheckbox />
              </ActionForm>
            </OperationsPanel>
          ) : null}

          {canWithdraw ? (
            <OperationsPanel
              title="Withdraw submission"
              description="Withdrawal removes this record from active consideration. It remains in operational history."
            >
              <ActionForm
                action={withdrawSubmissionAction}
                submitLabel="Withdraw"
                pendingLabel="Withdrawing…"
                submitClassName="bg-transparent text-rose-100 border border-rose-300/40 hover:bg-rose-300/10"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
              </ActionForm>
            </OperationsPanel>
          ) : null}

          <OperationsNotice title="Editorial meaning">
            <p>
              “Approved for editorial development” is not publication,
              verification, ranking, registration, or an official athlete
              designation.
            </p>
          </OperationsNotice>
        </aside>
      </div>
    </OperationsPage>
  );
}

function isValidRecordId(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.11em] text-white/50">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm leading-6 text-muted ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function TermsCheckbox() {
  return (
    <label className="flex cursor-pointer gap-3 text-sm leading-6 text-muted">
      <input
        type="checkbox"
        name="termsAccepted"
        value="on"
        required
        className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
      />
      <span>
        I confirm this revision contains no intentional confidential
        information and understand that review does not guarantee publication.
      </span>
    </label>
  );
}

function editableSubmission(
  submission: ContributorSubmissionDetail,
): SubmissionFormInitial {
  const common = {
    id: submission.id,
    title: submission.title,
    summary: submission.summary,
    details: submission.details,
    contributorNote: submission.contributorNote,
    supportingLinks: submission.supportingLinks,
  };

  switch (submission.submissionType) {
    case "storyPitch":
      return {
        ...common,
        submissionType: "storyPitch",
        storyPitchDetails: submission.storyPitchDetails,
      };
    case "athleteNomination":
      return {
        ...common,
        submissionType: "athleteNomination",
        athleteNominationDetails: submission.athleteNominationDetails,
      };
    case "competitionListing":
      return {
        ...common,
        submissionType: "competitionListing",
        competitionListingDetails: submission.competitionListingDetails,
      };
    case "mediaPitch":
      return {
        ...common,
        submissionType: "mediaPitch",
        mediaPitchDetails: submission.mediaPitchDetails,
      };
    case "correctionRequest":
      return {
        ...common,
        submissionType: "correctionRequest",
        correctionRequestDetails: submission.correctionRequestDetails,
      };
  }
}
