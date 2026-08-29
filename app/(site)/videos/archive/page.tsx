import type { Metadata } from "next";
import Link from "next/link";

import { FeaturedVideo } from "@/components/videos/featured-video";
import { VideoArchive } from "@/components/videos/video-archive";
import { VideoArchiveHero } from "@/components/videos/video-archive-hero";
import { VideoSeriesOverview } from "@/components/videos/video-series-overview";
import { Container } from "@/components/ui/container";
import { getVideosPageData } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPublicMetadata({
    path: "/videos/archive",
    title: "Video archive — Cali Central",
    description:
      "Search Cali Central's structured global archive of technique studies, competition media, field reports, and athlete features.",
    socialTitle: "Video archive — Cali Central",
  }),
  keywords: [
    "calisthenics video archive",
    "calisthenics media",
    "technique studies",
    "competition coverage",
  ],
};

function formatTotalRuntime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}H ${String(minutes).padStart(2, "0")}M` : `${minutes}M`;
}

export default async function VideoArchivePage() {
  const {
    videos,
    series: videoSeries,
    featuredVideo,
  } = await getVideosPageData();
  const categoryCount = new Set(videos.map((video) => video.category)).size;
  const totalRuntimeSeconds = videos.reduce(
    (total, video) => total + video.durationSeconds,
    0,
  );

  return (
    <>
      <VideoArchiveHero
        episodeCount={videos.length}
        seriesCount={videoSeries.length}
        categoryCount={categoryCount}
        totalRuntime={formatTotalRuntime(totalRuntimeSeconds)}
      />

      <div className="border-b border-white/10 bg-canvas">
        <Container>
          <nav
            aria-label="Video views"
            className="flex flex-wrap gap-3 py-5"
          >
            <Link
              href="/videos"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Discover
            </Link>
            <Link
              href="/videos/archive"
              aria-current="page"
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Archive
            </Link>
          </nav>
        </Container>
      </div>

      {featuredVideo ? <FeaturedVideo video={featuredVideo} /> : null}

      <VideoSeriesOverview series={videoSeries} videos={videos} />

      <section
        aria-labelledby="all-videos-heading"
        className="technical-grid bg-canvas py-14 sm:py-18 lg:py-24"
      >
        <Container>
          <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Complete archive / Search the frame
              </p>
              <h2
                id="all-videos-heading"
                className="mt-4 text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
              >
                Every media record.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Search titles and tags, filter by editorial lens, and sort the
              full archive by episode, date, or runtime.
            </p>
          </div>

          <VideoArchive videos={videos} />

          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-xs leading-5 text-muted">
            Prototype records remain clearly labelled. Static artwork does not
            imply that a playable file or third-party embed is available.
          </p>
        </Container>
      </section>
    </>
  );
}
