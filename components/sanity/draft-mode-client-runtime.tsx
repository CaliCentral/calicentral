"use client";

import { useEffect, useState } from "react";

type DraftModeModules = {
  VisualEditing: (typeof import("next-sanity/visual-editing"))["VisualEditing"];
  DraftModeControls: (typeof import("./draft-mode-controls"))["DraftModeControls"];
};

export function DraftModeClientRuntime() {
  const [modules, setModules] = useState<DraftModeModules | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      import("next-sanity/visual-editing"),
      import("./draft-mode-controls"),
    ])
      .then(([{ VisualEditing }, { DraftModeControls }]) => {
        if (isMounted) {
          setModules({ VisualEditing, DraftModeControls });
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadFailed(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loadFailed) {
    return (
      <aside
        role="status"
        className="fixed bottom-4 right-4 z-[90] max-w-xs border border-rose-300/40 bg-canvas/95 p-4 text-sm text-ink shadow-2xl backdrop-blur"
      >
        <p className="font-bold">Preview controls could not be loaded.</p>
        <a
          href="/api/draft-mode/disable"
          className="mt-3 inline-flex min-h-10 items-center text-xs font-bold uppercase tracking-[0.1em] text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Exit preview
        </a>
      </aside>
    );
  }

  if (!modules) {
    return null;
  }

  const { VisualEditing, DraftModeControls } = modules;

  return (
    <>
      <VisualEditing />
      <DraftModeControls />
    </>
  );
}
