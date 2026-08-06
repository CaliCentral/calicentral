import type { Metadata } from "next";

import { RankingBoard } from "@/components/rankings/ranking-board";
import { RankingCategoryNav } from "@/components/rankings/ranking-category-nav";
import { RankingsHero } from "@/components/rankings/rankings-hero";
import { RankingsMethodology } from "@/components/rankings/rankings-methodology";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { getRankingCategories } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Explore fictional, not-official prototype calisthenics standings across published sample California ranking categories.";

export const metadata: Metadata = createPublicMetadata({
  path: "/rankings",
  title: "Prototype Rankings",
  description,
  socialTitle: "Prototype calisthenics rankings | Cali Central",
});

export default async function RankingsPage() {
  const rankingCategories = await getRankingCategories();
  const rankedAthleteSlugs = new Set(
    rankingCategories.flatMap((category) =>
      category.entries.map((entry) => entry.athleteSlug),
    ),
  );
  const recordCount = rankingCategories.reduce(
    (total, category) => total + category.entries.length,
    0,
  );

  return (
    <>
      <RankingsHero
        categoryCount={rankingCategories.length}
        athleteCount={rankedAthleteSlugs.size}
        recordCount={recordCount}
      />

      <section
        aria-labelledby="ranking-categories-heading"
        className="bg-canvas py-16 text-ink sm:py-20 lg:py-24"
      >
        <Container>
          {rankingCategories.length > 0 ? (
            <>
              <RankingCategoryNav categories={rankingCategories} />

              <div className="mt-8 divide-y divide-white/15 border-y border-white/15">
                {rankingCategories.map((category, index) => (
                  <RankingBoard
                    key={category.slug}
                    category={category}
                    index={index}
                  />
                ))}
              </div>
            </>
          ) : (
            <ContentEmptyState
              headingId="ranking-categories-heading"
              title="No ranking boards are published"
              description="The public rankings board is being prepared. Published categories will appear here."
            />
          )}
        </Container>
      </section>

      <RankingsMethodology />
    </>
  );
}
