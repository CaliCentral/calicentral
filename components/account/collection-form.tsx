import { ActionForm } from "@/components/operations/action-form";
import {
  createCommunityCollectionAction,
  updateCommunityCollectionAction,
} from "@/lib/community/actions/collections";

export function CollectionForm({
  collection,
}: {
  readonly collection?: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
  };
}) {
  const action = collection
    ? updateCommunityCollectionAction
    : createCommunityCollectionAction;
  const returnTo = collection
    ? `/account/collections/${collection.id}`
    : "/account/collections";
  return (
    <ActionForm
      action={action}
      submitLabel={collection ? "Save collection" : "Create collection"}
      pendingLabel="Saving…"
      onSuccess={collection ? "refresh" : "redirect"}
    >
      {collection ? (
        <input type="hidden" name="collectionId" value={collection.id} />
      ) : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block">
        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
          Name
        </span>
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={collection?.name ?? ""}
          className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </label>
      <label className="mt-5 block">
        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
          Description
        </span>
        <textarea
          name="description"
          maxLength={500}
          rows={4}
          defaultValue={collection?.description ?? ""}
          className="mt-2 w-full resize-y border border-white/15 bg-canvas p-3 text-sm leading-6 text-ink focus:border-accent focus:outline-none"
        />
      </label>
      <p className="mt-4 text-xs leading-5 text-muted">
        Collections are private in this release. Their names and contents are
        not shown on your public member profile.
      </p>
    </ActionForm>
  );
}
