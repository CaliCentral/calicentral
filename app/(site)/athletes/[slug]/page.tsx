import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AthleteProfileHero } from "@/components/athletes/athlete-profile-hero";
import { AthleteProfileRecord } from "@/components/athletes/athlete-profile-record";
import { AthleteProfileSummary } from "@/components/athletes/athlete-profile-summary";
import { AthleteRelatedContent } from "@/components/athletes/athlete-related-content";
import { AthleteSportingRelations } from "@/components/athletes/athlete-sporting-relations";
import { ContentCommunityActions } from "@/components/community/content-discussion";
import { Container } from "@/components/ui/container";
import {
  getAthletePage,
  getAthleteRankingSnapshots,
  getTeams,
} from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import { getCommunityRepository } from "@/lib/community/runtime";
import { getAthletePresentationRepository } from "@/lib/community/athlete-presentation-runtime";
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

export const dynamic = "force-dynamic";

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
  const [pageData, rankingSnapshots, teams] = await Promise.all([
    getAthletePage(slug),
    getAthleteRankingSnapshots(),
    getTeams(),
  ]);

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
  const communityRepository = await getCommunityRepository();
  const presentationRepository = await getAthletePresentationRepository();
  const [linkedMember, claimedPresentation] = await Promise.all([
    communityRepository.availability.writable
      ? communityRepository.getPublicMemberProfileByAthleteId(athlete.canonicalId)
      : Promise.resolve(null),
    presentationRepository.available
      ? presentationRepository.getForAthlete(athlete.canonicalId)
      : Promise.resolve(null),
  ]);
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
      <AthleteSportingRelations
        athleteSlug={athlete.slug}
        snapshots={rankingSnapshots}
        teams={teams}
      />
      {linkedMember && claimedPresentation ? (
        <section aria-labelledby="athlete-controlled-presentation-heading" className="border-t border-white/10 bg-surface py-12">
          <Container>
            {claimedPresentation.coverMediaId ? <Image src={`/api/community/media/${claimedPresentation.coverMediaId}`} alt="" width={1200} height={320} className="mb-7 h-48 w-full object-cover sm:h-64" unoptimized /> : null}
            <p className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">Athlete-controlled presentation</p>
            <h2 id="athlete-controlled-presentation-heading" className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">{claimedPresentation.preferredDisplayName || athlete.name}</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted">Separate from canonical identity, rankings, results, and editorial verification</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[12rem_1fr]">
              {claimedPresentation.profileMediaId ? <Image src={`/api/community/media/${claimedPresentation.profileMediaId}`} alt={`${athlete.name} athlete-controlled profile`} width={192} height={192} className="aspect-square w-48 object-cover" unoptimized /> : <div className="flex aspect-square w-48 items-center justify-center border border-dashed border-white/20 text-center text-xs uppercase text-muted">No approved athlete media</div>}
              <div>{claimedPresentation.biography ? <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted">{claimedPresentation.biography}</p> : <p className="text-sm text-muted">No athlete-controlled biography has been added.</p>}<dl className="mt-5 grid gap-4 sm:grid-cols-2">{claimedPresentation.trainingLocation ? <div><dt className="text-xs uppercase text-muted">Training location</dt><dd className="mt-1 text-ink">{claimedPresentation.trainingLocation}</dd></div> : null}{claimedPresentation.specialties.length ? <div><dt className="text-xs uppercase text-muted">Self-described specialties</dt><dd className="mt-1 text-ink">{claimedPresentation.specialties.join(" · ")}</dd></div> : null}</dl><div className="mt-5 flex flex-wrap gap-4">{claimedPresentation.website ? <a href={claimedPresentation.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent">Athlete website ↗</a> : null}{claimedPresentation.socialLinks.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent">Social profile ↗</a>)}</div></div>
            </div>
          </Container>
        </section>
      ) : null}
      <ContentCommunityActions
        targetType="athlete"
        targetId={athlete.canonicalId}
        title={athlete.name}
        returnTo={`/athletes/${athlete.slug}`}
        followType="athlete"
      />
      {linkedMember ? (
        <section className="border-t border-white/10 bg-surface py-8">
          <Container>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">
              Approved profile control
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              This canonical athlete is linked to the public Cali Central member account{" "}
              <Link href={`/members/${linkedMember.handle}`} className="font-bold text-ink underline decoration-accent/50 underline-offset-4 hover:text-accent">
                {linkedMember.displayName} (@{linkedMember.handle})
              </Link>.
            </p>
          </Container>
        </section>
      ) : null}

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
              {athlete.verification.identityStatus === "unverified" && !linkedMember ? (
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
