import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/operations/filter-bar";
import { OperationsEmptyState } from "@/components/operations/operations-empty-state";
import { OperationsPage } from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { requireEditor, resolveEffectiveRole } from "@/lib/auth";
import {
  countContributorProfiles,
  getContributorDirectory,
} from "@/lib/operations/contributors";
import {
  ACCESS_STATUSES,
  CONTRIBUTOR_ROLES,
  type EditorContributorSummary,
} from "@/lib/operations/types";
import {
  accessStatusLabel,
  formatOperationsDate,
  roleLabel,
} from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Contributor directory",
};

type ContributorDirectoryPageProps = {
  readonly searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ContributorDirectoryPage({
  searchParams,
}: ContributorDirectoryPageProps) {
  const [params] = await Promise.all([
    searchParams,
    requireEditor("/admin/contributors"),
  ]);
  const [storedContributors, totalContributorCount] = await Promise.all([
    getContributorDirectory(),
    countContributorProfiles(),
  ]);
  const contributors = storedContributors.map((contributor) => ({
    ...contributor,
    role: resolveEffectiveRole(
      contributor.role,
      contributor.normalizedEmail,
    ),
  }));
  const query = first(params.q).trim().toLowerCase();
  const role = first(params.role);
  const status = first(params.status);
  const sort = first(params.sort) || "name";
  const filtered = contributors
    .filter(
      (contributor) =>
        (!query ||
          contributor.displayName.toLowerCase().includes(query) ||
          contributor.normalizedEmail.toLowerCase().includes(query)) &&
        (!role || contributor.role === role) &&
        (!status || contributor.accessStatus === status),
    )
    .sort(sortContributors(sort));

  return (
    <OperationsPage
      eyebrow="Editorial desk / Private identities"
      title="Contributor directory"
      description="Editors can inspect identity and submission context required for review. Role, access, and internal-note mutations remain administrator-only."
    >
      <FilterBar
        search={first(params.q)}
        searchPlaceholder="Name or authenticated email"
        resetHref="/admin/contributors"
        filters={[
          {
            name: "role",
            label: "Role",
            value: role,
            options: [
              { value: "", label: "All roles" },
              ...CONTRIBUTOR_ROLES.map((value) => ({
                value,
                label: roleLabel(value),
              })),
            ],
          },
          {
            name: "status",
            label: "Access",
            value: status,
            options: [
              { value: "", label: "All access states" },
              ...ACCESS_STATUSES.map((value) => ({
                value,
                label: accessStatusLabel(value),
              })),
            ],
          },
          {
            name: "sort",
            label: "Sort",
            value: sort,
            options: [
              { value: "name", label: "Name A–Z" },
              { value: "newest", label: "Newest contributor" },
              { value: "lastSignIn", label: "Latest sign-in" },
            ],
          },
        ]}
      />
      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {filtered.length} {filtered.length === 1 ? "contributor" : "contributors"}
      </p>
      {totalContributorCount > contributors.length ? (
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          Filters apply to the first {contributors.length} contributor records
          in display-name order; {totalContributorCount - contributors.length}
          {" "}additional records remain retained.
        </p>
      ) : null}
      <div className="mt-3">
        {filtered.length ? (
          <>
            <ul className="space-y-3 md:hidden">
              {filtered.map((contributor) => (
                <li
                  key={contributor.id}
                  className="border border-white/15 bg-surface p-5"
                >
                  <h2 className="break-words text-lg font-black uppercase tracking-[-0.02em] text-ink">
                    {contributor.displayName}
                  </h2>
                  <p className="mt-1 break-all text-sm text-muted">
                    {contributor.normalizedEmail}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusLabel kind="role" value={contributor.role} />
                    <StatusLabel
                      kind="access"
                      value={contributor.accessStatus}
                    />
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted">
                    Since{" "}
                    {formatOperationsDate(contributor.contributorSince)} ·{" "}
                    {contributor.submissionCount} submissions ·{" "}
                    {contributor.activeReviewCount} active review
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Last sign-in {formatOperationsDate(contributor.lastSignedInAt)} ·{" "}
                    Public author {contributor.linkedAuthorId ? "linked" : "not linked"}
                  </p>
                  <Link
                    href={`/admin/contributors/${encodeURIComponent(contributor.id)}`}
                    className="mt-5 inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Open contributor
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto border border-white/15 bg-surface md:block">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Protected contributor operations directory
              </caption>
              <thead className="border-b border-white/15 bg-canvas/60 font-mono text-[0.68rem] font-bold uppercase tracking-[0.11em] text-white/55">
                <tr>
                  <th scope="col" className="px-4 py-4">Contributor</th>
                  <th scope="col" className="px-4 py-4">Role</th>
                  <th scope="col" className="px-4 py-4">Access</th>
                  <th scope="col" className="px-4 py-4">Since / Last sign-in</th>
                  <th scope="col" className="px-4 py-4">Submissions</th>
                  <th scope="col" className="px-4 py-4">Public author</th>
                  <th scope="col" className="px-4 py-4">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((contributor) => (
                  <tr key={contributor.id} className="align-top">
                    <th scope="row" className="max-w-xs px-4 py-5">
                      <span className="block break-words font-bold text-ink">
                        {contributor.displayName}
                      </span>
                      <span className="mt-1 block break-all font-normal text-muted">
                        {contributor.normalizedEmail}
                      </span>
                    </th>
                    <td className="px-4 py-5">
                      <StatusLabel kind="role" value={contributor.role} />
                    </td>
                    <td className="px-4 py-5">
                      <StatusLabel
                        kind="access"
                        value={contributor.accessStatus}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-muted">
                      <span className="block">
                        {formatOperationsDate(contributor.contributorSince)}
                      </span>
                      <span className="mt-1 block text-xs">
                        {formatOperationsDate(contributor.lastSignedInAt)}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-muted">
                      {contributor.submissionCount} total
                      <span className="mt-1 block text-xs">
                        {contributor.activeReviewCount} active review
                      </span>
                    </td>
                    <td className="px-4 py-5 text-muted">
                      {contributor.linkedAuthorId ? "Linked" : "Not linked"}
                    </td>
                    <td className="px-4 py-5 text-right">
                      <Link
                        href={`/admin/contributors/${encodeURIComponent(contributor.id)}`}
                        className="inline-flex min-h-10 items-center border border-white/20 px-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        ) : (
          <OperationsEmptyState
            title={
              contributors.length ? "No contributors match" : "No contributors"
            }
            description={
              contributors.length
                ? "Adjust the private directory filters."
                : "Contributor profiles are provisioned after a configured OAuth sign-in."
            }
            action={
              contributors.length ? (
                <Link
                  href="/admin/contributors"
                  className="inline-flex min-h-11 items-center border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </OperationsPage>
  );
}

function sortContributors(
  sort: string,
): (a: EditorContributorSummary, b: EditorContributorSummary) => number {
  if (sort === "newest") {
    return (a, b) => b.contributorSince.localeCompare(a.contributorSince);
  }
  if (sort === "lastSignIn") {
    return (a, b) => b.lastSignedInAt.localeCompare(a.lastSignedInAt);
  }
  return (a, b) => a.displayName.localeCompare(b.displayName);
}
