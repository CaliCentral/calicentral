import Link from "next/link";

import type { AthleteRankMovement } from "@/types/athlete";
import type { RankingCategory, RankingEntry } from "@/types/ranking";

type RankingBoardProps = {
  readonly category: RankingCategory;
  readonly index: number;
};

export function RankingBoard({ category, index }: RankingBoardProps) {
  return (
    <section
      id={category.slug}
      aria-labelledby={`${category.slug}-heading`}
      className="scroll-mt-24 py-12 sm:py-16 lg:py-20"
    >
      <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.5fr)] lg:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            Field board / {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            id={`${category.slug}-heading`}
            className="mt-3 text-balance font-display text-3xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-ink sm:text-4xl lg:text-5xl"
          >
            {category.title}{" "}
            <span className="text-accent">— {category.region}</span>
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            {category.description}
          </p>
        </div>
        <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted lg:justify-self-end">
          <span aria-hidden="true" className="size-1.5 bg-accent" />
          {category.status} / Not official
        </p>
      </div>

      <div className="overflow-hidden border border-white/15 bg-surface">
        <dl className="grid grid-cols-2 border-b border-white/15 bg-surface-2 sm:grid-cols-4">
          <BoardMeta label="Discipline" value={category.discipline} />
          <BoardMeta label="Division" value={category.division} />
          <BoardMeta label="Region" value={category.region} />
          <BoardMeta label="Record" value={category.updatedLabel} />
        </dl>

        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            {category.status} for {category.title}, {category.region}.{" "}
            {category.disclaimer}
          </caption>
          <thead>
            <tr className="border-b border-white/10 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted sm:tracking-[0.12em]">
              <th
                scope="col"
                className="w-10 px-2 py-4 text-center sm:w-16 sm:px-4"
              >
                <span className="sm:hidden">#</span>
                <span className="hidden sm:inline">Rank</span>
              </th>
              <th scope="col" className="px-2 py-4 sm:px-4">
                Athlete
              </th>
              <th
                scope="col"
                className="hidden w-32 px-3 py-4 md:table-cell lg:w-40 lg:px-5"
              >
                Region
              </th>
              <th
                scope="col"
                className="w-14 px-1 py-4 text-right sm:w-20 sm:px-3"
              >
                Pts
              </th>
              <th
                scope="col"
                className="w-[4.5rem] px-2 py-4 text-right sm:w-28 sm:px-4"
              >
                Move
              </th>
            </tr>
          </thead>
          <tbody>
            {category.entries.map((entry) => (
              <RankingRow key={entry.rank} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-3xl border-l-2 border-accent pl-4 text-xs leading-5 text-muted">
        {category.disclaimer}
      </p>
    </section>
  );
}

function BoardMeta({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="min-w-0 border-b border-r border-white/15 p-4 even:border-r-0 sm:border-b-0 sm:even:border-r sm:last:border-r-0 sm:p-5">
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-bold leading-5 text-ink">{value}</dd>
    </div>
  );
}

function RankingRow({ entry }: { readonly entry: RankingEntry }) {
  return (
    <tr className="border-b border-white/10 last:border-b-0">
      <td className="border-r border-white/10 px-2 py-5 text-center sm:px-4 sm:py-6">
        <span
          className={`font-mono text-2xl font-black leading-none tracking-[-0.07em] sm:text-3xl ${
            entry.rank === 1 ? "text-accent" : "text-ink"
          }`}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>
      </td>
      <th
        scope="row"
        className="min-w-0 px-2 py-5 align-middle sm:px-4 sm:py-6"
      >
        <Link
          href={`/athletes/${entry.athleteSlug}`}
          className="text-sm font-black leading-5 text-ink underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-base"
        >
          {entry.athleteName}
        </Link>
        <span className="mt-1 block font-mono text-xs font-medium uppercase leading-4 tracking-[0.06em] text-muted md:hidden">
          {entry.region}
        </span>
        <span className="mt-1.5 block font-mono text-xs font-medium uppercase leading-4 tracking-[0.06em] text-muted">
          {entry.statusLabel}
        </span>
      </th>
      <td className="hidden px-3 py-5 text-sm leading-6 text-muted md:table-cell md:py-6 lg:px-5">
        {entry.region}
      </td>
      <td className="px-1 py-5 text-right align-middle font-mono text-xs font-bold tabular-nums text-ink sm:px-3 sm:py-6 sm:text-sm">
        {entry.points.toLocaleString("en-US")}
      </td>
      <td className="px-2 py-5 text-right align-middle sm:px-4 sm:py-6">
        <MovementLabel movement={entry.movement} />
      </td>
    </tr>
  );
}

function MovementLabel({
  movement,
}: {
  readonly movement: AthleteRankMovement;
}) {
  const symbol = {
    up: "↑",
    down: "↓",
    hold: "—",
    new: "+",
  }[movement.direction];

  const tone = {
    up: "text-ink",
    down: "text-muted",
    hold: "text-muted",
    new: "text-accent",
  }[movement.direction];

  return (
    <span
      className={`inline-flex items-center justify-end gap-1 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.04em] sm:gap-1.5 sm:tracking-[0.07em] ${tone}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{movement.label}</span>
    </span>
  );
}
