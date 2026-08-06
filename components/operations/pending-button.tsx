"use client";

import { useFormStatus } from "react-dom";

type PendingButtonProps = {
  readonly children: string;
  readonly pendingLabel: string;
  readonly className?: string;
  readonly name?: string;
  readonly value?: string;
};

export function PendingButton({
  children,
  pendingLabel,
  className = "",
  name,
  value,
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`clip-corner inline-flex min-h-12 items-center justify-center px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
