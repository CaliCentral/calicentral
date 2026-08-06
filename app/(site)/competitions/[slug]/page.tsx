import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitionHero } from "@/components/competitions/competition-hero";
import { CompetitionRecord } from "@/components/competitions/competition-record";
import { CompetitionRelatedContent } from "@/components/competitions/competition-related-content";
import { Container } from "@/components/ui/container";
import {
  getCompetitionPage,
  getCompetitionSlugs,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";

type CompetitionPageProps = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getCompetitionSlugs();

  return [...new Set(slugs.filter(isPublicSlug))].map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: CompetitionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getCompetitionPage(slug, { stega: false });

  if (!pageData || !isPublicSlug(pageData.competition.slug)) {
    return {
      title: "Competition not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const { competition } = pageData;
  const title =
    competition.seo?.title ??
    `${competition.name} — Fictional competition`;
  const description =
    competition.seo?.description ??
    `${competition.summary} ${competition.dateDisplay} in ${competition.city}, ${competition.state}.`;
  const socialImage = competition.seo?.image ?? competition.image;

  return {
    ...createPublicMetadata({
      path: `/competitions/${competition.slug}`,
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
      noIndex: competition.seo?.noIndex,
    }),
    keywords: [
      "calisthenics",
      "fictional competition",
      competition.competitionFormat,
      competition.city,
      ...competition.disciplines,
    ],
  };
}

export default async function CompetitionPage({
  params,
}: CompetitionPageProps) {
  const { slug } = await params;
  const pageData = await getCompetitionPage(slug);

  if (!pageData || !isPublicSlug(pageData.competition.slug)) {
    notFound();
  }

  const {
    competition,
    relatedAthletes,
    relatedStories,
    relatedCompetitions,
    relatedVideos,
  } = pageData;

  return (
    <article>
      <CompetitionHero competition={competition} />
      <CompetitionRecord competition={competition} />
      <CompetitionRelatedContent
        athletes={relatedAthletes}
        stories={relatedStories}
        competitions={relatedCompetitions}
        videos={relatedVideos}
      />

      <footer className="border-t border-white/10 bg-surface-2 py-8">
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/competitions"
              className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span aria-hidden="true">←</span>
              Return to competition directory
            </Link>
            <p className="max-w-xl text-xs leading-5 text-muted sm:text-right">
              Prototype record only. This event, its participants, schedule,
              organizer, registration state, and results are entirely
              fictional.
            </p>
          </div>
        </Container>
      </footer>
    </article>
  );
}
