import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Container } from "@/components/ui/container";
import { navigationItems } from "@/data/homepage";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/95 backdrop-blur-sm">
      <Container className="relative flex h-[4.5rem] items-center justify-between">
        <Link
          href="/"
          aria-label="Cali Central home"
          className="group inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center bg-ink text-[0.67rem] font-black tracking-[-0.08em] text-canvas transition-colors group-hover:bg-rust"
          >
            CC
          </span>
          <span className="text-base font-black uppercase leading-none tracking-[-0.04em] text-ink sm:text-lg">
            Cali <span className="text-rust">Central</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden lg:block">
          <ul className="flex items-center gap-1 lg:gap-2">
            {navigationItems.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={index === 0 ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center px-3 text-[0.78rem] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:px-4 ${
                    index === 0
                      ? "text-rust"
                      : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNavigation items={navigationItems} />
      </Container>
    </header>
  );
}
