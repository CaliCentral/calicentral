import { AthleteVisual } from "@/components/athletes/athlete-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { CategoryLabel } from "@/components/ui/category-label";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import {
  athleteCategoryLabel,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

type AthleteSpotlightSectionProps = {
  readonly athlete: Athlete | null;
};

export function AthleteSpotlightSection({
  athlete,
}: AthleteSpotlightSectionProps) {
  if (!athlete) {
    return (
      <section
        id="athlete-spotlight"
        className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20"
      >
        <Container>
          <ContentEmptyState
            title="No athlete spotlight is published"
            description="The athlete desk is preparing its next public profile."
          />
        </Container>
      </section>
    );
  }

  const isPrototype = /fictional|prototype|sample/i.test(
    `${athlete.status} ${athlete.profileLabel}`,
  );
  const facts = [
    { label: "Training base", value: athlete.trainingBase },
    {
      label: "Primary category",
      value: athleteCategoryLabel(athlete.primaryCategory),
    },
    {
      label: "Specialties",
      value: athlete.specialties.map(athleteSpecialtyLabel).join(" / "),
    },
    { label: "Signature", value: athlete.style },
    { label: "Profile status", value: athlete.profileLabel || athlete.status },
  ].filter((fact) => Boolean(fact.value));

  return (
    <section
      id="athlete-spotlight"
      aria-labelledby="athlete-heading"
      className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
    >
      <Container>
        <div className="mb-6 flex items-center justify-between border-t border-on-light/20 pt-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-dark">
          <span>Section 04 / Athlete file</span>
          <span className="hidden sm:inline">Profile study / 001</span>
        </div>

        <div className="grid overflow-hidden border border-on-light/25 bg-canvas text-ink shadow-[0_28px_80px_rgba(0,0,0,0.18)] lg:grid-cols-[minmax(22rem,0.86fr)_minmax(0,1.14fr)]">
          <AthleteVisual
            athlete={athlete}
            className="border-b border-white/15 lg:min-h-full lg:border-b-0 lg:border-r"
          />

          <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14">
            <div>
              <CategoryLabel inverted>
                {isPrototype
                  ? "Fictional athlete profile"
                  : athlete.profileLabel || "Published athlete profile"}
              </CategoryLabel>
              <h2
                id="athlete-heading"
                className="mt-5 text-balance font-display text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-ink sm:text-6xl xl:text-7xl"
              >
                {athlete.name}
              </h2>
              <p className="mt-4 max-w-xl font-mono text-xs font-bold uppercase leading-5 tracking-[0.15em] text-accent-strong">
                {athleteCategoryLabel(athlete.primaryCategory)} /{" "}
                {formatGlobalLocation(athlete) || "Location not published"}
              </p>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted">
                {athlete.shortBio}
              </p>
              <blockquote className="mt-8 border-l-4 border-accent pl-5 text-xl font-bold leading-8 tracking-[-0.025em] text-ink sm:text-2xl">
                “{athlete.quote}”
              </blockquote>
              <ButtonLink
                href={`/athletes/${athlete.slug}`}
                className="mt-8 w-full sm:w-auto"
              >
                View athlete profile
              </ButtonLink>
            </div>

            <dl className="mt-10 grid grid-cols-2 border-l border-t border-white/15 sm:grid-cols-4">
              {facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className="min-w-0 border-b border-r border-white/15 p-4"
                >
                  <dt className="font-mono text-xs font-bold uppercase leading-4 tracking-[0.13em] text-muted">
                    {String(index + 1).padStart(2, "0")} / {fact.label}
                  </dt>
                  <dd className="mt-2 text-sm font-bold leading-5 text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
