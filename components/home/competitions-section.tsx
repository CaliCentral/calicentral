import { CompetitionCard } from "@/components/competitions/competition-card";
import { SectionHeading } from "@/components/home/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import type { Competition } from "@/types/competition";

type CompetitionsSectionProps = {
  readonly competitions: readonly Competition[];
};

export function CompetitionsSection({
  competitions,
}: CompetitionsSectionProps) {
  return (
    <section
      id="competitions"
      aria-labelledby="competitions-heading"
      className="technical-grid bg-canvas py-16 text-ink sm:py-20 lg:py-24"
    >
      <Container>
        <SectionHeading
          headingId="competitions-heading"
          eyebrow="Competition calendar"
          title="Next on the floor"
          description="A first look at the event directory Cali Central is building for athletes, organizers, and spectators."
          index="03"
        />

        {competitions.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {competitions.map((competition) => (
              <CompetitionCard
                key={competition.slug}
                competition={competition}
              />
            ))}
          </div>
        ) : (
          <ContentEmptyState
            title="No competitions are published"
            description="The competition desk has not published an upcoming event record yet."
          />
        )}

        <div className="mt-8 flex flex-col gap-6 border-t border-white/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs leading-5 text-muted">
            All event names, dates, divisions, participants, and locations are
            fictional sample content. No registration is available.
          </p>
          <ButtonLink href="/competitions" variant="outline">
            Explore every competition
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
