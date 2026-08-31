import type { Metadata } from "next";

import { AthleteDirectory } from "@/components/athletes/athlete-directory";
import { AthleteDirectoryHero } from "@/components/athletes/athlete-directory-hero";
import { FeaturedAthlete } from "@/components/athletes/featured-athlete";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { athleteCategoryLabel } from "@/lib/athlete-taxonomy";
import { getAthletes } from "@/lib/content";
import { countryNameFor } from "@/lib/geography";
import { createPublicMetadata } from "@/lib/site/metadata";
import { useSupabaseAuth } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const description =
  "Explore Cali Central athlete profiles by country, competition category, specialty, and public verification state.";

export const metadata: Metadata = createPublicMetadata({
  path: "/athletes",
  title: "Athlete directory",
  description,
  socialTitle: "Profiles from the field | Cali Central",
});

export default async function AthletesPage() {
  const athletes = await getAthletes();
  const featuredAthlete =
    athletes.find((athlete) => athlete.featured) ?? athletes[0];
  const categorySummary = Array.from(
    new Set(athletes.map((athlete) => athlete.primaryCategory)),
  )
    .map((category) => ({
      label: athleteCategoryLabel(category),
      count: athletes.filter(
        (athlete) => athlete.primaryCategory === category,
      ).length,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
  const countrySummary = Array.from(
    new Set(athletes.map((athlete) => countryNameFor(athlete.country))),
  )
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second))
    .map((country) => ({
      label: country,
      count: athletes.filter(
        (athlete) => countryNameFor(athlete.country) === country,
      ).length,
    }));
  const createProfileTarget =
    "/account/submissions/new?type=athleteNomination&requestKind=create";
  const createProfileHref = `/sign-in?callbackUrl=${encodeURIComponent(
    createProfileTarget,
  )}`;

  return (
    <>
      <AthleteDirectoryHero athletes={athletes} />
      {featuredAthlete ? <FeaturedAthlete athlete={featuredAthlete} /> : null}

      <section
        id="athlete-directory"
        aria-labelledby="athlete-directory-heading"
        className="border-y border-white/10 bg-canvas py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Archive record / Public directory
              </p>
              <h2
                id="athlete-directory-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
              >
                Athlete files
              </h2>
            </div>
            <div>
              <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                Search approved and prototype athlete records by worldwide
                geography, category, specialty, and verification state.
              </p>
              <ButtonLink
                href={createProfileHref}
                variant="outline"
                className="mt-5"
              >
                Create athlete profile
              </ButtonLink>
            </div>
          </div>

          <AthleteDirectory athletes={athletes} />
        </Container>
      </section>

      {athletes.length > 0 ? (
        <section
          aria-labelledby="directory-field-heading"
          className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
        >
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1.45fr)] lg:gap-14">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">
                  Directory index / Scope
                </p>
                <h2
                  id="directory-field-heading"
                  className="mt-4 font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-5xl"
                >
                  The field at a glance
                </h2>
                <p className="mt-6 text-sm leading-6 text-muted-dark sm:text-base sm:leading-7">
                  Counts are derived from the currently published athlete
                  records. Empty countries or categories are never padded with
                  invented profiles.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <FieldSummary
                  label="Competition categories"
                  records={categorySummary}
                />
                <FieldSummary label="Country file" records={countrySummary} />
              </div>
            </div>

            {useSupabaseAuth ? null : (
              <p className="mt-12 border-l-2 border-accent-dark pl-4 text-xs leading-5 text-muted-dark">
                All names, profiles, quotes, training bases, achievements,
                rankings, and performance statistics in this directory are
                fictional prototype content. They do not document or verify
                real people, teams, or competition results.
              </p>
            )}
          </Container>
        </section>
      ) : null}
    </>
  );
}

type FieldSummaryProps = {
  readonly label: string;
  readonly records: readonly {
    readonly label: string;
    readonly count: number;
  }[];
};

function FieldSummary({ label, records }: FieldSummaryProps) {
  return (
    <div>
      <h3 className="border-b border-on-light/25 pb-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">
        {label}
      </h3>
      <dl>
        {records.map((record, index) => (
          <div
            key={record.label}
            className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-on-light/15 py-4"
          >
            <dt className="col-span-2 grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-3">
              <span
                aria-hidden="true"
                className="font-mono text-xs font-bold text-muted-dark"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 text-sm font-bold uppercase tracking-[-0.01em]">
                {record.label}
              </span>
            </dt>
            <dd className="text-right font-mono text-xs font-bold">
              {String(record.count).padStart(2, "0")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
