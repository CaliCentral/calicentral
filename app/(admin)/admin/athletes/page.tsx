import type { Metadata } from "next";
import Link from "next/link";

import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import { getSanityAdminAthleteDirectory } from "@/lib/content/sanity-source";
import { adminStatusLabel } from "@/lib/presentation/admin-rankings";

export const metadata: Metadata = {
  title: "Admin — Athletes",
};

const PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { readonly searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function oneOf<const Values extends readonly string[]>(
  value: string,
  values: Values,
): Values[number] | undefined {
  return values.includes(value) ? (value as Values[number]) : undefined;
}

function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const value = first(rawValue).trim();
    if (value && key !== "page") {
      query.set(key, value);
    }
  }
  if (page > 1) {
    query.set("page", String(page));
  }
  const suffix = query.toString();
  return suffix ? `/admin/athletes?${suffix}` : "/admin/athletes";
}

export default async function AdminAthletesPage({ searchParams }: Props) {
  await requireEditor("/admin/athletes");
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 120);
  const profileStatus = oneOf(first(params.profile), [
    "not-reviewed",
    "approved",
  ] as const);
  const prototypeStatus = oneOf(first(params.prototype), [
    "real",
    "sample-record",
    "fictional-prototype",
    "not-official",
  ] as const);
  const rankingStatus =
    oneOf(first(params.ranking), ["all", "linked", "unlinked"] as const) ??
    "all";
  const sourceStatus =
    oneOf(first(params.source), ["all", "linked", "unlinked"] as const) ??
    "all";
  const country = first(params.country).trim().slice(0, 120);
  const page = pageNumber(first(params.page));

  const directory = await getSanityAdminAthleteDirectory({
    query,
    profileStatus,
    prototypeStatus,
    rankingStatus,
    sourceStatus,
    country,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(directory.total / PAGE_SIZE));

  return (
    <OperationsPage
      eyebrow="Internal / Canonical athletes"
      title="Athlete review"
      description="All canonical athlete records are available to editors here, including unreviewed profiles that are intentionally excluded from the public site. Search and filters run in Sanity before this bounded page is returned."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Canonical athletes" value={directory.total} />
        <MetricCard
          label="Awaiting profile review"
          value={directory.awaitingProfileReview}
        />
        <MetricCard label="Sample records" value={directory.sampleRecords} />
      </div>

      <OperationsPanel
        className="mt-7"
        title="Canonical athlete directory"
        description="Profile approval, profile control, source matching, and ranking publication remain separate review states. Up to 50 matching records are rendered per page."
      >
        <form
          method="get"
          className="mb-6 grid gap-3 border border-white/12 bg-canvas p-4 md:grid-cols-2 xl:grid-cols-7"
        >
          <label className="xl:col-span-2">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Search
            </span>
            <input
              name="q"
              defaultValue={query}
              maxLength={120}
              placeholder="Name, ID, or country"
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Profile
            </span>
            <select
              name="profile"
              defaultValue={profileStatus ?? ""}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              <option value="not-reviewed">Not reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Record type
            </span>
            <select
              name="prototype"
              defaultValue={prototypeStatus ?? ""}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              <option value="real">Real / imported</option>
              <option value="sample-record">Sample</option>
              <option value="fictional-prototype">Prototype</option>
              <option value="not-official">Not official</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Source identity
            </span>
            <select
              name="source"
              defaultValue={sourceStatus}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="all">All</option>
              <option value="linked">Linked</option>
              <option value="unlinked">Unlinked</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Ranking link
            </span>
            <select
              name="ranking"
              defaultValue={rankingStatus}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="all">All</option>
              <option value="linked">Linked</option>
              <option value="unlinked">Unlinked</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Country
            </span>
            <select
              name="country"
              defaultValue={country}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              {directory.countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 xl:col-span-6">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas"
            >
              Apply filters
            </button>
            <Link
              href="/admin/athletes"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
            >
              Clear
            </Link>
          </div>
        </form>

        {directory.items.length === 0 ? (
          <p className="border border-dashed border-white/20 p-5 text-sm text-muted">
            No canonical athletes match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                  <th className="px-3 py-3">Athlete</th>
                  <th className="px-3 py-3">Country</th>
                  <th className="px-3 py-3">Profile review</th>
                  <th className="px-3 py-3">Identity</th>
                  <th className="px-3 py-3">Source / rankings</th>
                  <th className="px-3 py-3">Prototype marker</th>
                  <th className="px-3 py-3">Ranking eligible</th>
                </tr>
              </thead>
              <tbody>
                {directory.items.map((athlete) => (
                  <tr
                    key={athlete.canonicalId}
                    className="border-b border-white/10"
                  >
                    <td className="px-3 py-4 align-top">
                      <Link
                        href={`/admin/athletes/${encodeURIComponent(athlete.canonicalId)}`}
                        className="font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                      >
                        {athlete.name}
                      </Link>
                      <p className="mt-1 font-mono text-[0.68rem] text-muted">
                        {athlete.canonicalId}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {athlete.country ?? "Not set"}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminStatusLabel(athlete.verification.profileStatus)}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminStatusLabel(athlete.verification.identityStatus)}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {athlete.externalIdentityCount ?? 0} source ·{" "}
                      {athlete.rankingSnapshotCount ?? 0} snapshots
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminStatusLabel(athlete.prototypeStatus)}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {athlete.rankingEligible === undefined
                        ? "Not set"
                        : athlete.rankingEligible
                          ? "Yes"
                          : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-muted">
          <p>
            Page {Math.min(page, pageCount)} of {pageCount} · {directory.total}{" "}
            matching records
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(params, page - 1)}
                className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={pageHref(params, page + 1)}
                className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </OperationsPanel>
    </OperationsPage>
  );
}
