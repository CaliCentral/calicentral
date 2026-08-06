import Link from "next/link";

import { CompetitionVisual } from "@/components/competitions/competition-visual";
import { Container } from "@/components/ui/container";
import { formatGlobalLocation } from "@/lib/geography";
import {
  competitionDisciplineLabels,
  competitionScheduleStatusLabels,
  competitionStatusLabels,
  registrationStatusLabels,
} from "@/lib/presentation/competition-labels";
import type { Competition } from "@/types/competition";

type CompetitionHeroProps = {
  readonly competition: Competition;
};

export function CompetitionHero({ competition }: CompetitionHeroProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-canvas text-ink">
      <Container className="py-10 sm:py-14 lg:py-18">
        <Link
          href="/competitions"
          className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span>
          Competition directory
        </Link>

        <div className="mt-7 grid overflow-hidden border border-white/15 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.72fr)]">
          <div className="relative flex min-h-[31rem] flex-col justify-between bg-surface p-6 sm:p-9 lg:min-h-[37rem] lg:p-11">
            <div
              aria-hidden="true"
              className="absolute right-3 top-0 font-mono text-[clamp(7rem,17vw,14rem)] font-black leading-none tracking-[-0.14em] text-white/[0.035]"
            >
              {competition.eventNumber}
            </div>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Event file / {competition.eventNumber}
                </p>
                {competition.contentStatus !== "published-record" ? (
                  <span className="border border-accent/60 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">
                    Sample / Not official
                  </span>
                ) : null}
                <span
                  className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.13em] ${
                    competition.status === "upcoming"
                      ? "bg-accent text-canvas"
                      : "border border-white/20 text-ink"
                  }`}
                >
                  {competitionStatusLabels[competition.status]}
                </span>
              </div>
              <p className="mt-12 font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
                {competition.competitionFormat}
              </p>
              <h1 className="mt-4 max-w-[12ch] text-balance font-display text-[clamp(3.4rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.07em] text-ink">
                {competition.name}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {competition.summary}
              </p>
            </div>

            <div className="relative mt-10">
              <ul className="flex flex-wrap gap-2" aria-label="Disciplines">
                {competition.disciplines.map((discipline) => (
                  <li
                    key={discipline}
                    className="border border-white/20 px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-ink"
                  >
                    {competitionDisciplineLabels[discipline]}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/15 pt-5 font-mono text-xs font-bold uppercase leading-6 tracking-[0.13em] text-muted">
                {registrationStatusLabels[competition.registrationStatus]}
                <br />
                {competitionScheduleStatusLabels[competition.scheduleStatus]}
              </p>
            </div>
          </div>

          <div className="grid grid-rows-[1fr_auto]">
            <CompetitionVisual
              name={competition.name}
              eventNumber={competition.eventNumber}
              variant={competition.visualVariant}
              image={competition.image}
              priority
            />
            <dl className="grid grid-cols-2 gap-px border-t border-white/15 bg-white/15">
              <div className="bg-canvas p-4 sm:p-5">
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Date
                </dt>
                <dd className="mt-2 text-sm font-bold uppercase leading-5 text-ink">
                  <time dateTime={competition.startDate}>
                    {competition.dateDisplay}
                  </time>
                </dd>
              </div>
              <div className="bg-canvas p-4 sm:p-5">
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Location
                </dt>
                <dd className="mt-2 text-sm font-bold uppercase leading-5 text-ink">
                  {formatGlobalLocation({
                    city: competition.city,
                    administrativeArea:
                      competition.administrativeArea ?? competition.state,
                    country: competition.country,
                  }) || "Location not published"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>
    </header>
  );
}
