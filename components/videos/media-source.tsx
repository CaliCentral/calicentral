import {
  formatPlatformMetric,
  safeMediaSourceUrl,
} from "@/lib/media/provenance";
import { VideoOriginLabel } from "@/components/videos/video-origin-label";
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
    : video.origin === "cali-central-original"
      ? "Cali Central"
      : "Source attribution not published";

  return (
    <div
      className={
        compact
          ? "border-t border-white/12 pt-4"
          : "border border-white/15 bg-surface p-5 sm:p-6"
      }
    >
      <VideoOriginLabel origin={video.origin} />
      <p className="mt-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
        Source / Attribution
      </p>
      <p className="mt-2 text-sm font-bold uppercase leading-5 text-ink">
        {sourceLabel}
      </p>
      {video.origin === "cali-central-original" ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          Produced or published as Cali Central original editorial media.
        </p>
      ) : video.origin === "community-submission" ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          Accepted from the community for editorial listing. Creator, source,
          and rights details remain attached when available.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted">
          Hosted by a third party and presented with attribution. Cali Central
          does not claim ownership of the original media.
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
            No platform metrics are published. No cross-platform total is
            estimated.
          </p>
        )}
      </div>
    </div>
  );
}
