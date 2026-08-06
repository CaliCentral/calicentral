import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoHero } from "@/components/videos/video-hero";
import { VideoRecord } from "@/components/videos/video-record";
import { VideoRelatedContent } from "@/components/videos/video-related-content";
import { Container } from "@/components/ui/container";
import {
  getVideoPage,
  getVideoSlugs,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";

type VideoPageProps = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getVideoSlugs();

  return [...new Set(slugs.filter(isPublicSlug))].map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getVideoPage(slug, { stega: false });

  if (!pageData || !isPublicSlug(pageData.video.slug)) {
    return {
      title: "Video record not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const { video } = pageData;
  const title =
    video.seo?.title ?? `${video.title} — Fictional media record`;
  const description =
    video.seo?.description ??
    `${video.summary} A static, non-playable ${video.format.toLocaleLowerCase()} from the Cali Central prototype archive.`;
  const socialImage = video.seo?.image ?? video.image;

  const metadata = createPublicMetadata({
    path: `/videos/${video.slug}`,
    title,
    description,
    socialImage: socialImage
      ? {
          src: socialImage.src,
          width: socialImage.width,
          height: socialImage.height,
          alt: socialImage.alt,
        }
      : undefined,
    noIndex: video.seo?.noIndex,
  });

  return {
    ...metadata,
    keywords: [
      "calisthenics",
      "fictional media archive",
      video.seriesTitle,
      video.category,
      video.format,
      ...video.tags,
    ],
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: video.publishedDate,
    },
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const pageData = await getVideoPage(slug);

  if (!pageData || !isPublicSlug(pageData.video.slug)) {
    notFound();
  }

  const {
    video,
    relatedAthletes,
    relatedCompetitions,
    relatedStories,
    relatedVideos,
  } = pageData;

  return (
    <article>
      <VideoHero video={video} />
      <VideoRecord video={video} />
      <VideoRelatedContent
        athletes={relatedAthletes}
        competitions={relatedCompetitions}
        stories={relatedStories}
        videos={relatedVideos}
      />

      <footer className="border-t border-white/10 bg-surface-2 py-8">
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/videos"
              className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span aria-hidden="true">←</span>
              Return to video archive
            </Link>
            <p className="max-w-xl text-xs leading-5 text-muted sm:text-right">
              Prototype record only. This title, transcript, credits, and
              production context are fictional. No playable media exists.
            </p>
          </div>
        </Container>
      </footer>
    </article>
  );
}
