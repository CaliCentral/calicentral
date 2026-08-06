"use client";

import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function SiteError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <section
      aria-labelledby="site-error-heading"
      className="technical-grid relative grid min-h-[70vh] place-items-center overflow-hidden bg-canvas py-20"
    >
      <Container className="relative">
        <div className="mx-auto max-w-3xl border border-white/15 bg-surface p-7 sm:p-12 lg:p-16">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Signal interrupted
          </p>
          <h1
            id="site-error-heading"
            className="mt-6 text-balance font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] text-ink sm:text-7xl"
          >
            This page could not be loaded.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted">
            The problem may be temporary. Try the page again, or return to a
            published section. Private diagnostics are not displayed.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={reset}
              className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Return home
            </Link>
            <Link
              href="/stories"
              className="inline-flex min-h-12 items-center px-2 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Browse stories
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
