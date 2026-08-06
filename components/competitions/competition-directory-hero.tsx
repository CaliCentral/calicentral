import Link from "next/link";

import { Container } from "@/components/ui/container";

type CompetitionDirectoryHeroProps = {
  readonly eventCount: number;
  readonly countryCount: number;
  readonly disciplineCount: number;
  readonly nextDateLabel: string;
};

export function CompetitionDirectoryHero({
  eventCount,
  countryCount,
  disciplineCount,
  nextDateLabel,
}: CompetitionDirectoryHeroProps) {
  const signals = [
    { label: "Event files", value: String(eventCount).padStart(2, "0") },
    { label: "Countries represented", value: String(countryCount).padStart(2, "0") },
    {
      label: "Disciplines",
      value: String(disciplineCount).padStart(2, "0"),
    },
    { label: "Next date", value: nextDateLabel },
  ];

  return (
    <section
      aria-labelledby="competition-directory-title"
      className="technical-grid relative overflow-hidden border-b border-white/10 bg-canvas py-14 text-ink sm:py-18 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 top-0 font-mono text-[clamp(8rem,24vw,22rem)] font-black leading-none tracking-[-0.14em] text-white/[0.025]"
      >
        04
      </div>
      <Container className="relative">
        <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <span aria-hidden="true" className="h-1 w-7 bg-accent" />
          Field directory / Competition records
        </p>
        <h1
          id="competition-directory-title"
          className="mt-6 max-w-[11ch] text-balance font-display text-[clamp(3.35rem,9vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em] text-ink"
        >
          The field, mapped in public.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          A worldwide event directory for published dates, locations,
          disciplines, registration states, and result provenance. Sample
          records remain explicitly labeled.
        </p>
        <Link
          href="/competitions/calendar"
          className="mt-7 inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Open calendar view
          <span aria-hidden="true">→</span>
        </Link>

        <dl className="mt-10 grid border-y border-white/15 min-[430px]:grid-cols-2 lg:grid-cols-4">
          {signals.map((signal, index) => (
            <div
              key={signal.label}
              className="border-t border-white/10 py-5 first:border-t-0 min-[430px]:border-l min-[430px]:px-5 min-[430px]:first:border-l-0 min-[430px]:nth-[2]:border-t-0 lg:border-t-0 lg:first:pl-0"
            >
              <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
                0{index + 1} / {signal.label}
              </dt>
              <dd className="mt-2 text-xl font-black uppercase tracking-[-0.03em] text-ink">
                {signal.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
