import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/ui/container";
import type { FooterGroup } from "@/types/content";

type SiteFooterProps = {
  readonly groups: readonly FooterGroup[];
  readonly prototypeNotice: string;
  readonly footerStatement: string;
};

const policyLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
] as const;

export function SiteFooter({
  groups,
  prototypeNotice,
  footerStatement,
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-ink/10 bg-canvas text-ink">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent to-accent-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(243,241,236,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(243,241,236,0.03)_1px,transparent_1px)] [background-size:4rem_4rem]"
      />

      <Container className="relative py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-3 border-b border-ink/15 pb-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-ink">
            <span className="size-1.5 rounded-full bg-accent" />
            Signal / Field / Frame
          </span>
          <span>Independent desk · Worldwide view</span>
        </div>

        <div className="grid gap-12 border-b border-ink/15 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(9rem,0.45fr))]">
          <div className="md:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="Cali Central home"
              className="group inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <BrandMark size="large" />
            </Link>

            <p className="mt-8 max-w-xl text-2xl font-black uppercase leading-[1.08] tracking-[-0.045em] text-ink sm:text-3xl">
              Independent reporting for a sport in motion.
            </p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted sm:text-base">
              Independent coverage of calisthenics culture, athletes,
              competition, and the movement shaping the sport worldwide.
            </p>
            <p className="mt-6 inline-flex border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {prototypeNotice}
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h2 className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted">
                <span aria-hidden="true" className="h-px w-5 bg-accent" />
                {group.title}
              </h2>
              <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex min-h-12 items-center justify-between text-sm font-bold uppercase tracking-[0.04em] text-ink/80 transition-colors hover:text-accent focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className="text-xs text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="pt-7 font-mono text-xs uppercase leading-5 tracking-[0.12em] text-muted">
          <nav aria-label="Policy links">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p>© {currentYear} Cali Central. All rights reserved.</p>
            <p className="text-ink/70">
              {footerStatement}
            </p>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="mt-10 whitespace-nowrap border-t border-ink/10 pt-8 text-center text-[clamp(2.25rem,8.6vw,8rem)] font-black uppercase leading-none tracking-[-0.085em] text-ink"
        >
          Cali<span className="text-accent">/</span>Central
        </p>
      </Container>
    </footer>
  );
}
