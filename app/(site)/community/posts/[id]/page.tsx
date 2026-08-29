import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { PostComments } from "@/components/community/post-comments";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTarget } from "@/lib/community/targets";
import { createPublicMetadata, publicRobotsMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

type CommunityPostPageProps = {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function commentOffset(value: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10_000 ? parsed : 0;
}

export async function generateMetadata({
  params,
}: CommunityPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return { title: "Community post unavailable", robots: publicRobotsMetadata(true) };
  }
  try {
    const post = await repository.getPost(id);
    if (!post) {
      return { title: "Community post not found", robots: publicRobotsMetadata(true) };
    }
    const description = post.body || "A public community activity on Cali Central.";
    return createPublicMetadata({
      path: `/community/posts/${post.id}`,
      title: `${post.author.displayName} in the community`,
      description,
    });
  } catch {
    return { title: "Community post unavailable", robots: publicRobotsMetadata(true) };
  }
}

export default async function CommunityPostPage({
  params,
  searchParams,
}: CommunityPostPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return (
      <PostUnavailable
        title="Community persistence is unavailable."
        description="This post cannot be loaded without the configured community database."
      />
    );
  }

  const data = await (async () => {
    try {
      const user = await getCurrentUser();
      const member = user
        ? await repository.getMemberProfileByPrincipalId(user.id)
        : null;
      const canMutate = Boolean(
        user &&
          !["suspended", "archived"].includes(user.accessStatus) &&
          member?.status === "active" &&
          member.profilePublic,
      );
      const viewerState: CommunityViewerState = !user
        ? "logged-out"
        : !member
          ? "profile-required"
          : canMutate
            ? "member"
            : "restricted";
      const offset = commentOffset(first(query.commentsOffset));
      const post = await repository.getPost(id, member?.id);
      if (!post) return { status: "not-found" as const };
      const [comments, collections, resolvedTarget] = await Promise.all([
        repository.listComments({
          targetType: "post",
          targetId: post.id,
          viewerMemberId: member?.id,
          offset,
          limit: 10,
        }),
        member ? repository.listCollections(member.id) : Promise.resolve([]),
        post.canonicalTargetType && post.canonicalTargetId
          ? resolveCommunityTarget(post.canonicalTargetType, post.canonicalTargetId)
          : Promise.resolve(null),
      ]);
      return {
        status: "ready" as const,
        post,
        comments,
        collections,
        resolvedTarget,
        viewerState,
        offset,
        returnTo: `/community/posts/${post.id}`,
      };
    } catch {
      return { status: "error" as const };
    }
  })();

  if (data.status === "not-found") notFound();
  if (data.status === "error") {
    return (
      <PostUnavailable
        title="This post could not be loaded."
        description="No cached or substitute community content is shown when the database read fails."
      />
    );
  }

  const {
    post,
    comments,
    collections,
    resolvedTarget,
    viewerState,
    offset,
    returnTo,
  } = data;

  return (
      <div className="technical-grid min-h-screen bg-canvas py-12 sm:py-16">
        <Container className="max-w-5xl">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Community / Post record
              </p>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.045em] text-ink sm:text-5xl">
                Field post
              </h1>
            </div>
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              ← Return to field feed
            </Link>
          </header>
          <CommunityPostCard
            post={post}
            resolvedTarget={resolvedTarget ?? undefined}
            viewerState={viewerState}
            collections={collections}
            returnTo={returnTo}
          />
          <div className="mt-12">
            <PostComments
              comments={comments}
              targetType="post"
              targetId={post.id}
              viewerState={viewerState}
              returnTo={returnTo}
              offset={offset}
            />
          </div>
        </Container>
      </div>
  );
}

function PostUnavailable({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="technical-grid min-h-[65vh] bg-canvas py-20">
      <Container className="max-w-3xl">
        <div className="border border-white/15 bg-surface p-8 sm:p-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Community / Unavailable
          </p>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em] text-ink">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">{description}</p>
          <Link
            href="/community"
            className="mt-6 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
          >
            Return to community
          </Link>
        </div>
      </Container>
    </div>
  );
}
