import type { Metadata } from "next";
import Link from "next/link";

import { AthleteRankingSnapshots } from "@/components/rankings/athlete-ranking-snapshots";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { getAthleteRankingSnapshots } from "@/lib/content";
import { featureConfig } from "@/lib/features/config";
import {
  athleteRankingFilterOptions,
  filterAthleteRankingSnapshots,
  sanitizeAthleteRankingFilters,
  type AthleteRankingFilterOption,
  type AthleteRankingFilters,
} from "@/lib/rankings/filters";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicMetadata({
  path: "/rankings",
  title: "Athlete ranking systems",
  description:
    "Dated, provider-attributed calisthenics athlete ranking snapshots with public provenance and clear authority labels.",
});

type Props = {
  readonly searchParams: Promise<{
    provider?: string | string[];
    discipline?: string | string[];
    category?: string | string[];
    weightClass?: string | string[];
    scope?: string | string[];
    season?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RankingsPage({ searchParams }: Props) {
  const [snapshots, params] = await Promise.all([
    getAthleteRankingSnapshots(),
    searchParams,
  ]);
  const options = athleteRankingFilterOptions(snapshots);
  const filters = sanitizeAthleteRankingFilters(
    {
      provider: first(params.provider),
      discipline: first(params.discipline),
      category: first(params.category),
      weightClass: first(params.weightClass),
      scope: first(params.scope),
      season: first(params.season),
    },
    options,
  );
  const filtered = filterAthleteRankingSnapshots(snapshots, filters);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            Athlete rankings / Provider-attributed snapshots
          </p>
          <h1 className="mt-5 max-w-5xl text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl lg:text-8xl">
            Whose ranking. Which system. What date.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-muted sm:text-lg">
            Rankings are athlete-oriented source records. They are distinct from
            team and league season{" "}
            <Link
              href="/standings"
              className="font-bold text-ink underline underline-offset-4 hover:text-accent"
            >
              standings
            </Link>
            .
          </p>
        </Container>
      </header>
      <section
        className="bg-canvas py-16 sm:py-20 lg:py-24"
        aria-labelledby="ranking-snapshots-heading"
      >
        <Container>
          <div className="mb-9 border-t border-white/15 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
              Public record / Source checked
            </p>
            <h2
              id="ranking-snapshots-heading"
              className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink sm:text-5xl"
            >
              Published snapshots
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-muted">
              Snapshots are never fetched from third-party sites during page
              render. Only records from active systems and active providers with
              a public HTTP(S) source and source-confirmed or official provenance
              can appear.
            </p>
          </div>

          {snapshots.length ? (
            <>
              <form
                method="get"
                className="grid gap-4 border border-white/15 bg-surface p-5 md:grid-cols-2 xl:grid-cols-4"
              >
                <Filter
                  label="Provider"
                  name="provider"
                  value={filters.provider}
                  options={options.providers}
                />
                <Filter
                  label="Discipline"
                  name="discipline"
                  value={filters.discipline}
                  options={options.disciplines}
                />
                <Filter
                  label="Category"
                  name="category"
                  value={filters.category}
                  options={options.categories}
                />
                <Filter
                  label="Weight class"
                  name="weightClass"
                  value={filters.weightClass}
                  options={options.weightClasses}
                />
                <Filter
                  label="Geographic scope"
                  name="scope"
                  value={filters.scope}
                  options={options.scopes}
                />
                <Filter
                  label="Season"
                  name="season"
                  value={filters.season}
                  options={options.seasons}
                />
                <button
                  type="submit"
                  className="min-h-12 self-end bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Apply filters
                </button>
                <Link
                  href="/rankings"
                  className="inline-flex min-h-12 items-center justify-center self-end border border-white/20 px-5 text-xs font-bold uppercase tracking-[0.12em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Clear
                </Link>
              </form>
              <p
                aria-live="polite"
                className="my-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                {filtered.length} published {filtered.length === 1 ? "snapshot" : "snapshots"}
              </p>
              {filtered.length ? (
                <AthleteRankingSnapshots snapshots={filtered} />
              ) : (
                <>
                  <ContentEmptyState
                    title="No ranking snapshots match these filters"
                    description="Change or clear the provider, discipline, category, weight-class, scope, and season filters."
                    eyebrow="Athlete rankings / No matching records"
                  />
                  {hasFilters ? (
                    <Link
                      href="/rankings"
                      className="mt-5 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink hover:text-accent"
                    >
                      Clear all filters →
                    </Link>
                  ) : null}
                </>
              )}
            </>
          ) : (
            <ContentEmptyState
              title="No external athlete rankings are published"
              description={
                featureConfig.externalRankings
                  ? "No source-confirmed ranking snapshot is ready for publication."
                  : "External ranking publication is currently disabled. Cali Central will not invent positions or display unsourced world-rank claims."
              }
              eyebrow="Athlete rankings / Awaiting source review"
            />
          )}
        </Container>
      </section>
    </>
  );
}

function Filter({
  label,
  name,
  value,
  options,
}: {
  readonly label: string;
  readonly name: keyof AthleteRankingFilters;
  readonly value?: string;
  readonly options: readonly AthleteRankingFilterOption[];
}) {
  return (
    <label className="grid gap-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="min-h-12 border border-white/20 bg-canvas px-3 text-sm normal-case tracking-normal text-ink outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
