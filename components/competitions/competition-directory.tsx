"use client";

import { useMemo, useState } from "react";

import { CompetitionCard } from "@/components/competitions/competition-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import {
  competitionDisciplineLabels,
  competitionStatusLabels,
} from "@/lib/presentation/competition-labels";
import type {
  Competition,
  CompetitionDiscipline,
  CompetitionStatus,
} from "@/types/competition";

type SortOption = "date-asc" | "date-desc" | "name";

type CompetitionDirectoryProps = {
  readonly competitions: readonly Competition[];
};

const selectClassName =
  "min-h-12 w-full border border-white/18 bg-canvas px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CompetitionDirectory({
  competitions,
}: CompetitionDirectoryProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompetitionStatus | "all">("all");
  const [discipline, setDiscipline] = useState<
    CompetitionDiscipline | "all"
  >("all");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState<SortOption>("date-asc");

  const statuses = useMemo(
    () => [...new Set(competitions.map((item) => item.status))].sort(),
    [competitions],
  );
  const disciplines = useMemo(
    () => [...new Set(competitions.flatMap((item) => item.disciplines))].sort(),
    [competitions],
  );
  const cities = useMemo(
    () => [...new Set(competitions.map((item) => item.city))].sort(),
    [competitions],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return competitions
      .filter((competition) => {
        const searchField = [
          competition.name,
          competition.city,
          competition.state,
          competition.competitionFormat,
          competition.venueName,
          ...competition.disciplines.map(
            (item) => competitionDisciplineLabels[item],
          ),
        ]
          .join(" ")
          .toLocaleLowerCase();

        return (
          (!normalizedQuery || searchField.includes(normalizedQuery)) &&
          (status === "all" || competition.status === status) &&
          (discipline === "all" ||
            competition.disciplines.includes(discipline)) &&
          (city === "all" || competition.city === city)
        );
      })
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        const dateDifference =
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        return sort === "date-asc" ? dateDifference : -dateDifference;
      });
  }, [city, competitions, discipline, query, sort, status]);

  const hasActiveFilters =
    query !== "" ||
    status !== "all" ||
    discipline !== "all" ||
    city !== "all" ||
    sort !== "date-asc";

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setDiscipline("all");
    setCity("all");
    setSort("date-asc");
  }

  if (competitions.length === 0) {
    return (
      <ContentEmptyState
        eyebrow="Competition directory / Awaiting publication"
        title="No competition records are published"
        description="The public competition field is being prepared. Published event records will appear here."
      />
    );
  }

  return (
    <div>
      <div className="border border-white/15 bg-surface p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(15rem,1.45fr)_repeat(4,minmax(8.5rem,0.7fr))]">
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Search the field
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Event, city, format…"
              className={selectClassName}
            />
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Status
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CompetitionStatus | "all")
              }
              className={selectClassName}
            >
              <option value="all">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {competitionStatusLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Discipline
            </span>
            <select
              value={discipline}
              onChange={(event) =>
                setDiscipline(
                  event.target.value as CompetitionDiscipline | "all",
                )
              }
              className={selectClassName}
            >
              <option value="all">All disciplines</option>
              {disciplines.map((item) => (
                <option key={item} value={item}>
                  {competitionDisciplineLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              City
            </span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={selectClassName}
            >
              <option value="all">All cities</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={selectClassName}
            >
              <option value="date-asc">Date / Earliest</option>
              <option value="date-desc">Date / Latest</option>
              <option value="name">Name / A–Z</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-4">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink"
          >
            {String(results.length).padStart(2, "0")}{" "}
            {results.length === 1 ? "event record" : "event records"}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          ) : (
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
              Complete prototype field
            </p>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((competition) => (
            <CompetitionCard
              key={competition.slug}
              competition={competition}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 border border-dashed border-white/25 bg-surface px-5 py-14 text-center sm:px-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            No matching field records
          </p>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink">
            Reset the lens and try again.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
            No fictional competition currently matches this combination of
            search and filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 min-h-12 border border-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
