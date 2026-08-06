import Link from "next/link";

import { StoryArtwork } from "@/components/stories/story-artwork";
import type { Article } from "@/types/article";

type FeaturedStoryCardProps = {
  readonly article: Article;
};

export function FeaturedStoryCard({ article }: FeaturedStoryCardProps) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      className="group block border border-white/15 bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <article className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <StoryArtwork article={article} />
        <div className="flex min-h-[27rem] flex-col justify-between p-6 sm:p-9 lg:p-10 xl:p-12">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 font-mono text-xs font-bold uppercase tracking-[0.15em]">
              <span className="text-accent">{article.category}</span>
              <span className="text-muted">Lead story / {article.issueNumber}</span>
            </div>
            <h2 className="mt-7 text-balance font-display text-[clamp(2.5rem,4.8vw,5.4rem)] font-black leading-[0.88] tracking-[-0.065em] text-ink transition-colors group-hover:text-accent">
              {article.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              {article.dek}
            </p>
          </div>

          <div className="mt-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.1em] text-muted">
              <time dateTime={article.publicationDate}>
                {article.displayDate}
              </time>
              <span aria-hidden="true" className="size-1 bg-accent" />
              <span>{article.readTime}</span>
              <span aria-hidden="true" className="size-1 bg-accent" />
              <span>{article.location}</span>
            </div>
            <span className="mt-7 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors group-hover:text-accent">
              Read the feature
              <span
                aria-hidden="true"
                className="h-px w-9 bg-accent transition-[width] group-hover:w-14"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
