"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DraftModeControls() {
  const isPresentationTool = useIsPresentationTool();

  if (isPresentationTool) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 right-4 z-[90] border border-white/20 bg-canvas/95 p-3 text-ink shadow-2xl backdrop-blur">
      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">
        Draft preview active
      </p>
      <a
        href="/api/draft-mode/disable"
        className="mt-2 inline-flex min-h-10 items-center border border-white/20 px-3 text-xs font-bold uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Exit preview
      </a>
    </aside>
  );
}
