"use client";

import { useMemo, useState } from "react";

import { VideoCard } from "@/components/videos/video-card";
import type { MediaFeature } from "@/types/video";

const discoveryLenses = [
  {
    id: "competition",
    label: "Competition",
    description:
      "Event previews, highlights, round analysis, and field coverage.",
  },
  {
    id: "freestyle",
    label: "Freestyle",
    description:
      "Dynamic movement, combinations, judging, and athlete expression.",
  },
  {
    id: "strength",
    label: "Strength",
    description:
      "Strength-focused practice, progressions, and athlete features.",
  },
  {
    id: "streetlifting",
    label: "Streetlifting",
    description: "Weighted calisthenics competition and training records.",
  },
  {
    id: "statics-control",
    label: "Statics / Control",
    description: "Holds, hand balancing, position, tempo, and control.",
  },
  {
    id: "training",
    label: "Training",
    description: "Technique studies, session structure, and practice context.",
  },
  {
    id: "athlete-features",
    label: "Athlete Features",
    description: "Profiles and interviews centered on an athlete's process.",
  },
  {
    id: "team-content",
    label: "Team Content",
    description: "Crew sessions, shared practice, and team-linked media.",
  },
  {
    id: "creator-spotlight",
    label: "Creator Spotlight",
    description:
      "Work led by photographers, filmmakers, and community creators.",
  },
  {
    id: "documentary-interviews",
    label: "Documentary / Interviews",
    description:
      "Longer-form reporting, documentary records, and conversations.",
  },
] as const;

type DiscoveryLensId = (typeof discoveryLenses)[number]["id"];

function includesAny(haystack: string, needles: readonly string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function matchesLens(video: MediaFeature, lensId: DiscoveryLensId) {
  const searchField = [
    video.category,
    video.format,
    video.seriesTitle,
    video.visualVariant,
    ...video.tags,
  ]
    .join(" ")
    .toLocaleLowerCase();

  switch (lensId) {
    case "competition":
      return includesAny(searchField, [
        "competition",
        "event preview",
        "round",
      ]);
    case "freestyle":
      return includesAny(searchField, ["freestyle", "dynamic", "flight"]);
    case "strength":
      return includesAny(searchField, ["strength", "weighted", "pull", "dip"]);
    case "streetlifting":
      return includesAny(searchField, ["streetlifting", "street lifting"]);
    case "statics-control":
      return includesAny(searchField, [
        "static",
        "control",
        "handstand",
        "hand balancing",
        "hold",
      ]);
    case "training":
      return includesAny(searchField, ["training", "technique", "practice"]);
    case "athlete-features":
      return includesAny(searchField, [
        "athlete profile",
        "athlete file",
        "profile study",
      ]);
    case "team-content":
      return includesAny(searchField, ["team", "crew", "shared practice"]);
    case "creator-spotlight":
      return includesAny(searchField, [
        "creator",
        "photographer",
        "filmmaker",
        "videographer",
      ]);
    case "documentary-interviews":
      return includesAny(searchField, ["documentary", "interview"]);
  }
}

type VideoCategoryDiscoveryProps = {
  readonly videos: readonly MediaFeature[];
};

export function VideoCategoryDiscovery({
  videos,
}: VideoCategoryDiscoveryProps) {
  const lensResults = useMemo(
    () =>
      discoveryLenses.map((lens) => ({
        ...lens,
        videos: videos.filter((video) => matchesLens(video, lens.id)),
      })),
    [videos],
  );
  const [activeLensId, setActiveLensId] = useState<DiscoveryLensId>(() => {
    const firstAvailableLens = discoveryLenses.find((lens) =>
      videos.some((video) => matchesLens(video, lens.id)),
    );

    return firstAvailableLens?.id ?? discoveryLenses[0].id;
  });
  const activeLens =
    lensResults.find((lens) => lens.id === activeLensId) ?? lensResults[0];

  return (
    <div>
      <div
        aria-label="Video discovery categories"
        className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-5"
      >
        {lensResults.map((lens) => {
          const isActive = lens.id === activeLens.id;
          const isUnavailable = lens.videos.length === 0;

          return (
            <button
              key={lens.id}
              type="button"
              aria-pressed={isActive}
              disabled={isUnavailable}
              onClick={() => setActiveLensId(lens.id)}
              className={`min-h-20 px-4 py-3 text-left transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:text-muted/55 ${
                isActive
                  ? "bg-accent text-canvas"
                  : "bg-canvas text-ink hover:bg-surface hover:text-accent"
              }`}
            >
              <span className="block text-xs font-black uppercase leading-5 tracking-[0.08em]">
                {lens.label}
              </span>
              <span className="mt-1 block font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-75">
                {isUnavailable
                  ? "Awaiting media"
                  : `${String(lens.videos.length).padStart(2, "0")} records`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3 border-l-2 border-accent pl-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">
            Selected lens
          </p>
          <h3 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">
            {activeLens.label}
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted">
          {activeLens.description}
        </p>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {activeLens.videos.length} {activeLens.label} video records.
      </p>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {activeLens.videos.slice(0, 6).map((video) => (
          <VideoCard key={video.slug} video={video} />
        ))}
      </div>
    </div>
  );
}
