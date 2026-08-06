import type { ReactNode } from "react";

type OperationsEmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
};

export function OperationsEmptyState({
  title,
  description,
  action,
}: OperationsEmptyStateProps) {
  return (
    <div className="border border-dashed border-white/20 bg-white/[0.025] p-6 sm:p-8">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
        Queue state / Empty
      </p>
      <h2 className="mt-3 text-balance text-2xl font-black uppercase tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
