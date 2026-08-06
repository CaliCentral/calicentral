export const PUBLIC_SEARCH_FILTERS = [
  "all",
  "stories",
  "athletes",
  "competitions",
  "videos",
] as const;

export type PublicSearchFilter = (typeof PUBLIC_SEARCH_FILTERS)[number];
export type PublicSearchCategory = Exclude<PublicSearchFilter, "all">;

export const MAX_PUBLIC_SEARCH_QUERY_LENGTH = 80;
export const MIN_PUBLIC_SEARCH_QUERY_LENGTH = 2;

export type PublicSearchResult = {
  readonly category: PublicSearchCategory;
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly context: string;
};

export function normalizePublicSearchQuery(
  value: string | string[] | undefined,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  return (candidate ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PUBLIC_SEARCH_QUERY_LENGTH);
}

export function resolvePublicSearchFilter(
  value: string | string[] | undefined,
): PublicSearchFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return (PUBLIC_SEARCH_FILTERS as readonly string[]).includes(candidate ?? "")
    ? (candidate as PublicSearchFilter)
    : "all";
}
