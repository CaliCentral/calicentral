import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import { RepostControl } from "@/components/community/repost-control";
import { SaveDialog } from "@/components/community/save-dialog";
import { ShareButton } from "@/components/community/share-button";
import { toggleCommunityLikeAction } from "@/lib/community/actions/interactions";
import type {
  CommunityCollectionSummary,
  CommunityInteractionState,
  CommunityRepostTargetType,
  CommunitySaveTargetType,
} from "@/lib/community/types";

export type CommunityViewerState =
  | "logged-out"
  | "profile-required"
  | "restricted"
  | "member";

export function CommunityInteractionBar({
  targetType,
  targetId,
  state,
  viewerState,
  collections,
  returnTo,
  sharePath,
  shareTitle,
  commentHref,
  theme = "dark",
}: {
  readonly targetType: CommunitySaveTargetType;
  readonly targetId: string;
  readonly state: CommunityInteractionState;
  readonly viewerState: CommunityViewerState;
  readonly collections: readonly CommunityCollectionSummary[];
  readonly returnTo: string;
  readonly sharePath: string;
  readonly shareTitle: string;
  readonly commentHref?: string;
  readonly theme?: "dark" | "paper";
}) {
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`;
  const actionLink = viewerState === "logged-out" ? signInHref : "/account/profile#public-member-profile";
  const actionLinkLabel = viewerState === "logged-out" ? "Sign in" : "Create profile";
  const baseLinkClass =
    "inline-flex min-h-11 items-center justify-center border px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
  const dark = theme === "dark";

  return (
    <div
      className={`mt-5 border-t pt-4 ${dark ? "border-white/12" : "border-on-light/20"}`}
      aria-label="Community interactions"
    >
      {viewerState === "restricted" ? (
        <p className={`mb-3 text-xs leading-5 ${dark ? "text-muted" : "text-on-light/65"}`}>
          Community changes are unavailable for this account status.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {viewerState === "member" ? (
          <CommunityActionButton
            action={toggleCommunityLikeAction}
            fields={{
              targetType,
              targetId,
              active: String(!state.liked),
              returnTo,
            }}
            label={`${state.liked ? "Liked" : "Like"} · ${state.likeCount}`}
            pendingLabel="Saving…"
            pressed={state.liked}
            className={dark ? "" : "!border-on-light/20 !text-on-light hover:!border-accent-dark hover:!text-accent-dark"}
          />
        ) : viewerState !== "restricted" ? (
          <Link
            href={actionLink}
            className={`${baseLinkClass} ${dark ? "border-white/15 text-ink/80 hover:border-accent hover:text-accent focus-visible:outline-accent" : "border-on-light/20 text-on-light hover:border-accent-dark hover:text-accent-dark focus-visible:outline-accent-dark"}`}
          >
            {actionLinkLabel} to like · {state.likeCount}
          </Link>
        ) : (
          <span className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted">
            {state.likeCount} {state.likeCount === 1 ? "like" : "likes"}
          </span>
        )}

        {commentHref ? (
          <Link
            href={commentHref}
            className={`${baseLinkClass} ${dark ? "border-white/15 text-ink/80 hover:border-accent hover:text-accent focus-visible:outline-accent" : "border-on-light/20 text-on-light hover:border-accent-dark hover:text-accent-dark focus-visible:outline-accent-dark"}`}
          >
            Comment · {state.commentCount}
          </Link>
        ) : null}

        {["post", "story", "video"].includes(targetType) ? (
          viewerState === "member" ? (
            <RepostControl
              targetType={targetType as CommunityRepostTargetType}
              targetId={targetId}
              reposted={state.reposted}
              repostCount={state.repostCount}
              returnTo={returnTo}
            />
          ) : viewerState !== "restricted" ? (
            <Link
              href={actionLink}
              className={`${baseLinkClass} ${dark ? "border-white/15 text-ink/80 hover:border-accent hover:text-accent focus-visible:outline-accent" : "border-on-light/20 text-on-light hover:border-accent-dark hover:text-accent-dark focus-visible:outline-accent-dark"}`}
            >
              {actionLinkLabel} to repost · {state.repostCount}
            </Link>
          ) : null
        ) : null}

        {viewerState === "member" ? (
          <SaveDialog
            targetType={targetType}
            targetId={targetId}
            saved={state.saved}
            collections={collections}
            collectionIds={state.collectionIds}
            returnTo={returnTo}
          />
        ) : viewerState !== "restricted" ? (
          <Link
            href={actionLink}
            className={`${baseLinkClass} ${dark ? "border-white/15 text-ink/80 hover:border-accent hover:text-accent focus-visible:outline-accent" : "border-on-light/20 text-on-light hover:border-accent-dark hover:text-accent-dark focus-visible:outline-accent-dark"}`}
          >
            {actionLinkLabel} to save
          </Link>
        ) : null}

        <ShareButton
          path={sharePath}
          title={shareTitle}
          className={dark ? "" : "!border-on-light/20 !text-on-light hover:!border-accent-dark hover:!text-accent-dark focus-visible:!outline-accent-dark"}
        />
      </div>
    </div>
  );
}
