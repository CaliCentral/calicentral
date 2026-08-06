import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { searchPublicContent } from "@/lib/content/search";
import {
  MAX_PUBLIC_SEARCH_QUERY_LENGTH,
  MIN_PUBLIC_SEARCH_QUERY_LENGTH,
  PUBLIC_SEARCH_FILTERS,
  normalizePublicSearchQuery,
  resolvePublicSearchFilter,
  type PublicSearchFilter,
} from "@/lib/search/contracts";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Search published Cali Central stories, athletes, competitions, and videos without exposing private submissions or account records.";

export const metadata: Metadata = createPublicMetadata({
  path: "/search",
  title: "Search",
  description,
  socialTitle: "Search Cali Central",
  noIndex: true,
});

type SearchPageProps = {
  readonly searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
  }>;
};

const filterLabels: Readonly<Record<PublicSearchFilter, string>> = {
  all: "All",
  stories: "Stories",
  athletes: "Athletes",
  competitions: "Competitions",
  videos: "Videos",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizePublicSearchQuery(params.q);
  const filter = resolvePublicSearchFilter(params.type);
  const canSearch = query.length >= MIN_PUBLIC_SEARCH_QUERY_LENGTH;
  const results = canSearch
    ? await searchPublicContent({ query, filter })
    : [];

  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-14 sm:py-18 lg:py-22">
        <Container>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Public index / Published records only
          </p>
          <h1 className="mt-5 max-w-5xl font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-ink sm:text-7xl lg:text-8xl">
            Search the field
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Search published stories, athlete profiles, competitions, and
            videos. Private submissions, account records, editorial notes, and
            draft content are excluded.
          </p>
        </Container>
      </header>

      <section
        aria-labelledby="search-results-heading"
        className="min-h-[38rem] bg-surface-2 py-12 sm:py-16 lg:py-20"
      >
        <Container>
          <form
            role="search"
            action="/search"
            method="get"
            className="border border-white/15 bg-surface p-5 sm:p-7"
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
              <label className="block min-w-0">
                <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink">
                  Search term
                </span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  minLength={MIN_PUBLIC_SEARCH_QUERY_LENGTH}
                  maxLength={MAX_PUBLIC_SEARCH_QUERY_LENGTH}
                  placeholder="Name, place, title, or topic"
                  className="min-h-12 w-full border border-white/20 bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/80 hover:border-white/40 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink">
                  Content type
                </span>
                <select
                  name="type"
                  defaultValue={filter}
                  className="min-h-12 w-full border border-white/20 bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors hover:border-white/40 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {PUBLIC_SEARCH_FILTERS.map((option) => (
                    <option key={option} value={option}>
                      {filterLabels[option]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="clip-corner inline-flex min-h-12 items-center justify-center bg-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-white/15 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {query
                ? `${results.length} public ${results.length === 1 ? "record" : "records"}`
                : "Ready for a query"}
            </p>
            <h2
              id="search-results-heading"
              className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-4xl"
            >
              {query ? `Results for “${query}”` : "Search Cali Central"}
            </h2>
          </div>

          {!query ? (
            <div className="mt-7 border border-white/15 bg-surface p-6 sm:p-8">
              <p className="max-w-2xl text-sm leading-7 text-muted">
                Enter at least {MIN_PUBLIC_SEARCH_QUERY_LENGTH} characters. The
                first version uses the existing bounded public content
                repositories and does not require a separate search service.
              </p>
            </div>
          ) : !canSearch ? (
            <div role="status" className="mt-7 border border-amber-300/30 bg-amber-300/[0.06] p-6">
              <p className="text-sm leading-6 text-amber-100">
                Add at least {MIN_PUBLIC_SEARCH_QUERY_LENGTH} characters to run
                a public search.
              </p>
            </div>
          ) : results.length > 0 ? (
            <ul className="mt-7 grid gap-px border border-white/15 bg-white/15 md:grid-cols-2">
              {results.map((result) => (
                <li
                  key={`${result.category}-${result.href}`}
                  className="min-w-0 bg-canvas p-6 sm:p-7"
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    {filterLabels[result.category]} / {result.context}
                  </p>
                  <h3 className="mt-4 text-balance font-display text-2xl font-black uppercase leading-tight tracking-[-0.035em] text-ink">
                    <Link
                      href={result.href}
                      className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                    >
                      {result.title}
                    </Link>
                  </h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted">
                    {result.description}
                  </p>
                  <Link
                    href={result.href}
                    className="mt-5 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Open public record
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div role="status" className="mt-7 border border-white/15 bg-surface p-6 sm:p-8">
              <p className="font-display text-2xl font-black uppercase tracking-[-0.03em] text-ink">
                No published records matched
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Try a broader term or search all public content types. Empty
                results are not filled with private or invented records.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
