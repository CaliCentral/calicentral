import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AthleteProfileHero } from "@/components/athletes/athlete-profile-hero";
import { AthleteProfileRecord } from "@/components/athletes/athlete-profile-record";
import { AthleteProfileSummary } from "@/components/athletes/athlete-profile-summary";
import { AthleteRelatedContent } from "@/components/athletes/athlete-related-content";
import { Container } from "@/components/ui/container";
import {
  getAthletePage,
  getAthleteSlugs,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";

type AthletePageProps = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getAthleteSlugs();

  return [...new Set(slugs.filter(isPublicSlug))].map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: AthletePageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getAthletePage(slug, { stega: false });

  if (!pageData || !isPublicSlug(pageData.athlete.slug)) {
    return {
      title: "Athlete not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const { athlete } = pageData;
  const title =
    athlete.seo?.title ??
    `${athlete.name} — Fictional athlete profile`;
  const disciplineLabel = athlete.disciplines.join(" and ");
  const description =
    athlete.seo?.description ??
    `${athlete.name} is a fictional ${disciplineLabel} athlete profile from ${athlete.region}. ${athlete.shortBio}`;
  const socialImage = athlete.seo?.image ?? athlete.image;

  return {
    ...createPublicMetadata({
      path: `/athletes/${athlete.slug}`,
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
      noIndex: athlete.seo?.noIndex,
    }),
    keywords: [
      "calisthenics",
      "fictional athlete profile",
      ...athlete.disciplines,
      athlete.region,
    ],
  };
}

export default async function AthletePage({ params }: AthletePageProps) {
  const { slug } = await params;
  const pageData = await getAthletePage(slug);

  if (!pageData || !isPublicSlug(pageData.athlete.slug)) {
    notFound();
  }

  const {
    athlete,
    relatedStories,
    relatedAthletes,
    relatedCompetitions,
    relatedVideos,
  } = pageData;

  return (
    <article>
      <AthleteProfileHero athlete={athlete} />
      <AthleteProfileSummary athlete={athlete} />
      <AthleteProfileRecord athlete={athlete} />

      <nav
        aria-label="Profile navigation"
        className="border-t border-white/10 bg-surface-2 py-7"
      >
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/athletes"
              className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span aria-hidden="true">←</span>
              Return to athlete directory
            </Link>
            <Link
              href="/rankings"
              className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              View prototype rankings
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </nav>

      <AthleteRelatedContent
        stories={relatedStories}
        athletes={relatedAthletes}
        competitions={relatedCompetitions}
        videos={relatedVideos}
      />
    </article>
  );
}
