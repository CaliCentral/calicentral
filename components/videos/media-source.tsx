import {
  formatPlatformMetric,
  safeMediaSourceUrl,
} from "@/lib/media/provenance";
import type { MediaFeature } from "@/types/video";

type MediaSourceProps = {
  readonly video: MediaFeature;
  readonly compact?: boolean;
};

export function MediaSource({ video, compact = false }: MediaSourceProps) {
  const originalPostUrl = safeMediaSourceUrl(video.source?.originalPostUrl);
  const metrics = video.platformMetrics ?? [];
  const sourceLabel = video.source
    ? [video.source.platform, video.source.account].filter(Boolean).join(" / ")
    : "Source attribution not published";

  return (
    <div
      className={
        compact
          ? "border-t border-white/12 pt-4"
          : "border border-white/15 bg-surface p-5 sm:p-6"
      }
    >
      <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
        Source / Attribution
      </p>
      <p className="mt-2 text-sm font-bold uppercase leading-5 text-ink">
        {sourceLabel}
      </p>
      {video.source?.ownershipStatus === "third-party-attributed" ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          Third-party media remains owned by and attributed to its original
          source.
        </p>
      ) : video.source?.ownershipStatus === "cali-central-original" ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          Cali Central original editorial media.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted">
          Ownership and original-post details are not available for this
          record.
        </p>
      )}

      {originalPostUrl ? (
        <a
          href={originalPostUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent underline decoration-accent/50 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Open original post ↗
        </a>
      ) : null}

      <div className="mt-4 border-t border-white/12 pt-4">
        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
          Platform metrics
        </p>
        {metrics.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-xs font-bold uppercase leading-5 text-ink">
            {metrics.map((metric, index) => (
              <li key={`${metric.platform}-${metric.label}-${index}`}>
                {formatPlatformMetric(metric)}
                {metric.observedAt ? ` · observed ${metric.observedAt}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs leading-5 text-muted">
            External view counts are unavailable. No cross-platform total is
            estimated.
          </p>
        )}
      </div>
    </div>
  );
}
