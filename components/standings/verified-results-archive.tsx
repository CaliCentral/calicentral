"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ContentEmptyState } from "@/components/ui/content-empty-state";
import type { VerifiedCompetitionResult } from "@/types/competition";

type VerifiedResultsArchiveProps = {
  readonly results: readonly VerifiedCompetitionResult[];
};

const fieldClassName =
  "min-h-12 w-full border border-white/18 bg-canvas px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function VerifiedResultsArchive({ results }: VerifiedResultsArchiveProps) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState("all");

  const years = useMemo(
    () => [...new Set(results.map((result) => result.competitionDate.slice(0, 4)))].sort().reverse(),
    [results],
  );
  const countries = useMemo(
    () => [...new Set(results.map((result) => result.competitionCountry))].sort(),
    [results],
  );
  const categories = useMemo(
    () => [...new Set(results.map((result) => result.category).filter(Boolean))].sort(),
    [results],
  );

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return results.filter((result) => {
      const searchField = [
        result.athleteName,
        result.competitionName,
        result.competitionCountry,
        result.category,
        result.division,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!normalizedQuery || searchField.includes(normalizedQuery)) &&
        (year === "all" || result.competitionDate.startsWith(year)) &&
        (country === "all" || result.competitionCountry === country) &&
        (category === "all" || result.category === category)
      );
    });
  }, [category, country, query, results, year]);

  if (results.length === 0) {
    return (
      <ContentEmptyState
        eyebrow="Verified results archive / Awaiting sources"
        title="No verified results have been published"
        description="Sample and unverified competition outcomes are excluded. Results will appear after public source review."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 border border-white/15 bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <label>
          <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Athlete or competition…"
            className={fieldClassName}
          />
        </label>
        <FilterSelect label="Year" value={year} onChange={setYear} options={years} allLabel="All years" />
        <FilterSelect label="Country" value={country} onChange={setCountry} options={countries} allLabel="All countries" />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={categories as string[]} allLabel="All categories" />
      </div>

      <p aria-live="polite" className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted">
        {filteredResults.length} verified {filteredResults.length === 1 ? "result" : "results"}
      </p>

      {filteredResults.length > 0 ? (
        <ol className="mt-5 grid gap-px border border-white/15 bg-white/15">
          {filteredResults.map((result) => (
            <li key={`${result.competitionSlug}-${result.key}`} className="grid gap-4 bg-surface p-5 md:grid-cols-[4rem_minmax(0,1fr)_minmax(10rem,0.55fr)_minmax(12rem,0.75fr)] md:items-center sm:p-6">
              <span className="font-mono text-3xl font-black tabular-nums text-accent">
                {String(result.placement).padStart(2, "0")}
              </span>
              <div>
                <p className="font-black uppercase text-ink">{result.athleteName}</p>
                <p className="mt-1 text-sm text-muted">
                  {[result.category, result.division].filter(Boolean).join(" / ") || "Division not published"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">Result</p>
                <p className="mt-1 font-bold text-ink">{result.scoreDisplay || result.resultLabel}</p>
              </div>
              <div>
                <Link href={`/competitions/${result.competitionSlug}`} className="font-bold text-ink underline decoration-white/25 underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  {result.competitionName}
                </Link>
                <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  Source: {result.sourceName}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5">
          <ContentEmptyState
            title="No verified results match these filters"
            description="Change or clear the archive filters to inspect another set of published results."
          />
        </div>
      )}
    </div>
  );
}

function FilterSelect({
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
      <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
        <option value="all">{allLabel}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
