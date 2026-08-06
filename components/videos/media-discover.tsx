import Link from "next/link";

import { Container } from "@/components/ui/container";
import { MediaSource } from "@/components/videos/media-source";
import { VideoVisual } from "@/components/videos/video-visual";
import type { MediaFeature } from "@/types/video";

type MediaDiscoverProps = {
  readonly videos: readonly MediaFeature[];
};

export function MediaDiscover({ videos }: MediaDiscoverProps) {
  const attributedSourceCount = new Set(
    videos.flatMap((video) =>
      video.source ? [video.source.platform] : [],
    ),
  ).size;
  const metricCount = videos.reduce(
    (total, video) => total + (video.platformMetrics?.length ?? 0),
    0,
  );

  return (
    <>
      <section className="technical-grid border-b border-white/10 bg-canvas pb-14 pt-12 sm:pb-18 sm:pt-16 lg:pb-22 lg:pt-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Media / Discover worldwide
              </p>
              <h1 className="mt-5 max-w-5xl text-balance font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-ink sm:text-7xl lg:text-8xl">
                Calisthenics in motion.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Discover Cali Central originals and moderated external media
                records. Source ownership, original-post links, and each
                platform metric remain separate and visible when available.
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-px border border-white/15 bg-white/15 lg:grid-cols-1">
              {[
                ["Records", String(videos.length).padStart(2, "0")],
                ["Sources", String(attributedSourceCount).padStart(2, "0")],
                ["Metrics", String(metricCount).padStart(2, "0")],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface p-4">
                  <dt className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-black uppercase text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <nav
            aria-label="Video views"
            className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-5"
          >
            <Link
              href="/videos"
              aria-current="page"
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Discover
            </Link>
            <Link
              href="/videos/archive"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Archive
            </Link>
          </nav>
        </Container>
      </section>

      <section
        aria-labelledby="discover-feed-heading"
        className="bg-surface py-14 sm:py-18 lg:py-24"
      >
        <Container>
          <div className="mb-8 grid gap-4 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-10">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Latest / Editorial selection
              </p>
              <h2
                id="discover-feed-heading"
                className="mt-4 font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
              >
                Media discover.
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Static previews avoid automatically loading third-party embeds.
              Open the original source only when a moderated link is present.
            </p>
          </div>

          {videos.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {videos.map((video) => (
                <article
                  key={video.slug}
                  className="flex min-w-0 flex-col border border-white/15 bg-canvas"
                >
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
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      <span className="text-accent">{video.category}</span>
                      <time dateTime={video.publishedDate}>
                        {video.publishedDateDisplay}
                      </time>
                    </div>
                    <h3 className="mt-4 text-balance font-display text-3xl font-black uppercase leading-[0.96] tracking-[-0.045em] text-ink sm:text-4xl">
                      <Link
                        href={`/videos/${video.slug}`}
                        className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        {video.title}
                      </Link>
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      {video.discoverContext ?? video.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {video.relatedAthleteSlugs.length > 0 ? (
                        <span className="border border-white/15 px-2.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/80">
                          {video.relatedAthleteSlugs.length} athlete
                          {video.relatedAthleteSlugs.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {video.relatedCompetitionSlugs.length > 0 ? (
                        <span className="border border-white/15 px-2.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/80">
                          Competition linked
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-auto pt-6">
                      <MediaSource video={video} compact />
                      <Link
                        href={`/videos/${video.slug}`}
                        className="mt-5 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Open editorial record →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/25 bg-canvas px-6 py-14 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                No media published
              </p>
              <h3 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink">
                The discover feed is awaiting approved records.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                Media appears here only after editorial review and with source
                attribution where applicable.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
