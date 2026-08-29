import {
  CommunityInteractionBar,
  type CommunityViewerState,
} from "@/components/community/community-interaction-bar";
import { PostComments } from "@/components/community/post-comments";
import { Container } from "@/components/ui/container";
import { ShareButton } from "@/components/community/share-button";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import type {
  CommunityCanonicalTargetType,
  CommunityCommentTargetType,
  CommunitySaveTargetType,
} from "@/lib/community/types";

export async function ContentDiscussion({
  targetType,
  targetId,
  title,
  returnTo,
  commentsOffset = 0,
}: {
  readonly targetType: CommunityCommentTargetType;
  readonly targetId: string;
  readonly title: string;
  readonly returnTo: string;
  readonly commentsOffset?: number;
}) {
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) return null;

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
      const [state, comments, collections] = await Promise.all([
        repository.getInteractionState(targetType, targetId, member?.id),
        repository.listComments({
          targetType,
          targetId,
          viewerMemberId: member?.id,
          offset: commentsOffset,
          limit: 10,
        }),
        member ? repository.listCollections(member.id) : Promise.resolve([]),
      ]);
      return { viewerState, state, comments, collections };
    } catch {
      return null;
    }
  })();

  if (!data) return null;
  const { viewerState, state, comments, collections } = data;

  return (
      <section className="technical-grid border-y border-white/10 bg-canvas py-14 sm:py-18">
        <Container className="max-w-5xl">
          <div className="border border-white/15 bg-surface p-5 sm:p-7">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Community signal / Editorial record
            </p>
            <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink sm:text-3xl">
              Discuss and save this {targetType === "story" ? "story" : targetType}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Member activity is separate from Cali Central&apos;s canonical
              editorial record.
            </p>
            <CommunityInteractionBar
              targetType={targetType as CommunitySaveTargetType}
              targetId={targetId}
              state={state}
              viewerState={viewerState}
              collections={collections}
              returnTo={returnTo}
              sharePath={returnTo}
              shareTitle={title}
              commentHref={`${returnTo}#discussion`}
            />
          </div>
          <div className="mt-10">
            <PostComments
              comments={comments}
              targetType={targetType}
              targetId={targetId}
              viewerState={viewerState}
              returnTo={returnTo}
              offset={commentsOffset}
            />
          </div>
        </Container>
      </section>
  );
}

export async function ContentCommunityActions({
  targetType,
  targetId,
  title,
  returnTo,
  followType,
}: {
  readonly targetType: Extract<
    CommunityCanonicalTargetType,
    "athlete" | "team" | "competition" | "organization"
  >;
  readonly targetId: string;
  readonly title: string;
  readonly returnTo: string;
  readonly followType?: "athlete" | "team" | "competition" | "organization";
}) {
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) return null;

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
      const [state, collections] = await Promise.all([
        targetType === "organization"
          ? Promise.resolve(null)
          : repository.getInteractionState(targetType, targetId, member?.id),
        member ? repository.listCollections(member.id) : Promise.resolve([]),
      ]);
      return { member, viewerState, state, collections };
    } catch {
      return null;
    }
  })();

  if (!data) return null;
  const { member, viewerState, state, collections } = data;

  return (
      <section className="border-y border-white/10 bg-canvas py-8">
        <Container>
          <div className="flex flex-col gap-4 border border-white/15 bg-surface p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
                Community library
              </p>
              <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[-0.03em] text-ink">
                Follow or save this record
              </h2>
            </div>
            <div>
              {targetType === "organization" || !state ? (
                <ShareButton path={returnTo} title={title} />
              ) : (
                <CommunityInteractionBar
                  targetType={targetType}
                  targetId={targetId}
                  state={state}
                  viewerState={viewerState}
                  collections={collections}
                  returnTo={returnTo}
                  sharePath={returnTo}
                  shareTitle={title}
                />
              )}
              {followType ? (
                <FollowRecordControl
                  repository={repository}
                  memberId={member?.id}
                  viewerState={viewerState}
                  targetType={followType}
                  targetId={targetId}
                  returnTo={returnTo}
                />
              ) : null}
            </div>
          </div>
        </Container>
      </section>
  );
}

async function FollowRecordControl({
  repository,
  memberId,
  viewerState,
  targetType,
  targetId,
  returnTo,
}: {
  readonly repository: Awaited<ReturnType<typeof getCommunityRepository>>;
  readonly memberId?: string;
  readonly viewerState: "logged-out" | "profile-required" | "member" | "restricted";
  readonly targetType: "athlete" | "team" | "competition" | "organization";
  readonly targetId: string;
  readonly returnTo: string;
}) {
  const { CommunityActionButton } = await import(
    "@/components/community/community-action-button"
  );
  const { toggleCommunityFollowAction } = await import(
    "@/lib/community/actions/interactions"
  );
  if (viewerState !== "member" || !memberId) return null;
  const row = await repository.getFollowState(memberId, targetType, targetId);
  return (
    <div className="mt-2">
      <CommunityActionButton
        action={toggleCommunityFollowAction}
        fields={{
          targetType,
          targetId,
          active: String(!row),
          returnTo,
        }}
        label={row ? `Following ${targetType}` : `Follow ${targetType}`}
        pendingLabel="Saving…"
        pressed={row}
      />
    </div>
  );
}
