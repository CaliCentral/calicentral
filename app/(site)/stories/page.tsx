import type { Metadata } from "next";

import { FeaturedStoryCard } from "@/components/stories/featured-story-card";
import { StoryCard } from "@/components/stories/story-card";
import { StoryIndexHero } from "@/components/stories/story-index-hero";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { getStories } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Fictional prototype reporting, athlete journals, training culture, competition analysis, and field notes from Cali Central.";

export const metadata: Metadata = createPublicMetadata({
  path: "/stories",
  title: "Stories",
  description,
  socialTitle: "Stories from the movement | Cali Central",
});

const coverageAreas = [
  {
    index: "01",
    title: "Culture",
    description: "The crews, parks, rituals, and local identities behind practice.",
  },
  {
    index: "02",
    title: "Performance",
    description: "Patient training, athlete journals, and the craft inside a result.",
  },
  {
    index: "03",
    title: "Competition",
    description: "Standards, staging, and analysis built for a sport in motion.",
  },
] as const;

export default async function StoriesPage() {
  const articles = await getStories();
  const featuredArticle =
    articles.find((article) => article.featured) ?? articles[0] ?? null;
  const latestArticles = articles.filter(
    (article) => article.slug !== featuredArticle?.slug,
  );

  return (
    <>
      <StoryIndexHero />

      <section
        aria-labelledby="lead-story-heading"
        className="bg-canvas py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="mb-8 flex flex-col gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Lead signal / 001
              </p>
              <h2
                id="lead-story-heading"
                className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-[-0.05em] text-ink sm:text-5xl"
              >
                Featured report
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">
              The defining fictional story from this prototype editorial issue.
            </p>
          </div>
          {featuredArticle ? (
            <FeaturedStoryCard article={featuredArticle} />
          ) : (
            <ContentEmptyState
              title="No stories are published"
              description="The editorial desk is preparing its first public story. Published reporting will appear here."
            />
          )}
        </Container>
      </section>

      <section
        aria-labelledby="latest-stories-heading"
        className="border-y border-white/10 bg-surface-2 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Editorial desk / Latest
              </p>
              <h2
                id="latest-stories-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
              >
                Across the field
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Profiles, analysis, and observations centered on how
              calisthenics is practiced, judged, and shared.
            </p>
          </div>

          {latestArticles.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latestArticles.map((article, index) => (
                <StoryCard
                  key={article.slug}
                  article={article}
                  index={index + 2}
                />
              ))}
            </div>
          ) : null}

          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-xs leading-5 text-muted">
            Every story on this page is fictional prototype editorial content.
            Names, groups, events, quotes, and reporting scenarios are
            illustrative and do not document real people or organizations.
          </p>
        </Container>
      </section>

      <section
        aria-labelledby="coverage-heading"
        className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
                Publication field / Scope
              </p>
              <h2
                id="coverage-heading"
                className="mt-4 max-w-xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.055em] sm:text-5xl"
              >
                Athlete-focused. Independent. Worldwide in scope.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-dark">
                Cali Central is being built to cover the whole movement:
                professional stages, neighborhood sessions, training craft,
                and the systems that make competition legible.
              </p>
            </div>

            <div className="border-y border-on-light/20">
              {coverageAreas.map((area) => (
                <article
                  key={area.index}
                  className="grid gap-3 border-b border-on-light/15 py-6 last:border-b-0 sm:grid-cols-[3rem_11rem_1fr] sm:items-start"
                >
                  <span className="font-mono text-xs font-bold text-accent-dark">
                    {area.index}
                  </span>
                  <h3 className="font-display text-xl font-black uppercase tracking-[-0.025em]">
                    {area.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-dark">
                    {area.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
