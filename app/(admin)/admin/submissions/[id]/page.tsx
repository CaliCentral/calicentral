import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { AuditList } from "@/components/operations/audit-list";
import { SelectInput, TextArea } from "@/components/operations/field";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { SubmissionContent } from "@/components/operations/submission-content";
import { requireEditor } from "@/lib/auth";
import {
  addPrivateNoteAction,
  approveSubmissionAction,
  archiveSubmissionAction,
  assignReviewerAction,
  rejectSubmissionAction,
  requestRevisionAction,
  startReviewAction,
  updatePriorityAction,
  updateVisibleFeedbackAction,
} from "@/lib/operations/actions";
import { getAssignableReviewers } from "@/lib/operations/contributors";
import { getSubmissionForReview } from "@/lib/operations/submissions";
import { SUBMISSION_PRIORITIES } from "@/lib/operations/types";
import {
  formatOperationsDate,
  priorityLabel,
  submissionStatusDescription,
  submissionTypeLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Review submission",
};

type AdminSubmissionDetailPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function AdminSubmissionDetailPage({
  params,
}: AdminSubmissionDetailPageProps) {
  const { id } = await params;
  await requireEditor(`/admin/submissions/${id}`);

  if (!isValidRecordId(id)) {
    notFound();
  }

  const [submission, reviewers] = await Promise.all([
    getSubmissionForReview(id),
    getAssignableReviewers(),
  ]);

  if (!submission) {
    notFound();
  }

  const mayResolve =
    submission.status === "submitted" || submission.status === "inReview";
  const mayArchive =
    submission.status === "approved" || submission.status === "rejected";
  const mayAssignReviewer = [
    "submitted",
    "inReview",
    "revisionRequested",
  ].includes(submission.status);
  const mayUpdateEditorialMetadata = [
    "submitted",
    "inReview",
    "revisionRequested",
    "approved",
    "rejected",
  ].includes(submission.status);

  return (
    <OperationsPage
      eyebrow={`Editorial review / ${submission.submissionNumber}`}
      title={submission.title}
      description={`${submissionTypeLabel(submission.submissionType)} · Secure contributor intake record`}
      actions={
        <>
          <Link
            href="/admin/submissions"
            className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Back to queue
          </Link>
          <StudioSubmissionLink
            id={submission.createdDraftDocumentId ?? submission.id}
            type={submission.createdDraftDocumentId ? undefined : "submission"}
            label={
              submission.createdDraftDocumentId
                ? "Open linked draft"
                : "Open in Studio"
            }
          />
        </>
      }
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.52fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Complete submitted content">
            <SubmissionContent submission={submission} />
          </OperationsPanel>

          <OperationsPanel
            title="Contributor review context"
            description="Private identity information required for editorial review. Do not copy it into public content."
          >
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailRow
                label="Contributor"
                value={submission.submitter.displayName}
              />
              <DetailRow
                label="Authenticated email"
                value={submission.submitter.normalizedEmail}
              />
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Access
                </dt>
                <dd className="mt-2">
                  <StatusLabel
                    kind="access"
                    value={submission.submitter.accessStatus}
                  />
                </dd>
              </div>
              <DetailRow
                label="Contributor since"
                value={formatOperationsDate(
                  submission.submitter.contributorSince,
                )}
              />
              <DetailRow
                label="Submission history"
                value={`${submission.submitter.submissionCount} total; ${submission.submitter.activeReviewCount} active review`}
              />
              <div>
                <Link
                  href={`/admin/contributors/${encodeURIComponent(submission.submitter.id)}`}
                  className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.11em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Open contributor record
                </Link>
              </div>
            </dl>
          </OperationsPanel>

          <OperationsPanel
            title="Private editorial notes"
            description="Internal newsroom context only. This array is never fetched by contributor projections."
          >
            {submission.privateEditorialNotes.length ? (
              <ol className="space-y-3">
                {submission.privateEditorialNotes.map((note) => (
                  <li
                    key={note.key}
                    className="border border-violet-300/25 bg-violet-300/[0.06] p-4"
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                      {note.text}
                    </p>
                    <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.09em] text-violet-100/75">
                      {note.author.displayName} ·{" "}
                      {formatOperationsDate(note.createdAt, true)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No private notes recorded.</p>
            )}
            <div className="mt-6 border-t border-white/10 pt-6">
              <ActionForm
                action={addPrivateNoteAction}
                submitLabel="Add private note"
                pendingLabel="Adding private note…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <input
                  type="hidden"
                  name="operationKey"
                  value={crypto.randomUUID()}
                />
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-violet-100">
                    Private — editors and administrators only
                  </span>
                  <TextArea
                    name="note"
                    maxLength={6000}
                    required
                    className="mt-2"
                  />
                </label>
              </ActionForm>
            </div>
          </OperationsPanel>

          <OperationsPanel
            title="Submission audit history"
            description="Meaningful transitions and editorial changes are authored on the server."
          >
            <AuditList events={submission.auditEvents} />
          </OperationsPanel>
        </div>

        <aside className="space-y-6">
          <OperationsPanel
            title="Workflow status"
            description={submissionStatusDescription(submission.status)}
          >
            <div className="flex flex-wrap gap-2">
              <StatusLabel kind="submission" value={submission.status} />
              <StatusLabel kind="priority" value={submission.priority} />
            </div>
            <dl className="mt-5 space-y-4">
              <DetailRow
                label="Assigned reviewer"
                value={submission.assignedReviewer?.displayName ?? "Unassigned"}
              />
              <DetailRow
                label="Created"
                value={formatOperationsDate(submission.createdAt, true)}
              />
              <DetailRow
                label="Submitted"
                value={formatOperationsDate(submission.submittedAt, true)}
              />
              <DetailRow
                label="Last updated"
                value={formatOperationsDate(submission.updatedAt, true)}
              />
              <DetailRow
                label="Reviewed"
                value={formatOperationsDate(submission.reviewedAt, true)}
              />
              <DetailRow
                label="Resolved"
                value={formatOperationsDate(submission.resolvedAt, true)}
              />
            </dl>
          </OperationsPanel>

          {submission.status === "submitted" ? (
            <OperationsPanel
              title="Start review"
              description="Moves a newly submitted record into active editorial review."
            >
              <ActionForm
                action={startReviewAction}
                submitLabel="Start review"
                pendingLabel="Starting review…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
              </ActionForm>
            </OperationsPanel>
          ) : null}

          {mayUpdateEditorialMetadata ? (
            <OperationsPanel
              title="Assignment and priority"
              description="Both values are internal. Every change is audited."
            >
              {mayAssignReviewer ? (
                <ActionForm
                  action={assignReviewerAction}
                  submitLabel="Assign reviewer"
                  pendingLabel="Assigning reviewer…"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                      Active editor or administrator
                    </span>
                    <SelectInput
                      name="reviewerId"
                      defaultValue={submission.assignedReviewer?.id}
                      required
                      className="mt-2"
                    >
                      <option value="">Choose reviewer</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.id} value={reviewer.id}>
                          {reviewer.displayName} — {reviewer.role}
                        </option>
                      ))}
                    </SelectInput>
                  </label>
                </ActionForm>
              ) : null}
              <div
                className={
                  mayAssignReviewer
                    ? "mt-6 border-t border-white/10 pt-6"
                    : undefined
                }
              >
                <ActionForm
                  action={updatePriorityAction}
                  submitLabel="Update priority"
                  pendingLabel="Updating priority…"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                      Internal priority
                    </span>
                    <SelectInput
                      name="priority"
                      defaultValue={submission.priority}
                      className="mt-2"
                    >
                      {SUBMISSION_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priorityLabel(priority)}
                        </option>
                      ))}
                    </SelectInput>
                  </label>
                </ActionForm>
              </div>
            </OperationsPanel>
          ) : null}

          {mayUpdateEditorialMetadata ? (
            <OperationsPanel
              title="Contributor-visible feedback"
              description="This field is returned to the submission owner. Keep it concise and professional."
            >
              <ActionForm
                action={updateVisibleFeedbackAction}
                submitLabel="Save visible feedback"
                pendingLabel="Saving visible feedback…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <TextArea
                  name="feedback"
                  defaultValue={submission.contributorVisibleFeedback}
                  maxLength={4000}
                  aria-label="Feedback visible to the contributor"
                />
              </ActionForm>
            </OperationsPanel>
          ) : null}

          {mayResolve ? (
            <OperationsPanel
              title="Editorial decision"
              description="All transitions are rechecked on the server. Approval never publishes content."
            >
              <ActionForm
                action={requestRevisionAction}
                submitLabel="Request revision"
                pendingLabel="Requesting revision…"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-amber-100">
                    Feedback visible to contributor
                  </span>
                  <TextArea
                    name="feedback"
                    minLength={10}
                    maxLength={4000}
                    required
                    className="mt-2"
                  />
                </label>
              </ActionForm>
              <div className="mt-6 border-t border-white/10 pt-6">
                <ActionForm
                  action={approveSubmissionAction}
                  submitLabel="Approve for editorial development"
                  pendingLabel="Approving…"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                </ActionForm>
              </div>
              <div className="mt-6 border-t border-white/10 pt-6">
                <ActionForm
                  action={rejectSubmissionAction}
                  submitLabel="Reject submission"
                  pendingLabel="Rejecting…"
                  submitClassName="border border-rose-300/40"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-rose-100">
                      Feedback visible to contributor
                    </span>
                    <TextArea
                      name="feedback"
                      minLength={10}
                      maxLength={4000}
                      required
                      className="mt-2"
                    />
                  </label>
                  <ConfirmationCheckbox>
                    I confirm that this submission should be rejected.
                  </ConfirmationCheckbox>
                </ActionForm>
              </div>
            </OperationsPanel>
          ) : null}

          {mayArchive ? (
            <OperationsPanel
              title="Archive resolved record"
              description="Editor/admin historical retention action for a resolved submission."
            >
              <ActionForm
                action={archiveSubmissionAction}
                submitLabel="Archive submission"
                pendingLabel="Archiving…"
                submitClassName="border border-rose-300/40"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />
                <ConfirmationCheckbox>
                  I confirm this resolved submission should be archived.
                </ConfirmationCheckbox>
              </ActionForm>
            </OperationsPanel>
          ) : null}

          <OperationsNotice title="CMS relationships">
            {submission.linkedDocuments.length ? (
              <ul className="space-y-2">
                {submission.linkedDocuments.map((document) => (
                  <li key={`${document.type}-${document.id}`}>
                    <StudioSubmissionLink
                      id={document.id}
                      type={document.type}
                      label={`Open linked ${document.type}`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No editorial CMS record is linked. Automatic draft conversion
                is intentionally omitted; accepted work remains unpublished.
              </p>
            )}
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
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm leading-6 text-muted">{value}</dd>
    </div>
  );
}

function ConfirmationCheckbox({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <label className="mt-4 flex cursor-pointer gap-3 text-xs leading-5 text-muted">
      <input
        type="checkbox"
        name="confirmation"
        value="confirm"
        required
        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
      />
      <span>{children}</span>
    </label>
  );
}

function StudioSubmissionLink({
  id,
  type,
  label,
}: {
  readonly id: string;
  readonly type?: string;
  readonly label: string;
}) {
  const safeId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(id);
  const safeType = type && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(type)
    ? type
    : undefined;
  const intentPath = safeId
    ? `/studio/intent/edit/id=${encodeURIComponent(id)}${
        safeType ? `;type=${encodeURIComponent(safeType)}` : ""
      }`
    : "/studio";

  return (
    <Link
      href={intentPath}
      className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.11em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {label}
    </Link>
  );
}
