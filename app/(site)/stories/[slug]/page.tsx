import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/stories/article-body";
import { ArticleHero } from "@/components/stories/article-hero";
import { ArticleMeta } from "@/components/stories/article-meta";
import { ArticleProgress } from "@/components/stories/article-progress";
import { RelatedStories } from "@/components/stories/related-stories";
import { RelatedStoryField } from "@/components/stories/related-story-field";
import { Container } from "@/components/ui/container";
import {
  getStoryPage,
  getStorySlugs,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";

type StoryPageProps = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getStorySlugs();

  return [...new Set(slugs.filter(isPublicSlug))].map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getStoryPage(slug, { stega: false });

  if (!pageData || !isPublicSlug(pageData.story.slug)) {
    return {
      title: "Story not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const { story: article } = pageData;
  const title = article.seo?.title ?? article.title;
  const description = article.seo?.description ?? article.dek;
  const socialImage = article.seo?.image ?? article.image;

  const metadata = createPublicMetadata({
    path: `/stories/${article.slug}`,
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
    noIndex: article.seo?.noIndex,
  });

  return {
    ...metadata,
    authors: [{ name: article.author }],
    category: article.category,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: article.publicationDate,
      authors: [article.author],
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const pageData = await getStoryPage(slug);

  if (!pageData || !isPublicSlug(pageData.story.slug)) {
    notFound();
  }

  const {
    story: article,
    relatedStories: relatedArticles,
    relatedAthletes,
    relatedCompetitions,
    relatedVideos,
  } = pageData;

  return (
    <>
      <ArticleProgress />
      <article>
        <ArticleHero article={article} />

        <section
          aria-label="Article"
          data-reading-progress-region
          className="technical-grid-dark bg-paper py-14 text-on-light sm:py-18 lg:py-24"
        >
          <Container className="grid gap-10 lg:grid-cols-[13rem_minmax(0,46rem)] lg:justify-center lg:gap-16 xl:grid-cols-[15rem_minmax(0,48rem)] xl:gap-20">
            <ArticleMeta article={article} />
            <div className="min-w-0">
              <ArticleBody article={article} />
              <div className="mt-14 border-t border-on-light/20 pt-7">
                <Link
                  href="/stories"
                  className="inline-flex min-h-11 items-center gap-3 text-xs font-bold uppercase tracking-[0.13em] text-on-light transition-colors hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
                >
                  <span aria-hidden="true">←</span>
                  Return to all stories
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <RelatedStories articles={relatedArticles} />
        <RelatedStoryField
          athletes={relatedAthletes}
          competitions={relatedCompetitions}
          videos={relatedVideos}
        />
      </article>
    </>
  );
}
