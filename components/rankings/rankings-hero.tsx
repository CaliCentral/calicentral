import { Container } from "@/components/ui/container";

type RankingsHeroProps = {
  readonly categoryCount: number;
  readonly athleteCount: number;
  readonly recordCount: number;
};

export function RankingsHero({
  categoryCount,
  athleteCount,
  recordCount,
}: RankingsHeroProps) {
  const fieldSummary = [
    { value: String(categoryCount).padStart(2, "0"), label: "Boards" },
    { value: String(athleteCount).padStart(2, "0"), label: "Athlete files" },
    { value: String(recordCount).padStart(2, "0"), label: "Sample records" },
  ] as const;

  return (
    <section
      aria-labelledby="rankings-title"
      className="relative isolate overflow-hidden border-b border-white/10 bg-canvas text-ink"
    >
      <div
        aria-hidden="true"
        className="technical-grid pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-[9%] hidden w-px bg-white/10 lg:block"
      />

      <Container className="relative grid gap-10 py-14 sm:py-18 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.7fr)] lg:items-end lg:gap-16 lg:py-24">
        <div>
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden="true" className="h-1 w-7 bg-accent" />
            Rankings / Prototype field board
          </p>
          <h1
            id="rankings-title"
            className="mt-7 max-w-[12ch] text-balance font-display text-[clamp(3rem,8.5vw,7.75rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]"
          >
            A clearer view of the field
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Four fictional California boards demonstrate how Cali Central
            could make categories, positions, points, and movement easier to
            follow.
          </p>

          <div className="mt-8 max-w-2xl border-l-4 border-accent bg-surface-2 px-5 py-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Not official / Fictional sample standings
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              No athlete, placement, or point total on this page has been
              verified. This is a public presentation prototype, not a live
              ranking service.
            </p>
          </div>
        </div>

        <div className="border border-white/15 bg-surface/85">
          <div className="flex items-center justify-between border-b border-white/15 px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
            <span>Field register / 003</span>
            <span className="inline-flex items-center gap-2 text-ink">
              <span aria-hidden="true" className="size-1.5 bg-accent" />
              Local data
            </span>
          </div>
          <dl className="grid grid-cols-3">
            {fieldSummary.map((item) => (
              <div
                key={item.label}
                className="min-w-0 border-r border-white/15 px-3 py-6 last:border-r-0 sm:px-5 sm:py-7"
              >
                <dt className="mt-2 font-mono text-xs font-bold uppercase leading-4 tracking-[0.1em] text-muted">
                  {item.label}
                </dt>
                <dd className="font-mono text-3xl font-black leading-none tracking-[-0.07em] text-ink sm:text-4xl">
                  <span className="text-accent">/</span>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <div
            aria-hidden="true"
            className="relative h-24 overflow-hidden border-t border-white/15"
          >
            <div className="technical-grid absolute inset-0 opacity-70" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end gap-2">
              {[42, 68, 53, 86, 61, 100, 76, 91].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={`block flex-1 ${
                    index === 5 ? "bg-accent" : "bg-white/20"
                  }`}
                  style={{ height: `${height * 0.42}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
