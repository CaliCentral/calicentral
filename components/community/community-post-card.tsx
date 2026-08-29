import Link from "next/link";

import { CanonicalTargetCard } from "@/components/community/canonical-target-card";
import { CommunityActionButton } from "@/components/community/community-action-button";
import { CommunityMediaPreview } from "@/components/community/community-media-preview";
import {
  CommunityInteractionBar,
  type CommunityViewerState,
} from "@/components/community/community-interaction-bar";
import { MemberAvatar } from "@/components/community/member-avatar";
import { ReportForm } from "@/components/community/report-form";
import { ActionForm } from "@/components/operations/action-form";
import {
  deleteCommunityPostAction,
  updateCommunityPostAction,
} from "@/lib/community/actions/posts";
import type {
  CommunityCollectionSummary,
  CommunityPost,
  ResolvedCommunityTarget,
} from "@/lib/community/types";

const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function CommunityPostCard({
  post,
  resolvedTarget,
  viewerState,
  collections,
  returnTo,
  showManagement = true,
}: {
  readonly post: CommunityPost;
  readonly resolvedTarget?: ResolvedCommunityTarget;
  readonly viewerState: CommunityViewerState;
  readonly collections: readonly CommunityCollectionSummary[];
  readonly returnTo: string;
  readonly showManagement?: boolean;
}) {
  const detailPath = `/community/posts/${post.id}`;

  return (
    <article
      id={`post-${post.id}`}
      className="scroll-mt-28 border border-white/15 bg-surface p-5 sm:p-7"
    >
      {post.repost ? (
        <p className="mb-4 border-b border-white/10 pb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-accent">
          Reposted by @{post.author.handle}
        </p>
      ) : null}
      <header className="flex items-start gap-3">
        <Link href={`/members/${post.author.handle}`} className="shrink-0">
          <MemberAvatar
            displayName={post.author.displayName}
            avatarUrl={post.author.avatarUrl}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link
              href={`/members/${post.author.handle}`}
              className="font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {post.author.displayName}
            </Link>
            <span className="font-mono text-xs text-muted">
              @{post.author.handle}
            </span>
          </div>
          {post.author.publicRoles.length ? (
            <ul
              className="mt-2 flex flex-wrap gap-1.5"
              aria-label="Public roles"
            >
              {post.author.publicRoles.map((role) => (
                <li
                  key={role}
                  className="border border-white/12 px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/55"
                >
                  Self-described · {role}
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href={detailPath}
            className="mt-2 inline-block font-mono text-[0.65rem] uppercase tracking-[0.08em] text-white/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <time dateTime={post.createdAt}>
              {dateTime.format(new Date(post.createdAt))}
            </time>
            {post.edited ? " · Edited" : ""}
          </Link>
          <p className="mt-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/45">
            {post.postType.replaceAll("-", " ")}
            {post.visibility === "public"
              ? ""
              : ` · ${post.visibility === "followers" ? "Followers" : "Only me"}`}
          </p>
        </div>
      </header>

      {post.body ? (
        <p className="mt-5 whitespace-pre-wrap break-words text-[0.98rem] leading-7 text-ink/90">
          {post.body}
        </p>
      ) : null}

      {post.repost?.targetType === "post" ? (
        post.repost.originalPost?.available ? (
          <Link
            href={`/community/posts/${post.repost.targetId}`}
            className="mt-5 block border border-white/15 bg-canvas/60 p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
              Original community post
            </p>
            <p className="mt-2 text-sm font-bold text-ink">
              {post.repost.originalPost.author
                ? `${post.repost.originalPost.author.displayName} · @${post.repost.originalPost.author.handle}`
                : "Community member"}
            </p>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted">
              {post.repost.originalPost.body || "Media or referenced content"}
            </p>
          </Link>
        ) : (
          <div className="mt-5 border border-dashed border-white/20 bg-canvas/45 p-5 text-sm text-muted">
            The original post is no longer available.
          </div>
        )
      ) : post.canonicalTargetType && post.canonicalTargetId ? (
        <CanonicalTargetCard target={resolvedTarget} />
      ) : null}

      {post.externalMediaUrl ? (
        <>
          <CommunityMediaPreview
            url={post.externalMediaUrl}
            credit={post.externalMediaCredit}
            kind={post.externalMediaKind}
            altText={post.externalMediaAltText}
          />
          {viewerState === "member" &&
          !post.viewerCanEdit &&
          post.externalMediaId ? (
            <div className="mt-3">
              <ReportForm
                targetType="media"
                targetId={post.externalMediaId}
                returnTo={returnTo}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <CommunityInteractionBar
        targetType="post"
        targetId={post.id}
        state={post.interactions}
        viewerState={viewerState}
        collections={collections}
        returnTo={returnTo}
        sharePath={detailPath}
        shareTitle={`${post.author.displayName} on Cali Central`}
        commentHref={`${detailPath}#discussion`}
      />

      {showManagement && post.viewerCanEdit && viewerState === "member" ? (
        <div className="mt-4 flex flex-wrap items-start gap-4 border-t border-white/10 pt-4">
          {post.body ? (
            <details className="min-w-[min(100%,24rem)] flex-1">
              <summary className="cursor-pointer font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Edit post
              </summary>
              <ActionForm
                action={updateCommunityPostAction}
                submitLabel="Save edit"
                pendingLabel="Saving…"
                onSuccess="refresh"
              >
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <textarea
                  name="body"
                  defaultValue={post.body}
                  required
                  maxLength={4000}
                  rows={4}
                  className="mt-3 w-full resize-y border border-white/15 bg-canvas p-3 text-sm leading-6 text-ink focus:border-accent focus:outline-none"
                />
              </ActionForm>
            </details>
          ) : null}
          <CommunityActionButton
            action={deleteCommunityPostAction}
            fields={{ postId: post.id, returnTo }}
            label="Delete post"
            pendingLabel="Deleting…"
            confirmMessage="Delete this post? It will be removed from public feeds."
            className="!border-rose-300/35 !text-rose-200 hover:!border-rose-300"
          />
        </div>
      ) : viewerState === "member" ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <ReportForm
            targetType="post"
            targetId={post.id}
            returnTo={returnTo}
          />
        </div>
      ) : null}
    </article>
  );
}
