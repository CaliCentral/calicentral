"use client";

import Link from "next/link";

export default function AccountError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="technical-grid min-h-[calc(100vh-10rem)] px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl border border-rose-300/35 bg-surface p-6 sm:p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
          Account data / Unavailable
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.035em] text-ink">
          The secure account record could not be loaded
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          No change was made. Check the operational Sanity configuration or try
          this request again. Private diagnostics are not displayed here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center border border-white/25 px-5 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}
