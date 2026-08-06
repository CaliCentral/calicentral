import type { RankingCategory } from "@/types/ranking";

type RankingCategoryNavProps = {
  readonly categories: readonly RankingCategory[];
};

export function RankingCategoryNav({
  categories,
}: RankingCategoryNavProps) {
  const categoryCount = categories.length;

  return (
    <div>
      <div className="grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] md:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            Category index / 01–
            {String(categoryCount).padStart(2, "0")}
          </p>
          <h2
            id="ranking-categories-heading"
            className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-ink sm:text-5xl"
          >
            Read every published board
          </h2>
        </div>
        <p className="text-sm leading-6 text-muted sm:text-base sm:leading-7">
          {categoryCount === 1
            ? "The published category is rendered"
            : `All ${categoryCount} published categories are rendered`}{" "}
          on this page. Use these links to move directly to a standings
          section—no loading or hidden panels.
        </p>
      </div>

      <nav aria-label="Ranking categories" className="mt-8">
        <ul className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category, index) => (
            <li key={category.slug} className="min-w-0 bg-surface">
              <a
                href={`#${category.slug}`}
                className="group flex min-h-32 h-full flex-col justify-between p-5 transition-colors hover:bg-surface-2 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:min-h-36"
              >
                <span className="flex items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span aria-hidden="true" className="text-accent">
                    ↓
                  </span>
                </span>
                <span className="mt-7 block">
                  <span className="block text-lg font-black uppercase leading-tight tracking-[-0.025em] text-ink transition-colors group-hover:text-accent">
                    {category.title}
                  </span>
                  <span className="mt-1 block font-mono text-xs font-semibold uppercase tracking-[0.11em] text-muted">
                    {category.subtitle}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
