import { StoryCard } from "@/components/stories/story-card";
import { Container } from "@/components/ui/container";
import type { Article } from "@/types/article";

type RelatedStoriesProps = {
  readonly articles: readonly Article[];
};

export function RelatedStories({ articles }: RelatedStoriesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-stories-heading"
      className="border-t border-white/10 bg-canvas py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <div className="mb-9 flex flex-col gap-5 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              Continue reading / Signal
            </p>
            <h2
              id="related-stories-heading"
              className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-[-0.05em] text-ink sm:text-5xl"
            >
              Related stories
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            More fictional editorial work from across Cali Central&apos;s
            prototype field desk.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <StoryCard
              key={article.slug}
              article={article}
              index={index + 1}
              showArtwork={false}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
