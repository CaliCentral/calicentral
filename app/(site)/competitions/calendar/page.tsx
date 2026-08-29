import type { Metadata } from "next";
import Link from "next/link";

import { CompetitionDirectory } from "@/components/competitions/competition-directory";
import { Container } from "@/components/ui/container";
import { getCompetitions } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicMetadata({
  path: "/competitions/calendar",
  title: "Calisthenics Competition Calendar",
  description:
    "A chronological view of published calisthenics competition records with worldwide location, category, status, registration, and date filters.",
});

export default async function CompetitionCalendarPage() {
  const competitions = await getCompetitions();

  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-14 text-ink sm:py-18 lg:py-24">
        <Container>
          <Link
            href="/competitions"
            className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span aria-hidden="true">←</span>
            Competition directory
          </Link>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            Calendar / Shared event source
          </p>
          <h1 className="mt-5 max-w-[11ch] text-balance font-display text-[clamp(3.3rem,9vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
            Dates across the field.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            This timeline uses the same published competition records as the
            directory. Filters do not change or infer event status.
          </p>
        </Container>
      </header>

      <section className="technical-grid bg-canvas py-14 sm:py-18 lg:py-24">
        <Container>
          <CompetitionDirectory competitions={competitions} view="timeline" />
        </Container>
      </section>
    </>
  );
}
