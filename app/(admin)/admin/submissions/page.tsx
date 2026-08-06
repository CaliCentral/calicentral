import type { Metadata } from "next";

import { FilterBar } from "@/components/operations/filter-bar";
import { MetricCard } from "@/components/operations/metric-card";
import { OperationsPage } from "@/components/operations/page-shell";
import { AdminSubmissionList } from "@/components/operations/submission-list";
import { requireEditor } from "@/lib/auth";
import {
  countAdminSubmissions,
  getAdminSubmissionQueue,
} from "@/lib/operations/submissions";
import {
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
  type AdminSubmissionSummary,
} from "@/lib/operations/types";
import {
  priorityLabel,
  submissionStatusLabel,
  submissionTypeLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Submission queue",
};

type AdminSubmissionQueuePageProps = {
  readonly searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminSubmissionQueuePage({
  searchParams,
}: AdminSubmissionQueuePageProps) {
  const [params] = await Promise.all([
    searchParams,
    requireEditor("/admin/submissions"),
  ]);
  const [queue, totalSubmissionCount] = await Promise.all([
    getAdminSubmissionQueue(),
    countAdminSubmissions(),
  ]);
  const query = first(params.q).trim().toLowerCase();
  const type = first(params.type);
  const status = first(params.status);
  const priority = first(params.priority);
  const reviewer = first(params.reviewer);
  const contributor = first(params.contributor);
  const sort = first(params.sort) || "updatedDesc";
  const contributors = uniqueOptions(
    queue.map((submission) => ({
      value: submission.submitter.id,
      label: submission.submitter.displayName,
    })),
  );
  const reviewers = uniqueOptions(
    queue.flatMap((submission) =>
      submission.assignedReviewer
        ? [
            {
              value: submission.assignedReviewer.id,
              label: submission.assignedReviewer.displayName,
            },
          ]
        : [],
    ),
  );

  const filtered = queue
    .filter((submission) => {
      const matchesQuery =
        !query ||
        submission.title.toLowerCase().includes(query) ||
        submission.submissionNumber.toLowerCase().includes(query) ||
        submission.submitter.displayName.toLowerCase().includes(query);
      return (
        matchesQuery &&
        (!type || submission.submissionType === type) &&
        (!status || submission.status === status) &&
        (!priority || submission.priority === priority) &&
        (!reviewer ||
          (reviewer === "unassigned"
            ? !submission.assignedReviewer
            : submission.assignedReviewer?.id === reviewer)) &&
        (!contributor || submission.submitter.id === contributor)
      );
    })
    .sort(sortQueue(sort));

  return (
    <OperationsPage
      eyebrow="Editorial desk / Protected queue"
      title="Submission queue"
      description="Search, triage, and open contributor records with only the private fields needed for editorial operations."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="All secure records" value={totalSubmissionCount} />
        <MetricCard
          label="Loaded awaiting triage"
          value={queue.filter((item) => item.status === "submitted").length}
          detail="Within the bounded queue view"
        />
        <MetricCard label="Matching filters" value={filtered.length} />
      </div>
      <div className="mt-6">
        <FilterBar
          search={first(params.q)}
          searchPlaceholder="Number, title, or contributor"
          resetHref="/admin/submissions"
          filters={[
            {
              name: "type",
              label: "Type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...SUBMISSION_TYPES.map((value) => ({
                  value,
                  label: submissionTypeLabel(value),
                })),
              ],
            },
            {
              name: "status",
              label: "Status",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...SUBMISSION_STATUSES.map((value) => ({
                  value,
                  label: submissionStatusLabel(value),
                })),
              ],
            },
            {
              name: "priority",
              label: "Priority",
              value: priority,
              options: [
                { value: "", label: "All priorities" },
                ...SUBMISSION_PRIORITIES.map((value) => ({
                  value,
                  label: priorityLabel(value),
                })),
              ],
            },
            {
              name: "reviewer",
              label: "Reviewer",
              value: reviewer,
              options: [
                { value: "", label: "All reviewers" },
                { value: "unassigned", label: "Unassigned" },
                ...reviewers,
              ],
            },
            {
              name: "contributor",
              label: "Contributor",
              value: contributor,
              options: [
                { value: "", label: "All contributors" },
                ...contributors,
              ],
            },
            {
              name: "sort",
              label: "Sort",
              value: sort,
              options: [
                { value: "updatedDesc", label: "Recently updated" },
                { value: "newest", label: "Newest submitted" },
                { value: "oldest", label: "Oldest submitted" },
              ],
            },
          ]}
        />
      </div>
      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {filtered.length} {filtered.length === 1 ? "record" : "records"}
      </p>
      {totalSubmissionCount > queue.length ? (
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          Filters apply to the {queue.length} most recently updated records;
          {" "}{totalSubmissionCount - queue.length} older records remain retained.
        </p>
      ) : null}
      <div className="mt-3">
        <AdminSubmissionList submissions={filtered} />
      </div>
    </OperationsPage>
  );
}

function uniqueOptions(
  options: readonly { value: string; label: string }[],
): { value: string; label: string }[] {
  return [...new Map(options.map((option) => [option.value, option])).values()]
    .sort((a, b) => a.label.localeCompare(b.label));
}

function sortQueue(
  sort: string,
): (a: AdminSubmissionSummary, b: AdminSubmissionSummary) => number {
  if (sort === "oldest") {
    return (a, b) =>
      (a.submittedAt ?? a.createdAt).localeCompare(
        b.submittedAt ?? b.createdAt,
      );
  }
  if (sort === "newest") {
    return (a, b) =>
      (b.submittedAt ?? b.createdAt).localeCompare(
        a.submittedAt ?? a.createdAt,
      );
  }
  return (a, b) => b.updatedAt.localeCompare(a.updatedAt);
}
