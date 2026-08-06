import { Container } from "@/components/ui/container";

type StandingsHeroProps = {
  readonly boardCount: number;
  readonly athleteCount: number;
  readonly verifiedResultCount: number;
};

export function StandingsHero({
  boardCount,
  athleteCount,
  verifiedResultCount,
}: StandingsHeroProps) {
  const signals = [
    { label: "Published boards", value: boardCount },
    { label: "Standing athletes", value: athleteCount },
    { label: "Verified results", value: verifiedResultCount },
  ] as const;

  return (
    <header className="technical-grid border-b border-white/10 bg-canvas py-14 text-ink sm:py-18 lg:py-24">
      <Container>
        <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <span aria-hidden="true" className="h-1 w-7 bg-accent" />
          Standings / Results-led field
        </p>
        <h1 className="mt-6 max-w-[11ch] text-balance font-display text-[clamp(3.35rem,9vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
          Evidence before position.
        </h1>
        <p className="mt-7 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          Published competition standings can appear only when their
          methodology is approved and every athlete entry traces to a verified
          competition result. Editorial selections remain separate.
        </p>

        <dl className="mt-10 grid border-y border-white/15 sm:grid-cols-3">
          {signals.map((signal, index) => (
            <div
              key={signal.label}
              className="border-t border-white/10 py-5 first:border-t-0 sm:border-l sm:border-t-0 sm:px-6 sm:first:border-l-0 sm:first:pl-0"
            >
              <dt className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
                0{index + 1} / {signal.label}
              </dt>
              <dd className="mt-2 font-mono text-4xl font-black tabular-nums tracking-[-0.07em]">
                {String(signal.value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </header>
  );
}
