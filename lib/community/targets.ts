import "server-only";

import {
  getAthletes,
  getCompetitions,
  getOrganizations,
  getProducts,
  getStories,
  getTeams,
  getVideosPageData,
} from "@/lib/content";
import type {
  CommunityResolvableTargetType,
  ResolvedCommunityTarget,
} from "@/lib/community/types";

type TargetReference = {
  readonly type: CommunityResolvableTargetType;
  readonly id: string;
};

export async function resolveCommunityTargets(
  references: readonly TargetReference[],
): Promise<ReadonlyMap<string, ResolvedCommunityTarget>> {
  const unique = [
    ...new Map(
      references.slice(0, 100).map((reference) => [
        `${reference.type}:${reference.id}`,
        reference,
      ]),
    ).values(),
  ];
  const types = new Set(unique.map((reference) => reference.type));
  const [stories, athletes, teams, competitions, organizations, videosData, products] =
    await Promise.all([
      types.has("story")
        ? getStories({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
      types.has("athlete")
        ? getAthletes({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
      types.has("team")
        ? getTeams({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
      types.has("competition")
        ? getCompetitions({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
      types.has("organization")
        ? getOrganizations({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
      types.has("video")
        ? getVideosPageData({ publishedOnly: true, stega: false })
        : Promise.resolve({ videos: [], series: [], featuredVideo: null }),
      types.has("product")
        ? getProducts({ publishedOnly: true, stega: false })
        : Promise.resolve([]),
    ]);

  const resolved = new Map<string, ResolvedCommunityTarget>();
  for (const story of stories) {
    const target = {
      type: "story",
      id: story.canonicalId,
      href: `/stories/${story.slug}`,
      eyebrow: `Story / ${story.category}`,
      title: story.title,
      summary: story.dek,
      meta: `${story.displayDate} · ${story.readTime}`,
    } as const;
    resolved.set(`story:${story.canonicalId}`, target);
    resolved.set(`story:${story.slug}`, target);
  }
  for (const athlete of athletes) {
    const target = {
      type: "athlete",
      id: athlete.canonicalId,
      href: `/athletes/${athlete.slug}`,
      eyebrow: "Athlete file",
      title: athlete.name,
      summary: athlete.shortBio,
      meta: `${athlete.city}, ${athlete.country}`,
    } as const;
    resolved.set(`athlete:${athlete.canonicalId}`, target);
    resolved.set(`athlete:${athlete.slug}`, target);
  }
  for (const team of teams) {
    const target = {
      type: "team" as const,
      id: team.canonicalId,
      href: `/teams/${team.slug}`,
      eyebrow: `Team / ${team.teamType.replaceAll("-", " ")}`,
      title: team.name,
      summary: team.description,
      meta: `${team.city}, ${team.country}`,
    };
    resolved.set(`team:${team.canonicalId}`, target);
    resolved.set(`team:${team.slug}`, target);
  }
  for (const competition of competitions) {
    const target = {
      type: "competition",
      id: competition.canonicalId,
      href: `/competitions/${competition.slug}`,
      eyebrow: "Competition record",
      title: competition.name,
      summary: competition.summary,
      meta: `${competition.dateDisplay} · ${competition.city}, ${competition.country}`,
    } as const;
    resolved.set(`competition:${competition.canonicalId}`, target);
    resolved.set(`competition:${competition.slug}`, target);
  }
  for (const organization of organizations) {
    const target = {
      type: "organization" as const,
      id: organization.canonicalId,
      href: `/organizations/${organization.slug}`,
      eyebrow: `Organization / ${organization.organizationType.replaceAll("-", " ")}`,
      title: organization.name,
      summary: organization.description,
      meta: [organization.city, organization.country].filter(Boolean).join(", "),
    };
    resolved.set(`organization:${organization.canonicalId}`, target);
    resolved.set(`organization:${organization.slug}`, target);
  }
  for (const video of videosData.videos) {
    const target = {
      type: "video",
      id: video.canonicalId,
      href: `/videos/${video.slug}`,
      eyebrow: `Video / ${video.category}`,
      title: video.title,
      summary: video.summary,
      meta: `${video.duration} · ${video.publishedDateDisplay}`,
    } as const;
    resolved.set(`video:${video.canonicalId}`, target);
    resolved.set(`video:${video.slug}`, target);
  }
  for (const product of products) {
    const target = {
      type: "product" as const,
      id: product.canonicalId,
      href: `/shop/${product.slug}`,
      eyebrow: `Shop / ${product.category.replaceAll("-", " ")}`,
      title: product.name,
      summary: product.shortDescription,
      meta: product.brand.name,
    };
    resolved.set(`product:${product.canonicalId}`, target);
    resolved.set(`product:${product.slug}`, target);
  }

  return resolved;
}

export async function resolveCommunityTarget(
  type: CommunityResolvableTargetType,
  id: string,
): Promise<ResolvedCommunityTarget | null> {
  const resolved = await resolveCommunityTargets([{ type, id }]);
  return resolved.get(`${type}:${id}`) ?? null;
}
