import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/operations/filter-bar";
import { MetricCard } from "@/components/operations/metric-card";
import { OperationsPage } from "@/components/operations/page-shell";
import { ContributorSubmissionList } from "@/components/operations/submission-list";
import { requireContributor } from "@/lib/auth";
import {
  countContributorSubmissions,
  getContributorSubmissions,
} from "@/lib/operations/submissions";
import {
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
  type ContributorSubmissionSummary,
} from "@/lib/operations/types";
import {
  submissionStatusLabel,
  submissionTypeLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "My submissions",
};

type ContributorSubmissionsPageProps = {
  readonly searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    status?: string | string[];
    sort?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ContributorSubmissionsPage({
  searchParams,
}: ContributorSubmissionsPageProps) {
  const [user, params] = await Promise.all([
    requireContributor("/account/submissions"),
    searchParams,
  ]);
  const [allSubmissions, totalSubmissions] = await Promise.all([
    getContributorSubmissions(user.id),
    countContributorSubmissions(user.id),
  ]);
  const query = first(params.q).trim().toLowerCase();
  const type = first(params.type);
  const status = first(params.status);
  const sort = first(params.sort) || "updatedDesc";

  const filtered = allSubmissions
    .filter((submission) => {
      const matchesQuery =
        !query ||
        submission.title.toLowerCase().includes(query) ||
        submission.submissionNumber.toLowerCase().includes(query);
      return (
        matchesQuery &&
        (!type || submission.submissionType === type) &&
        (!status || submission.status === status)
      );
    })
    .sort(sortSubmissions(sort));

  return (
    <OperationsPage
      eyebrow="Account / Secure submission directory"
      title="My submissions"
      description="This directory is fetched with your authenticated contributor ID. No other contributor records are sent to the page."
      actions={
        <Link
          href="/account/submissions/new"
          className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          New submission
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total"
          value={totalSubmissions}
          detail="Owned by this contributor"
        />
        <MetricCard
          label="Loaded editorial flow"
          value={
            allSubmissions.filter((submission) =>
              ["submitted", "inReview", "revisionRequested"].includes(
                submission.status,
              ),
            ).length
          }
          detail="Within the bounded directory view"
        />
        <MetricCard
          label="Matching filters"
          value={filtered.length}
          detail={query || type || status ? "Filtered result" : "All records"}
        />
      </div>
      <div className="mt-6">
        <FilterBar
          search={first(params.q)}
          searchPlaceholder="Title or submission number"
          resetHref="/account/submissions"
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
              name: "sort",
              label: "Sort",
              value: sort,
              options: [
                { value: "updatedDesc", label: "Recently updated" },
                { value: "newest", label: "Newest created" },
                { value: "oldest", label: "Oldest created" },
              ],
            },
          ]}
        />
      </div>
      {totalSubmissions > allSubmissions.length ? (
        <p className="mt-4 text-sm leading-6 text-amber-100/80">
          Showing the {allSubmissions.length} most recently updated records.
          Older records remain retained and available to the editorial team.
        </p>
      ) : null}
      <div className="mt-6">
        <ContributorSubmissionList
          submissions={filtered}
          emptyTitle={
            allSubmissions.length ? "No submissions match" : "No submissions yet"
          }
          emptyDescription={
            allSubmissions.length
              ? "Adjust the search or filters to see your secure records."
              : undefined
          }
        />
      </div>
    </OperationsPage>
  );
}

function sortSubmissions(
  sort: string,
): (a: ContributorSubmissionSummary, b: ContributorSubmissionSummary) => number {
  if (sort === "oldest") {
    return (a, b) => a.createdAt.localeCompare(b.createdAt);
  }

  if (sort === "newest") {
    return (a, b) => b.createdAt.localeCompare(a.createdAt);
  }

  return (a, b) => b.updatedAt.localeCompare(a.updatedAt);
}
