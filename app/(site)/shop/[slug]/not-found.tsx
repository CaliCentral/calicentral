import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function ProductNotFound() {
  return (
    <section className="technical-grid grid min-h-[70vh] place-items-center bg-canvas py-24">
      <Container>
        <div className="mx-auto max-w-3xl border border-white/15 bg-surface p-7 sm:p-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Product record missing / 404
          </p>
          <h1 className="mt-6 text-balance font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] text-ink sm:text-7xl">
            This product is not published.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted">
            The record may be disabled, unpublished, discontinued, or unavailable
            at this URL.
          </p>
          <Link
            href="/shop"
            className="mt-9 inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Browse curated shop
          </Link>
        </div>
      </Container>
    </section>
  );
}
