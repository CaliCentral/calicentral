import type { VideoOrigin } from "@/types/video";

export const videoOriginLabels: Record<VideoOrigin, string> = {
  "cali-central-original": "Cali Central Original",
  "community-submission": "Community Submission",
  "external-source": "External Source",
};

const videoOriginClassNames: Record<VideoOrigin, string> = {
  "cali-central-original": "border-accent/70 bg-accent/10 text-accent",
  "community-submission": "border-white/30 bg-white/5 text-ink",
  "external-source": "border-white/20 bg-surface text-muted",
};

type VideoOriginLabelProps = {
  readonly origin: VideoOrigin;
  readonly className?: string;
};

export function VideoOriginLabel({
  origin,
  className = "",
}: VideoOriginLabelProps) {
  return (
    <span
      className={`inline-flex w-fit items-center border px-2.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.13em] ${videoOriginClassNames[origin]} ${className}`}
    >
      {videoOriginLabels[origin]}
    </span>
  );
}
