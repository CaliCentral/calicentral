import { createHash } from "node:crypto";

import type { OfficialStreetliftingCompetition, RawSourceSnapshot } from "@/lib/data-ops/providers/types";

export type CompetitionDiscoverySurface = {
  readonly key: "upcoming" | "past";
  readonly initialUrl: string;
};

export type CompetitionSourceProvider = {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly allowedDomains: readonly string[];
  readonly status: "active" | "paused";
  readonly trustLevel: "official" | "authoritative" | "review-required";
  readonly parserVersion: string;
  readonly cadenceMinutes: number;
  readonly capabilities: readonly ("competitions" | "athletes" | "results" | "rankings" | "rosters")[];
  readonly identityStrategy: string;
  readonly maxPagesPerSurface: number;
  readonly surfaces: readonly CompetitionDiscoverySurface[];
  readonly parseCompetitionList: (html: string) => readonly OfficialStreetliftingCompetition[];
  readonly parsePagination: (html: string, currentUrl: string) => readonly string[];
};

export type ExistingCompetitionRecord = {
  readonly canonicalId: string;
  readonly provider: string;
  readonly externalId: string;
  readonly name?: string;
  readonly startDate?: string;
  readonly status?: string;
  readonly location?: string;
  readonly style?: string;
  readonly sourceUrl?: string;
};

export type CompetitionDiscoveryDecision = {
  readonly externalId: string;
  readonly canonicalId?: string;
  readonly state: "new" | "matched" | "updated" | "unchanged" | "ambiguous";
  readonly changedFields: readonly string[];
  readonly source: OfficialStreetliftingCompetition;
};

export type CompetitionDiscoveryReport = {
  readonly provider: string;
  readonly surfaces: readonly {
    readonly key: string;
    readonly pagesChecked: number;
    readonly eventsFound: number;
    readonly failedPages: readonly { readonly url: string; readonly error: string }[];
  }[];
  readonly snapshots: readonly RawSourceSnapshot[];
  readonly decisions: readonly CompetitionDiscoveryDecision[];
  readonly missingFromCompleteDiscovery: readonly ExistingCompetitionRecord[];
  readonly resultPages: readonly string[];
  readonly sourceHealth: "healthy" | "degraded" | "failing";
  readonly runKey: string;
};

function normalized(value: string | undefined): string | undefined {
  return value?.trim().replace(/\s+/g, " ") || undefined;
}

function changedFields(source: OfficialStreetliftingCompetition, existing: ExistingCompetitionRecord): string[] {
  const comparisons: readonly [string, string | undefined, string | undefined][] = [
    ["name", source.name, existing.name],
    ["startDate", source.startDate, existing.startDate],
    ["status", source.sourceStatus.toLowerCase(), existing.status?.toLowerCase()],
    ["location", source.location, existing.location],
    ["style", source.style, existing.style],
    ["sourceUrl", source.sourceUrl, existing.sourceUrl],
  ];
  return comparisons.flatMap(([field, next, current]) => (
    current !== undefined && normalized(next) !== normalized(current) ? [field] : []
  ));
}

export async function discoverCompetitions(input: {
  readonly provider: CompetitionSourceProvider;
  readonly fetchPage: (url: string) => Promise<RawSourceSnapshot>;
  readonly existing?: readonly ExistingCompetitionRecord[];
}): Promise<CompetitionDiscoveryReport> {
  const snapshots: RawSourceSnapshot[] = [];
  const discovered = new Map<string, OfficialStreetliftingCompetition>();
  const surfaceReports: CompetitionDiscoveryReport["surfaces"][number][] = [];
  let completedAllSurfaces = true;

  for (const surface of input.provider.surfaces) {
    const pending = [surface.initialUrl];
    const visited = new Set<string>();
    const surfaceIds = new Set<string>();
    const failedPages: { url: string; error: string }[] = [];
    while (pending.length && visited.size < input.provider.maxPagesPerSurface) {
      const url = pending.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      try {
        const snapshot = await input.fetchPage(url);
        snapshots.push(snapshot);
        for (const competition of input.provider.parseCompetitionList(snapshot.body)) {
          const prior = discovered.get(competition.externalId);
          if (prior && JSON.stringify(prior) !== JSON.stringify(competition)) {
            failedPages.push({ url, error: `Conflicting source facts for external competition ${competition.externalId}.` });
            continue;
          }
          discovered.set(competition.externalId, competition);
          surfaceIds.add(competition.externalId);
        }
        for (const next of input.provider.parsePagination(snapshot.body, snapshot.sourceUrl)) {
          if (!visited.has(next)) pending.push(next);
        }
      } catch (error) {
        completedAllSurfaces = false;
        failedPages.push({ url, error: error instanceof Error ? error.message : "Unknown source failure" });
      }
    }
    if (pending.length) {
      completedAllSurfaces = false;
      failedPages.push({ url: pending[0], error: "Provider page limit reached before pagination completed." });
    }
    surfaceReports.push({ key: surface.key, pagesChecked: visited.size, eventsFound: surfaceIds.size, failedPages });
  }

  const existing = input.existing ?? [];
  const decisions = [...discovered.values()].sort((left, right) => left.externalId.localeCompare(right.externalId)).map((source) => {
    const matches = existing.filter((item) => item.provider === input.provider.id && item.externalId === source.externalId);
    if (matches.length > 1) return { externalId: source.externalId, state: "ambiguous" as const, changedFields: [], source };
    if (!matches.length) return { externalId: source.externalId, state: "new" as const, changedFields: [], source };
    const changed = changedFields(source, matches[0]);
    return {
      externalId: source.externalId,
      canonicalId: matches[0].canonicalId,
      state: changed.length ? "updated" as const : "unchanged" as const,
      changedFields: changed,
      source,
    };
  });
  const missingFromCompleteDiscovery = completedAllSurfaces
    ? existing.filter((item) => item.provider === input.provider.id && !discovered.has(item.externalId))
    : [];
  const failures = surfaceReports.reduce((sum, surface) => sum + surface.failedPages.length, 0);
  const sourceHealth = failures === 0 ? "healthy" : snapshots.length ? "degraded" : "failing";
  const resultPages = decisions.filter((item) => item.source.sourceStatus.toLowerCase() === "completed").map((item) => item.source.sourceUrl);
  const runKey = createHash("sha256").update(JSON.stringify({
    provider: input.provider.id,
    snapshots: snapshots.map((item) => [item.sourceUrl, item.contentHash]),
  })).digest("hex");
  return {
    provider: input.provider.id,
    surfaces: surfaceReports,
    snapshots,
    decisions,
    missingFromCompleteDiscovery,
    resultPages,
    sourceHealth,
    runKey,
  };
}
