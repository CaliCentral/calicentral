import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import { SaveDialog } from "@/components/community/save-dialog";
import { toggleCommunityCollectionItemAction } from "@/lib/community/actions/collections";
import type {
  CommunityCollectionSummary,
  CommunityLibraryItem,
  ResolvedCommunityTarget,
} from "@/lib/community/types";

const date = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function LibraryItemCard({
  item,
  target,
  collections,
  returnTo,
  collectionId,
}: {
  readonly item: CommunityLibraryItem;
  readonly target?: ResolvedCommunityTarget;
  readonly collections: readonly CommunityCollectionSummary[];
  readonly returnTo: string;
  readonly collectionId?: string;
}) {
  const postAvailable = item.targetType === "post" && item.post?.available;
  const href = postAvailable
    ? `/community/posts/${item.targetId}`
    : target?.href;
  const title = postAvailable
    ? item.post?.author
      ? `${item.post.author.displayName} · @${item.post.author.handle}`
      : "Community post"
    : target?.title;
  const summary = postAvailable ? item.post?.body : target?.summary;

  return (
    <article className="border border-white/15 bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-accent">
            {item.targetType} / Saved {date.format(new Date(item.addedAt))}
          </p>
          {href && title ? (
            <Link
              href={href}
              className="mt-2 block font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              {title}
            </Link>
          ) : (
            <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.035em] text-muted">
              Content unavailable
            </h2>
          )}
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">
            {summary ||
              "This canonical record was removed, unpublished, or is no longer visible."}
          </p>
        </div>
        {collectionId ? (
          <CommunityActionButton
            action={toggleCommunityCollectionItemAction}
            fields={{
              collectionId,
              targetType: item.targetType,
              targetId: item.targetId,
              active: "false",
              returnTo,
            }}
            label="Remove"
            pendingLabel="Removing…"
          />
        ) : (
          <SaveDialog
            targetType={item.targetType}
            targetId={item.targetId}
            saved
            collections={collections}
            collectionIds={item.collectionIds}
            returnTo={returnTo}
          />
        )}
      </div>
    </article>
  );
}
