import { createHash } from "node:crypto";

import type { RankingDimensions } from "@/lib/data-ops/providers/types";

export type RankingSystemMatchOutcome =
  | "EXACT_MATCH"
  | "EXTERNAL_ONLY_NEW_SYSTEM"
  | "AMBIGUOUS_REVIEW"
  | "UNSUPPORTED"
  | "UNKNOWN";

export type SourceRankingSystem = {
  readonly providerSlug: string;
  readonly externalSystemKey?: string;
  readonly sourceUrl: string;
  readonly title: string;
  readonly supported: boolean;
  readonly dimensions: RankingDimensions;
};

export type ExistingRankingSystem = {
  readonly id: string;
  readonly providerSlug: string;
  readonly externalSystemKey?: string;
  readonly sourceUrl?: string;
  readonly title: string;
  readonly dimensions: RankingDimensions;
};

export type RankingSystemMatch = {
  readonly outcome: RankingSystemMatchOutcome;
  readonly systemId?: string;
  readonly candidateIds: readonly string[];
  readonly reason: string;
};

const DIMENSION_KEYS = [
  "gender", "liftFormat", "division", "weightClass", "methodology",
  "category", "equipment", "geographicScope",
] as const satisfies readonly (keyof RankingDimensions)[];

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim().toLowerCase().replace(/\s+/g, " ");
  return result || undefined;
}

export function canonicalRankingDimensions(dimensions: RankingDimensions): RankingDimensions {
  return Object.fromEntries(DIMENSION_KEYS.flatMap((key) => {
    const value = normalized(dimensions[key]);
    return value ? [[key, value]] : [];
  })) as RankingDimensions;
}

export function rankingSystemIdentity(providerSlug: string, externalSystemKey: string): string {
  return createHash("sha256")
    .update(`${normalized(providerSlug)}:${externalSystemKey.trim().toLowerCase()}`)
    .digest("hex");
}

function dimensionsExactlyAgree(source: RankingDimensions, existing: RankingDimensions): boolean {
  const left = canonicalRankingDimensions(source);
  const right = canonicalRankingDimensions(existing);
  return DIMENSION_KEYS.every((key) => left[key] === right[key]);
}

export function matchRankingSystem(
  source: SourceRankingSystem,
  existingSystems: readonly ExistingRankingSystem[],
): RankingSystemMatch {
  if (!source.supported) {
    return { outcome: "UNSUPPORTED", candidateIds: [], reason: "The source surface has no supported deterministic row parser." };
  }
  if (!source.externalSystemKey || !source.dimensions.category || !source.dimensions.liftFormat) {
    return { outcome: "UNKNOWN", candidateIds: [], reason: "Required source identity or structured dimensions are unknown." };
  }

  const providerSystems = existingSystems.filter(
    (system) => normalized(system.providerSlug) === normalized(source.providerSlug),
  );
  const identityMatches = providerSystems.filter(
    (system) => system.externalSystemKey === source.externalSystemKey,
  );
  if (identityMatches.length === 1) {
    const match = identityMatches[0];
    if (!dimensionsExactlyAgree(source.dimensions, match.dimensions)) {
      return {
        outcome: "AMBIGUOUS_REVIEW",
        candidateIds: [match.id],
        reason: "The stable external key exists, but its stored structured dimensions conflict with the source.",
      };
    }
    return { outcome: "EXACT_MATCH", systemId: match.id, candidateIds: [match.id], reason: "Provider, stable external key, and every structured dimension agree." };
  }
  if (identityMatches.length > 1) {
    return { outcome: "AMBIGUOUS_REVIEW", candidateIds: identityMatches.map((item) => item.id), reason: "Multiple systems claim the same provider-native identity." };
  }

  const structuredMatches = providerSystems.filter(
    (system) => dimensionsExactlyAgree(source.dimensions, system.dimensions),
  );
  if (structuredMatches.length === 1) {
    return { outcome: "EXACT_MATCH", systemId: structuredMatches[0].id, candidateIds: [structuredMatches[0].id], reason: "Provider and every structured dimension agree; title was not used as an identity key." };
  }
  if (structuredMatches.length > 1) {
    return { outcome: "AMBIGUOUS_REVIEW", candidateIds: structuredMatches.map((item) => item.id), reason: "Multiple systems share all structured dimensions." };
  }
  return { outcome: "EXTERNAL_ONLY_NEW_SYSTEM", candidateIds: [], reason: "Legitimate external system has no equivalent provider system." };
}
