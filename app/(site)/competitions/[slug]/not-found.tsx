import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function CompetitionNotFound() {
  return (
    <section
      aria-labelledby="competition-not-found-title"
      className="relative grid min-h-[70vh] place-items-center overflow-hidden bg-canvas py-24"
    >
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl border border-white/15 bg-surface p-7 sm:p-12 lg:p-16">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Field record missing / 404
          </p>
          <h1
            id="competition-not-found-title"
            className="mt-6 text-balance font-display text-5xl font-black uppercase leading-[0.85] tracking-[-0.06em] text-ink sm:text-7xl"
          >
            This event is off the calendar.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted">
            The fictional competition may have moved, or the requested field
            record does not exist in this public prototype.
          </p>
          <div className="mt-9 flex flex-wrap gap-5">
            <Link
              href="/competitions"
              className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Browse competitions
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center border-b border-white/30 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Cali Central home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
