import { SectionHeading } from "@/components/home/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { VideoCard } from "@/components/videos/video-card";
import type { MediaFeature } from "@/types/video";

type VideosSectionProps = {
  readonly videos: readonly MediaFeature[];
};

export function VideosSection({ videos }: VideosSectionProps) {
  return (
    <section
      id="videos"
      aria-labelledby="videos-heading"
      className="bg-surface py-16 text-ink sm:py-20 lg:py-24"
    >
      <Container>
        <SectionHeading
          headingId="videos-heading"
          eyebrow="Watch / Preview archive"
          title="Movement, slowed down"
          description="Short-form visual stories focused on technique, preparation, and the communities built around every session."
          index="02"
        />

        {videos.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.slug} video={video} />
            ))}
          </div>
        ) : (
          <ContentEmptyState
            title="No media records are published"
            description="The media desk has not published any preview records yet."
          />
        )}

        <div className="mt-8 flex flex-col gap-6 border-t border-white/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs leading-5 text-muted">
            Video titles, episodes, credits, and preview frames are fictional.
            Every preview is static and non-interactive; playback is
            unavailable.
          </p>
          <ButtonLink href="/videos" variant="outline">
            Explore the media archive
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
