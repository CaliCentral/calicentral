import type { Metadata } from "next";

import { AthleteSpotlightSection } from "@/components/home/athlete-spotlight-section";
import { CompetitionsSection } from "@/components/home/competitions-section";
import { FeaturedStorySection } from "@/components/home/featured-story-section";
import { HeroSection } from "@/components/home/hero-section";
import { JoinCommunitySection } from "@/components/home/join-community-section";
import { RankingsPreviewSection } from "@/components/home/rankings-preview-section";
import { VideosSection } from "@/components/home/videos-section";
import { getHomepageContent, getSiteSettings } from "@/lib/content";
import { siteStage } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings({ stega: false });
  const seo = settings.defaultSeo;
  const baseDescription =
    seo.description ?? settings.siteDescription;
  const description =
    siteStage === "production"
      ? baseDescription
      : `${baseDescription} Public prototype content is clearly labeled and fictional where noted.`;

  return createPublicMetadata({
    path: "/",
    title: seo.title ?? settings.siteTitle,
    description,
    socialImage: seo.image,
    noIndex: seo.noIndex,
    absoluteTitle: true,
  });
}

export default async function Home() {
  const content = await getHomepageContent();

  return (
    <>
      <HeroSection content={content.hero} />
      <FeaturedStorySection
        featuredStory={content.featuredStory}
        supportingStories={content.supportingStories}
      />
      <VideosSection videos={content.videos} />
      <CompetitionsSection competitions={content.competitions} />
      <AthleteSpotlightSection athlete={content.athlete} />
      <RankingsPreviewSection category={content.rankingCategory} />
      <JoinCommunitySection />
    </>
  );
}
