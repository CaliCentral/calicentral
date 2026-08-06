import Link from "next/link";

import { StoryArtwork } from "@/components/stories/story-artwork";
import type { Article } from "@/types/article";

type StoryCardProps = {
  readonly article: Article;
  readonly index?: number;
  readonly showArtwork?: boolean;
};

export function StoryCard({
  article,
  index,
  showArtwork = true,
}: StoryCardProps) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      className="group block h-full border border-white/12 bg-surface transition-colors hover:border-accent/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <article className="flex h-full flex-col">
        {showArtwork ? <StoryArtwork article={article} compact /> : null}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em]">
            <span className="text-accent">{article.category}</span>
            <span className="text-muted">
              {index ? String(index).padStart(2, "0") : article.issueNumber}
            </span>
          </div>
          <h3 className="mt-4 text-balance font-display text-2xl font-extrabold leading-[1.02] tracking-[-0.04em] text-ink transition-colors group-hover:text-accent sm:text-3xl">
            {article.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-muted">{article.dek}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-[0.1em] text-muted">
            <time dateTime={article.publicationDate}>
              {article.displayDate}
            </time>
            <span aria-hidden="true" className="size-1 bg-accent" />
            <span>{article.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
