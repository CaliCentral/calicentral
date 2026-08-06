import type {
  VideoPlatformMetric,
  VideoSourceAttribution,
} from "@/types/video";

export function safeMediaSourceUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    return (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function hasCompleteMediaAttribution(
  source: VideoSourceAttribution | undefined,
) {
  if (!source || source.ownershipStatus === "source-unavailable") {
    return false;
  }

  if (source.ownershipStatus === "third-party-attributed") {
    return Boolean(safeMediaSourceUrl(source.originalPostUrl));
  }

  return source.platform === "Cali Central";
}

export function formatPlatformMetric(metric: VideoPlatformMetric) {
  const value = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(metric.value);

  return `${value} ${metric.label.toLocaleLowerCase()} on ${metric.platform}`;
}
