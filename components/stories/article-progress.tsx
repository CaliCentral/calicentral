"use client";

import { useEffect, useState } from "react";

export function ArticleProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function updateProgress() {
      const readingRegion = document.querySelector<HTMLElement>(
        "[data-reading-progress-region]",
      );

      if (!readingRegion) {
        setProgress(0);
        frame = 0;
        return;
      }

      const regionBounds = readingRegion.getBoundingClientRect();
      const regionStart = regionBounds.top + window.scrollY;
      const regionEnd =
        regionStart + regionBounds.height - window.innerHeight * 0.75;
      const readingDistance = Math.max(regionEnd - regionStart, 1);
      const nextProgress = Math.min(
        Math.max((window.scrollY - regionStart) / readingDistance, 0),
        1,
      );

      setProgress(nextProgress);
      frame = 0;
    }

    function requestUpdate() {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    }

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-40 h-0.5 bg-white/10"
    >
      <div
        data-reading-progress-bar
        className="h-full origin-left bg-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
