import type { Metadata } from "next";
import Link from "next/link";

import { StandingBoard } from "@/components/standings/standing-board";
import { StandingsHero } from "@/components/standings/standings-hero";
import { VerifiedResultsArchive } from "@/components/standings/verified-results-archive";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { getCompetitions, getRankingCategories } from "@/lib/content";
import { getVerifiedCompetitionResults } from "@/lib/standings/publication";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

const description =
  "Published calisthenics competition standings, source-backed results, and clearly separated editorial selections from Cali Central.";

export const metadata: Metadata = createPublicMetadata({
  path: "/standings",
  title: "Competition Standings and Verified Results",
  description,
  socialTitle: "Competition standings and verified results | Cali Central",
});

export default async function StandingsPage() {
  const [categories, competitions] = await Promise.all([
    getRankingCategories(),
    getCompetitions(),
  ]);
  const verifiedResults = getVerifiedCompetitionResults(competitions);
  const standingAthleteCount = new Set(
    categories.flatMap((category) =>
      category.entries.map((entry) => entry.athleteSlug),
    ),
  ).size;

  return (
    <>
      <StandingsHero
        boardCount={categories.length}
        athleteCount={standingAthleteCount}
        verifiedResultCount={verifiedResults.length}
      />

      <section aria-labelledby="competition-standings-heading" className="bg-canvas py-16 text-ink sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="01 / Competition standings"
            id="competition-standings-heading"
            title="Published boards, when the evidence is ready."
            description="Only competition-based boards with an approved methodology and verified result sources can appear here."
          />
          {categories.length > 0 ? (
            <div className="mt-9 space-y-7">
              {categories.map((category) => (
                <StandingBoard key={category.slug} category={category} />
              ))}
            </div>
          ) : (
            <div className="mt-9">
              <ContentEmptyState
                eyebrow="Competition standings / Awaiting publication"
                title="No competition standings are published"
                description="Cali Central has not approved a scoring methodology and sourced field for public standings yet."
              />
            </div>
          )}
          <Link
            href="/standings/methodology"
            className="mt-7 inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Read the draft methodology
            <span aria-hidden="true">→</span>
          </Link>
        </Container>
      </section>

      <section aria-labelledby="verified-results-heading" className="border-t border-white/10 bg-surface-2 py-16 text-ink sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="02 / Verified results archive"
            id="verified-results-heading"
            title="Placements with public provenance."
            description="Fictional samples, disputed claims, and results without a public source are excluded from this archive."
          />
          <div className="mt-9">
            <VerifiedResultsArchive results={verifiedResults} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="country-standings-heading" className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="03 / Country standings"
            id="country-standings-heading"
            title="Country standings are not available."
            description="No approved team eligibility, nation assignment, event weighting, or points methodology exists. Cali Central will not infer a country table from incomplete records."
            light
          />
          <div className="mt-9 border border-on-light/20 bg-paper p-6 sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent-dark">Unavailable / Methodology required</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-dark">
              This section reserves the product architecture without presenting invented positions.
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="athletes-watch-heading" className="border-t border-white/10 bg-canvas py-16 text-ink sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="04 / Athletes to watch"
            id="athletes-watch-heading"
            title="Editorial attention is not a ranking."
            description="Selections in this section are made by the Cali Central editorial team and never determine standing points or verified results."
          />
          <div className="mt-9">
            <ContentEmptyState
              eyebrow="Editorial selection / Not an official ranking"
              title="No Athletes to Watch selection is published"
              description="The editorial desk has not approved a current selection."
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  id,
  title,
  description,
  light = false,
}: {
  readonly eyebrow: string;
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly light?: boolean;
}) {
  return (
    <div className={`grid gap-5 border-t pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.52fr)] lg:items-end ${light ? "border-on-light/20" : "border-white/15"}`}>
      <div>
        <p className={`font-mono text-xs font-bold uppercase tracking-[0.17em] ${light ? "text-accent-dark" : "text-accent"}`}>{eyebrow}</p>
        <h2 id={id} className="mt-4 max-w-4xl text-balance font-display text-4xl font-black uppercase leading-[0.93] tracking-[-0.055em] sm:text-5xl">{title}</h2>
      </div>
      <p className={`max-w-xl text-sm leading-7 sm:text-base ${light ? "text-muted-dark" : "text-muted"}`}>{description}</p>
    </div>
  );
}
