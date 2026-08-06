import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/ui/container";
import { publicRobotsMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = {
  title: {
    absolute: "Page not found | Cali Central",
  },
  description: "The requested Cali Central page could not be found.",
  robots: publicRobotsMetadata(true),
};

const destinations = [
  { label: "Stories", href: "/stories" },
  { label: "Athletes", href: "/athletes" },
  { label: "Competitions", href: "/competitions" },
  { label: "Videos", href: "/videos" },
] as const;

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="technical-grid relative grid min-h-screen place-items-center overflow-hidden bg-canvas py-16 text-ink"
    >
      <Container className="relative">
        <section
          aria-labelledby="not-found-heading"
          className="mx-auto max-w-4xl border border-white/15 bg-surface/95 p-7 sm:p-12 lg:p-16"
        >
          <Link
            href="/"
            aria-label="Cali Central home"
            className="group inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <BrandMark size="large" />
          </Link>

          <p className="mt-12 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Signal lost / 404
          </p>
          <h1
            id="not-found-heading"
            className="mt-5 text-balance font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] sm:text-7xl lg:text-8xl"
          >
            This page is outside the frame.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            The address may be incomplete, or the page may have moved.
            Rejoin Cali Central through one of the live sections below.
          </p>

          <div className="mt-9">
            <Link
              href="/"
              className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Return home
              <span aria-hidden="true" className="ml-3">
                →
              </span>
            </Link>
          </div>

          <nav
            aria-label="Explore Cali Central"
            className="mt-10 border-t border-white/15 pt-6"
          >
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {destinations.map((destination) => (
                <li key={destination.href}>
                  <Link
                    href={destination.href}
                    className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {destination.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </Container>
    </main>
  );
}
