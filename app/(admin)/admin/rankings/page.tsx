import type { Metadata } from "next";
import Link from "next/link";

import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import {
  getSanityAdminRankingOverview,
  getSanityAdminRankingProviders,
  getSanityAdminRankingSnapshotDirectory,
} from "@/lib/content/sanity-source";
import {
  adminDateLabel,
  adminStatusLabel,
  rankingDimensionsLabel,
  rankingValueLabel,
} from "@/lib/presentation/admin-rankings";

export const metadata: Metadata = {
  title: "Admin — Rankings",
};

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { readonly searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positivePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function snapshotStatus(value: string) {
  return ["draft", "published", "superseded", "archived"].includes(value)
    ? (value as "draft" | "published" | "superseded" | "archived")
    : undefined;
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
  return suffix ? `/admin/rankings?${suffix}` : "/admin/rankings";
}

export default async function AdminRankingsPage({ searchParams }: Props) {
  await requireEditor("/admin/rankings");
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 120);
  const status = snapshotStatus(first(params.status));
  const providerId = first(params.provider).trim().slice(0, 180);
  const page = positivePage(first(params.page));

  const [overview, directory, providers] = await Promise.all([
    getSanityAdminRankingOverview(),
    getSanityAdminRankingSnapshotDirectory({
      query,
      status,
      providerId,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    getSanityAdminRankingProviders(),
  ]);
  const pageCount = Math.max(1, Math.ceil(directory.total / PAGE_SIZE));

  return (
    <OperationsPage
      eyebrow="Internal / Athlete ranking review"
      title="Ranking review center"
      description="A bounded read-only view of provider identities, ranking systems, snapshots, and source provenance. Nothing shown here is made public by review access."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Canonical athletes"
          value={overview.canonicalAthletes}
        />
        <MetricCard
          label="Ranking-linked athletes"
          value={overview.rankingLinkedAthletes}
        />
        <MetricCard label="Stored snapshots" value={overview.snapshots} />
        <MetricCard label="Draft snapshots" value={overview.draftSnapshots} />
        <MetricCard label="Draft systems" value={overview.draftSystems} />
        <MetricCard
          label="Providers under review"
          value={overview.providersUnderReview}
        />
        <MetricCard
          label="Candidate identities"
          value={overview.candidateIdentities}
        />
      </div>

      <OperationsPanel
        className="mt-7"
        eyebrow="Provider-attributed / Read only"
        title="Ranking snapshots"
        description="Filters and pagination execute in Sanity. Cards show at most 12 preview entries; the snapshot detail route reads the bounded full entry list directly by ID."
      >
        <form
          method="get"
          className="mb-6 grid gap-3 border border-white/12 bg-canvas p-4 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]"
        >
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Search
            </span>
            <input
              name="q"
              defaultValue={query}
              maxLength={120}
              placeholder="Snapshot, system, or provider"
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Snapshot status
            </span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="superseded">Superseded</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Provider
            </span>
            <select
              name="provider"
              defaultValue={providerId}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              {providers.map((provider) => (
                <option key={provider.canonicalId} value={provider.canonicalId}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas"
            >
              Apply
            </button>
            <Link
              href="/admin/rankings"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
            >
              Clear
            </Link>
          </div>
        </form>

        {directory.items.length === 0 ? (
          <p className="border border-dashed border-white/20 p-5 text-sm text-muted">
            No ranking snapshots match these filters.
          </p>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {directory.items.map((snapshot) => {
              const provider = snapshot.system?.provider;
              const entryCount = snapshot.entryCount ?? snapshot.entries.length;

              return (
                <article
                  key={snapshot.canonicalId}
                  className="border border-white/15 bg-canvas p-5"
                >
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
                    {provider?.name ?? "Provider not linked"}
                  </p>
                  <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.025em] text-ink">
                    <Link
                      href={`/admin/rankings/${encodeURIComponent(snapshot.canonicalId)}`}
                      className="hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                    >
                      {snapshot.system?.name ?? snapshot.canonicalId}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {rankingDimensionsLabel(snapshot.system)}
                  </p>

                  <dl className="mt-5 grid gap-3 border-y border-white/10 py-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Snapshot</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(snapshot.publicationStatus)} /{" "}
                        {snapshot.publicationStatus === "published"
                          ? "Publication candidate"
                          : "Not public"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">System / provider</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(snapshot.system?.status)} /{" "}
                        {adminStatusLabel(provider?.status)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Source</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(
                          snapshot.provenance.verificationStatus,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Entries</dt>
                      <dd className="mt-1 text-ink">{entryCount}</dd>
                    </div>
                  </dl>

                  {snapshot.entries.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {snapshot.entries.map((entry) => (
                        <li
                          key={entry.canonicalId}
                          className="flex flex-col justify-between gap-2 border-l-2 border-accent/45 pl-3 sm:flex-row sm:items-center"
                        >
                          <div>
                            {entry.athleteId ? (
                              <Link
                                href={`/admin/athletes/${encodeURIComponent(entry.athleteId)}`}
                                className="font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                              >
                                {entry.athleteName ??
                                  entry.sourceDisplayName ??
                                  entry.athleteId}
                              </Link>
                            ) : (
                              <p className="font-bold text-ink">
                                {entry.sourceDisplayName ?? "Unmatched entry"}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted">
                              {adminStatusLabel(entry.status)}
                            </p>
                          </div>
                          <p className="font-display text-2xl font-black text-accent">
                            {rankingValueLabel(entry, snapshot.system)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {entryCount > snapshot.entries.length ? (
                    <p className="mt-4 text-xs text-muted">
                      Showing {snapshot.entries.length} of {entryCount} entries.
                      Open the snapshot for the complete stored list.
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-muted">
                    <span>Ranking date {adminDateLabel(snapshot.rankingDate)}</span>
                    {snapshot.provenance.url ? (
                      <a
                        href={snapshot.provenance.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                      >
                        View source ↗
                      </a>
                    ) : (
                      <span>Source URL not set</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-muted">
          <p>
            Page {Math.min(page, pageCount)} of {pageCount} · {directory.total}{" "}
            matching snapshots
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

      <OperationsPanel
        className="mt-7"
        title="Athlete ranking readiness"
        description="The canonical athlete directory supplies server-side ranking-linked and unlinked filters without loading every athlete or snapshot here."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/athletes?ranking=linked"
            className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
          >
            Ranking-linked athletes
          </Link>
          <Link
            href="/admin/athletes?ranking=unlinked"
            className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
          >
            Athletes awaiting source
          </Link>
        </div>
      </OperationsPanel>
    </OperationsPage>
  );
}
