import Link from "next/link";

import type { RankingCategory } from "@/types/ranking";

type StandingBoardProps = {
  readonly category: RankingCategory;
};

export function StandingBoard({ category }: StandingBoardProps) {
  return (
    <article
      id={category.slug}
      aria-labelledby={`${category.slug}-heading`}
      className="scroll-mt-24 border border-white/15 bg-surface"
    >
      <header className="grid gap-5 border-b border-white/15 bg-surface-2 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
            Competition standing / {category.seasonLabel}
          </p>
          <h3
            id={`${category.slug}-heading`}
            className="mt-3 font-display text-3xl font-black uppercase leading-[0.95] tracking-[-0.05em] sm:text-4xl"
          >
            {category.title}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            {category.description}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px border border-white/15 bg-white/15 text-sm">
          <div className="bg-canvas p-4">
            <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
              Category
            </dt>
            <dd className="mt-1 font-bold uppercase">{category.discipline}</dd>
          </div>
          <div className="bg-canvas p-4">
            <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
              Scope
            </dt>
            <dd className="mt-1 font-bold uppercase">{category.region}</dd>
          </div>
        </dl>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">
            Published {category.title} competition standings for {category.seasonLabel}.
          </caption>
          <thead>
            <tr className="border-b border-white/15 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <th scope="col" className="w-20 px-5 py-4">Position</th>
              <th scope="col" className="px-5 py-4">Athlete</th>
              <th scope="col" className="px-5 py-4">Region</th>
              <th scope="col" className="w-24 px-5 py-4 text-right">Points</th>
              <th scope="col" className="w-44 px-5 py-4">Provenance</th>
            </tr>
          </thead>
          <tbody>
            {category.entries.map((entry) => (
              <tr key={`${entry.rank}-${entry.athleteSlug}`} className="border-b border-white/10 last:border-b-0">
                <td className="px-5 py-5 font-mono text-2xl font-black text-accent">
                  {String(entry.rank).padStart(2, "0")}
                </td>
                <th scope="row" className="px-5 py-5">
                  <Link
                    href={`/athletes/${entry.athleteSlug}`}
                    className="font-black uppercase text-ink underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {entry.athleteName}
                  </Link>
                  <span className="mt-1 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-muted">
                    {entry.statusLabel}
                  </span>
                </th>
                <td className="px-5 py-5 text-sm text-muted">{entry.region}</td>
                <td className="px-5 py-5 text-right font-mono font-bold tabular-nums">
                  {entry.points.toLocaleString("en-US")}
                </td>
                <td className="px-5 py-5 text-sm">
                  <ul className="space-y-2">
                    {entry.sources.map((source) => (
                      <li key={`${source.competitionSlug}-${source.resultKey}`}>
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-ink underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          {source.competitionName || source.sourceName}
                          <span className="sr-only"> verified result source (opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-white/15 px-5 py-4 text-xs leading-5 text-muted sm:px-7">
        {category.disclaimer}
      </p>
    </article>
  );
}
