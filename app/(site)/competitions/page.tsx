import type { Metadata } from "next";

import { CompetitionDirectory } from "@/components/competitions/competition-directory";
import { CompetitionDirectoryHero } from "@/components/competitions/competition-directory-hero";
import { FeaturedCompetition } from "@/components/competitions/featured-competition";
import { Container } from "@/components/ui/container";
import { getCompetitions } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPublicMetadata({
    path: "/competitions",
    title: "Worldwide Calisthenics Competition Directory",
    description:
      "Explore worldwide calisthenics competition listings, dates, disciplines, registration states, and source-backed results from Cali Central.",
    socialTitle: "Competitions — Cali Central",
  }),
  keywords: [
    "calisthenics competitions",
    "worldwide calisthenics events",
    "calisthenics event calendar",
    "competition results archive",
  ],
};

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();
  const upcomingCompetitions = competitions
    .filter((competition) => competition.status === "upcoming")
    .slice()
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
  const completedCompetitions = competitions
    .filter((competition) => competition.status === "completed")
    .slice()
    .sort((first, second) => second.startDate.localeCompare(first.startDate));
  const featuredCompetition =
    upcomingCompetitions.find((competition) => competition.featured) ??
    upcomingCompetitions[0];
  const postponedCount = competitions.filter(
    (competition) => competition.status === "postponed",
  ).length;
  const countryCount = new Set(
    competitions.map((competition) => competition.country).filter(Boolean),
  ).size;
  const disciplineCount = new Set(
    competitions.flatMap((competition) => competition.disciplines),
  ).size;
  const nextDateLabel = featuredCompetition
    ? `${featuredCompetition.monthCode} ${featuredCompetition.day}`
    : "Pending";

  return (
    <>
      <CompetitionDirectoryHero
        eventCount={competitions.length}
        countryCount={countryCount}
        disciplineCount={disciplineCount}
        nextDateLabel={nextDateLabel}
      />

      {featuredCompetition ? (
        <FeaturedCompetition competition={featuredCompetition} />
      ) : null}

      <section
        aria-labelledby="calendar-summary-heading"
        className="border-b border-white/10 bg-canvas py-12 sm:py-14"
      >
        <Container>
          <div className="grid gap-7 border-t border-white/15 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Calendar state / At a glance
              </p>
              <h2
                id="calendar-summary-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
              >
                One field, clear event states.
              </h2>
            </div>
            <dl className="grid grid-cols-3 gap-px border border-white/15 bg-white/15">
              {[
                ["Upcoming", upcomingCompetitions.length],
                ["Completed", completedCompetitions.length],
                ["Postponed", postponedCount],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-3 py-4 sm:p-5">
                  <dt className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted sm:text-[0.65rem]">
                    {label}
                  </dt>
                  <dd className="mt-2 font-mono text-3xl font-black tabular-nums tracking-[-0.06em] text-ink">
                    {String(value).padStart(2, "0")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="all-competitions-heading"
        className="technical-grid bg-canvas py-14 sm:py-18 lg:py-24"
      >
        <Container>
          <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Complete calendar / Search the field
              </p>
              <h2
                id="all-competitions-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
              >
                Every event record.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Filter the published directory by country, administrative area,
              category, status, registration state, and date.
            </p>
          </div>

          <CompetitionDirectory competitions={competitions} />

          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-xs leading-5 text-muted">
            Prototype and sample records retain a visible “Sample / Not official” label. Registration, ticketing, and livestream availability is controlled by the reviewed external actions on each event record.
          </p>
        </Container>
      </section>
    </>
  );
}
