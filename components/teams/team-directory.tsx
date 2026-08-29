import Link from "next/link";

import { TeamCard } from "@/components/teams/team-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { featureConfig } from "@/lib/features/config";
import { countryCodeFor, countryNameFor } from "@/lib/geography";
import type { Team } from "@/types/team";

export function TeamDirectory({
  teams,
  country,
  administrativeArea,
  status,
}: {
  readonly teams: readonly Team[];
  readonly country?: string;
  readonly administrativeArea?: string;
  readonly status?: string;
}) {
  const selectedCountry = countryCodeFor(country);
  const selectedArea = administrativeArea?.trim().toLocaleLowerCase();
  const selectedStatus = status === "prospective" ? status : undefined;
  const filtered = teams.filter(
    (team) =>
      (!selectedCountry || countryCodeFor(team.country) === selectedCountry) &&
      (!selectedArea ||
        team.administrativeArea.toLocaleLowerCase() === selectedArea) &&
      (!selectedStatus || team.publicStatus === "approved-prospective"),
  );
  const countries = Array.from(
    new Set(
      teams
        .map((team) => countryCodeFor(team.country))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
  ).sort();
  const areas = Array.from(
    new Set(
      teams
        .filter(
          (team) =>
            !selectedCountry ||
            countryCodeFor(team.country) === selectedCountry,
        )
        .map((team) => team.administrativeArea)
        .filter(Boolean),
    ),
  ).sort();

  return (
    <>
      <form
        method="get"
        className="grid gap-4 border border-white/15 bg-surface p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
      >
        <Filter
          label="Country"
          name="country"
          defaultValue={selectedCountry ?? ""}
        >
          <option value="">All countries</option>
          {countries.map((code) => (
            <option key={code} value={code}>
              {countryNameFor(code)}
            </option>
          ))}
        </Filter>
        <Filter
          label="State, province, or region"
          name="region"
          defaultValue={administrativeArea ?? ""}
        >
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </Filter>
        <Filter
          label="Public status"
          name="status"
          defaultValue={selectedStatus ?? ""}
        >
          <option value="">All public teams</option>
          <option value="prospective">Prospective teams</option>
        </Filter>
        <button
          type="submit"
          className="min-h-12 bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Apply filters
        </button>
      </form>
      <p
        aria-live="polite"
        className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted"
      >
        {filtered.length} public {filtered.length === 1 ? "team" : "teams"}
      </p>
      {filtered.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.canonicalId} team={team} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ContentEmptyState
            title={
              teams.length
                ? "No teams match these filters"
                : "No public teams yet"
            }
            description={
              teams.length
                ? "Change or clear the country, administrative-area, and status filters."
                : "Reviewed public team records will appear here after publication. No teams are invented to fill the directory."
            }
            eyebrow={
              teams.length
                ? "Team directory / No matching records"
                : "Team directory / Awaiting published records"
            }
            action={
              !teams.length && featureConfig.teamApplications ? (
                <Link
                  href="/account/teams"
                  className="clip-corner inline-flex min-h-11 items-center bg-accent px-4 text-xs font-bold uppercase tracking-[0.11em] text-canvas"
                >
                  Apply / create team
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </>
  );
}

function Filter({
  label,
  name,
  defaultValue,
  children,
}: {
  readonly label: string;
  readonly name: string;
  readonly defaultValue: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="min-h-12 border border-white/20 bg-canvas px-3 text-sm normal-case tracking-normal text-ink outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {children}
      </select>
    </label>
  );
}
