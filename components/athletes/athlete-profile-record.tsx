import { Container } from "@/components/ui/container";
import type { Athlete } from "@/types/athlete";

type AthleteProfileRecordProps = {
  readonly athlete: Athlete;
};

export function AthleteProfileRecord({ athlete }: AthleteProfileRecordProps) {
  return (
    <>
      <section
        aria-labelledby="athlete-statistics-heading"
        className="border-y border-white/10 bg-surface-2 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Performance index / Illustrative data
              </p>
              <h2
                id="athlete-statistics-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl"
              >
                Sample statistics
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              Presentation-only metrics for this fictional profile. No values
              are verified or official.
            </p>
          </div>

          <dl className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {athlete.statistics.map((statistic, index) => (
              <div
                key={statistic.label}
                className={`min-w-0 bg-surface p-6 sm:p-7 ${
                  statistic.emphasis ? "border-t-4 border-accent" : ""
                }`}
              >
                <dt className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted">
                  {String(index + 1).padStart(2, "0")} / {statistic.label}
                </dt>
                <dd className="mt-5">
                  <span className="block font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink">
                    {statistic.value}
                  </span>
                  {statistic.detail ? (
                    <span className="mt-4 block text-sm leading-6 text-muted">
                      {statistic.detail}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section
        aria-labelledby="athlete-record-heading"
        className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
      >
        <Container>
          <div className="mb-10 border-t border-on-light/20 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
              Archive record / Fictional development
            </p>
            <h2
              id="athlete-record-heading"
              className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] sm:text-5xl"
            >
              Achievements and timeline
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <section aria-labelledby="athlete-achievements-heading">
              <h3
                id="athlete-achievements-heading"
                className="font-display text-2xl font-black uppercase tracking-[-0.035em]"
              >
                Illustrative achievements
              </h3>
              <ol className="mt-6 border-t border-on-light/20">
                {athlete.achievements.map((achievement) => (
                  <li
                    key={`${achievement.year}-${achievement.title}`}
                    className="grid gap-3 border-b border-on-light/15 py-5 sm:grid-cols-[4rem_1fr]"
                  >
                    <span className="font-mono text-xs font-bold text-accent-dark">
                      {achievement.year}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h4 className="font-display text-xl font-black leading-tight tracking-[-0.025em]">
                          {achievement.title}
                        </h4>
                        <span className="border border-on-light/20 px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.09em] text-muted-dark">
                          {achievement.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-dark">
                        {achievement.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="athlete-timeline-heading">
              <h3
                id="athlete-timeline-heading"
                className="font-display text-2xl font-black uppercase tracking-[-0.035em]"
              >
                Development timeline
              </h3>
              <ol className="relative mt-6 border-l border-on-light/25">
                {athlete.timeline.map((entry) => (
                  <li
                    key={`${entry.dateLabel}-${entry.title}`}
                    className="relative pb-8 pl-7 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -left-[0.32rem] top-1 size-2.5 bg-accent-dark"
                    />
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent-dark">
                      {entry.dateLabel} / {entry.type}
                    </p>
                    <h4 className="mt-2 font-display text-xl font-black leading-tight tracking-[-0.025em]">
                      {entry.title}
                    </h4>
                    <p className="mt-3 text-sm leading-6 text-muted-dark">
                      {entry.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </Container>
      </section>
    </>
  );
}
