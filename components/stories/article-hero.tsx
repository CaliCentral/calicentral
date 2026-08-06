import Link from "next/link";

import { StoryArtwork } from "@/components/stories/story-artwork";
import { Container } from "@/components/ui/container";
import type { Article } from "@/types/article";

type ArticleHeroProps = {
  readonly article: Article;
};

export function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-canvas">
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      <Container className="relative py-10 sm:py-14 lg:py-18">
        <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em]">
          <Link
            href="/stories"
            className="text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Stories
          </Link>
          <span aria-hidden="true" className="text-accent">
            /
          </span>
          <span className="text-accent">{article.category}</span>
        </div>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.65fr)] lg:items-end lg:gap-12">
          <div className="min-w-0 pb-2">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              <span aria-hidden="true" className="h-1 w-7 bg-accent" />
              {article.heroLabel} / {article.issueNumber}
            </p>
            <h1 className="mt-7 max-w-5xl text-balance font-display text-[clamp(2.8rem,8.1vw,7.8rem)] font-black leading-[0.82] tracking-[-0.075em] text-ink">
              {article.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {article.dek}
            </p>

            <div className="mt-9 grid gap-4 border-y border-white/15 py-5 font-mono text-xs uppercase tracking-[0.11em] text-muted sm:grid-cols-3">
              <p>
                <span className="mb-1 block text-ink">By {article.author}</span>
                Editorial desk
              </p>
              <p>
                <time
                  dateTime={article.publicationDate}
                  className="mb-1 block text-ink"
                >
                  {article.displayDate}
                </time>
                {article.readTime}
              </p>
              <p>
                <span className="mb-1 block text-ink">{article.location}</span>
                Fictional reporting location
              </p>
            </div>
          </div>

          <StoryArtwork
            article={article}
            priority
            className="min-h-[22rem] lg:min-h-[37rem]"
          />
        </div>
      </Container>
    </header>
  );
}
