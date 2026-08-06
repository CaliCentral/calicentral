import type { ArticleBlock } from "@/types/article";

type ArticleBlockProps = {
  readonly block: ArticleBlock;
};

export function ArticleBlockView({ block }: ArticleBlockProps) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-on-light/86">{block.text}</p>;

    case "heading":
      return (
        <h2
          id={block.id}
          className="scroll-mt-28 pt-7 font-display text-3xl font-black leading-[1.02] tracking-[-0.045em] text-on-light sm:text-4xl"
        >
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3
          id={block.id}
          className="scroll-mt-28 pt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.035em] text-on-light"
        >
          {block.text}
        </h3>
      );

    case "pullQuote":
      return (
        <blockquote className="my-12 border-y border-on-light/20 py-8 sm:my-14 sm:py-10">
          <p className="text-balance font-display text-3xl font-black leading-[1.03] tracking-[-0.045em] text-accent-dark sm:text-4xl">
            “{block.quote}”
          </p>
          {block.attribution ? (
            <footer className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted-dark">
              — {block.attribution}
            </footer>
          ) : null}
        </blockquote>
      );

    case "factBox":
      return (
        <aside className="my-10 border-l-4 border-accent bg-on-light p-6 text-ink sm:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Field data
          </p>
          <p className="mt-3 font-display text-2xl font-black leading-tight tracking-[-0.035em]">
            {block.title}
          </p>
          <ul className="mt-5 divide-y divide-white/12 border-y border-white/12">
            {block.items.map((item) => (
              <li
                key={item}
                className="grid grid-cols-[0.75rem_1fr] gap-3 py-3 text-sm leading-6 text-ink/80"
              >
                <span aria-hidden="true" className="mt-2 size-1 bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      );

    case "list": {
      const List = block.style === "ordered" ? "ol" : "ul";

      return (
        <List
          className={`space-y-3 pl-6 text-on-light/86 ${
            block.style === "ordered" ? "list-decimal" : "list-[square]"
          } marker:font-mono marker:font-bold marker:text-accent-dark`}
        >
          {block.items.map((item) => (
            <li key={item} className="pl-2">
              {item}
            </li>
          ))}
        </List>
      );
    }

    case "divider":
      return (
        <div
          role="separator"
          className="my-12 flex items-center gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-dark"
        >
          <span aria-hidden="true" className="h-px flex-1 bg-on-light/20" />
          {block.label ? <span>{block.label}</span> : null}
          <span aria-hidden="true" className="h-px w-12 bg-accent" />
        </div>
      );

    case "callout":
      return (
        <aside className="my-10 border border-on-light/20 bg-white/35 p-6 sm:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">
            {block.label}
          </p>
          {block.title ? (
            <p className="mt-3 font-display text-2xl font-black leading-tight tracking-[-0.035em] text-on-light">
              {block.title}
            </p>
          ) : null}
          <p className="mt-4 text-base leading-7 text-muted-dark">
            {block.text}
          </p>
        </aside>
      );
  }
}
