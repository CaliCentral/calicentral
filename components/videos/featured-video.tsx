import Link from "next/link";

import { VideoVisual } from "@/components/videos/video-visual";
import { Container } from "@/components/ui/container";
import type { MediaFeature } from "@/types/video";

type FeaturedVideoProps = {
  readonly video: MediaFeature;
};

export function FeaturedVideo({ video }: FeaturedVideoProps) {
  return (
    <section
      aria-labelledby="featured-video-heading"
      className="border-b border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
    >
      <Container>
        <div className="grid overflow-hidden border border-white/15 lg:grid-cols-[1.08fr_0.92fr]">
          <VideoVisual
            title={video.title}
            episodeNumber={video.episodeNumber}
            duration={video.duration}
            frameCode={video.frameCode}
            posterLabel={video.posterLabel}
            variant={video.visualVariant}
            image={video.image}
          />
          <div className="flex flex-col bg-canvas p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Featured archive record
              </p>
              <span className="border border-white/20 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink">
                {video.episodeNumber}
              </span>
            </div>
            <p className="mt-10 font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
              {video.seriesTitle} · {video.category}
            </p>
            <h2
              id="featured-video-heading"
              className="mt-4 max-w-xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
            >
              {video.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              {video.summary}
            </p>

            <dl className="mt-8 grid gap-px border border-white/12 bg-white/12 sm:grid-cols-3">
              {[
                ["Format", video.format],
                ["Runtime", video.duration],
                ["Location", video.location],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface p-4">
                  <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm font-bold uppercase leading-5 text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto flex flex-col gap-4 pt-8 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
              <Link
                href={`/videos/${video.slug}`}
                className="clip-corner inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Open archive record
                <span aria-hidden="true">→</span>
              </Link>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                Static preview / No playback
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
