import Link from "next/link";

import { CompetitionVisual } from "@/components/competitions/competition-visual";
import { Container } from "@/components/ui/container";
import {
  competitionDisciplineLabels,
  competitionScheduleStatusLabels,
  competitionStatusLabels,
  registrationStatusLabels,
} from "@/lib/presentation/competition-labels";
import type { Competition } from "@/types/competition";

type FeaturedCompetitionProps = {
  readonly competition: Competition;
};

export function FeaturedCompetition({
  competition,
}: FeaturedCompetitionProps) {
  return (
    <section
      aria-labelledby="next-event-heading"
      className="border-b border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
    >
      <Container>
        <div className="grid overflow-hidden border border-white/15 lg:grid-cols-[0.9fr_1.1fr]">
          <CompetitionVisual
            name={competition.name}
            eventNumber={competition.eventNumber}
            variant={competition.visualVariant}
            image={competition.image}
          />
          <div className="flex flex-col bg-canvas p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Next event / Featured field record{competition.contentStatus !== "published-record" ? " / Sample" : ""}
              </p>
              <span className="bg-accent px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.13em] text-canvas">
                {competitionStatusLabels[competition.status]}
              </span>
            </div>
            <p className="mt-10 font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
              {competition.dateDisplay} · {competition.city},{" "}
              {competition.administrativeArea ?? competition.state}, {competition.country}
            </p>
            <h2
              id="next-event-heading"
              className="mt-4 max-w-xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
            >
              {competition.name}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              {competition.summary}
            </p>

            <dl className="mt-8 grid gap-px border border-white/12 bg-white/12 sm:grid-cols-3">
              <div className="bg-surface p-4">
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Format
                </dt>
                <dd className="mt-2 text-sm font-bold uppercase text-ink">
                  {competition.competitionFormat}
                </dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Primary discipline
                </dt>
                <dd className="mt-2 text-sm font-bold uppercase text-ink">
                  {competitionDisciplineLabels[competition.primaryDiscipline]}
                </dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Listing state
                </dt>
                <dd className="mt-2 text-sm font-bold uppercase text-ink">
                  {competitionScheduleStatusLabels[competition.scheduleStatus]}
                </dd>
              </div>
            </dl>

            <div className="mt-auto flex flex-col gap-4 pt-8 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
              <Link
                href={`/competitions/${competition.slug}`}
                className="clip-corner inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Open event record
                <span aria-hidden="true">→</span>
              </Link>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                {registrationStatusLabels[competition.registrationStatus]}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
