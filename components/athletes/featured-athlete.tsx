import { AthleteVisual } from "@/components/athletes/athlete-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  athleteCategoryLabel,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

type FeaturedAthleteProps = {
  readonly athlete: Athlete;
};

export function FeaturedAthlete({ athlete }: FeaturedAthleteProps) {
  const featuredStatistics = athlete.statistics.slice(0, 4);
  const location = formatGlobalLocation(athlete);

  return (
    <section
      aria-labelledby="featured-athlete-heading"
      className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
    >
      <Container>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-t border-on-light/20 pt-5">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">
              Lead profile / {athlete.profileNumber}
            </p>
            <h2
              id="featured-athlete-heading"
              className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.05em] sm:text-4xl"
            >
              Featured athlete
            </h2>
          </div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-dark">
            {athlete.status}
          </p>
        </div>

        <article className="grid overflow-hidden border border-on-light/25 bg-canvas text-ink shadow-[0_28px_80px_rgba(0,0,0,0.18)] lg:grid-cols-[minmax(20rem,0.88fr)_minmax(0,1.12fr)]">
          <AthleteVisual
            athlete={athlete}
            className="border-b border-white/15 lg:border-b-0 lg:border-r"
          />

          <div className="flex min-w-0 flex-col justify-between p-6 sm:p-9 lg:p-10 xl:p-12">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                {athlete.profileLabel}
              </p>
              <h3 className="mt-5 text-balance font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.07em] text-ink">
                {athlete.name}
              </h3>
              <p className="mt-5 font-mono text-xs font-bold uppercase leading-5 tracking-[0.13em] text-accent">
                {athleteCategoryLabel(athlete.primaryCategory)}
                {athlete.specialties.length > 0
                  ? ` / ${athlete.specialties
                      .map(athleteSpecialtyLabel)
                      .join(" / ")}`
                  : ""}
                {location ? <span className="text-muted"> — {location}</span> : null}
              </p>
              {athlete.shortBio ? (
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted">
                  {athlete.shortBio}
                </p>
              ) : null}
              {athlete.quote ? (
                <blockquote className="mt-7 max-w-2xl border-l-4 border-accent pl-5 text-xl font-bold leading-8 tracking-[-0.025em] text-ink">
                  “{athlete.quote}”
                </blockquote>
              ) : null}
            </div>

            <div>
              {featuredStatistics.length > 0 ? (
                <dl className="mt-9 grid grid-cols-2 border-l border-t border-white/15 sm:grid-cols-4">
                  {featuredStatistics.map((statistic, index) => (
                    <div
                      key={statistic.label}
                      className="min-w-0 border-b border-r border-white/15 p-4"
                    >
                      <dt className="font-mono text-xs font-bold uppercase leading-4 tracking-[0.11em] text-muted">
                        0{index + 1} / {statistic.label}
                      </dt>
                      <dd className="mt-2 break-words text-lg font-black leading-6 text-ink">
                        {statistic.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <ButtonLink
                href={`/athletes/${athlete.slug}`}
                className="mt-8 w-full sm:w-auto"
              >
                Open full athlete file
              </ButtonLink>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
