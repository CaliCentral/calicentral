import type { Metadata } from "next";

import { FeaturedVideo } from "@/components/videos/featured-video";
import { VideoArchive } from "@/components/videos/video-archive";
import { VideoArchiveHero } from "@/components/videos/video-archive-hero";
import { VideoSeriesOverview } from "@/components/videos/video-series-overview";
import { Container } from "@/components/ui/container";
import { getVideosPageData } from "@/lib/content";
import { createPublicMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = {
  ...createPublicMetadata({
    path: "/videos",
    title: "Videos — Fictional media archive",
    description:
      "Explore Cali Central's fictional archive of static technique studies, competition diaries, field reports, and athlete profile records.",
    socialTitle: "Videos — Cali Central",
  }),
  keywords: [
    "calisthenics video archive",
    "fictional media prototype",
    "technique studies",
    "competition diaries",
  ],
};

function formatTotalRuntime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}H ${String(minutes).padStart(2, "0")}M` : `${minutes}M`;
}

export default async function VideosPage() {
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
              full fictional archive by episode, date, or runtime.
            </p>
          </div>

          <VideoArchive videos={videos} />

          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-xs leading-5 text-muted">
            Every title, episode, transcript, credit, location, and production
            detail is fictional prototype content. Preview artwork is static;
            there are no video files, players, controls, or playback links.
          </p>
        </Container>
      </section>
    </>
  );
}
