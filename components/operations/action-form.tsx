"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  type ReactNode,
} from "react";

import {
  initialActionState,
  type ActionResult,
} from "@/lib/operations/action-result";

type OperationsAction = (
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

type ActionFormProps = {
  readonly action: OperationsAction;
  readonly children: ReactNode;
  readonly submitLabel: string;
  readonly pendingLabel?: string;
  readonly className?: string;
  readonly submitClassName?: string;
  readonly intent?: string;
  readonly onSuccess?: "refresh" | "redirect";
};

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  className = "",
  submitClassName = "",
  intent,
  onSuccess = "redirect",
}: ActionFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (onSuccess === "redirect" && state.redirectTo) {
      startTransition(() => router.push(state.redirectTo!));
      return;
    }

    startTransition(() => router.refresh());
  }, [onSuccess, router, state.redirectTo, state.success]);

  return (
    <form action={formAction} className={className}>
      {state.formError ? (
        <div
          role="alert"
          tabIndex={-1}
          className="mb-6 border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          <p className="font-bold">This change could not be saved.</p>
          <p className="mt-1">{state.formError}</p>
        </div>
      ) : null}
      {!state.success &&
      state.fieldErrors &&
      Object.keys(state.fieldErrors).length ? (
        <div
          role="alert"
          className="mb-6 border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          <p className="font-bold">Review the highlighted form information.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {Object.entries(state.fieldErrors).flatMap(([field, errors]) =>
              errors.map((error) => (
                <li key={`${field}-${error}`}>
                  <span className="font-semibold">{field}:</span> {error}
                </li>
              )),
            )}
          </ul>
        </div>
      ) : null}
      {state.success && state.message ? (
        <p
          role="status"
          className="mb-6 border border-sky-300/40 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100"
        >
          {state.message}
        </p>
      ) : null}
      {children}
      <button
        type="submit"
        name={intent ? "intent" : undefined}
        value={intent}
        disabled={pending}
        aria-disabled={pending}
        className={`clip-corner mt-6 inline-flex min-h-12 items-center justify-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 ${submitClassName}`}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
