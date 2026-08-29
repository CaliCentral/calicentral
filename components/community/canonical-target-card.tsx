import Link from "next/link";

import type { ResolvedCommunityTarget } from "@/lib/community/types";

export function CanonicalTargetCard({
  target,
}: {
  readonly target?: ResolvedCommunityTarget;
}) {
  if (!target) {
    return (
      <div className="mt-5 border border-dashed border-white/20 bg-canvas/45 p-5 text-sm text-muted">
        This referenced Cali Central record is no longer available.
      </div>
    );
  }

  return (
    <Link
      href={target.href}
      className="group mt-5 block border border-white/15 bg-canvas/60 p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
        {target.eyebrow}
      </p>
      <h3 className="mt-2 font-display text-xl font-black uppercase tracking-[-0.025em] text-ink group-hover:text-accent">
        {target.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
        {target.summary}
      </p>
      {target.meta ? (
        <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-white/45">
          {target.meta}
        </p>
      ) : null}
    </Link>
  );
}
