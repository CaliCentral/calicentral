import type { Article } from "@/types/article";

type ArticleMetaProps = {
  readonly article: Article;
};

export function ArticleMeta({ article }: ArticleMetaProps) {
  const details = [
    { label: "Byline", value: article.author },
    { label: "Published", value: article.displayDate },
    { label: "Reading time", value: article.readTime },
    { label: "Filed from", value: article.location },
  ] as const;

  return (
    <aside
      aria-label="Article details"
      className="self-start lg:sticky lg:top-28"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">
        Story file / {article.issueNumber}
      </p>
      <dl className="mt-5 border-t border-on-light/20">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="border-b border-on-light/15 py-4"
          >
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted-dark">
              {detail.label}
            </dt>
            <dd className="mt-2 text-sm font-semibold leading-5 text-on-light">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="border border-on-light/20 px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-dark"
          >
            {tag}
          </span>
        ))}
      </div>
    </aside>
  );
}
