"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";

import {
  initialActionState,
  type ActionResult,
} from "@/lib/operations/action-result";

type CommunityAction = (
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

type CommunityActionButtonProps = {
  readonly action: CommunityAction;
  readonly fields: Readonly<Record<string, string>>;
  readonly label: string;
  readonly pendingLabel?: string;
  readonly pressed?: boolean;
  readonly confirmMessage?: string;
  readonly className?: string;
};

export function CommunityActionButton({
  action,
  fields,
  label,
  pendingLabel = "Working…",
  pressed,
  confirmMessage,
  className = "",
}: CommunityActionButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  useEffect(() => {
    if (!state.success) return;
    startTransition(() => {
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    });
  }, [router, state.redirectTo, state.success]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        aria-pressed={pressed}
        className={`inline-flex min-h-11 items-center justify-center border px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 ${
          pressed
            ? "border-accent bg-accent/12 text-accent"
            : "border-white/15 text-ink/80 hover:border-accent hover:text-accent"
        } ${className}`}
      >
        {pending ? pendingLabel : label}
      </button>
      {!state.success && state.message ? (
        <p
          role="alert"
          className="mt-2 max-w-xs text-xs leading-5 text-rose-200"
        >
          {state.message}
        </p>
      ) : (
        <span className="sr-only" aria-live="polite">
          {state.message}
        </span>
      )}
    </form>
  );
}
