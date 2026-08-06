import Link from "next/link";

import { videoStatusLabels } from "@/components/videos/video-labels";
import { VideoVisual } from "@/components/videos/video-visual";
import { Container } from "@/components/ui/container";
import type { MediaFeature } from "@/types/video";

type VideoHeroProps = {
  readonly video: MediaFeature;
};

export function VideoHero({ video }: VideoHeroProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-canvas text-ink">
      <Container className="py-10 sm:py-14 lg:py-18">
        <Link
          href="/videos"
          className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span>
          Media discover
        </Link>

        <div className="mt-7 grid overflow-hidden border border-white/15 lg:grid-cols-[minmax(0,0.93fr)_minmax(25rem,1.07fr)]">
          <div className="relative flex min-h-[31rem] min-w-0 flex-col justify-between bg-surface p-6 sm:p-9 lg:min-h-[37rem] lg:p-11">
            <div
              aria-hidden="true"
              className="absolute right-3 top-0 font-mono text-[clamp(7rem,17vw,14rem)] font-black leading-none tracking-[-0.14em] text-white/[0.035]"
            >
              {video.episodeNumber.replace(/\D/g, "").slice(-2)}
            </div>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Archive file / {video.episodeNumber}
                </p>
                <span className="border border-white/20 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink">
                  {videoStatusLabels[video.status]}
                </span>
              </div>
              <p className="mt-12 font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
                {video.seriesTitle} · {video.format}
              </p>
              <h1 className="mt-4 max-w-[12ch] text-balance font-display text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.85] tracking-[-0.07em] text-ink">
                {video.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {video.summary}
              </p>
            </div>

            <div className="relative mt-10">
              <ul className="flex flex-wrap gap-2" aria-label="Archive tags">
                {video.tags.slice(0, 4).map((tag) => (
                  <li
                    key={tag}
                    className="border border-white/20 px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/15 pt-5 font-mono text-xs font-bold uppercase leading-6 tracking-[0.13em] text-muted">
                {video.availabilityLabel}
                <br />
                Static editorial preview / No playback
              </p>
            </div>
          </div>

          <div className="grid min-w-0 grid-rows-[1fr_auto]">
            <VideoVisual
              title={video.title}
              episodeNumber={video.episodeNumber}
              duration={video.duration}
              frameCode={video.frameCode}
              posterLabel={video.posterLabel}
              variant={video.visualVariant}
              image={video.image}
              priority
            />
            <dl className="grid grid-cols-3 gap-px border-t border-white/15 bg-white/15">
              {[
                ["Runtime", video.duration],
                ["Category", video.category],
                ["Published", video.publishedDateDisplay],
              ].map(([label, value]) => (
                <div key={label} className="bg-canvas p-3 sm:p-5">
                  <dt className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted sm:text-[0.65rem]">
                    {label}
                  </dt>
                  <dd className="mt-2 text-xs font-bold uppercase leading-5 text-ink sm:text-sm">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </header>
  );
}
