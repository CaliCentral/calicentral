import type { Metadata } from "next";

import { MediaDiscover } from "@/components/videos/media-discover";
import { getVideosPageData } from "@/lib/content";
import { featureConfig } from "@/lib/features/config";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPublicMetadata({
    path: "/videos",
    title: "Calisthenics media — Discover worldwide",
    description:
      "Discover worldwide calisthenics media with visible source attribution, platform-specific metrics, and Cali Central editorial context.",
    socialTitle: "Media discover — Cali Central",
  }),
  keywords: [
    "calisthenics media",
    "calisthenics videos",
    "athlete features",
    "competition media",
  ],
};

export default async function VideosPage() {
  const { videos, featuredVideo } = await getVideosPageData();
  const discoverVideos = [...videos].sort((a, b) =>
    b.publishedDate.localeCompare(a.publishedDate),
  );

  return (
    <MediaDiscover
      videos={discoverVideos}
      featuredVideo={featuredVideo}
      videoSubmissionsEnabled={featureConfig.videoSubmissions}
    />
  );
}
