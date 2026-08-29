import type { AthleteRankingSnapshot } from "@/types/ranking-source";

export type AthleteRankingFilters = {
  readonly provider?: string;
  readonly discipline?: string;
  readonly category?: string;
  readonly weightClass?: string;
  readonly scope?: string;
  readonly season?: string;
};

export type AthleteRankingFilterOption = {
  readonly value: string;
  readonly label: string;
};

export type AthleteRankingFilterOptions = {
  readonly providers: readonly AthleteRankingFilterOption[];
  readonly disciplines: readonly AthleteRankingFilterOption[];
  readonly categories: readonly AthleteRankingFilterOption[];
  readonly weightClasses: readonly AthleteRankingFilterOption[];
  readonly scopes: readonly AthleteRankingFilterOption[];
  readonly seasons: readonly AthleteRankingFilterOption[];
};

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim().toLocaleLowerCase();
  return result || undefined;
}

function textOptions(values: readonly (string | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((first, second) => first.localeCompare(second))
    .map((value) => ({ value, label: value }));
}

export function athleteRankingFilterOptions(
  snapshots: readonly AthleteRankingSnapshot[],
): AthleteRankingFilterOptions {
  const providerMap = new Map<string, string>();
  for (const snapshot of snapshots) {
    providerMap.set(snapshot.provider.slug, snapshot.provider.name);
  }

  return {
    providers: [...providerMap]
      .sort(([, first], [, second]) => first.localeCompare(second))
      .map(([value, label]) => ({ value, label })),
    disciplines: textOptions(snapshots.map((snapshot) => snapshot.discipline)),
    categories: textOptions(snapshots.map((snapshot) => snapshot.category)),
    weightClasses: textOptions(snapshots.map((snapshot) => snapshot.weightClass)),
    scopes: textOptions(snapshots.map((snapshot) => snapshot.geographicScope)),
    seasons: textOptions(snapshots.map((snapshot) => snapshot.season)),
  };
}

function accepted(
  value: string | undefined,
  options: readonly AthleteRankingFilterOption[],
): string | undefined {
  const candidate = normalized(value);
  if (!candidate) return undefined;
  return options.find((option) => normalized(option.value) === candidate)?.value;
}

export function sanitizeAthleteRankingFilters(
  input: AthleteRankingFilters,
  options: AthleteRankingFilterOptions,
): AthleteRankingFilters {
  return {
    provider: accepted(input.provider, options.providers),
    discipline: accepted(input.discipline, options.disciplines),
    category: accepted(input.category, options.categories),
    weightClass: accepted(input.weightClass, options.weightClasses),
    scope: accepted(input.scope, options.scopes),
    season: accepted(input.season, options.seasons),
  };
}

export function filterAthleteRankingSnapshots(
  snapshots: readonly AthleteRankingSnapshot[],
  filters: AthleteRankingFilters,
): AthleteRankingSnapshot[] {
  const provider = normalized(filters.provider);
  const discipline = normalized(filters.discipline);
  const category = normalized(filters.category);
  const weightClass = normalized(filters.weightClass);
  const scope = normalized(filters.scope);
  const season = normalized(filters.season);

  return snapshots.filter(
    (snapshot) =>
      (!provider || normalized(snapshot.provider.slug) === provider) &&
      (!discipline || normalized(snapshot.discipline) === discipline) &&
      (!category || normalized(snapshot.category) === category) &&
      (!weightClass || normalized(snapshot.weightClass) === weightClass) &&
      (!scope || normalized(snapshot.geographicScope) === scope) &&
      (!season || normalized(snapshot.season) === season),
  );
}
