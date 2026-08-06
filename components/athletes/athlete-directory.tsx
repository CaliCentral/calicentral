"use client";

import { useMemo, useState } from "react";

import { AthleteCard } from "@/components/athletes/athlete-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import {
  athleteCategoryLabel,
  athleteCompetitionCategories,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import {
  administrativeAreaLabel,
  countryNameFor,
} from "@/lib/geography";
import type {
  Athlete,
  AthleteCompetitionCategory,
} from "@/types/athlete";

type AthleteDirectoryProps = {
  readonly athletes: readonly Athlete[];
};

type SortOption = "featured" | "name" | "updated";
type CategoryFilter = AthleteCompetitionCategory | "all";
type VerificationFilter = "all" | "identity" | "profile" | "unverified";

const controlClassName =
  "min-h-12 w-full border border-white/20 bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/80 hover:border-white/40 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function AthleteDirectory({ athletes }: AthleteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [administrativeArea, setAdministrativeArea] = useState("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [verification, setVerification] =
    useState<VerificationFilter>("all");
  const [sort, setSort] = useState<SortOption>("featured");

  const availableCountries = useMemo(
    () =>
      Array.from(new Set(athletes.map((athlete) => countryNameFor(athlete.country))))
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [athletes],
  );

  const administrativeAreas = useMemo(
    () => {
      const records = country === "all"
        ? athletes
        : athletes.filter(
            (athlete) => countryNameFor(athlete.country) === country,
          );

      return Array.from(
        new Set(records.map((athlete) => athlete.administrativeArea)),
      )
        .filter(Boolean)
        .sort(
        (first, second) => first.localeCompare(second),
        );
    },
    [athletes, country],
  );

  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return athletes
      .filter((athlete) => {
        const searchableRecord = [
          athlete.name,
          athlete.city,
          athlete.country,
          athlete.administrativeArea,
          athlete.region,
          athleteCategoryLabel(athlete.primaryCategory),
          ...athlete.specialties.map(athleteSpecialtyLabel),
        ]
          .join(" ")
          .toLocaleLowerCase();

        const matchesSearch =
          normalizedQuery.length === 0 ||
          searchableRecord.includes(normalizedQuery);
        const matchesCountry =
          country === "all" || countryNameFor(athlete.country) === country;
        const matchesAdministrativeArea =
          administrativeArea === "all" ||
          athlete.administrativeArea === administrativeArea;
        const matchesCategory =
          category === "all" || athlete.primaryCategory === category;
        const matchesVerification =
          verification === "all" ||
          (verification === "identity" &&
            athlete.verification.identityStatus ===
              "profile-control-confirmed") ||
          (verification === "profile" &&
            athlete.verification.profileStatus === "approved") ||
          (verification === "unverified" &&
            athlete.verification.identityStatus === "unverified" &&
            athlete.verification.profileStatus === "not-reviewed");

        return (
          matchesSearch &&
          matchesCountry &&
          matchesAdministrativeArea &&
          matchesCategory &&
          matchesVerification
        );
      })
      .sort((first, second) => {
        if (sort === "name") {
          return first.name.localeCompare(second.name);
        }

        if (sort === "updated") {
          return (
            (second.updatedAt ?? "").localeCompare(first.updatedAt ?? "") ||
            first.name.localeCompare(second.name)
          );
        }

        return (
          Number(second.featured) - Number(first.featured) ||
          first.name.localeCompare(second.name)
        );
      });
  }, [
    administrativeArea,
    athletes,
    category,
    country,
    query,
    sort,
    verification,
  ]);

  const hasActiveFilters =
    query.length > 0 ||
    country !== "all" ||
    administrativeArea !== "all" ||
    category !== "all" ||
    verification !== "all" ||
    sort !== "featured";

  function clearFilters() {
    setQuery("");
    setCountry("all");
    setAdministrativeArea("all");
    setCategory("all");
    setVerification("all");
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
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Search name, city, country, or specialty
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
              Country
            </span>
            <select
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setAdministrativeArea("all");
              }}
              className={controlClassName}
            >
              <option value="all">Worldwide</option>
              {availableCountries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              {administrativeAreaLabel(
                country === "all" ? undefined : country,
              )}
            </span>
            <select
              value={administrativeArea}
              onChange={(event) => setAdministrativeArea(event.target.value)}
              className={controlClassName}
            >
              <option value="all">All administrative areas</option>
              {administrativeAreas.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Competition category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as CategoryFilter)
              }
              className={controlClassName}
            >
              <option value="all">All categories</option>
              {athleteCompetitionCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Verification
            </span>
            <select
              value={verification}
              onChange={(event) =>
                setVerification(event.target.value as VerificationFilter)
              }
              className={controlClassName}
            >
              <option value="all">All verification states</option>
              <option value="identity">Profile control confirmed</option>
              <option value="profile">Editorial profile approved</option>
              <option value="unverified">Not verified or reviewed</option>
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
              <option value="updated">Recently updated</option>
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
            Try a broader search or reset the location, category, and
            verification filters to see the complete directory.
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
