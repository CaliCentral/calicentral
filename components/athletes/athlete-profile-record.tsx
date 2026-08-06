import Link from "next/link";

import { Container } from "@/components/ui/container";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

type AthleteProfileRecordProps = {
  readonly athlete: Athlete;
};

export function AthleteProfileRecord({ athlete }: AthleteProfileRecordProps) {
  const hasStatistics = athlete.statistics.length > 0;
  const hasAchievements = athlete.achievements.length > 0;
  const hasTimeline = athlete.timeline.length > 0;
  const isPrototype = [athlete.status, athlete.profileLabel].some((value) =>
    /fictional|prototype|sample/i.test(value),
  );

  return (
    <>
      {hasStatistics ? (
        <section
          aria-labelledby="athlete-statistics-heading"
          className="border-y border-white/10 bg-surface-2 py-16 sm:py-20 lg:py-24"
        >
          <Container>
            <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                  {isPrototype
                    ? "Performance index / Illustrative data"
                    : "Performance record / Published profile"}
                </p>
                <h2
                  id="athlete-statistics-heading"
                  className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl"
                >
                  {isPrototype ? "Sample statistics" : "Profile statistics"}
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted">
                {isPrototype
                  ? "Presentation-only metrics for this fictional profile. No values are verified or official."
                  : "Published profile metrics. Individual result and source status must be assessed separately from profile approval."}
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
      ) : null}

      {athlete.competitionHistory.length > 0 ? (
        <section
          aria-labelledby="athlete-competition-history-heading"
          className="border-b border-white/10 bg-canvas py-16 sm:py-20"
        >
          <Container>
            <div className="border-t border-white/15 pt-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Competition archive / Result-level status
              </p>
              <h2
                id="athlete-competition-history-heading"
                className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl"
              >
                Competition history
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-6 text-muted">
                Every entry carries its own evidence status. Athlete profile
                approval does not verify a placement or score.
              </p>
            </div>
            <ol className="mt-8 space-y-4">
              {athlete.competitionHistory.map((record, index) => {
                const location = formatGlobalLocation(record);

                return (
                  <li
                    key={`${record.eventName}-${record.date}-${index}`}
                    className="border border-white/15 bg-surface p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">
                          {record.date}
                          {location ? ` / ${location}` : ""}
                        </p>
                        <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.025em] text-ink">
                          {record.eventSlug ? (
                            <Link
                              href={`/competitions/${record.eventSlug}`}
                              className="hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                              {record.eventName}
                            </Link>
                          ) : (
                            record.eventName
                          )}
                        </h3>
                      </div>
                      <span className="border border-white/20 px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
                        {competitionVerificationLabel(
                          record.verificationStatus,
                        )}
                      </span>
                    </div>
                    <dl className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
                      <CompetitionValue
                        label="Division / category"
                        value={record.divisionCategory}
                      />
                      <CompetitionValue
                        label="Placement"
                        value={record.placement}
                      />
                      <CompetitionValue label="Score" value={record.score} />
                    </dl>
                    {record.sourceUrl || record.videoUrl ? (
                      <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 font-mono text-xs font-bold uppercase tracking-[0.1em]">
                        {record.sourceUrl ? (
                          <a
                            href={record.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            {record.sourceLabel || "View result source"} ↗
                          </a>
                        ) : null}
                        {record.videoUrl ? (
                          <a
                            href={record.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            View evidence video ↗
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </Container>
        </section>
      ) : null}

      {hasAchievements || hasTimeline ? (
        <section
          aria-labelledby="athlete-record-heading"
          className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
        >
          <Container>
            <div className="mb-10 border-t border-on-light/20 pt-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
                {isPrototype
                  ? "Archive record / Fictional development"
                  : "Archive record / Athlete history"}
              </p>
              <h2
                id="athlete-record-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] sm:text-5xl"
              >
                Achievements and timeline
              </h2>
            </div>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {hasAchievements ? (
                <section aria-labelledby="athlete-achievements-heading">
                  <h3
                    id="athlete-achievements-heading"
                    className="font-display text-2xl font-black uppercase tracking-[-0.035em]"
                  >
                    {isPrototype ? "Illustrative achievements" : "Achievements"}
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
              ) : null}

              {hasTimeline ? (
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
              ) : null}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function CompetitionValue({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-ink">{value || "Not published"}</dd>
    </div>
  );
}

function competitionVerificationLabel(
  status: Athlete["competitionHistory"][number]["verificationStatus"],
): string {
  switch (status) {
    case "verified":
      return "Result verified";
    case "source-reviewed":
      return "Source reviewed";
    case "disputed":
      return "Result disputed";
    case "sample":
      return "Fictional sample";
    case "unverified":
      return "Unverified result";
  }
}
