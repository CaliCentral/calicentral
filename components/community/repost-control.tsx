import { ActionForm } from "@/components/operations/action-form";
import { CommunityActionButton } from "@/components/community/community-action-button";
import { toggleCommunityRepostAction } from "@/lib/community/actions/interactions";
import type { CommunityRepostTargetType } from "@/lib/community/types";

export function RepostControl({
  targetType,
  targetId,
  reposted,
  repostCount,
  returnTo,
}: {
  readonly targetType: CommunityRepostTargetType;
  readonly targetId: string;
  readonly reposted: boolean;
  readonly repostCount: number;
  readonly returnTo: string;
}) {
  if (reposted) {
    return (
      <CommunityActionButton
        action={toggleCommunityRepostAction}
        fields={{
          targetType,
          targetId,
          active: "false",
          returnTo,
        }}
        label={`Reposted · ${repostCount}`}
        pendingLabel="Removing…"
        pressed
      />
    );
  }

  return (
    <details className="relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center border border-white/15 px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink/80 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Repost · {repostCount}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] border border-white/20 bg-surface p-4 shadow-2xl">
        <p className="text-sm font-bold text-ink">Repost to your activity</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Add an optional note. The original record remains canonical.
        </p>
        <ActionForm
          action={toggleCommunityRepostAction}
          submitLabel="Repost"
          pendingLabel="Reposting…"
          onSuccess="refresh"
          submitClassName="w-full"
        >
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="active" value="true" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label
            htmlFor={`quote-${targetType}-${targetId}`}
            className="sr-only"
          >
            Optional repost note
          </label>
          <textarea
            id={`quote-${targetType}-${targetId}`}
            name="quoteBody"
            maxLength={4000}
            rows={3}
            placeholder="Add a note (optional)"
            className="mt-4 w-full resize-y border border-white/15 bg-canvas p-3 text-sm leading-6 text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
          />
        </ActionForm>
      </div>
    </details>
  );
}
