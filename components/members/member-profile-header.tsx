import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import { MemberAvatar, MemberCover } from "@/components/community/member-avatar";
import { ReportForm } from "@/components/community/report-form";
import { ShareButton } from "@/components/community/share-button";
import {
  toggleCommunityBlockAction,
  toggleCommunityFollowAction,
  toggleCommunityMuteAction,
} from "@/lib/community/actions/interactions";
import type { PublicMemberProfile } from "@/lib/community/types";

export function MemberProfileHeader({
  profile,
  viewerState,
  ownProfile,
  followed,
  blocked,
  muted,
  linkedAthleteHref,
}: {
  readonly profile: PublicMemberProfile;
  readonly viewerState: CommunityViewerState;
  readonly ownProfile: boolean;
  readonly followed: boolean;
  readonly blocked: boolean;
  readonly muted: boolean;
  readonly linkedAthleteHref?: string;
}) {
  const path = `/members/${profile.handle}`;
  const location = [profile.city, profile.administrativeArea, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="overflow-hidden border border-white/15 bg-surface">
      <MemberCover
        coverImageUrl={profile.coverImageUrl}
        displayName={profile.displayName}
      />
      <div className="p-5 sm:p-8">
        <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 sm:flex-row sm:items-end">
          <MemberAvatar
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1 sm:pb-1">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
              Cali Central member
            </p>
            <h1 className="mt-2 break-words font-display text-4xl font-black uppercase leading-none tracking-[-0.05em] text-ink sm:text-5xl">
              {profile.displayName}
            </h1>
            <p className="mt-2 font-mono text-sm text-muted">@{profile.handle}</p>
          </div>
        </div>

        {profile.publicRoles.length ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Public member roles">
            {profile.publicRoles.map((role) => (
              <li
                key={role}
                className="border border-accent/35 bg-accent/8 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-accent"
              >
                Self-described · {role}
              </li>
            ))}
          </ul>
        ) : null}
        {profile.biography ? (
          <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-8 text-ink/85">
            {profile.biography}
          </p>
        ) : null}
        {location ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-muted">
            {location}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.1em] text-muted">
          <span>{profile.followerCount} followers</span>
          <span>{profile.followingCount} following</span>
          {linkedAthleteHref ? (
            <Link href={linkedAthleteHref} className="text-accent hover:text-accent-strong">
              Approved athlete profile ↗
            </Link>
          ) : null}
        </div>

        {profile.socialAccounts.length ? (
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Public social links">
            {profile.socialAccounts.map((account) => (
              <li key={`${account.platform}-${account.url}`}>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                >
                  {account.platform} ↗
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/12 pt-5">
          {ownProfile ? (
            <Link
              href="/account/profile#public-member-profile"
              className="clip-corner inline-flex min-h-11 items-center bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.11em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Edit public profile
            </Link>
          ) : viewerState === "member" ? (
            <>
              <CommunityActionButton
                action={toggleCommunityFollowAction}
                fields={{
                  targetType: "member",
                  targetId: profile.id,
                  active: String(!followed),
                  returnTo: path,
                }}
                label={followed ? "Following" : "Follow member"}
                pendingLabel="Saving…"
                pressed={followed}
              />
              <CommunityActionButton
                action={toggleCommunityMuteAction}
                fields={{
                  targetMemberId: profile.id,
                  active: String(!muted),
                  returnTo: path,
                }}
                label={muted ? "Unmute" : "Mute member"}
                pendingLabel="Saving…"
                pressed={muted}
              />
              <CommunityActionButton
                action={toggleCommunityBlockAction}
                fields={{
                  targetMemberId: profile.id,
                  active: String(!blocked),
                  returnTo: path,
                }}
                label={blocked ? "Unblock" : "Block member"}
                pendingLabel="Saving…"
                pressed={blocked}
                confirmMessage={
                  blocked
                    ? undefined
                    : "Block this member? Following relationships will be removed."
                }
              />
            </>
          ) : viewerState === "logged-out" ? (
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(path)}`}
              className="inline-flex min-h-11 items-center border border-white/15 px-4 font-mono text-xs font-bold uppercase tracking-[0.11em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Sign in to follow
            </Link>
          ) : null}
          <ShareButton path={path} title={`${profile.displayName} on Cali Central`} />
        </div>

        {!ownProfile && viewerState === "member" ? (
          <div className="mt-4">
            <ReportForm targetType="member" targetId={profile.id} returnTo={path} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
