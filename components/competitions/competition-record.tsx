import Link from "next/link";

import { Container } from "@/components/ui/container";
import {
  competitionDisciplineLabels,
  registrationStatusLabels,
} from "@/lib/presentation/competition-labels";
import { absoluteSiteUrl } from "@/lib/site/config";
import type { Competition } from "@/types/competition";

type CompetitionRecordProps = {
  readonly competition: Competition;
};

export function CompetitionRecord({ competition }: CompetitionRecordProps) {
  const showParticipants =
    competition.status !== "completed" && competition.participants.length > 0;
  const showResults =
    competition.status === "completed" && competition.results.length > 0;
  const organizerVerificationLabel = {
    unverified: "Organizer not verified",
    reviewed: "Organizer details reviewed",
    verified: "Verified organizer",
    sample: "Fictional sample organizer",
  }[competition.organizerVerificationStatus ?? "unverified"];
  const correctionHref = `/account/submissions/new?${new URLSearchParams({
    type: "correctionRequest",
    affectedUrl: absoluteSiteUrl(`/competitions/${competition.slug}`),
  }).toString()}`;

  return (
    <>
      <section
        aria-labelledby="competition-overview-heading"
        className="technical-grid-dark bg-paper py-14 text-on-light sm:py-18 lg:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
              Overview / {competition.contentStatus === "published-record" ? "Published event brief" : "Sample event brief"}
            </p>
            <h2
              id="competition-overview-heading"
              className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-on-light sm:text-5xl"
            >
              The public event record.
            </h2>
            <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-muted-dark">
              {competition.fullDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="self-start">
            <dl className="border-y border-on-light/20">
              {[
                ["Venue", competition.venueName],
                ["Venue type", competition.venueType],
                ["Organizer", competition.organizerName],
                ["Organizer status", organizerVerificationLabel],
                ["Region", competition.region || "Not published"],
                ["Capacity", competition.capacityLabel],
                ["Format", competition.competitionFormat],
                [
                  "Registration",
                  registrationStatusLabels[competition.registrationStatus],
                ],
                ...(competition.registrationDeadline
                  ? [
                      [
                        "Registration deadline",
                        formatDateTime(competition.registrationDeadline),
                      ],
                    ]
                  : []),
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

            {(competition.actionLinks ?? []).length > 0 ? (
              <div className="mt-6 border border-on-light/20 p-4">
                <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent-dark">
                  Official event actions
                </p>
                <ul className="mt-3 space-y-3">
                  {(competition.actionLinks ?? []).map((action) => (
                    <li key={`${action.linkType}-${action.url}`}>
                      <a
                        href={action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase text-on-light underline decoration-on-light/30 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
                      >
                        {action.label}
                        <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      {action.affiliate ? (
                        <p className="mt-1 text-xs leading-5 text-muted-dark">
                          Affiliate disclosure: {action.disclosure} Partner: {action.partnerName}.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
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
              )} divisions are recorded for this event.`}
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
              description="Times and stages appear with their published schedule status and may be provisional, complete, or cancelled."
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
                  ? competition.resultsStatus === "verified-results"
                    ? "Verified outcome / Results"
                    : "Sample or unverified outcome / Results"
                  : "Preview roster / Participants"
              }
              headingId="competition-field-heading"
              title={showResults ? "The completed field." : "The expected field."}
              description={
                showResults
                  ? competition.resultsStatus === "verified-results"
                    ? "Every published placement below carries public source provenance."
                    : "These placements are sample or unverified results and do not enter the verified-results archive."
                  : competition.contentStatus === "published-record"
                    ? "Participant names and entry states appear as supplied by the published event record."
                    : "Names and entry states are fictional previews, not confirmed registrations."
              }
            />

            {showResults ? (
              <ol className="grid gap-px border border-white/15 bg-white/15">
                {competition.results.map((result) => (
                  <li
                    key={result.key ?? `${result.placement}-${result.athleteName}`}
                    className="grid gap-4 bg-canvas p-5 md:grid-cols-[4rem_minmax(0,1fr)_minmax(9rem,0.45fr)_minmax(12rem,0.65fr)] md:items-center sm:p-6"
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
                      <p className="mt-1 text-xs text-muted">
                        {[result.category, result.division]
                          .filter(Boolean)
                          .join(" / ") || "Category not published"}
                      </p>
                      {[result.ruleset, result.bodyweightDisplay]
                        .filter(Boolean)
                        .map((value) => (
                          <p key={value} className="mt-1 text-xs text-muted">
                            {value}
                          </p>
                        ))}
                    </div>
                    <div>
                      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                        {result.resultLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-ink">
                        {result.scoreDisplay}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm leading-6 text-muted">
                        {result.movementNote}
                      </p>
                      <p className="mt-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-accent">
                        {resultVerificationLabel(
                          result.verificationStatus,
                          competition.resultsStatus,
                        )}
                      </p>
                      {result.sourceUrl && result.sourceName ? (
                        <a
                          href={result.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-ink underline decoration-white/25 underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          Source: {result.sourceName} ↗
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-muted">No public source published.</p>
                      )}
                      {result.videoUrl ? (
                        <a
                          href={result.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-xs font-bold text-ink underline decoration-white/25 underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          Evidence video ↗
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : null}
                    </div>
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
              description="A public history for schedule, registration, and field-state updates."
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

      <section className="border-t border-white/10 bg-surface py-10">
        <Container className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Correction or missing source?
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Submit evidence through the moderated correction workflow. Public records change only after review.
            </p>
          </div>
          <Link
            href={correctionHref}
            className="inline-flex min-h-12 items-center justify-center border border-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Submit a correction
          </Link>
        </Container>
      </section>
    </>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(date);
}

function resultVerificationLabel(
  status: Competition["results"][number]["verificationStatus"],
  resultsStatus: Competition["resultsStatus"],
): string {
  if (resultsStatus === "sample-results" || status === "sample") {
    return "Sample result / Not verified";
  }

  const labels = {
    unverified: "Unverified result",
    "source-reviewed": "Source reviewed / Not verified",
    verified: "Verified result",
    disputed: "Disputed result / Not verified",
  } as const;

  return status ? labels[status as keyof typeof labels] ?? "Unverified result" : "Unverified result";
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
