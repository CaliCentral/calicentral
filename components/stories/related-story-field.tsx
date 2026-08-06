import Link from "next/link";

import { AthleteCard } from "@/components/athletes/athlete-card";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { Container } from "@/components/ui/container";
import { VideoCard } from "@/components/videos/video-card";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { MediaFeature } from "@/types/video";

type RelatedStoryFieldProps = {
  readonly athletes: readonly Athlete[];
  readonly competitions: readonly Competition[];
  readonly videos: readonly MediaFeature[];
};

export function RelatedStoryField({
  athletes,
  competitions,
  videos,
}: RelatedStoryFieldProps) {
  if (
    athletes.length === 0 &&
    competitions.length === 0 &&
    videos.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-story-field-heading"
      className="border-t border-white/10 bg-surface-2 py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <div className="flex flex-col gap-5 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              From the event desk / Prototype field
            </p>
            <h2
              id="related-story-field-heading"
              className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl"
            >
              Related field records
            </h2>
          </div>
          <Link
            href="/competitions"
            className="inline-flex min-h-11 items-center gap-3 self-start font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:self-auto"
          >
            Explore the event field
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {athletes.length > 0 ? (
          <div className="mt-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
              Related athlete files
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {athletes.map((athlete) => (
                <AthleteCard key={athlete.slug} athlete={athlete} compact />
              ))}
            </div>
          </div>
        ) : null}

        {competitions.length > 0 ? (
          <div className="mt-12 border-t border-white/12 pt-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
              Competition records
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <CompetitionCard
                  key={competition.slug}
                  competition={competition}
                />
              ))}
            </div>
          </div>
        ) : null}

        {videos.length > 0 ? (
          <div className="mt-12 border-t border-white/12 pt-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
              Video archive records
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.slug} video={video} />
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-7 max-w-3xl text-xs leading-5 text-muted">
          These linked events and media records are fictional prototype
          content. Media previews are static and provide no playback.
        </p>
      </Container>
    </section>
  );
}
