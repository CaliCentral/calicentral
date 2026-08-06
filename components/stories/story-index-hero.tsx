import { Container } from "@/components/ui/container";

export function StoryIndexHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-canvas">
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-12 size-72 rounded-full border-[3rem] border-accent/80 opacity-20 sm:size-96 sm:opacity-100"
      />
      <Container className="relative grid min-h-[31rem] content-end gap-12 py-14 sm:min-h-[38rem] sm:py-20 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:py-24">
        <div className="min-w-0">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden="true" className="h-1 w-8 bg-accent" />
            Editorial field / Issue 002
          </p>
          <h1 className="mt-7 max-w-5xl font-display text-[clamp(3rem,10vw,8.5rem)] font-black uppercase leading-[0.78] tracking-[-0.075em] text-ink">
            <span className="block">Stories</span>
            <span className="block">from</span>
            <span className="block text-accent">
              <span className="block sm:inline">the</span>{" "}
              <span className="block sm:inline">movement.</span>
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Original prototype reporting, athlete journals, competition
            analysis, and field notes from California and beyond.
          </p>
        </div>

        <dl className="grid min-w-0 grid-cols-2 border-y border-white/15 py-5 font-mono text-xs uppercase tracking-[0.12em] lg:grid-cols-1 lg:border-y-0 lg:border-l lg:py-0 lg:pl-7">
          <div className="min-w-0 pr-5 lg:pb-5 lg:pr-0">
            <dt className="text-muted">Signal</dt>
            <dd className="mt-2 font-bold text-ink">Independent</dd>
          </div>
          <div className="min-w-0 border-l border-white/15 pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5">
            <dt className="text-muted">Field</dt>
            <dd className="mt-2 font-bold text-ink">California / World</dd>
          </div>
        </dl>
      </Container>
    </section>
  );
}
