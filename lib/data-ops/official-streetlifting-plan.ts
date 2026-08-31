import { createHash } from "node:crypto";

import { resolveExternalIdentity, stableDataOpsUuid, type ExistingExternalIdentity } from "@/lib/data-ops/identity";
import { OFFICIAL_STREETLIFTING_PROVIDER } from "@/lib/data-ops/providers/official-streetlifting";
import {
  matchRankingSystem,
  type ExistingRankingSystem,
  type RankingSystemMatchOutcome,
} from "@/lib/data-ops/ranking-system-matcher";
import type {
  OfficialStreetliftingCompetition,
  OfficialStreetliftingRanking,
  OfficialStreetliftingResult,
} from "@/lib/data-ops/providers/types";

export type ExistingCompetitionIdentity = ExistingExternalIdentity & {
  readonly startDate?: string;
  readonly status?: string;
};

export type NormalizedCompetitionStatus = "upcoming" | "completed" | "cancelled" | "postponed" | "delayed" | "unknown";

/**
 * Maps the source's own explicit status text to a normalized value. Every
 * mapped case comes from positive source evidence -- an explicit badge, or
 * (for "upcoming") the page's own section heading (see
 * lib/data-ops/providers/official-streetlifting.ts) -- never inferred from
 * what's missing. Anything not explicitly recognized stays "unknown" rather
 * than being guessed.
 */
export function normalizeCompetitionSourceStatus(sourceStatus: string): NormalizedCompetitionStatus {
  switch (sourceStatus) {
    case "Upcoming": return "upcoming";
    case "Completed": return "completed";
    case "Cancelled": return "cancelled";
    case "Postponed": return "postponed";
    case "Delayed": return "delayed";
    default: return "unknown";
  }
}

