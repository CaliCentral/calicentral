import Link from "next/link";

import { Container } from "@/components/ui/container";
import { FeaturedVideo } from "@/components/videos/featured-video";
import { VideoCard } from "@/components/videos/video-card";
import { VideoCategoryDiscovery } from "@/components/videos/video-category-discovery";
import type { MediaFeature } from "@/types/video";

type MediaDiscoverProps = {
  readonly videos: readonly MediaFeature[];
  readonly featuredVideo: MediaFeature | null;
  readonly videoSubmissionsEnabled: boolean;
};

const videoSubmissionHref =
  "/sign-in?callbackUrl=%2Faccount%2Fsubmissions%2Fnew%3Ftype%3DvideoSubmission";

export function MediaDiscover({
  videos,
  featuredVideo,
  videoSubmissionsEnabled,
}: MediaDiscoverProps) {
  const allVideos = featuredVideo
    ? [
        featuredVideo,
        ...videos.filter((video) => video.slug !== featuredVideo.slug),
      ]
    : videos;
  const latestVideos = videos
    .filter((video) => video.slug !== featuredVideo?.slug)
    .slice(0, 4);
  const originCount = new Set(allVideos.map((video) => video.origin)).size;
  const categoryCount = new Set(allVideos.map((video) => video.category)).size;

  return (
    <>
      <section className="technical-grid border-b border-white/10 bg-canvas pb-14 pt-12 sm:pb-18 sm:pt-16 lg:pb-22 lg:pt-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Videos / Discover
              </p>
              <h1 className="mt-5 max-w-5xl text-balance font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-ink sm:text-7xl lg:text-8xl">
                Calisthenics in motion.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Curated originals, accepted community submissions, and
                attributed external sources—each with its origin kept clear.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {videoSubmissionsEnabled ? (
                  <Link
                    href={videoSubmissionHref}
                    className="clip-corner inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    Submit video for review
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex min-h-12 items-center border border-white/15 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted"
                  >
                    Video intake currently closed
                  </span>
                )}
                <Link
                  href="/videos/archive"
                  className="inline-flex min-h-12 items-center justify-center border border-white/20 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Search the archive
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px border border-white/15 bg-white/15 lg:grid-cols-1">
              {[
                ["Records", String(allVideos.length).padStart(2, "0")],
                ["Origins", String(originCount).padStart(2, "0")],
                ["Categories", String(categoryCount).padStart(2, "0")],
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

      {featuredVideo ? (
        <FeaturedVideo
          video={featuredVideo}
          eyebrow="Featured / Editorial selection"
          actionLabel="Open featured record"
        />
      ) : null}

      <section
        aria-labelledby="latest-videos-heading"
        className="bg-surface py-14 sm:py-18 lg:py-24"
      >
        <Container>
          <div className="mb-8 grid gap-4 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-10">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Latest / Date ordered
              </p>
              <h2
                id="latest-videos-heading"
                className="mt-4 font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
              >
                New from the desk.
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Supporting records are ordered by publication date. Popularity or
              trend claims appear only when verified metrics exist.
            </p>
          </div>

          {latestVideos.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {latestVideos.map((video) => (
                <VideoCard key={video.slug} video={video} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/25 bg-canvas px-6 py-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Awaiting supporting records
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                Newly approved video records will appear here after editorial
                publication.
              </p>
            </div>
          )}
        </Container>
      </section>

      {allVideos.length > 0 ? (
        <section
          aria-labelledby="video-category-heading"
          className="technical-grid border-t border-white/10 bg-canvas py-14 sm:py-18 lg:py-24"
        >
          <Container>
            <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                  Categories / Find your line
                </p>
                <h2
                  id="video-category-heading"
                  className="mt-4 text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
                >
                  Discover by discipline and story.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                These editorial lenses use the current category, format, and tag
                taxonomy. Empty lenses stay visible without inventing content.
              </p>
            </div>

            <VideoCategoryDiscovery videos={allVideos} />
          </Container>
        </section>
      ) : (
        <section className="bg-canvas py-14 sm:py-18 lg:py-24">
          <Container>
            <div className="border border-dashed border-white/25 bg-surface px-6 py-14 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                No videos published
              </p>
              <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink">
                The discovery library is awaiting approved records.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                Submissions remain separate from publication and appear only
                after editorial review.
              </p>
            </div>
          </Container>
        </section>
      )}

      <section className="border-y border-white/10 bg-accent py-10 text-canvas sm:py-12">
        <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-canvas/70">
              Community source / Editorial review
            </p>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-[-0.05em]">
              Have a video worth seeing?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-canvas/80">
              Eligible contributors can submit a public source for review.
              Approval never publishes a canonical video automatically.
            </p>
          </div>
          {videoSubmissionsEnabled ? (
            <Link
              href={videoSubmissionHref}
              className="inline-flex min-h-12 shrink-0 items-center justify-center border border-canvas bg-canvas px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-transparent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas"
            >
              Submit video
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-12 shrink-0 items-center justify-center border border-canvas/40 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas/75"
            >
              Intake currently closed
            </span>
          )}
        </Container>
      </section>
    </>
  );
}
