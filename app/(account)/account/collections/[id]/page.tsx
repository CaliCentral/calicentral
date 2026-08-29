import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionForm } from "@/components/account/collection-form";
import { LibraryItemCard } from "@/components/account/library-item-card";
import { CommunityActionButton } from "@/components/community/community-action-button";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { deleteCommunityCollectionAction } from "@/lib/community/actions/collections";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";

export const metadata: Metadata = { title: "Private collection" };

type CollectionPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const [{ id }, user] = await Promise.all([
    params,
    requireAuthenticatedUser("/account/collections"),
  ]);
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return (
      <OperationsPage eyebrow="Account / Community unavailable" title="Collection unavailable" description="Community persistence is not configured. No private collection state is simulated.">
        <OperationsPanel title="Database unavailable" description="Return after the reviewed D1 binding and community feature are configured.">
          <span />
        </OperationsPanel>
      </OperationsPage>
    );
  }
  const member = await repository.getMemberProfileByPrincipalId(user.id);
  if (!member) notFound();
  const collection = await repository.getCollection(member.id, id);
  // Ownership is enforced inside the repository. Another member receives the
  // same not-found result as an unknown collection ID.
  if (!collection) notFound();
  const targets = await resolveCommunityTargets(
    collection.items.flatMap((item) =>
      item.targetType === "post"
        ? []
        : [{ type: item.targetType, id: item.targetId }],
    ),
  );
  const returnTo = `/account/collections/${collection.id}`;

  return (
    <OperationsPage
      eyebrow="Account / Private collection"
      title={collection.name}
      description={collection.description || "A private organized subset of your Saved library."}
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <Link href="/account/collections" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:text-accent-strong">
          ← All collections
        </Link>
        <CommunityActionButton
          action={deleteCommunityCollectionAction}
          fields={{ collectionId: collection.id, returnTo }}
          label="Delete collection"
          pendingLabel="Deleting…"
          confirmMessage="Delete this collection? Saved items will remain in your private Saved library."
          className="!border-rose-300/35 !text-rose-200 hover:!border-rose-300"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] xl:items-start">
        <div>
          {collection.items.length ? (
            <div className="space-y-4">
              {collection.items.map((item) => (
                <LibraryItemCard
                  key={`${item.targetType}:${item.targetId}`}
                  item={item}
                  target={targets.get(`${item.targetType}:${item.targetId}`)}
                  collections={[]}
                  returnTo={returnTo}
                  collectionId={collection.id}
                />
              ))}
            </div>
          ) : (
            <OperationsPanel title="Empty collection" description="Open an item in Saved or use a public Save dialog to add it to this collection.">
              <span />
            </OperationsPanel>
          )}
        </div>
        <OperationsPanel title="Collection details" description="Only the collection owner can view or edit this record.">
          <CollectionForm collection={collection} />
        </OperationsPanel>
      </div>
    </OperationsPage>
  );
}