export type OfficialStreetliftingImportPlan = {
  readonly athletes: readonly {
    readonly externalId: string;
    readonly canonicalId?: string;
    readonly state: "new" | "matched" | "ambiguous";
    readonly sourceUrl: string;
    readonly sourceName: string;
    readonly sourceAliases: readonly string[];
  }[];
  readonly competitions: readonly {
    readonly externalId: string;
    readonly canonicalId?: string;
    readonly state: "new" | "matched" | "ambiguous";
    readonly sourceUrl: string;
    readonly name: string;
    readonly startDate?: string;
    readonly dateChanged: boolean;
    readonly status: NormalizedCompetitionStatus;
    readonly statusChanged: boolean;
  }[];
  readonly results: readonly {
    readonly id: string;
    readonly externalResultId: string;
    readonly athleteCanonicalId?: string;
    readonly competitionCanonicalId?: string;
    readonly blocked: boolean;
    readonly source: OfficialStreetliftingResult;
  }[];
  readonly rankingSnapshots: readonly {
    readonly id: string;
    readonly systemId: string;
    readonly sourceUrl: string;
    readonly observedOn: string;
    readonly contentHash: string;
    readonly entries: readonly {
      readonly athleteCanonicalId?: string;
      readonly athleteExternalId: string;
      readonly externalEntryId: string;
      readonly sourceDisplayName: string;
      readonly rank?: number;
      readonly unresolved: boolean;
    }[];
  }[];
  readonly rankingSystems: readonly {
    readonly stableKey: string;
    readonly systemId?: string;
    readonly outcome: RankingSystemMatchOutcome;
    readonly candidateIds: readonly string[];
    readonly reason: string;
    readonly source: OfficialStreetliftingRanking;
  }[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
};

function contentIdentity(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function uniqueResults(results: readonly OfficialStreetliftingResult[], errors: string[]): OfficialStreetliftingResult[] {
  const records = new Map<string, OfficialStreetliftingResult>();
  for (const result of results) {
    const existing = records.get(result.externalResultId);
    if (existing && contentIdentity(existing) !== contentIdentity(result)) {
      errors.push(`Conflicting result rows share external result ID ${result.externalResultId}.`);
      continue;
    }
    records.set(result.externalResultId, result);
  }
  return [...records.values()];
}

export function planOfficialStreetliftingImport(input: {
  readonly competitions: readonly OfficialStreetliftingCompetition[];
  readonly results: readonly OfficialStreetliftingResult[];
  readonly rankings: readonly OfficialStreetliftingRanking[];
  readonly observedOn: string;
  readonly existingAthleteIdentities?: readonly ExistingExternalIdentity[];
  readonly existingCompetitionIdentities?: readonly ExistingCompetitionIdentity[];
  readonly existingRankingSystems?: readonly ExistingRankingSystem[];
}): OfficialStreetliftingImportPlan {
  const warnings: string[] = [];
  const errors: string[] = [];
  const allResults = uniqueResults([
    ...input.results,
    ...input.rankings.flatMap((ranking) => ranking.entries),
  ], errors);
  const athleteFacts = new Map<string, { names: Set<string>; sourceUrls: Set<string> }>();
  for (const result of allResults) {
    const existing = athleteFacts.get(result.athleteExternalId);
    if (existing) {
      existing.names.add(result.athleteName);
      existing.sourceUrls.add(result.athleteSourceUrl);
    } else {
      athleteFacts.set(result.athleteExternalId, {
        names: new Set([result.athleteName]),
        sourceUrls: new Set([result.athleteSourceUrl]),
      });
    }
  }
  const athletes = [...athleteFacts].map(([externalId, fact]) => {
    const names = [...fact.names].sort((left, right) => left.localeCompare(right));
    const sourceUrls = [...fact.sourceUrls].sort();
    if (names.length > 1) warnings.push(`Athlete ${externalId} has source display-name variants retained for review: ${names.join(" | ")}.`);
    if (sourceUrls.length > 1) warnings.push(`Athlete ${externalId} has multiple source URLs retained for review: ${sourceUrls.join(" | ")}.`);
    const resolution = resolveExternalIdentity({
      provider: OFFICIAL_STREETLIFTING_PROVIDER,
      externalId,
      existing: input.existingAthleteIdentities ?? [],
      newIdNamespace: "calicentral:official-streetlifting:athlete",
    });
    if (resolution.state === "ambiguous") warnings.push(`Athlete ${externalId} has ambiguous existing external identity mappings.`);
    return {
      externalId,
      ...(resolution.state !== "ambiguous" ? { canonicalId: resolution.canonicalId } : {}),
      state: resolution.state,
      sourceUrl: sourceUrls[0],
      sourceName: names[0],
      sourceAliases: names,
    };
  }).sort((left, right) => left.externalId.localeCompare(right.externalId));
  const athleteByExternalId = new Map(athletes.map((athlete) => [athlete.externalId, athlete]));

  const competitions = input.competitions.map((competition) => {
    const resolution = resolveExternalIdentity({
      provider: OFFICIAL_STREETLIFTING_PROVIDER,
      externalId: competition.externalId,
      existing: input.existingCompetitionIdentities ?? [],
      newIdNamespace: "calicentral:official-streetlifting:competition",
    });
    const exactExisting = (input.existingCompetitionIdentities ?? []).find(
      (identity) => identity.provider === OFFICIAL_STREETLIFTING_PROVIDER && identity.externalId === competition.externalId,
    );
    if (resolution.state === "ambiguous") warnings.push(`Competition ${competition.externalId} has ambiguous existing external identity mappings.`);
    const status = normalizeCompetitionSourceStatus(competition.sourceStatus);
    return {
      externalId: competition.externalId,
      ...(resolution.state !== "ambiguous" ? { canonicalId: resolution.canonicalId } : {}),
      state: resolution.state,
      sourceUrl: competition.sourceUrl,
      name: competition.name,
      ...(competition.startDate ? { startDate: competition.startDate } : {}),
      dateChanged: Boolean(exactExisting?.startDate && competition.startDate && exactExisting.startDate !== competition.startDate),
      status,
      statusChanged: Boolean(exactExisting?.status && exactExisting.status !== status),
    };
  }).sort((left, right) => left.externalId.localeCompare(right.externalId));
  const competitionByExternalId = new Map(competitions.map((competition) => [competition.externalId, competition]));

  const results = allResults.map((result) => {
    const athlete = athleteByExternalId.get(result.athleteExternalId);
    const competition = result.competitionExternalId
      ? competitionByExternalId.get(result.competitionExternalId)
      : undefined;
    const blocked = !athlete?.canonicalId || (Boolean(result.competitionExternalId) && !competition?.canonicalId);
    return {
      id: stableDataOpsUuid("calicentral:official-streetlifting:result", result.externalResultId),
      externalResultId: result.externalResultId,
      ...(athlete?.canonicalId ? { athleteCanonicalId: athlete.canonicalId } : {}),
      ...(competition?.canonicalId ? { competitionCanonicalId: competition.canonicalId } : {}),
      blocked,
      source: result,
    };
  });

  const rankingsByStableKey = new Map<string, OfficialStreetliftingRanking>();
  for (const ranking of input.rankings) {
    const existing = rankingsByStableKey.get(ranking.stableKey);
    if (!existing) {
      rankingsByStableKey.set(ranking.stableKey, ranking);
      continue;
    }
    if (contentIdentity({ ...existing, entries: [] }) !== contentIdentity({ ...ranking, entries: [] })) {
      errors.push(`Ranking pages for ${ranking.stableKey} disagree on system metadata.`);
      continue;
    }
    const entries = uniqueResults([...existing.entries, ...ranking.entries], errors)
      .sort((left, right) => (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER));
    rankingsByStableKey.set(ranking.stableKey, { ...existing, entries });
  }

  const rankingSystems = [...rankingsByStableKey.values()].map((ranking) => {
    const match = matchRankingSystem({
      providerSlug: OFFICIAL_STREETLIFTING_PROVIDER,
      externalSystemKey: ranking.stableKey,
      sourceUrl: ranking.sourceUrl,
      title: ranking.title,
      supported: Boolean(ranking.liftFormat && ranking.gender),
      dimensions: {
        ...(ranking.gender ? { gender: ranking.gender } : {}),
        ...(ranking.liftFormat ? { liftFormat: ranking.liftFormat } : {}),
        ...(ranking.division ? { division: ranking.division } : {}),
        ...(ranking.weightClass ? { weightClass: ranking.weightClass } : {}),
        ...(ranking.methodology ? { methodology: ranking.methodology } : {}),
        category: ranking.category,
        ...(ranking.equipment ? { equipment: ranking.equipment } : {}),
        geographicScope: "world",
      },
    }, input.existingRankingSystems ?? []);
    const proposedId = stableDataOpsUuid("calicentral:official-streetlifting:ranking-system", ranking.stableKey);
    return {
      stableKey: ranking.stableKey,
      ...(match.outcome === "EXACT_MATCH" ? { systemId: match.systemId } : {}),
      ...(match.outcome === "EXTERNAL_ONLY_NEW_SYSTEM" ? { systemId: proposedId } : {}),
      outcome: match.outcome,
      candidateIds: match.candidateIds,
      reason: match.reason,
      source: ranking,
    };
  });

  const rankingSnapshots = rankingSystems.flatMap((system) => {
    const ranking = system.source;
    if (!system.systemId || !["EXACT_MATCH", "EXTERNAL_ONLY_NEW_SYSTEM"].includes(system.outcome)) return [];
    const systemKey = ranking.stableKey;
    const systemId = system.systemId;
    const contentHash = contentIdentity(ranking.entries.map((entry) => ({
      externalResultId: entry.externalResultId,
      athleteExternalId: entry.athleteExternalId,
      position: entry.position,
      totalKg: entry.totalKg,
      score: entry.score,
    })));
    return [{
      id: stableDataOpsUuid("calicentral:official-streetlifting:ranking-snapshot", `${systemKey}:${contentHash}`),
      systemId,
      sourceUrl: ranking.sourceUrl,
      observedOn: input.observedOn,
      contentHash,
      entries: ranking.entries.map((entry) => {
        const athlete = athleteByExternalId.get(entry.athleteExternalId);
        return {
          ...(athlete?.canonicalId ? { athleteCanonicalId: athlete.canonicalId } : {}),
          athleteExternalId: entry.athleteExternalId,
          externalEntryId: entry.externalResultId,
          sourceDisplayName: entry.athleteName,
          ...(entry.position !== undefined ? { rank: entry.position } : {}),
          unresolved: !athlete?.canonicalId,
        };
      }),
    }];
  });

  for (const system of rankingSystems) {
    if (system.outcome === "AMBIGUOUS_REVIEW") warnings.push(`Ranking system ${system.stableKey} requires review: ${system.reason}`);
    if (system.outcome === "UNKNOWN" || system.outcome === "UNSUPPORTED") warnings.push(`Ranking system ${system.stableKey} was not imported: ${system.reason}`);
  }

  return { athletes, competitions, results, rankingSystems, rankingSnapshots, warnings, errors };
}
