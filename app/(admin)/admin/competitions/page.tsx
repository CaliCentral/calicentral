import type { Metadata } from "next";
import Link from "next/link";

import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import { getSanityAdminCompetitions } from "@/lib/content/sanity-source";
import {
  adminDateLabel,
  adminStatusLabel,
} from "@/lib/presentation/admin-rankings";
import { studioUrl } from "@/lib/site/studio";
import type { AdminCompetitionFilters } from "@/types/admin-competition";
import type { CompetitionStatus } from "@/types/competition";
import type { ProvenanceVerificationStatus } from "@/types/provenance";

export const metadata: Metadata = {
  title: "Admin — Competitions",
};

const PAGE_SIZE = 50;

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

const competitionStatuses = [
  "upcoming",
  "completed",
  "postponed",
  "cancelled",
  "preview",
] as const satisfies readonly CompetitionStatus[];
const verificationStatuses = [
  "unverified",
  "submitted",
  "source-confirmed",
  "official",
  "disputed",
  "superseded",
] as const satisfies readonly ProvenanceVerificationStatus[];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
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
  return suffix ? `/admin/competitions?${suffix}` : "/admin/competitions";
}

function exact<T extends string>(value: string, values: readonly T[]): T | undefined {
  return values.includes(value as T) ? (value as T) : undefined;
}

function locationLabel(competition: {
  readonly city?: string;
  readonly administrativeArea?: string;
  readonly country?: string;
}): string {
  return [
    competition.city,
    competition.administrativeArea,
    competition.country,
  ]
    .filter(Boolean)
    .join(", ") || "Not set";
}

export default async function AdminCompetitionsPage({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  await requireEditor("/admin/competitions");
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 120);
  const country = first(params.country).trim().slice(0, 120);
  const status = exact(first(params.status), competitionStatuses);
  const publicStatus = exact(first(params.publicStatus), [
    "draft",
    "published",
    "archived",
    "legacy-public",
  ] as const);
  const verification = exact(
    first(params.verification),
    verificationStatuses,
  );
  const dateScope = exact(first(params.dateScope), ["upcoming", "past"] as const);
  const recordKind = exact(first(params.recordKind), ["sample", "real"] as const);
  const page = pageNumber(first(params.page));
  const filters: AdminCompetitionFilters = {
    query,
    status,
    publicStatus,
    verification,
    country,
    dateScope,
    recordKind,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  };
  const result = await getSanityAdminCompetitions(filters);
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <OperationsPage
      eyebrow="Internal / Canonical competitions"
      title="Competition review"
      description="A bounded, read-only view of canonical competition records, source provenance, provider identity, and publication state. New imports remain internal by default."
      actions={
        <Link
          href={studioUrl}
          className="inline-flex min-h-12 items-center border border-accent/45 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Open Studio ↗
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Canonical records" value={result.counts.total} />
        <MetricCard label="Sample / prototype" value={result.counts.samples} />
        <MetricCard label="Real records" value={result.counts.real} />
        <MetricCard
          label="Source confirmed"
          value={result.counts.sourceConfirmed}
        />
        <MetricCard label="Upcoming" value={result.counts.upcoming} />
        <MetricCard label="Past" value={result.counts.past} />
      </div>

      <OperationsPanel
        className="mt-7"
        title="Review filters"
        description="Search, filters, and pagination run in Sanity. Each page is capped at 50 records and excludes private review notes."
      >
        <form
          action="/admin/competitions"
          method="get"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <label className="grid gap-2 text-sm text-muted">
            Search
            <input
              name="q"
              defaultValue={query}
              placeholder="Name, organizer, location, or ID"
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Event status
            <select
              name="status"
              defaultValue={status ?? ""}
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            >
              <option value="">All event states</option>
              {competitionStatuses.map((value) => (
                <option key={value} value={value}>
                  {adminStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Publication
            <select
              name="publicStatus"
              defaultValue={publicStatus ?? ""}
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            >
              <option value="">All publication states</option>
              <option value="draft">Internal draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="legacy-public">Legacy public</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Source verification
            <select
              name="verification"
              defaultValue={verification ?? ""}
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            >
              <option value="">All verification states</option>
              {verificationStatuses.map((value) => (
                <option key={value} value={value}>
                  {adminStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Record kind
            <select
              name="recordKind"
              defaultValue={recordKind ?? ""}
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            >
              <option value="">Sample and real</option>
              <option value="sample">Sample / prototype</option>
              <option value="real">Real</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Date scope
            <select
              name="dateScope"
              defaultValue={dateScope ?? ""}
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            >
              <option value="">Upcoming and past</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Country
            <input
              name="country"
              defaultValue={country}
              placeholder="Exact country name"
              className="min-h-11 border border-white/20 bg-canvas px-3 text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Apply filters
            </button>
            <Link
              href="/admin/competitions"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Reset
            </Link>
          </div>
        </form>
      </OperationsPanel>

      <OperationsPanel
        className="mt-7"
        title="Canonical competition directory"
        description={`Showing ${result.items.length} of ${result.total} matching records. Results are ordered by newest start date with at most 50 per page.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[86rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                <th className="px-3 py-3">Competition</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Organizer</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Verification</th>
                <th className="px-3 py-3">Publication</th>
                <th className="px-3 py-3">Record kind</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted">
                    No competition records match these filters.
                  </td>
                </tr>
              ) : (
                result.items.map((competition) => (
                  <tr
                    key={competition.canonicalId}
                    className="border-b border-white/10"
                  >
                    <td className="px-3 py-4 align-top">
                      <p className="font-bold text-ink">{competition.name}</p>
                      {competition.eventSeries ? (
                        <p className="mt-1 text-xs text-muted">
                          {competition.eventSeries}
                        </p>
                      ) : null}
                      <p className="mt-1 font-mono text-[0.68rem] text-muted">
                        {competition.canonicalId}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {adminStatusLabel(competition.status)}
                      </p>
                      {competition.editorialPriority ? (
                        <p className="mt-1 text-xs text-accent">
                          {adminStatusLabel(competition.editorialPriority)}
                          {competition.featured ? " · Featured" : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminDateLabel(competition.startDate)}
                      {competition.endDate ? (
                        <span className="block">
                          through {adminDateLabel(competition.endDate)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {locationLabel(competition)}
                      {competition.venueName ? (
                        <span className="mt-1 block text-xs">
                          {competition.venueName}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      <span className="font-bold text-ink">
                        {competition.organization?.name ??
                          competition.organizerName ??
                          "Not set"}
                      </span>
                      {competition.organization && competition.organizerName ? (
                        <span className="mt-1 block text-xs">
                          Source label: {competition.organizerName}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      <p className="font-bold text-ink">
                        {competition.source?.provider?.name ??
                          competition.source?.title ??
                          "No source"}
                      </p>
                      <p className="mt-1 text-xs">
                        {competition.externalProviderId ??
                          competition.source?.externalRecordId ??
                          "No external ID"}
                      </p>
                      {competition.source?.url ??
                      competition.externalProviderUrl ? (
                        <a
                          href={
                            competition.source?.url ??
                            competition.externalProviderUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                        >
                          View source ↗
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminStatusLabel(
                        competition.source?.verificationStatus,
                      )}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {competition.legacyPublic
                        ? "Legacy public sample"
                        : adminStatusLabel(competition.publicStatus)}
                    </td>
                    <td className="px-3 py-4 align-top text-muted">
                      {adminStatusLabel(competition.contentStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-muted">
          <p>
            Page {Math.min(page, pageCount)} of {pageCount} · {result.total}{" "}
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
