import type { Metadata } from "next";
import Link from "next/link";

import { MemberAvatar } from "@/components/community/member-avatar";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";

export const metadata: Metadata = { title: "Following" };
export const dynamic = "force-dynamic";

type FollowingPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 200 ? parsed : 1;
}

export default async function FollowingPage({ searchParams }: FollowingPageProps) {
  const [user, params] = await Promise.all([
    requireAuthenticatedUser("/account/following"),
    searchParams,
  ]);
  const repository = await getCommunityRepository();
  const member = repository.availability.writable
    ? await repository.getMemberProfileByPrincipalId(user.id)
    : null;
  const page = pageNumber(params.page);
  const offset = (page - 1) * 50;
  const [following, followers] = member
    ? await Promise.all([
        repository.listFollowing(member.id, 50, offset),
        repository.listFollowers(member.id, 50, 0),
      ])
    : [[], []];
  const targets = await resolveCommunityTargets(
    following.flatMap((item) =>
      item.targetType === "member"
        ? []
        : [{ type: item.targetType, id: item.targetId }],
    ),
  );

  return (
    <OperationsPage
      eyebrow="Account / Social graph"
      title="Following"
      description="Members, athletes, teams, competitions, and organizations you follow. This list is private account state."
    >
      {!repository.availability.writable ? (
        <OperationsPanel title="Community unavailable" description="The reviewed D1 binding is not configured in this environment."><span /></OperationsPanel>
      ) : !member ? (
        <OperationsPanel title="Create your member profile" description="A public member profile provides your stable community identity.">
          <Link href="/account/profile#public-member-profile" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">Open profile settings →</Link>
        </OperationsPanel>
      ) : (
        <>
          <OperationsPanel title={`${member.followingCount} following`} description="Up to 50 records per page, newest first.">
            {following.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {following.map((item) => {
                  const target = item.targetType === "member"
                    ? undefined
                    : targets.get(`${item.targetType}:${item.targetId}`);
                  return (
                    <li key={`${item.targetType}:${item.targetId}`} className="border border-white/12 p-4">
                      {item.member ? (
                        <Link href={`/members/${item.member.handle}`} className="flex items-center gap-3 text-ink hover:text-accent">
                          <MemberAvatar displayName={item.member.displayName} avatarUrl={item.member.avatarUrl} />
                          <span><strong className="block">{item.member.displayName}</strong><span className="font-mono text-xs text-muted">@{item.member.handle}</span></span>
                        </Link>
                      ) : target ? (
                        <Link href={target.href} className="block text-ink hover:text-accent">
                          <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted">{item.targetType}</span>
                          <strong className="mt-1 block">{target.title}</strong>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted">This followed record is no longer public.</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted">You are not following any records on this page.</p>}
            <div className="mt-5 flex gap-3">
              {page > 1 ? <Link href={`/account/following?page=${page - 1}`} className="font-mono text-xs font-bold uppercase text-accent">← Previous</Link> : null}
              {following.length === 50 ? <Link href={`/account/following?page=${page + 1}`} className="font-mono text-xs font-bold uppercase text-accent">Next →</Link> : null}
            </div>
          </OperationsPanel>
          <OperationsPanel title={`${member.followerCount} followers`} description="Public members who follow your profile; newest 50 shown.">
            {followers.length ? (
              <ul className="flex flex-wrap gap-3">
                {followers.map((follower) => (
                  <li key={follower.id}><Link href={`/members/${follower.handle}`} className="inline-flex min-h-10 items-center border border-white/15 px-3 text-sm text-ink hover:border-accent hover:text-accent">{follower.displayName}</Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No public followers yet.</p>}
          </OperationsPanel>
        </>
      )}
    </OperationsPage>
  );
}
