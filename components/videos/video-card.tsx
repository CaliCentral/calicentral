import Link from "next/link";

import { videoStatusLabels } from "@/components/videos/video-labels";
import { VideoVisual } from "@/components/videos/video-visual";
import type { MediaFeature } from "@/types/video";

type VideoCardProps = {
  readonly video: MediaFeature;
};

export function VideoCard({ video }: VideoCardProps) {
  return (
    <article className="group relative flex h-full flex-col border border-white/15 bg-canvas transition-colors hover:border-accent/60">
      <Link
        href={`/videos/${video.slug}`}
        aria-label={`Open the archive record for ${video.title}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="sr-only">View video archive record</span>
      </Link>

      <VideoVisual
        title={video.title}
        episodeNumber={video.episodeNumber}
        duration={video.duration}
        frameCode={video.frameCode}
        posterLabel={video.posterLabel}
        variant={video.visualVariant}
        image={video.image}
        compact
      />

      <div className="flex flex-1 flex-col border-t border-white/12 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {video.seriesTitle}
          </p>
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
            Episode / {video.episodeNumber}
          </span>
        </div>
        <h3 className="mt-3 text-balance font-display text-2xl font-black uppercase leading-[1.01] tracking-[-0.04em] text-ink transition-colors group-hover:text-accent sm:text-3xl">
          {video.title}
        </h3>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
          {video.summary}
        </p>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-2">
            <span className="border border-white/15 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/80">
              {video.category}
            </span>
            <span className="border border-white/15 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/80">
              {video.format}
            </span>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/12 pt-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
            <span>{videoStatusLabels[video.status]} / No playback</span>
            <span className="text-ink transition-transform group-hover:translate-x-1">
              View record →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
