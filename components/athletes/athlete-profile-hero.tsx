import Link from "next/link";

import { AthleteVisual } from "@/components/athletes/athlete-visual";
import { ContentImage } from "@/components/content/content-image";
import { Container } from "@/components/ui/container";
import {
  athleteCategoryLabel,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

type AthleteProfileHeroProps = {
  readonly athlete: Athlete;
};

export function AthleteProfileHero({ athlete }: AthleteProfileHeroProps) {
  const location = formatGlobalLocation(athlete);
  const metadata = [
    { label: "Profile status", value: athlete.status },
    { label: "Location", value: location },
    {
      label: "Primary category",
      value: athleteCategoryLabel(athlete.primaryCategory),
    },
    { label: "Years active", value: athlete.yearsActive },
  ].filter((item) => Boolean(item.value));
  const identityLabel =
    athlete.verification.identityStatus === "profile-control-confirmed"
      ? "Profile control confirmed"
      : "Identity not verified";
  const profileReviewLabel =
    athlete.verification.profileStatus === "approved"
      ? "Editorial profile approved"
      : "Profile not reviewed";

  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-canvas">
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      {athlete.coverImage ? (
        <div className="relative h-56 border-b border-white/10 sm:h-72 lg:h-96">
          <ContentImage
            image={athlete.coverImage}
            sizes="100vw"
            priority
            showDetails
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/35 to-transparent" />
        </div>
      ) : null}
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
              {athleteCategoryLabel(athlete.primaryCategory)}
              {athlete.specialties.length > 0
                ? ` / ${athlete.specialties
                    .map(athleteSpecialtyLabel)
                    .join(" / ")}`
                : ""}
            </p>
            {athlete.shortBio ? (
              <p className="mt-7 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
                {athlete.shortBio}
              </p>
            ) : null}

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

            <div className="mt-6 flex flex-wrap gap-3" aria-label="Verification status">
              <span className="border border-white/20 bg-surface-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
                {identityLabel}
              </span>
              <span className="border border-white/20 bg-surface-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
                {profileReviewLabel}
              </span>
              <Link
                href="/verification"
                className="inline-flex min-h-10 items-center px-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                What these labels mean
              </Link>
            </div>
          </div>

          <AthleteVisual
            athlete={athlete}
            priority={!athlete.coverImage}
            className="min-h-[23rem] sm:min-h-[31rem] lg:min-h-[43rem]"
          />
        </div>
      </Container>
    </header>
  );
}
