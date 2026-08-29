import type { Metadata } from "next";
import Link from "next/link";

import { CommunityComposer } from "@/components/community/community-composer";
import { CommunityFeed } from "@/components/community/community-feed";
import type { CommunityViewerState } from "@/components/community/community-interaction-bar";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicMetadata({
  path: "/community",
  title: "Community field feed",
  description:
    "Public posts and conversations from calisthenics athletes, creators, teams, and the people following the sport.",
});

type CommunityPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const feed = first(params.feed);
  const mode =
    feed === "following" || feed === "latest" || feed === "editorial"
      ? feed
      : "for-you";
  const requestedFilter = first(params.filter);
  const filter = (["posts", "videos", "photos", "stories"] as const).find(
    (value) => value === requestedFilter,
  ) ?? "all";
  const cursor = first(params.cursor) || undefined;
  const repository = await getCommunityRepository();

  if (!repository.availability.enabled) {
    return (
      <CommunityState
        eyebrow="Community / Field feed"
        title="Community is not enabled in this environment."
        description="Cali Central's editorial, athlete, team, competition, ranking, and video records remain available."
        actionHref="/join"
        actionLabel="Explore membership"
      />
    );
  }
  if (!repository.availability.configured) {
    return (
      <CommunityState
        eyebrow="Community / Persistence unavailable"
        title="The field feed is temporarily unavailable."
        description="No post or interaction will be accepted until the reviewed community database binding is configured."
        actionHref="/stories"
        actionLabel="Read Cali Central stories"
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
    const [page, collections] = await Promise.all([
      repository.listPosts({
        mode,
        activity: filter,
        viewerMemberId: member?.id,
        cursor,
        limit: 25,
      }),
      member ? repository.listCollections(member.id) : Promise.resolve([]),
    ]);
    const targets = await resolveCommunityTargets(
      page.items.flatMap((post) =>
        post.canonicalTargetType && post.canonicalTargetId
          ? [{ type: post.canonicalTargetType, id: post.canonicalTargetId }]
          : [],
      ),
    );

      return { member, viewerState, page, collections, targets };
    } catch {
      return null;
    }
  })();

  if (!data) {
    return (
      <CommunityState
        eyebrow="Community / Read unavailable"
        title="The field feed could not be loaded."
        description="No substitute posts or interaction counts are shown. The rest of Cali Central remains available."
        actionHref="/stories"
        actionLabel="Read stories"
      />
    );
  }

  const { member, viewerState, page, collections, targets } = data;

  return (
      <div className="technical-grid min-h-screen bg-canvas py-12 sm:py-16 lg:py-20">
        <Container>
          <header className="max-w-4xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Community / Field feed
            </p>
            <h1 className="mt-5 text-balance font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-ink sm:text-6xl lg:text-7xl">
              From the movement.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted">
              Athletes, creators, teams, and the people following calisthenics.
              Community posts remain distinct from verified results and Cali
              Central editorial records.
            </p>
          </header>

          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,48rem)_minmax(18rem,1fr)] xl:items-start">
            <main>
              <nav aria-label="Community feed" className="mb-5 flex flex-wrap gap-2">
                <FeedTab href={communityHref("for-you", filter)} label="Discover" active={mode === "for-you"} />
                <FeedTab
                  href={communityHref("following", filter)}
                  label="Following"
                  active={mode === "following"}
                />
                <FeedTab href={communityHref("latest", filter)} label="Latest" active={mode === "latest"} />
                <FeedTab href={communityHref("editorial", filter)} label="Editorial" active={mode === "editorial"} />
              </nav>

              <nav aria-label="Community content filters" className="mb-6 flex gap-5 overflow-x-auto border-b border-white/15 pb-3">
                {(["all", "posts", "videos", "photos", "stories"] as const).map((value) => (
                  <ContentFilter
                    key={value}
                    href={communityHref(mode, value)}
                    label={value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                    active={filter === value}
                  />
                ))}
              </nav>

              {viewerState === "member" ? (
                <div className="mb-6">
                  <CommunityComposer
                    returnTo={communityHref(mode, filter)}
                  />
                </div>
              ) : (
                <CommunityComposerState viewerState={viewerState} />
              )}

              {mode === "following" && !member ? (
                <div className="border border-dashed border-white/20 bg-surface p-8 text-center">
                  <h2 className="font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
                    Following needs a public member profile.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Sign in and create a public member profile to follow members
                    and build this feed.
                  </p>
                </div>
              ) : (
                <CommunityFeed
                  page={page}
                  targets={targets}
                  viewerState={viewerState}
                  collections={collections}
                  mode={mode}
                  filter={filter}
                />
              )}
            </main>

            <aside className="space-y-4 xl:sticky xl:top-28">
              <div className="border border-white/15 bg-surface p-6">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
                  Community record
                </p>
                <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
                  Conversation, not verification.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Member posts cannot change official athlete files, rankings,
                  competition results, or editorial stories.
                </p>
              </div>
              <div className="border border-white/15 bg-surface-2 p-6">
                <h2 className="font-display text-xl font-black uppercase tracking-[-0.03em] text-ink">
                  Field rules
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Respect people, credit media, avoid impersonation, and keep
                  private information private.
                </p>
                <Link
                  href="/community-guidelines"
                  className="mt-5 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                >
                  Read community guidelines →
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </div>
  );
}

function communityHref(
  mode: "for-you" | "following" | "latest" | "editorial",
  filter: "all" | "posts" | "videos" | "photos" | "stories",
) {
  const params = new URLSearchParams();
  if (mode !== "for-you") params.set("feed", mode);
  if (filter !== "all") params.set("filter", filter);
  return `/community${params.size ? `?${params.toString()}` : ""}`;
}

function FeedTab({
  href,
  label,
  active,
}: {
  readonly href: string;
  readonly label: string;
  readonly active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center border px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent ${
        active
          ? "border-accent bg-accent text-canvas"
          : "border-white/15 text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </Link>
  );
}

function ContentFilter({
  href,
  label,
  active,
}: {
  readonly href: string;
  readonly label: string;
  readonly active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`min-h-9 shrink-0 border-b-2 px-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function CommunityComposerState({
  viewerState,
}: {
  readonly viewerState: CommunityViewerState;
}) {
  const href =
    viewerState === "logged-out"
      ? `/sign-in?callbackUrl=${encodeURIComponent("/community")}`
      : "/account/profile#public-member-profile";
  const label = viewerState === "logged-out" ? "Sign in to post" : "Create public profile";
  return (
    <div className="mb-6 border border-white/15 bg-surface p-5 sm:p-7">
      <h2 className="font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
        Share from the movement
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {viewerState === "restricted"
          ? "Community publishing is unavailable for this account status."
          : "A public member profile connects your identity to posts and comments without exposing your account email."}
      </p>
      {viewerState !== "restricted" ? (
        <Link
          href={href}
          className="clip-corner mt-5 inline-flex min-h-12 items-center bg-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {label}
        </Link>
      ) : null}
    </div>
  );
}

function CommunityState({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actionHref: string;
  readonly actionLabel: string;
}) {
  return (
    <div className="technical-grid min-h-[70vh] bg-canvas py-20">
      <Container>
        <div className="mx-auto max-w-3xl border border-white/15 bg-surface p-8 sm:p-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            {description}
          </p>
          <Link
            href={actionHref}
            className="clip-corner mt-7 inline-flex min-h-12 items-center bg-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {actionLabel}
          </Link>
        </div>
      </Container>
    </div>
  );
}
