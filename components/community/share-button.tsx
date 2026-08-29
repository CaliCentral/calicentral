"use client";

import { useState } from "react";

export function ShareButton({
  path,
  title,
  className = "",
}: {
  readonly path: string;
  readonly title: string;
  readonly className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "failed">(
    "idle",
  );

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setStatus("shared");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
      } catch {
        setStatus("failed");
      }
    }
  }

  const label =
    status === "copied"
      ? "Link copied"
      : status === "shared"
        ? "Shared"
        : status === "failed"
          ? "Copy unavailable"
          : "Share";

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={`inline-flex min-h-11 items-center justify-center border border-white/15 px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink/80 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {label}
    </button>
  );
}
