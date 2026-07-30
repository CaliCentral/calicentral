import { AthleteSpotlightSection } from "@/components/home/athlete-spotlight-section";
import { CompetitionsSection } from "@/components/home/competitions-section";
import { FeaturedStorySection } from "@/components/home/featured-story-section";
import { HeroSection } from "@/components/home/hero-section";
import { RankingsPreviewSection } from "@/components/home/rankings-preview-section";
import { VideosSection } from "@/components/home/videos-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedStorySection />
      <VideosSection />
      <CompetitionsSection />
      <AthleteSpotlightSection />
      <RankingsPreviewSection />
    </>
  );
}
