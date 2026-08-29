import type { ReactNode } from "react";

type ContentEmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly eyebrow?: string;
  readonly headingId?: string;
  readonly className?: string;
  readonly action?: ReactNode;
};

export function ContentEmptyState({
  title,
  description,
  eyebrow = "Content desk / Awaiting publication",
  headingId,
  className = "",
  action,
}: ContentEmptyStateProps) {
  return (
    <div
      className={`border border-white/15 bg-surface px-6 py-12 text-center sm:px-10 sm:py-16 ${className}`}
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="mt-4 text-balance font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink sm:text-4xl"
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
