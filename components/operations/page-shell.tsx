import type { ReactNode } from "react";

type OperationsPageProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

export function OperationsPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: OperationsPageProps) {
  return (
    <div className="technical-grid min-h-[calc(100vh-12rem)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="border-b border-white/15 pb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-4xl">
              <h1 className="break-words text-balance text-4xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
                {description}
              </p>
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
            ) : null}
          </div>
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

type OperationsPanelProps = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly className?: string;
};

export function OperationsPanel({
  title,
  eyebrow,
  description,
  children,
  className = "",
}: OperationsPanelProps) {
  return (
    <section
      className={`border border-white/15 bg-surface/95 p-5 sm:p-7 ${className}`}
    >
      {eyebrow ? (
        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.025em] text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function OperationsNotice({
  title,
  children,
  tone = "neutral",
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-300/35 bg-rose-300/[0.08]"
      : tone === "warning"
        ? "border-amber-300/35 bg-amber-300/[0.08]"
        : "border-white/15 bg-white/[0.035]";

  return (
    <aside className={`border p-5 ${toneClass}`}>
      <h2 className="text-sm font-black uppercase tracking-[0.06em] text-ink">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
    </aside>
  );
}
