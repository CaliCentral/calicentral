"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Site unavailable | Cali Central</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen bg-canvas text-ink">
        <main className="technical-grid grid min-h-screen place-items-center px-5 py-16">
          <section
            aria-labelledby="global-error-heading"
            className="w-full max-w-3xl border border-white/15 bg-surface p-7 sm:p-12 lg:p-16"
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Cali / Central · Signal interrupted
            </p>
            <h1
              id="global-error-heading"
              className="mt-6 text-balance font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl"
            >
              The site could not be loaded.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted">
              Try again. If the interruption continues, return to the home
              page later. Private diagnostics are not displayed.
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
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
