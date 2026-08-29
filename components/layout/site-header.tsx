import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavigationSessionIsland } from "@/components/layout/navigation-session-island";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/90 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/80">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-accent via-accent/20 to-transparent"
      />

      <Container className="relative flex h-[4.5rem] items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            aria-label="Cali Central home"
            className="group inline-flex shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <BrandMark />
          </Link>

          <span
            aria-hidden="true"
            className="hidden border-l border-ink/15 pl-5 font-mono text-xs font-medium uppercase leading-[1.45] tracking-[0.18em] text-muted 2xl:block"
          >
            Independent
            <br />
            Calisthenics media
          </span>
        </div>

        <div className="flex shrink-0 items-center">
          <NavigationSessionIsland />
        </div>
      </Container>
    </header>
  );
}
