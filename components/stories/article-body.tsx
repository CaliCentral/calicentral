import { ArticleBlockView } from "@/components/stories/article-block";
import { PortableTextContent } from "@/components/content/portable-text";
import type { Article } from "@/types/article";

type ArticleBodyProps = {
  readonly article: Article;
};

export function ArticleBody({ article }: ArticleBodyProps) {
  return (
    <div data-article-body>
      <div className="mb-10 border border-accent-dark/30 bg-accent-dark/8 p-5 sm:p-6">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">
          Prototype editorial note
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-dark">
          {article.prototypeNotice}
        </p>
      </div>

      <div className="article-copy space-y-7">
        {article.portableBody ? (
          <PortableTextContent value={article.portableBody} />
        ) : (
          article.body.map((block, index) => (
            <ArticleBlockView
              key={`${article.slug}-${block.type}-${index}`}
              block={block}
            />
          ))
        )}
      </div>
    </div>
  );
}
