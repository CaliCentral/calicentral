import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import { MemberAvatar } from "@/components/community/member-avatar";
import { ReportForm } from "@/components/community/report-form";
import { ActionForm } from "@/components/operations/action-form";
import {
  createCommunityCommentAction,
  deleteCommunityCommentAction,
  updateCommunityCommentAction,
} from "@/lib/community/actions/comments";
import type {
  CommunityComment,
  CommunityCommentPage,
  CommunityCommentTargetType,
} from "@/lib/community/types";

const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function PostComments({
  comments,
  targetType,
  targetId,
  viewerState,
  returnTo,
  offset = 0,
}: {
  readonly comments: CommunityCommentPage;
  readonly targetType: CommunityCommentTargetType;
  readonly targetId: string;
  readonly viewerState: CommunityViewerState;
  readonly returnTo: string;
  readonly offset?: number;
}) {
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(`${returnTo}#discussion`)}`;

  return (
    <section id="discussion" aria-labelledby="discussion-heading" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Community discussion
          </p>
          <h2
            id="discussion-heading"
            className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink"
          >
            Join the conversation
          </h2>
        </div>
      </div>

      {viewerState === "member" ? (
        <div className="mt-6 border border-white/15 bg-surface p-5">
          <ActionForm
            action={createCommunityCommentAction}
            submitLabel="Add comment"
            pendingLabel="Posting…"
            onSuccess="refresh"
          >
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <label className="block">
              <span className="sr-only">Comment</span>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={4}
                placeholder="Add a respectful, relevant comment."
                className="w-full resize-y border border-white/15 bg-canvas p-4 text-sm leading-7 text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
              />
            </label>
          </ActionForm>
        </div>
      ) : viewerState === "logged-out" ? (
        <Link
          href={signInHref}
          className="clip-corner mt-6 inline-flex min-h-12 items-center bg-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Sign in to comment
        </Link>
      ) : viewerState === "profile-required" ? (
        <Link
          href="/account/profile#public-member-profile"
          className="clip-corner mt-6 inline-flex min-h-12 items-center bg-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Create a public profile to comment
        </Link>
      ) : (
        <p className="mt-6 border border-white/12 bg-surface p-4 text-sm text-muted">
          Commenting is unavailable for this account status.
        </p>
      )}

      {comments.items.length ? (
        <ol className="mt-8 space-y-4">
          {comments.items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              targetId={targetId}
              viewerState={viewerState}
              returnTo={returnTo}
            />
          ))}
        </ol>
      ) : (
        <div className="mt-8 border border-dashed border-white/15 p-6 text-sm leading-6 text-muted">
          No comments yet. Start a thoughtful discussion about this record.
        </div>
      )}

      {comments.hasMore && comments.nextOffset !== undefined ? (
        <Link
          href={`${returnTo}?commentsOffset=${comments.nextOffset}#discussion`}
          className="mt-6 inline-flex min-h-11 items-center border border-white/15 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
        >
          View more comments
        </Link>
      ) : offset > 0 ? (
        <Link
          href={`${returnTo}#discussion`}
          className="mt-6 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
        >
          Return to newest comments
        </Link>
      ) : null}
    </section>
  );
}

function CommentItem({
  comment,
  targetType,
  targetId,
  viewerState,
  returnTo,
  reply = false,
}: {
  readonly comment: CommunityComment;
  readonly targetType: CommunityCommentTargetType;
  readonly targetId: string;
  readonly viewerState: CommunityViewerState;
  readonly returnTo: string;
  readonly reply?: boolean;
}) {
  return (
    <li className={reply ? "border-l-2 border-white/12 pl-4 sm:pl-6" : "border border-white/12 bg-surface p-5 sm:p-6"}>
      <article>
        <header className="flex items-start gap-3">
          <Link href={`/members/${comment.author.handle}`}>
            <MemberAvatar
              displayName={comment.author.displayName}
              avatarUrl={comment.author.avatarUrl}
              size="sm"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/members/${comment.author.handle}`}
              className="text-sm font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {comment.author.displayName}
            </Link>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-white/45">
              @{comment.author.handle} ·{" "}
              <time dateTime={comment.createdAt}>
                {dateTime.format(new Date(comment.createdAt))}
              </time>
              {comment.edited ? " · Edited" : ""}
            </p>
          </div>
        </header>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-ink/85">
          {comment.body}
        </p>

        <div className="mt-4 flex flex-wrap items-start gap-4">
          {viewerState === "member" && !reply ? (
            <details>
              <summary className="cursor-pointer font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Reply
              </summary>
              <div className="mt-3 min-w-[min(30rem,calc(100vw-4rem))]">
                <ActionForm
                  action={createCommunityCommentAction}
                  submitLabel="Add reply"
                  pendingLabel="Posting…"
                  onSuccess="refresh"
                >
                  <input type="hidden" name="targetType" value={targetType} />
                  <input type="hidden" name="targetId" value={targetId} />
                  <input type="hidden" name="parentCommentId" value={comment.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <textarea
                    name="body"
                    required
                    maxLength={2000}
                    rows={3}
                    aria-label={`Reply to ${comment.author.displayName}`}
                    className="w-full resize-y border border-white/15 bg-canvas p-3 text-sm leading-6 text-ink focus:border-accent focus:outline-none"
                  />
                </ActionForm>
              </div>
            </details>
          ) : null}
          {comment.viewerCanEdit && viewerState === "member" ? (
            <>
              <details>
                <summary className="cursor-pointer font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                  Edit
                </summary>
                <div className="mt-3 min-w-[min(30rem,calc(100vw-4rem))]">
                  <ActionForm
                    action={updateCommunityCommentAction}
                    submitLabel="Save comment"
                    pendingLabel="Saving…"
                    onSuccess="refresh"
                  >
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <textarea
                      name="body"
                      required
                      maxLength={2000}
                      rows={3}
                      defaultValue={comment.body}
                      aria-label="Edit comment"
                      className="w-full resize-y border border-white/15 bg-canvas p-3 text-sm leading-6 text-ink focus:border-accent focus:outline-none"
                    />
                  </ActionForm>
                </div>
              </details>
              <CommunityActionButton
                action={deleteCommunityCommentAction}
                fields={{ commentId: comment.id, returnTo }}
                label="Delete"
                pendingLabel="Deleting…"
                confirmMessage="Delete this comment?"
                className="!min-h-8 !border-0 !p-0 !text-rose-200"
              />
            </>
          ) : viewerState === "member" ? (
            <ReportForm
              targetType="comment"
              targetId={comment.id}
              returnTo={returnTo}
            />
          ) : null}
        </div>
      </article>

      {!reply && comment.replies.length ? (
        <ol className="mt-5 space-y-4">
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              targetType={targetType}
              targetId={targetId}
              viewerState={viewerState}
              returnTo={returnTo}
              reply
            />
          ))}
        </ol>
      ) : null}
      {!reply && comment.replyCount > comment.replies.length ? (
        <p className="mt-4 border-l-2 border-accent/40 pl-4 text-xs leading-5 text-muted">
          Showing the first {comment.replies.length} of {comment.replyCount} replies.
        </p>
      ) : null}
    </li>
  );
}
