import type {
  AdminRankingSnapshotEntry,
  AdminRankingSystem,
} from "@/types/admin-ranking";

export function adminStatusLabel(value: string | undefined): string {
  if (!value) {
    return "Not set";
  }

  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function rankingDimensionsLabel(
  system: AdminRankingSystem | undefined,
): string {
  if (!system) {
    return "Ranking system unavailable";
  }

  const values = [
    system.sexDivision,
    system.category,
    system.division,
    system.weightClass,
    system.geographicScope,
  ].filter((value): value is string => Boolean(value));

  return values.length > 0 ? values.join(" · ") : "Dimensions not set";
}

export function rankingValueLabel(
  entry: AdminRankingSnapshotEntry,
  system: AdminRankingSystem | undefined,
): string {
  if (entry.position !== undefined) {
    return `${system?.geographicScope ?? "Rank"} #${entry.position}`;
  }

  if (entry.points !== undefined) {
    return `${entry.points} points`;
  }

  if (entry.rating !== undefined) {
    return `${entry.rating} rating`;
  }

  return "No published value";
}

export function adminDateLabel(value: string | undefined): string {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}
