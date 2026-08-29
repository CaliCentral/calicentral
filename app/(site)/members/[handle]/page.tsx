import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { MemberProfileHeader } from "@/components/members/member-profile-header";
import {
  MemberProfileTabs,
  type MemberProfileTab,
} from "@/components/members/member-profile-tabs";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";
import { createPublicMetadata, publicRobotsMetadata } from "@/lib/site/metadata";
import { getTrainingRepository } from "@/lib/training/runtime";

export const dynamic = "force-dynamic";

type MemberPageProps = {
  readonly params: Promise<{ handle: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function memberTab(value: string): MemberProfileTab {
  return value === "media" || value === "reposts" ? value : "posts";
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { handle } = await params;
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return { title: "Member unavailable", robots: publicRobotsMetadata(true) };
  }
  try {
    const profile = await repository.getPublicMemberProfile(handle);
    if (!profile) return { title: "Member not found", robots: publicRobotsMetadata(true) };
    return createPublicMetadata({
      path: `/members/${profile.handle}`,
      title: `${profile.displayName} — Community member`,
      description:
        profile.biography ||
        `${profile.displayName} is a public Cali Central community member.`,
      noIndex: !profile.discoverable,
    });
  } catch {
    return { title: "Member unavailable", robots: publicRobotsMetadata(true) };
  }
}

export default async function MemberPage({ params, searchParams }: MemberPageProps) {
  const [{ handle }, query] = await Promise.all([params, searchParams]);
  const repository = await getCommunityRepository();
  const trainingRepository = await getTrainingRepository();
  if (!repository.availability.writable) notFound();

  const data = await (async () => {
    try {
      const profile = await repository.getPublicMemberProfile(handle);
      if (!profile) return null;
      const user = await getCurrentUser();
      const viewerMember = user
        ? await repository.getMemberProfileByPrincipalId(user.id)
        : null;
      const canMutate = Boolean(
        user &&
          !["suspended", "archived"].includes(user.accessStatus) &&
          viewerMember?.status === "active" &&
          viewerMember.profilePublic,
      );
      const viewerState: CommunityViewerState = !user
        ? "logged-out"
        : !viewerMember
          ? "profile-required"
          : canMutate
            ? "member"
            : "restricted";
      const ownProfile = viewerMember?.id === profile.id;
      const tab = memberTab(first(query.tab));
      const cursor = first(query.cursor) || undefined;
      const [relationship, activity, collections, records, skills, affiliations] = await Promise.all([
        viewerMember && !ownProfile
          ? repository.getMemberRelationshipState(viewerMember.id, profile.id)
          : Promise.resolve({ followed: false, blocked: false, muted: false }),
        repository.listPosts({
          authorMemberId: profile.id,
          viewerMemberId: viewerMember?.id,
          activity: tab,
          cursor,
          limit: 20,
        }),
        viewerMember
          ? repository.listCollections(viewerMember.id)
          : Promise.resolve([]),
        trainingRepository.available
          ? trainingRepository.listRecords(profile.id, { publicOnly: true, currentOnly: true, limit: 12 })
          : Promise.resolve([]),
        trainingRepository.available
          ? trainingRepository.listSkills(profile.id, true)
          : Promise.resolve([]),
        repository.listMemberTeamAffiliations(profile.id, true),
      ]);
      const targets = await resolveCommunityTargets(
        [
          ...(profile.linkedAthleteId
            ? [{ type: "athlete" as const, id: profile.linkedAthleteId }]
            : []),
          ...activity.items.flatMap((post) =>
            post.canonicalTargetType && post.canonicalTargetId
              ? [{ type: post.canonicalTargetType, id: post.canonicalTargetId }]
              : [],
          ),
          ...affiliations.map((affiliation) => ({ type: "team" as const, id: affiliation.teamId })),
        ],
      );
      return {
        profile,
        viewerState,
        ownProfile,
        tab,
        relationship,
        activity,
        collections,
        records,
        skills,
        affiliations,
        targets,
        returnTo: `/members/${profile.handle}${tab === "posts" ? "" : `?tab=${tab}`}`,
      };
    } catch {
      return null;
    }
  })();

  if (!data) notFound();

  const {
    profile,
    viewerState,
    ownProfile,
    tab,
    relationship,
    activity,
    collections,
    records,
    skills,
    affiliations,
    targets,
    returnTo,
  } = data;

  return (
      <div className="technical-grid min-h-screen bg-canvas py-12 sm:py-16">
        <Container className="max-w-6xl">
          <MemberProfileHeader
            profile={profile}
            viewerState={viewerState}
            ownProfile={ownProfile}
            followed={relationship.followed}
            blocked={relationship.blocked}
            muted={relationship.muted}
            linkedAthleteHref={
              profile.linkedAthleteId
                ? targets.get(`athlete:${profile.linkedAthleteId}`)?.href
                : undefined
            }
          />
          <div className="mt-8">
            <MemberProfileTabs handle={profile.handle} active={tab} />
          </div>

          {tab === "posts" && (records.length || skills.length) ? (
            <section aria-labelledby="member-athlete-utility-heading" className="mt-8 border border-white/15 bg-surface p-5 sm:p-7">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">Member-entered athlete utility</p>
              <h2 id="member-athlete-utility-heading" className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">Records and skills</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">These entries are controlled by the member. Their provenance labels distinguish self-reported or training-linked activity from source-confirmed sporting data.</p>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div><h3 className="font-bold uppercase text-ink">Current public PRs</h3>{records.length ? <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">{records.map((record) => <li key={record.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-semibold text-ink">{record.movementName}</p><p className="text-xs uppercase text-muted">{record.sourceType} · {record.verificationStatus}</p></div><span className="font-display text-xl font-black text-ink">{record.value} {record.unit}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted">No public records.</p>}</div>
                <div><h3 className="font-bold uppercase text-ink">Public skill progress</h3>{skills.length ? <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">{skills.map((skill) => <li key={skill.id} className="flex items-center justify-between gap-4 py-3"><span className="font-semibold text-ink">{skill.movementName}</span><span className="font-mono text-xs uppercase text-accent">{skill.status.replaceAll("-", " ")}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted">No public skills.</p>}</div>
              </div>
            </section>
          ) : null}

          {tab === "posts" && affiliations.length ? (
            <section aria-labelledby="member-team-affiliations-heading" className="mt-8 border border-white/15 bg-surface p-5 sm:p-7">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">Confirmed public opt-in</p>
              <h2 id="member-team-affiliations-heading" className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">Team affiliations</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">{affiliations.map((affiliation) => { const team = targets.get(`team:${affiliation.teamId}`); return team ? <li key={affiliation.id} className="border border-white/10 p-4"><Link href={team.href} className="font-bold uppercase text-ink hover:text-accent">{team.title}</Link><p className="mt-2 text-xs uppercase text-muted">{affiliation.role.replaceAll("-", " ")} · confirmed active membership</p></li> : null; })}</ul>
            </section>
          ) : null}

          {relationship.blocked ? (
            <div className="mt-8 border border-dashed border-white/20 bg-surface p-8 text-center text-sm leading-7 text-muted">
              This member is blocked. Unblock them to show community activity.
            </div>
          ) : tab === "media" && !profile.showMedia ? (
            <div className="mt-8 border border-dashed border-white/20 bg-surface p-8 text-center text-sm leading-7 text-muted">
              This member has not made profile media public.
            </div>
          ) : activity.items.length ? (
            <div className="mt-8 space-y-4">
              {activity.items.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  resolvedTarget={
                    post.canonicalTargetType && post.canonicalTargetId
                      ? targets.get(`${post.canonicalTargetType}:${post.canonicalTargetId}`)
                      : undefined
                  }
                  viewerState={viewerState}
                  collections={collections}
                  returnTo={returnTo}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-white/20 bg-surface p-8 text-center">
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
                No {tab} yet.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Public activity will appear here without exposing private likes,
                saves, collections, or contributor information.
              </p>
            </div>
          )}

          {activity.nextCursor ? (
            <div className="mt-8 text-center">
              <Link
                href={`/members/${profile.handle}?${new URLSearchParams({
                  ...(tab !== "posts" ? { tab } : {}),
                  cursor: activity.nextCursor,
                }).toString()}`}
                className="inline-flex min-h-12 items-center border border-accent px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Load more activity
              </Link>
            </div>
          ) : null}
        </Container>
      </div>
  );
}
