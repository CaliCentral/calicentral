"use client";

import { useMemo, useState } from "react";

import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { VideoCard } from "@/components/videos/video-card";
import type {
  MediaFeature,
  VideoCategory,
  VideoFormat,
  VideoSeriesSlug,
} from "@/types/video";

type SortOption = "episode" | "newest" | "runtime-asc" | "runtime-desc";

type VideoArchiveProps = {
  readonly videos: readonly MediaFeature[];
};

const fieldClassName =
  "min-h-12 w-full border border-white/18 bg-canvas px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function VideoArchive({ videos }: VideoArchiveProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VideoCategory | "all">("all");
  const [series, setSeries] = useState<VideoSeriesSlug | "all">("all");
  const [format, setFormat] = useState<VideoFormat | "all">("all");
  const [sort, setSort] = useState<SortOption>("episode");

  const categories = useMemo(
    () => [...new Set(videos.map((video) => video.category))].sort(),
    [videos],
  );
  const seriesOptions = useMemo(
    () =>
      [...new Map(videos.map((video) => [video.seriesSlug, video])).values()]
        .map((video) => ({
          slug: video.seriesSlug,
          title: video.seriesTitle,
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [videos],
  );
  const formats = useMemo(
    () => [...new Set(videos.map((video) => video.format))].sort(),
    [videos],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return videos
      .filter((video) => {
        const searchField = [
          video.title,
          video.seriesTitle,
          video.category,
          video.format,
          video.location,
          ...video.tags,
        ]
          .join(" ")
          .toLocaleLowerCase();

        return (
          (!normalizedQuery || searchField.includes(normalizedQuery)) &&
          (category === "all" || video.category === category) &&
          (series === "all" || video.seriesSlug === series) &&
          (format === "all" || video.format === format)
        );
      })
      .sort((a, b) => {
        if (sort === "newest") {
          return b.publishedDate.localeCompare(a.publishedDate);
        }
        if (sort === "runtime-asc") {
          return a.durationSeconds - b.durationSeconds;
        }
        if (sort === "runtime-desc") {
          return b.durationSeconds - a.durationSeconds;
        }
        return a.episodeNumber.localeCompare(b.episodeNumber);
      });
  }, [category, format, query, series, sort, videos]);

  const hasActiveFilters =
    query !== "" ||
    category !== "all" ||
    series !== "all" ||
    format !== "all" ||
    sort !== "episode";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setSeries("all");
    setFormat("all");
    setSort("episode");
  }

  if (videos.length === 0) {
    return (
      <ContentEmptyState
        eyebrow="Video archive / Awaiting publication"
        title="No video records are published"
        description="The public video archive is being prepared. Published media records will appear here."
      />
    );
  }

  return (
    <div>
      <div className="border border-white/15 bg-surface p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(15rem,1.45fr)_repeat(4,minmax(8.5rem,0.7fr))]">
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Search the archive
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, series, place…"
              className={fieldClassName}
            />
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as VideoCategory | "all")
              }
              className={fieldClassName}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Series
            </span>
            <select
              value={series}
              onChange={(event) =>
                setSeries(event.target.value as VideoSeriesSlug | "all")
              }
              className={fieldClassName}
            >
              <option value="all">All series</option>
              {seriesOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Format
            </span>
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as VideoFormat | "all")
              }
              className={fieldClassName}
            >
              <option value="all">All formats</option>
              {formats.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={fieldClassName}
            >
              <option value="episode">Episode / Ascending</option>
              <option value="newest">Published / Newest</option>
              <option value="runtime-asc">Runtime / Shortest</option>
              <option value="runtime-desc">Runtime / Longest</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-4">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink"
          >
            {String(results.length).padStart(2, "0")}{" "}
            {results.length === 1 ? "archive record" : "archive records"}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          ) : (
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
              Static previews / No playback
            </p>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((video) => (
            <VideoCard key={video.slug} video={video} />
          ))}
        </div>
      ) : (
        <div className="mt-7 border border-dashed border-white/25 bg-surface px-5 py-14 text-center sm:px-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            No matching archive records
          </p>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink">
            Reset the frame and try again.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
            No fictional media record currently matches this combination of
            search and filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 min-h-12 border border-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
