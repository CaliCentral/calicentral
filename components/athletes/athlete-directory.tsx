"use client";

import { useMemo, useState } from "react";

import { AthleteCard } from "@/components/athletes/athlete-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import type { Athlete } from "@/types/athlete";

type AthleteDirectoryProps = {
  readonly athletes: readonly Athlete[];
};

type SortOption = "featured" | "name" | "ranking" | "region";
type DisciplineFilter = Athlete["disciplines"][number] | "all";

const controlClassName =
  "min-h-12 w-full border border-white/20 bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/80 hover:border-white/40 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function AthleteDirectory({ athletes }: AthleteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineFilter>("all");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");

  const disciplines = useMemo(
    () =>
      Array.from(
        new Set(athletes.flatMap((athlete) => athlete.disciplines)),
      ).sort((first, second) => first.localeCompare(second)),
    [athletes],
  );

  const regions = useMemo(
    () =>
      Array.from(new Set(athletes.map((athlete) => athlete.region))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [athletes],
  );

  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return athletes
      .filter((athlete) => {
        const searchableRecord = [
          athlete.name,
          athlete.city,
          athlete.region,
          ...athlete.disciplines,
        ]
          .join(" ")
          .toLocaleLowerCase();

        const matchesSearch =
          normalizedQuery.length === 0 ||
          searchableRecord.includes(normalizedQuery);
        const matchesDiscipline =
          discipline === "all" || athlete.disciplines.includes(discipline);
        const matchesRegion = region === "all" || athlete.region === region;

        return matchesSearch && matchesDiscipline && matchesRegion;
      })
      .sort((first, second) => {
        if (sort === "name") {
          return first.name.localeCompare(second.name);
        }

        if (sort === "ranking") {
          const categoryComparison = (
            first.ranking?.categoryTitle ?? "\uffff"
          ).localeCompare(second.ranking?.categoryTitle ?? "\uffff");
          const firstRank = first.ranking?.rank ?? Number.POSITIVE_INFINITY;
          const secondRank = second.ranking?.rank ?? Number.POSITIVE_INFINITY;

          return (
            categoryComparison ||
            firstRank - secondRank ||
            first.name.localeCompare(second.name)
          );
        }

        if (sort === "region") {
          return (
            first.region.localeCompare(second.region) ||
            first.name.localeCompare(second.name)
          );
        }

        return (
          Number(second.featured) - Number(first.featured) ||
          first.name.localeCompare(second.name)
        );
      });
  }, [athletes, discipline, query, region, sort]);

  const hasActiveFilters =
    query.length > 0 ||
    discipline !== "all" ||
    region !== "all" ||
    sort !== "featured";

  function clearFilters() {
    setQuery("");
    setDiscipline("all");
    setRegion("all");
    setSort("featured");
  }

  if (athletes.length === 0) {
    return (
      <ContentEmptyState
        eyebrow="Athlete directory / Awaiting publication"
        title="No athlete profiles are published"
        description="The public athlete directory is being prepared. Published profiles will appear here."
      />
    );
  }

  const resultLabel = `${filteredAthletes.length} ${
    filteredAthletes.length === 1 ? "athlete profile" : "athlete profiles"
  } shown out of ${athletes.length}`;

  return (
    <div>
      <div className="border border-white/15 bg-surface p-5 sm:p-6 lg:p-7">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.4fr)_repeat(3,minmax(10rem,0.7fr))]">
          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Search name, city, region, or discipline
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search athlete files"
              className={controlClassName}
            />
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Discipline
            </span>
            <select
              value={discipline}
              onChange={(event) =>
                setDiscipline(event.target.value as DisciplineFilter)
              }
              className={controlClassName}
            >
              <option value="all">All disciplines</option>
              {disciplines.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Region
            </span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={controlClassName}
            >
              <option value="all">All regions</option>
              {regions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={controlClassName}
            >
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="ranking">Ranking category / rank</option>
              <option value="region">Region</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted"
          >
            {resultLabel}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="min-h-11 self-start border border-white/25 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
          >
            Clear filters
          </button>
        </div>
      </div>

      {filteredAthletes.length > 0 ? (
        <ul className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAthletes.map((athlete) => (
            <li key={athlete.slug}>
              <AthleteCard athlete={athlete} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-7 border border-white/15 bg-surface px-5 py-12 text-center sm:px-8 sm:py-16">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
            Directory signal / No match
          </p>
          <h3 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink sm:text-4xl">
            No athlete files found
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base">
            Try a broader search or reset the discipline and region filters to
            see the complete fictional directory.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-7 min-h-12 border border-accent bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Reset directory
          </button>
        </div>
      )}
    </div>
  );
}
