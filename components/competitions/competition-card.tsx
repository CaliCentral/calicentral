import Link from "next/link";

import {
  competitionDisciplineLabels,
  competitionScheduleStatusLabels,
  competitionStatusLabels,
} from "@/lib/presentation/competition-labels";
import type { Competition } from "@/types/competition";

type CompetitionCardProps = {
  readonly competition: Competition;
};

export function CompetitionCard({ competition }: CompetitionCardProps) {
  return (
    <article className="group relative flex h-full flex-col border border-white/15 bg-surface transition-colors hover:border-accent/60">
      <Link
        href={`/competitions/${competition.slug}`}
        aria-label={`Open the prototype listing for ${competition.name}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="sr-only">View event record</span>
      </Link>

      <div className="grid grid-cols-[6rem_1fr] border-b border-white/12 sm:grid-cols-[7rem_1fr]">
        <time
          dateTime={competition.startDate}
          className="flex flex-col justify-between border-r border-white/12 bg-canvas p-4 sm:p-5"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
            {competition.monthCode} / {competition.year}
          </span>
          <span className="mt-6 font-mono text-5xl font-black leading-none tracking-[-0.08em] text-ink sm:text-6xl">
            {competition.day}
          </span>
        </time>

        <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] ${
                competition.status === "upcoming"
                  ? "bg-accent text-canvas"
                  : "border border-white/20 text-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-1.5 ${
                  competition.status === "upcoming" ? "bg-canvas" : "bg-accent"
                }`}
              />
              {competitionStatusLabels[competition.status]}
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Event / {competition.eventNumber}
            </span>
          </div>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent-strong">
            {competition.city}, {competition.state}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
          {competition.competitionFormat}
        </p>
        <h3 className="mt-3 text-balance font-display text-3xl font-black uppercase leading-[0.96] tracking-[-0.045em] text-ink transition-colors group-hover:text-accent sm:text-4xl">
          {competition.name}
        </h3>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
          {competition.summary}
        </p>

        <div className="mt-auto pt-7">
          <ul className="flex flex-wrap gap-2" aria-label="Disciplines">
            {competition.disciplines.map((discipline) => (
              <li
                key={discipline}
                className="border border-white/15 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/80"
              >
                {competitionDisciplineLabels[discipline]}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/12 pt-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
            <span>
              {competitionScheduleStatusLabels[competition.scheduleStatus]} /
              Prototype
            </span>
            <span className="text-ink transition-transform group-hover:translate-x-1">
              View record →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
