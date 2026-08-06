import { Container } from "@/components/ui/container";
import { competitionDisciplineLabels } from "@/lib/presentation/competition-labels";
import type { Competition } from "@/types/competition";

type CompetitionRecordProps = {
  readonly competition: Competition;
};

export function CompetitionRecord({ competition }: CompetitionRecordProps) {
  const showParticipants =
    competition.status !== "completed" && competition.participants.length > 0;
  const showResults =
    competition.status === "completed" && competition.results.length > 0;

  return (
    <>
      <section
        aria-labelledby="competition-overview-heading"
        className="technical-grid-dark bg-paper py-14 text-on-light sm:py-18 lg:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
              Overview / Fictional event brief
            </p>
            <h2
              id="competition-overview-heading"
              className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-on-light sm:text-5xl"
            >
              A public record before the floor opens.
            </h2>
            <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-muted-dark">
              {competition.fullDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <dl className="self-start border-y border-on-light/20">
            {[
              ["Venue", competition.venueName],
              ["Venue type", competition.venueType],
              ["Organizer", competition.organizerName],
              ["Region", competition.region],
              ["Capacity", competition.capacityLabel],
              ["Format", competition.competitionFormat],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-t border-on-light/15 py-4 first:border-t-0"
              >
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-dark">
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm font-bold uppercase leading-5 text-on-light">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {competition.divisions.length > 0 ? (
        <section
          aria-labelledby="competition-divisions-heading"
          className="border-t border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Field structure / Divisions"
              headingId="competition-divisions-heading"
              title="Ways into the competition."
              description={`${String(competition.divisions.length).padStart(
                2,
                "0",
              )} fictional divisions are recorded for this prototype event.`}
            />
            <div className="grid gap-px border border-white/15 bg-white/15 md:grid-cols-2 xl:grid-cols-3">
              {competition.divisions.map((division, index) => (
                <article key={division.slug} className="bg-canvas p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                      Division / {String(index + 1).padStart(2, "0")}
                    </p>
                    <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      Limit {division.participantLimit}
                    </span>
                  </div>
                  <h3 className="mt-5 text-balance font-display text-3xl font-black uppercase leading-[0.98] tracking-[-0.045em] text-ink">
                    {division.name}
                  </h3>
                  <p className="mt-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-accent-strong">
                    {competitionDisciplineLabels[division.discipline]} ·{" "}
                    {division.level}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    {division.description}
                  </p>
                  <p className="mt-5 border-t border-white/12 pt-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink">
                    {division.format}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {competition.schedule.length > 0 ? (
        <section
          aria-labelledby="competition-schedule-heading"
          className="border-t border-white/10 bg-canvas py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Run of field / Event schedule"
              headingId="competition-schedule-heading"
              title="The day, set in sequence."
              description="Every time and stage is fictional sample information and may be marked provisional, complete, or cancelled."
            />
            <ol className="border-y border-white/15">
              {competition.schedule.map((item, index) => (
                <li
                  key={`${item.time}-${item.label}`}
                  className="grid gap-4 border-t border-white/12 py-5 first:border-t-0 sm:grid-cols-[6rem_minmax(0,0.8fr)_minmax(0,1.2fr)_8rem] sm:items-start sm:gap-6"
                >
                  <div>
                    <p className="font-mono text-lg font-black tabular-nums text-accent">
                      {item.time}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      Slot {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase leading-6 text-ink">
                      {item.label}
                    </h3>
                    <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      {item.stage}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                  <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-ink sm:text-right">
                    {item.status}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {showParticipants || showResults ? (
        <section
          aria-labelledby="competition-field-heading"
          className="border-t border-white/10 bg-surface-2 py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow={
                showResults
                  ? "Sample outcome / Results"
                  : "Preview roster / Participants"
              }
              headingId="competition-field-heading"
              title={showResults ? "The completed field." : "The expected field."}
              description={
                showResults
                  ? "Illustrative placements demonstrate how a completed competition record could read."
                  : "Names and entry states are fictional previews, not confirmed registrations."
              }
            />

            {showResults ? (
              <ol className="grid gap-px border border-white/15 bg-white/15">
                {competition.results.map((result) => (
                  <li
                    key={`${result.placement}-${result.athleteName}`}
                    className="grid gap-4 bg-canvas p-5 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(9rem,0.45fr)_minmax(9rem,0.65fr)] sm:items-center sm:p-6"
                  >
                    <span className="font-mono text-4xl font-black tabular-nums tracking-[-0.06em] text-accent">
                      {String(result.placement).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-lg font-black uppercase text-ink">
                        {result.athleteName}
                      </h3>
                      <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                        {result.region}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                        {result.resultLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-ink">
                        {result.scoreDisplay}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-muted">
                      {result.movementNote}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3">
                {competition.participants.map((participant, index) => (
                  <article
                    key={`${participant.athleteName}-${participant.seed}`}
                    className="bg-canvas p-5"
                  >
                    <div className="flex items-center justify-between gap-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      <span>Entry / {String(index + 1).padStart(2, "0")}</span>
                      <span>{participant.status}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-black uppercase text-ink">
                      {participant.athleteName}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {participant.city} ·{" "}
                      {competitionDisciplineLabels[participant.discipline]}
                    </p>
                    <p className="mt-5 border-t border-white/12 pt-4 font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">
                      {participant.seed}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Container>
        </section>
      ) : null}

      {competition.timeline.length > 0 || competition.notices.length > 0 ? (
        <section
          aria-labelledby="competition-notices-heading"
          className="border-t border-white/10 bg-canvas py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Status log / Public notices"
              headingId="competition-notices-heading"
              title="What changed, and when."
              description="A transparent prototype history for schedule, registration, and field-state updates."
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-12">
              {competition.timeline.length > 0 ? (
                <ol className="border-l border-white/20">
                  {competition.timeline.map((entry, index) => (
                    <li
                      key={`${entry.dateLabel}-${entry.title}`}
                      className="relative pb-8 pl-7 last:pb-0"
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[0.3rem] top-1 size-2.5 border-2 border-canvas ${
                          entry.status === "current"
                            ? "bg-accent"
                            : "bg-white/35"
                        }`}
                      />
                      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">
                        {String(index + 1).padStart(2, "0")} / {entry.dateLabel}{" "}
                        / {entry.status}
                      </p>
                      <h3 className="mt-2 text-lg font-black uppercase text-ink">
                        {entry.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        {entry.description}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}

              {competition.notices.length > 0 ? (
                <div className="space-y-3">
                  {competition.notices.map((notice) => (
                    <aside
                      key={`${notice.label}-${notice.text}`}
                      className={`border p-5 ${
                        notice.emphasis === "signal"
                          ? "border-accent/50 bg-accent/10"
                          : "border-white/15 bg-surface"
                      }`}
                    >
                      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-accent">
                        {notice.label}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-ink/85">
                        {notice.text}
                      </p>
                    </aside>
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

type SectionIntroProps = {
  readonly eyebrow: string;
  readonly headingId: string;
  readonly title: string;
  readonly description: string;
};

function SectionIntro({
  eyebrow,
  headingId,
  title,
  description,
}: SectionIntroProps) {
  return (
    <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
          {eyebrow}
        </p>
        <h2
          id={headingId}
          className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}
