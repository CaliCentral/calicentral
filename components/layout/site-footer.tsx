import Link from "next/link";

import { Container } from "@/components/ui/container";
import { footerGroups } from "@/data/homepage";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-canvas">
      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 border-b border-white/15 pb-12 sm:pb-16 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(10rem,0.5fr))]">
          <div>
            <Link
              href="/"
              aria-label="Cali Central home"
              className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center bg-accent text-[0.7rem] font-black tracking-[-0.08em] text-ink"
              >
                CC
              </span>
              <span className="text-xl font-black uppercase tracking-[-0.045em]">
                Cali Central
              </span>
            </Link>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
              Independent coverage of calisthenics culture, athletes, and
              competition—from California to the global stage.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-accent">
              Public prototype · Sample content
            </p>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                {group.title}
              </h2>
              <ul className="mt-5 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-white/80 transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs leading-5 text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Cali Central. All rights reserved.</p>
          <p>Built for the movement. Published with purpose.</p>
        </div>
      </Container>
    </footer>
  );
}
