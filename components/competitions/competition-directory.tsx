"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CompetitionCard } from "@/components/competitions/competition-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { formatGlobalLocation } from "@/lib/geography";
import {
  competitionDisciplineLabels,
  competitionStatusLabels,
  registrationStatusLabels,
} from "@/lib/presentation/competition-labels";
import type {
  Competition,
  CompetitionDiscipline,
  CompetitionStatus,
  RegistrationStatus,
} from "@/types/competition";

type SortOption = "relevance" | "date-asc" | "date-desc" | "name";

// Upcoming/postponed/preview events are still ahead of us, so the default
// view surfaces the nearest one first; everything else (completed,
// cancelled, unknown) is settled history, so the most recent comes first.
// This keeps 2021-era archive events from leading the default "every event
// record" view ahead of what is actually next or just happened.
const FORWARD_LOOKING_STATUSES: readonly CompetitionStatus[] = ["upcoming", "postponed", "delayed", "preview"];

function relevanceCompare(a: Competition, b: Competition): number {
  const aForward = FORWARD_LOOKING_STATUSES.includes(a.status);
  const bForward = FORWARD_LOOKING_STATUSES.includes(b.status);
  if (aForward !== bForward) return aForward ? -1 : 1;
  const dateDifference = a.startDate.localeCompare(b.startDate);
  return aForward ? dateDifference : -dateDifference;
}

type CompetitionDirectoryProps = {
  readonly competitions: readonly Competition[];
  readonly view?: "cards" | "timeline";
};

