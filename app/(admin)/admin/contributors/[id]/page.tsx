import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/operations/action-form";
import { AuditList } from "@/components/operations/audit-list";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { SelectInput, TextArea } from "@/components/operations/field";
import { StatusLabel } from "@/components/operations/status-label";
import { ContributorSubmissionList } from "@/components/operations/submission-list";
import { requireEditor, resolveEffectiveRole } from "@/lib/auth";
import {
  updateContributorAccessAction,
  updateContributorInternalNotesAction,
  updateContributorRoleAction,
} from "@/lib/operations/actions";
import {
  getContributorForAdmin,
  getContributorForEditor,
} from "@/lib/operations/contributors";
import {
  getContributorAuditEvents,
  getContributorSubmissions,
} from "@/lib/operations/submissions";
import {
  ACCESS_STATUSES,
  CONTRIBUTOR_ROLES,
  type AdminContributorDetail,
  type EditorContributorSummary,
} from "@/lib/operations/types";
import {
  accessStatusLabel,
  formatOperationsDate,
  roleLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Contributor operations detail",
};

type ContributorAdminDetailPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function ContributorAdminDetailPage({
  params,
}: ContributorAdminDetailPageProps) {
  const { id } = await params;
  const user = await requireEditor(`/admin/contributors/${id}`);

  if (!isValidRecordId(id)) {
    notFound();
  }

  const [contributor, submissions, moderationHistory] = await Promise.all([
    user.role === "admin"
      ? getContributorForAdmin(id)
      : getContributorForEditor(id),
    getContributorSubmissions(id),
    getContributorAuditEvents(id),
  ]);

  if (!contributor) {
    notFound();
  }

  const effectiveRole = resolveEffectiveRole(
    contributor.role,
    contributor.normalizedEmail,
  );

  const adminContributor =
    user.role === "admin" && isAdminContributor(contributor)
      ? contributor
      : null;

  return (
    <OperationsPage
      eyebrow="Editorial desk / Contributor record"
      title={contributor.displayName}
      description="Private identity, editorial context, submission history, and administrator safeguards for this contributor."
      actions={
        <Link
          href="/admin/contributors"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Back to directory
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.55fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Contributor identity">
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailRow
                label="Authenticated email"
                value={contributor.normalizedEmail}
              />
              {adminContributor ? (
                <DetailRow
                  label="Provider"
                  value={adminContributor.authProvider}
                />
              ) : (
                <DetailRow
                  label="Identity source"
                  value="Authenticated OAuth contributor"
                />
              )}
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Role
                </dt>
                <dd className="mt-2">
                  <StatusLabel kind="role" value={effectiveRole} />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Access
                </dt>
                <dd className="mt-2">
                  <StatusLabel kind="access" value={contributor.accessStatus} />
                </dd>
              </div>
              <DetailRow
                label="Contributor since"
                value={formatOperationsDate(
                  contributor.contributorSince,
                  true,
                )}
              />
              <DetailRow
                label="Last sign-in"
                value={formatOperationsDate(contributor.lastSignedInAt, true)}
              />
              <DetailRow
                label="Profile location"
                value={contributor.location || "Not supplied"}
              />
              <DetailRow
                label="Areas of interest"
                value={
                  contributor.areasOfInterest.join(", ") || "Not supplied"
                }
              />
              <DetailRow
                label="Linked public author"
                value={
                  contributor.linkedAuthorId
                    ? "Linked by editorial staff"
                    : "Not linked"
                }
              />
              <DetailRow
                label="Linked public athlete"
                value={
                  contributor.linkedAthleteId
                    ? "Linked by editorial staff"
                    : "Not linked"
                }
              />
              <div className="sm:col-span-2">
                <DetailRow
                  label="Biography"
                  value={contributor.biography || "Not supplied"}
                />
              </div>
            </dl>
          </OperationsPanel>

          <OperationsPanel
            title="Submission history"
            description={`${contributor.submissionCount} total; ${contributor.activeReviewCount} in an active review state.`}
          >
            <ContributorSubmissionList
              submissions={submissions}
              detailBasePath="/admin/submissions"
              emptyTitle="No submission history"
              emptyDescription="This contributor has not created a submission record."
            />
          </OperationsPanel>

          <OperationsPanel
            title="Moderation history"
            description="A bounded view of server-authored account, submission, and review events associated with this contributor."
          >
            <AuditList events={moderationHistory} />
          </OperationsPanel>
        </div>

        <aside className="space-y-6">
          {adminContributor ? (
            <>
              <OperationsPanel
                title="Change role"
                description={`Target account: ${contributor.displayName}. Bootstrap allowlists and the final-administrator safeguard remain authoritative.`}
              >
                <ActionForm
                  action={updateContributorRoleAction}
                  submitLabel="Update role"
                  pendingLabel="Updating role…"
                >
                  <input
                    type="hidden"
                    name="contributorId"
                    value={contributor.id}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                      Portal role
                    </span>
                    <SelectInput
                      name="role"
                      defaultValue={contributor.role}
                      className="mt-2"
                    >
                      {CONTRIBUTOR_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </SelectInput>
                  </label>
                  {effectiveRole !== contributor.role ? (
                    <p className="mt-3 text-xs leading-5 text-amber-100/80">
                      The stored role is {roleLabel(contributor.role)}; the
                      server-only bootstrap allowlist currently resolves this
                      account as {roleLabel(effectiveRole)}.
                    </p>
                  ) : null}
                  <ConfirmationCheckbox>
                    I confirm this role change for {contributor.displayName},
                    including any administrator access impact.
                  </ConfirmationCheckbox>
                </ActionForm>
              </OperationsPanel>

              <OperationsPanel
                title="Change access"
                description="Suspension or archival blocks protected mutations. Active submissions prevent unsafe archival."
              >
                <ActionForm
                  action={updateContributorAccessAction}
                  submitLabel="Update access"
                  pendingLabel="Updating access…"
                >
                  <input
                    type="hidden"
                    name="contributorId"
                    value={contributor.id}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                      Access status
                    </span>
                    <SelectInput
                      name="accessStatus"
                      defaultValue={contributor.accessStatus}
                      className="mt-2"
                    >
                      {ACCESS_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {accessStatusLabel(status)}
                        </option>
                      ))}
                    </SelectInput>
                  </label>
                  <ConfirmationCheckbox>
                    I confirm this access change for {contributor.displayName}.
                  </ConfirmationCheckbox>
                </ActionForm>
              </OperationsPanel>

              <OperationsPanel
                title="Private internal notes"
                description="Administrator-only account moderation context. Never returned to contributor pages."
              >
                <ActionForm
                  action={updateContributorInternalNotesAction}
                  submitLabel="Save private notes"
                  pendingLabel="Saving private notes…"
                >
                  <input
                    type="hidden"
                    name="contributorId"
                    value={contributor.id}
                  />
                  <TextArea
                    name="internalNotes"
                    defaultValue={adminContributor.internalNotes}
                    maxLength={6000}
                    aria-label="Private contributor internal notes"
                  />
                </ActionForm>
              </OperationsPanel>
            </>
          ) : (
            <OperationsNotice title="Read-only editor access">
              <p>
                Editors may inspect contributor context required for review.
                Only administrators can change roles, access status, or private
                account notes.
              </p>
            </OperationsNotice>
          )}

          <OperationsNotice title="Record retention">
            <p>
              Contributor records are suspended or archived, not automatically
              deleted. Every high-impact change creates a server-authored audit
              event.
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

function isAdminContributor(
  value: EditorContributorSummary | AdminContributorDetail,
): value is AdminContributorDetail {
  return (
    "internalNotes" in value &&
    "authProvider" in value &&
    typeof value.internalNotes === "string" &&
    typeof value.authProvider === "string"
  );
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
      <dd className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-muted">
        {value}
      </dd>
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
