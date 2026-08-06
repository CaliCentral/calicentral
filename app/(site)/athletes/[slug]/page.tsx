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
import { athleteCategoryLabel } from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";
import { absoluteSiteUrl } from "@/lib/site/config";

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
    `${athlete.name} — Athlete profile`;
  const categoryLabel = athleteCategoryLabel(athlete.primaryCategory);
  const location = formatGlobalLocation(athlete);
  const description =
    athlete.seo?.description ??
    `${athlete.name} is listed in Cali Central's ${categoryLabel} athlete directory${location ? ` from ${location}` : ""}. ${athlete.shortBio}`.trim();
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
      "athlete profile",
      categoryLabel,
      ...athlete.specialties,
      athlete.country,
      athlete.administrativeArea,
      athlete.city,
    ].filter(Boolean),
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
  const claimTarget = `/account/submissions/new?type=athleteNomination&requestKind=claim&athlete=${encodeURIComponent(
    athlete.slug,
  )}`;
  const correctionTarget = `/account/submissions/new?type=correctionRequest&affectedUrl=${encodeURIComponent(
    absoluteSiteUrl(`/athletes/${athlete.slug}`),
  )}`;

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
            <div className="flex flex-wrap gap-4">
              {athlete.verification.identityStatus === "unverified" ? (
                <Link
                  href={`/sign-in?callbackUrl=${encodeURIComponent(claimTarget)}`}
                  className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Claim this profile
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
              <Link
                href={`/sign-in?callbackUrl=${encodeURIComponent(correctionTarget)}`}
                className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Report an error
                <span aria-hidden="true">→</span>
              </Link>
            </div>
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