const fieldClassName =
  "min-h-12 w-full border border-white/18 bg-canvas px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CompetitionDirectory({
  competitions,
  view = "cards",
}: CompetitionDirectoryProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompetitionStatus | "all">("all");
  const [registration, setRegistration] = useState<
    RegistrationStatus | "all"
  >("all");
  const [discipline, setDiscipline] = useState<
    CompetitionDiscipline | "all"
  >("all");
  const [country, setCountry] = useState("all");
  const [administrativeArea, setAdministrativeArea] = useState("all");
  const [year, setYear] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");

  const statuses = useMemo(
    () => [...new Set(competitions.map((item) => item.status))].sort(),
    [competitions],
  );
  const registrationStatuses = useMemo(
    () =>
      [...new Set(competitions.map((item) => item.registrationStatus))].sort(),
    [competitions],
  );
  const disciplines = useMemo(
    () => [...new Set(competitions.flatMap((item) => item.disciplines))].sort(),
    [competitions],
  );
  const countries = useMemo(
    () =>
      [...new Set(competitions.map((item) => item.country).filter(Boolean))].sort(),
    [competitions],
  );
  const years = useMemo(
    () => [...new Set(competitions.map((item) => item.year).filter(Boolean))].sort().reverse(),
    [competitions],
  );
  const administrativeAreas = useMemo(
    () =>
      [
        ...new Set(
          competitions
            .filter((item) => country === "all" || item.country === country)
            .map((item) => item.administrativeArea ?? item.state)
            .filter(Boolean),
        ),
      ].sort(),
    [competitions, country],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return competitions
      .filter((competition) => {
        const area = competition.administrativeArea ?? competition.state;
        const searchField = [
          competition.name,
          competition.city,
          area,
          competition.country,
          competition.region,
          competition.competitionFormat,
          competition.venueName,
          competition.organizerName,
          ...competition.disciplines.map(
            (item) => competitionDisciplineLabels[item],
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        return (
          (!normalizedQuery || searchField.includes(normalizedQuery)) &&
          (status === "all" || competition.status === status) &&
          (registration === "all" ||
            competition.registrationStatus === registration) &&
          (discipline === "all" ||
            competition.disciplines.includes(discipline)) &&
          (country === "all" || competition.country === country) &&
          (administrativeArea === "all" || area === administrativeArea) &&
          (year === "all" || competition.year === year) &&
          (!dateFrom || competition.startDate >= dateFrom) &&
          (!dateTo || competition.startDate <= dateTo)
        );
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "relevance") return relevanceCompare(a, b);
        const dateDifference = a.startDate.localeCompare(b.startDate);
        return sort === "date-asc" ? dateDifference : -dateDifference;
      });
  }, [
    administrativeArea,
    competitions,
    country,
    dateFrom,
    dateTo,
    discipline,
    query,
    registration,
    sort,
    status,
    year,
  ]);

  const hasActiveFilters =
    query !== "" ||
    status !== "all" ||
    registration !== "all" ||
    discipline !== "all" ||
    country !== "all" ||
    administrativeArea !== "all" ||
    year !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sort !== "relevance";

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setRegistration("all");
    setDiscipline("all");
    setCountry("all");
    setAdministrativeArea("all");
    setYear("all");
    setDateFrom("");
    setDateTo("");
    setSort("relevance");
  }

  if (competitions.length === 0) {
    return (
      <ContentEmptyState
        eyebrow="Competition directory / Awaiting publication"
        title="No competition records are published"
        description="Published event records will appear here after editorial review."
      />
    );
  }

  return (
    <div>
      <div className="border border-white/15 bg-surface p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2">
            <FilterLabel>Search the field</FilterLabel>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Event, country, city, organizer…"
              className={fieldClassName}
            />
          </label>
          <SelectField
            label="Country"
            value={country}
            onChange={(value) => {
              setCountry(value);
              setAdministrativeArea("all");
            }}
            options={countries}
            allLabel="All countries"
          />
          <SelectField
            label="State, province, or region"
            value={administrativeArea}
            onChange={setAdministrativeArea}
            options={administrativeAreas}
            allLabel="All areas"
          />
          <SelectField
            label="Year"
            value={year}
            onChange={setYear}
            options={years}
            allLabel="All years"
          />
          <label>
            <FilterLabel>Event status</FilterLabel>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CompetitionStatus | "all")
              }
              className={fieldClassName}
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
            <FilterLabel>Registration</FilterLabel>
            <select
              value={registration}
              onChange={(event) =>
                setRegistration(
                  event.target.value as RegistrationStatus | "all",
                )
              }
              className={fieldClassName}
            >
              <option value="all">All registration states</option>
              {registrationStatuses.map((item) => (
                <option key={item} value={item}>
                  {registrationStatusLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FilterLabel>Category</FilterLabel>
            <select
              value={discipline}
              onChange={(event) =>
                setDiscipline(
                  event.target.value as CompetitionDiscipline | "all",
                )
              }
              className={fieldClassName}
            >
              <option value="all">All categories</option>
              {disciplines.map((item) => (
                <option key={item} value={item}>
                  {competitionDisciplineLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FilterLabel>Sort</FilterLabel>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={fieldClassName}
            >
              <option value="relevance">Upcoming first (recommended)</option>
              <option value="date-asc">Date / Earliest</option>
              <option value="date-desc">Date / Latest</option>
              <option value="name">Name / A–Z</option>
            </select>
          </label>
          <label>
            <FilterLabel>Date from</FilterLabel>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label>
            <FilterLabel>Date to</FilterLabel>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-4">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink"
          >
            {String(results.length).padStart(2, "0")} {results.length === 1 ? "event record" : "event records"}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {results.length > 0 ? (
        view === "timeline" ? (
          <CompetitionTimeline competitions={results} />
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((competition) => (
              <CompetitionCard key={competition.slug} competition={competition} />
            ))}
          </div>
        )
      ) : (
        <div className="mt-7">
          <ContentEmptyState
            eyebrow="Competition directory / No matches"
            title="No event records match these filters"
            description="Clear or change the filters to inspect another part of the published directory."
          />
          <button
            type="button"
            onClick={resetFilters}
            className="mx-auto mt-5 flex min-h-11 items-center border border-accent px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function CompetitionTimeline({
  competitions,
}: {
  readonly competitions: readonly Competition[];
}) {
  return (
    <ol className="mt-7 border-y border-white/15">
      {competitions.map((competition) => (
        <li
          key={competition.slug}
          className="grid gap-4 border-t border-white/12 py-6 first:border-t-0 md:grid-cols-[8rem_minmax(0,1fr)_minmax(12rem,0.55fr)_auto] md:items-center md:gap-7"
        >
          <time
            dateTime={competition.startDate}
            className="font-mono text-sm font-black uppercase tracking-[0.08em] text-accent"
          >
            {competition.monthCode} {competition.day} / {competition.year}
          </time>
          <div>
            <Link
              href={`/competitions/${competition.slug}`}
              className="text-xl font-black uppercase text-ink underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {competition.name}
            </Link>
            <p className="mt-2 text-sm text-muted">
              {formatGlobalLocation({
                city: competition.city,
                administrativeArea:
                  competition.administrativeArea ?? competition.state,
                country: competition.country,
              }) || "Location not published"}
            </p>
          </div>
          <p className="font-mono text-xs font-bold uppercase leading-5 tracking-[0.11em] text-muted">
            {competitionStatusLabels[competition.status]}
            <br />
            {registrationStatusLabels[competition.registrationStatus]}
            {competition.contentStatus !== "published-record" ? (
              <>
                <br />
                <span className="text-accent">Sample / Not official</span>
              </>
            ) : null}
          </p>
          <Link
            href={`/competitions/${competition.slug}`}
            className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink underline decoration-white/25 underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Event record →
          </Link>
        </li>
      ))}
    </ol>
  );
}

function FilterLabel({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly string[];
  readonly allLabel: string;
}) {
  return (
    <label>
      <FilterLabel>{label}</FilterLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
