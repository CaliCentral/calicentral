import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { createPublicMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = createPublicMetadata({
  path: "/standings/methodology",
  title: "Standings Methodology — Draft",
  description:
    "The draft eligibility, source, correction, tie, and season requirements for future Cali Central competition standings.",
});

const methodologySections = [
  {
    title: "Qualifying events",
    text: "No event tier list is approved. A future eligible event must publish stable rules, divisions, dates, and results that Cali Central can review from a public source.",
  },
  {
    title: "Eligible results",
    text: "Only completed-event results carrying a verified result status and public provenance may support a standing. Submitted, sample, disputed, or unsourced performances are excluded.",
  },
  {
    title: "Points and event weighting",
    text: "No points table, tier, or multiplier has been finalized. The public site therefore publishes no calculated fallback standings. Any approved formula must be centralized and versioned before use.",
  },
  {
    title: "Ties",
    text: "No tie-break order is approved. A future methodology must state whether athletes share position and which published result factors, if any, resolve a tie.",
  },
  {
    title: "Season boundaries",
    text: "Every published board must identify its season label and date boundary. Results outside that window cannot be silently included.",
  },
  {
    title: "Withdrawals and disqualifications",
    text: "Withdrawals, disqualifications, and organizer corrections must retain their event context. They are not converted into ordinary placements without an explicit rule and source.",
  },
  {
    title: "Missing data",
    text: "Missing or unverifiable data receives no invented value. An empty board or omitted result is preferable to an unsupported estimate.",
  },
  {
    title: "Corrections and disputes",
    text: "Athletes and organizers may submit sourced corrections through the moderated account workflow. A disputed result is removed from verified-result eligibility while it is reviewed; private moderation notes remain private.",
  },
] as const;

export default function StandingsMethodologyPage() {
  return (
    <article>
      <header className="technical-grid border-b border-white/10 bg-canvas py-14 text-ink sm:py-18 lg:py-24">
        <Container>
          <Link href="/standings" className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <span aria-hidden="true">←</span>
            Return to standings
          </Link>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">Methodology / Draft framework</p>
          <h1 className="mt-5 max-w-[12ch] text-balance font-display text-[clamp(3.2rem,8vw,7.5rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">Rules before rankings.</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            This document describes publication gates, not a finalized scoring formula. Cali Central has not approved event tiers, points, multipliers, or tie-breakers.
          </p>
          <div className="mt-8 max-w-3xl border-l-4 border-accent bg-surface-2 p-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">Draft / No active formula</p>
            <p className="mt-2 text-sm leading-6 text-muted">No public position should be inferred from this framework until the methodology is approved and sourced results exist.</p>
          </div>
        </Container>
      </header>

      <section aria-labelledby="methodology-requirements" className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24">
        <Container>
          <h2 id="methodology-requirements" className="max-w-3xl font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-5xl">Publication requirements</h2>
          <ol className="mt-10 grid gap-px border border-on-light/20 bg-on-light/20 md:grid-cols-2">
            {methodologySections.map((section, index) => (
              <li key={section.title} className="bg-paper p-6 sm:p-8">
                <p className="font-mono text-xs font-bold text-accent-dark">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-xl font-black uppercase">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-dark">{section.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </article>
  );
}
