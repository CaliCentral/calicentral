"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
} from "react";

import { CommunityActionButton } from "@/components/community/community-action-button";
import {
  createCommunityCollectionAction,
  toggleCommunityCollectionItemAction,
} from "@/lib/community/actions/collections";
import { toggleCommunitySaveAction } from "@/lib/community/actions/interactions";
import type {
  CommunityCollectionSummary,
  CommunitySaveTargetType,
} from "@/lib/community/types";
import {
  initialActionState,
  type ActionResult,
} from "@/lib/operations/action-result";

export function SaveDialog({
  targetType,
  targetId,
  saved,
  collections,
  collectionIds,
  returnTo,
}: {
  readonly targetType: CommunitySaveTargetType;
  readonly targetId: string;
  readonly saved: boolean;
  readonly collections: readonly CommunityCollectionSummary[];
  readonly collectionIds: readonly string[];
  readonly returnTo: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    dialogRef.current?.close();
    openButtonRef.current?.focus();
  }

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        aria-haspopup="dialog"
        aria-pressed={saved}
        onClick={() => {
          dialogRef.current?.showModal();
          requestAnimationFrame(() => closeButtonRef.current?.focus());
        }}
        className={`inline-flex min-h-11 items-center justify-center border px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          saved
            ? "border-accent bg-accent/12 text-accent"
            : "border-white/15 text-ink/80 hover:border-accent hover:text-accent"
        }`}
      >
        {saved ? "Saved" : "Save"}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`save-dialog-${targetType}-${targetId}`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="m-auto max-h-[min(42rem,calc(100dvh-2rem))] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto border border-white/20 bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/75"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/12 bg-surface p-5 sm:p-6">
          <div>
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
              Personal library
            </p>
            <h2
              id={`save-dialog-${targetType}-${targetId}`}
              className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.035em]"
            >
              Save to
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/15 font-mono text-xs font-bold uppercase text-muted hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close save dialog"
          >
            ×
          </button>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border border-white/12 bg-canvas/50 p-4">
            <div>
              <p className="font-bold text-ink">Saved</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Your private, unorganized library.
              </p>
            </div>
            <CommunityActionButton
              action={toggleCommunitySaveAction}
              fields={{
                targetType,
                targetId,
                active: String(!saved),
                returnTo,
              }}
              label={saved ? "Remove" : "Save"}
              pendingLabel="Saving…"
              pressed={saved}
            />
          </div>

          <section aria-labelledby={`collections-${targetId}`}>
            <h3
              id={`collections-${targetId}`}
              className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/55"
            >
              Collections
            </h3>
            {collections.length ? (
              <ul className="mt-3 space-y-2">
                {collections.map((collection) => {
                  const selected = collectionIds.includes(collection.id);
                  return (
                    <li
                      key={collection.id}
                      className="flex items-center justify-between gap-4 border-t border-white/10 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {collection.name}
                        </span>
                        <span className="mt-1 block font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
                          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                        </span>
                      </span>
                      <CommunityActionButton
                        action={toggleCommunityCollectionItemAction}
                        fields={{
                          collectionId: collection.id,
                          targetType,
                          targetId,
                          active: String(!selected),
                          returnTo,
                        }}
                        label={selected ? "Added" : "Add"}
                        pendingLabel="Saving…"
                        pressed={selected}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">
                No collections yet. Create a private collection below.
              </p>
            )}
          </section>

          <CollectionCreateForm
            targetType={targetType}
            targetId={targetId}
            returnTo={returnTo}
          />
        </div>
      </dialog>
    </>
  );
}

function CollectionCreateForm({
  targetType,
  targetId,
  returnTo,
}: {
  readonly targetType: CommunitySaveTargetType;
  readonly targetId: string;
  readonly returnTo: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createCommunityCollectionAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.success) startTransition(() => router.refresh());
  }, [router, state.success]);

  return (
    <form action={formAction} className="border-t border-white/12 pt-5">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label
        htmlFor={`collection-name-${targetType}-${targetId}`}
        className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55"
      >
        New collection
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={`collection-name-${targetType}-${targetId}`}
          name="name"
          required
          maxLength={100}
          placeholder="Watch later"
          className="min-h-12 min-w-0 flex-1 border border-white/15 bg-canvas px-3 text-sm text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="clip-corner min-h-12 bg-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function ActionMessage({ state }: { readonly state: ActionResult }) {
  if (!state.message) return null;
  return (
    <p
      role={state.success ? "status" : "alert"}
      className={`mt-2 text-xs leading-5 ${state.success ? "text-sky-200" : "text-rose-200"}`}
    >
      {state.message}
    </p>
  );
}
