import Link from "next/link";

import { CommunityPostCard } from "@/components/community/community-post-card";
import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import type {
  CommunityCollectionSummary,
  CommunityPostPage,
  ResolvedCommunityTarget,
} from "@/lib/community/types";

export function CommunityFeed({
  page,
  targets,
  viewerState,
  collections,
  mode,
  filter,
}: {
  readonly page: CommunityPostPage;
  readonly targets: ReadonlyMap<string, ResolvedCommunityTarget>;
  readonly viewerState: CommunityViewerState;
  readonly collections: readonly CommunityCollectionSummary[];
  readonly mode: "for-you" | "latest" | "following" | "editorial";
  readonly filter: "all" | "posts" | "videos" | "photos" | "stories";
}) {
  if (!page.items.length) {
    return (
      <div className="border border-dashed border-white/20 bg-surface p-8 text-center sm:p-12">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
          {mode === "following"
            ? "Following feed"
            : mode === "editorial"
              ? "Editorial feed"
              : mode === "latest"
              ? "Latest feed"
              : "For You feed"}
        </p>
        <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">
          No posts yet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          {mode === "following"
            ? "Follow public members to see their latest community activity here."
            : "Be the first to share a training session, competition moment, photo, or calisthenics story."}
        </p>
      </div>
    );
  }

  const returnParams = new URLSearchParams();
  if (mode !== "for-you") returnParams.set("feed", mode);
  if (filter !== "all") returnParams.set("filter", filter);
  const returnTo = `/community${returnParams.size ? `?${returnParams.toString()}` : ""}`;
  return (
    <>
      <div className="space-y-4">
        {page.items.map((post) => (
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
      {page.nextCursor ? (
        <div className="mt-8 text-center">
          <Link
            href={`/community?${new URLSearchParams({
              ...(mode !== "for-you" ? { feed: mode } : {}),
              ...(filter !== "all" ? { filter } : {}),
              cursor: page.nextCursor,
            }).toString()}`}
            className="clip-corner inline-flex min-h-12 items-center justify-center border border-accent px-6 font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Load more posts
          </Link>
        </div>
      ) : null}
    </>
  );
}
