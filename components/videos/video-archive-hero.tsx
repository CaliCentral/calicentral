import { Container } from "@/components/ui/container";

type VideoArchiveHeroProps = {
  readonly episodeCount: number;
  readonly seriesCount: number;
  readonly categoryCount: number;
  readonly totalRuntime: string;
};

export function VideoArchiveHero({
  episodeCount,
  seriesCount,
  categoryCount,
  totalRuntime,
}: VideoArchiveHeroProps) {
  const signals = [
    { label: "Episodes", value: String(episodeCount).padStart(2, "0") },
    { label: "Series", value: String(seriesCount).padStart(2, "0") },
    { label: "Categories", value: String(categoryCount).padStart(2, "0") },
    { label: "Runtime", value: totalRuntime },
  ];

  return (
    <section
      aria-labelledby="video-archive-title"
      className="technical-grid relative overflow-hidden border-b border-white/10 bg-canvas py-14 text-ink sm:py-18 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 top-0 font-mono text-[clamp(8rem,24vw,22rem)] font-black leading-none tracking-[-0.14em] text-white/[0.025]"
      >
        05
      </div>
      <Container className="relative">
        <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <span aria-hidden="true" className="h-1 w-7 bg-accent" />
          Media archive / Static preview records
        </p>
        <h1
          id="video-archive-title"
          className="mt-6 max-w-[11ch] text-balance font-display text-[clamp(3.35rem,9vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em] text-ink"
        >
          Movement, held in the frame.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          Technique studies, competition diaries, field reports, and athlete
          profiles organized as a fictional editorial archive. Every frame is
          static; playback is intentionally unavailable.
        </p>

        <dl className="mt-10 grid border-y border-white/15 min-[430px]:grid-cols-2 lg:grid-cols-4">
          {signals.map((signal, index) => (
            <div
              key={signal.label}
              className="border-t border-white/10 py-5 first:border-t-0 min-[430px]:border-l min-[430px]:px-5 min-[430px]:first:border-l-0 lg:border-t-0 lg:first:pl-0"
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

