import Link from "next/link";

import { AthleteVisual } from "@/components/athletes/athlete-visual";
import { Container } from "@/components/ui/container";
import type { Athlete } from "@/types/athlete";

type AthleteProfileHeroProps = {
  readonly athlete: Athlete;
};

export function AthleteProfileHero({ athlete }: AthleteProfileHeroProps) {
  const metadata = [
    { label: "Profile status", value: athlete.status },
    { label: "Field base", value: `${athlete.city}, ${athlete.state}` },
    { label: "Region file", value: athlete.region },
    { label: "Years active", value: athlete.yearsActive },
  ] as const;

  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-canvas">
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      <Container className="relative py-10 sm:py-14 lg:py-18">
        <nav
          aria-label="Athlete breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em]"
        >
          <Link
            href="/athletes"
            className="text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Athletes
          </Link>
          <span aria-hidden="true" className="text-accent">
            /
          </span>
          <span className="text-accent">{athlete.disciplineCode}</span>
        </nav>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.68fr)] lg:items-end lg:gap-12">
          <div className="min-w-0 pb-2">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              <span aria-hidden="true" className="h-1 w-7 bg-accent" />
              Athlete file / {athlete.profileNumber}
            </p>
            <h1 className="mt-7 max-w-5xl text-balance font-display text-[clamp(3rem,8vw,8rem)] font-black uppercase leading-[0.8] tracking-[-0.075em] text-ink">
              {athlete.name}
            </h1>
            <p className="mt-6 font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-accent">
              {athlete.primaryDiscipline}
              {athlete.secondaryDiscipline
                ? ` / ${athlete.secondaryDiscipline}`
                : ""}
            </p>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {athlete.shortBio}
            </p>

            <div className="mt-9 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-4">
              {metadata.map((item) => (
                <div key={item.label} className="min-w-0 bg-surface p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.11em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-5 text-ink">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {athlete.ranking ? (
              <div className="mt-6 flex flex-wrap items-end gap-5 border-l-4 border-accent bg-surface-2 p-5">
                <span className="font-mono text-6xl font-black leading-none tracking-[-0.08em] text-accent sm:text-7xl">
                  {String(athlete.ranking.rank).padStart(2, "0")}
                </span>
                <div className="pb-1">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    Current sample rank
                  </p>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {athlete.ranking.categoryTitle} · {athlete.ranking.points} pts
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-muted">
                    {athlete.ranking.movement.label} · Prototype / Not official
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-6 border-l-4 border-accent bg-surface-2 p-5 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted">
                Ranking status / Not listed in this prototype issue
              </p>
            )}
          </div>

          <AthleteVisual
            athlete={athlete}
            priority
            className="min-h-[23rem] sm:min-h-[31rem] lg:min-h-[43rem]"
          />
        </div>
      </Container>
    </header>
  );
}
