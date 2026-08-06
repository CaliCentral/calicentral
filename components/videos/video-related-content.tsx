import Link from "next/link";
import type { ReactNode } from "react";

import { AthleteCard } from "@/components/athletes/athlete-card";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { StoryCard } from "@/components/stories/story-card";
import { VideoCard } from "@/components/videos/video-card";
import { Container } from "@/components/ui/container";
import type { Article } from "@/types/article";
import type { Athlete } from "@/types/athlete";
import type { Competition } from "@/types/competition";
import type { MediaFeature } from "@/types/video";

type VideoRelatedContentProps = {
  readonly athletes: readonly Athlete[];
  readonly competitions: readonly Competition[];
  readonly stories: readonly Article[];
  readonly videos: readonly MediaFeature[];
};

export function VideoRelatedContent({
  athletes,
  competitions,
  stories,
  videos,
}: VideoRelatedContentProps) {
  if (
    athletes.length === 0 &&
    competitions.length === 0 &&
    stories.length === 0 &&
    videos.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="video-related-heading"
      className="border-t border-white/10 bg-canvas py-14 sm:py-18 lg:py-22"
    >
      <Container>
        <div className="flex flex-col gap-5 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              Connected archive / Explicit relationships
            </p>
            <h2
              id="video-related-heading"
              className="mt-4 text-balance font-display text-4xl font-black uppercase leading-none tracking-[-0.055em] text-ink sm:text-5xl"
            >
              Continue beyond the frame.
            </h2>
          </div>
          <Link
            href="/videos"
            className="inline-flex min-h-11 items-center gap-3 self-start font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:self-auto"
          >
            Explore every video
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {athletes.length > 0 ? (
          <RelatedSection label="Related athlete files">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {athletes.map((athlete) => (
                <AthleteCard key={athlete.slug} athlete={athlete} compact />
              ))}
            </div>
          </RelatedSection>
        ) : null}

        {competitions.length > 0 ? (
          <RelatedSection label="Related competition records">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {competitions.map((competition) => (
                <CompetitionCard
                  key={competition.slug}
                  competition={competition}
                />
              ))}
            </div>
          </RelatedSection>
        ) : null}

        {stories.length > 0 ? (
          <RelatedSection label="Related editorial stories">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, index) => (
                <StoryCard
                  key={story.slug}
                  article={story}
                  index={index + 1}
                  showArtwork={false}
                />
              ))}
            </div>
          </RelatedSection>
        ) : null}

        {videos.length > 0 ? (
          <RelatedSection label="Related archive records">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.slug} video={video} />
              ))}
            </div>
          </RelatedSection>
        ) : null}
      </Container>
    </section>
  );
}

function RelatedSection({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="mt-10 border-t border-white/12 pt-8 first:border-t-0 first:pt-0">
      <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}
