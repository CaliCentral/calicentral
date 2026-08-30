import { createHash } from "node:crypto";

import { resolveExternalIdentity, stableDataOpsUuid, type ExistingExternalIdentity } from "@/lib/data-ops/identity";
import { OFFICIAL_STREETLIFTING_PROVIDER } from "@/lib/data-ops/providers/official-streetlifting";
import type {
  OfficialStreetliftingCompetition,
  OfficialStreetliftingRanking,
  OfficialStreetliftingResult,
} from "@/lib/data-ops/providers/types";

export type ExistingCompetitionIdentity = ExistingExternalIdentity & {
  readonly startDate?: string;
};

export type OfficialStreetliftingImportPlan = {
  readonly athletes: readonly {
    readonly externalId: string;
    readonly canonicalId?: string;
    readonly state: "new" | "matched" | "ambiguous";
    readonly sourceUrl: string;
    readonly sourceName: string;
  }[];
  readonly competitions: readonly {
    readonly externalId: string;
    readonly canonicalId?: string;
    readonly state: "new" | "matched" | "ambiguous";
    readonly sourceUrl: string;
    readonly name: string;
    readonly startDate?: string;
    readonly dateChanged: boolean;
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
    readonly entries: readonly { readonly athleteCanonicalId?: string; readonly rank?: number; readonly blocked: boolean }[];
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
}): OfficialStreetliftingImportPlan {
  const warnings: string[] = [];
  const errors: string[] = [];
  const allResults = uniqueResults([
    ...input.results,
    ...input.rankings.flatMap((ranking) => ranking.entries),
  ], errors);
  const athleteFacts = new Map<string, { name: string; sourceUrl: string }>();
  for (const result of allResults) {
    const existing = athleteFacts.get(result.athleteExternalId);
    if (existing && (existing.name !== result.athleteName || existing.sourceUrl !== result.athleteSourceUrl)) {
      errors.push(`Conflicting athlete facts share external athlete ID ${result.athleteExternalId}.`);
      continue;
    }
    athleteFacts.set(result.athleteExternalId, { name: result.athleteName, sourceUrl: result.athleteSourceUrl });
  }
  const athletes = [...athleteFacts].map(([externalId, fact]) => {
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
      sourceUrl: fact.sourceUrl,
      sourceName: fact.name,
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
    return {
      externalId: competition.externalId,
      ...(resolution.state !== "ambiguous" ? { canonicalId: resolution.canonicalId } : {}),
      state: resolution.state,
      sourceUrl: competition.sourceUrl,
      name: competition.name,
      ...(competition.startDate ? { startDate: competition.startDate } : {}),
      dateChanged: Boolean(exactExisting?.startDate && competition.startDate && exactExisting.startDate !== competition.startDate),
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

  const rankingSnapshots = input.rankings.map((ranking) => {
    const systemKey = [ranking.category, ranking.gender, ranking.weightClass, ranking.division].filter(Boolean).join("|").toLowerCase();
    const systemId = stableDataOpsUuid("calicentral:official-streetlifting:ranking-system", systemKey);
    const contentHash = contentIdentity(ranking.entries.map((entry) => ({
      externalResultId: entry.externalResultId,
      athleteExternalId: entry.athleteExternalId,
      position: entry.position,
      totalKg: entry.totalKg,
      score: entry.score,
    })));
    return {
      id: stableDataOpsUuid("calicentral:official-streetlifting:ranking-snapshot", `${systemKey}:${input.observedOn}:${contentHash}`),
      systemId,
      sourceUrl: ranking.sourceUrl,
      observedOn: input.observedOn,
      contentHash,
      entries: ranking.entries.map((entry) => {
        const athlete = athleteByExternalId.get(entry.athleteExternalId);
        return {
          ...(athlete?.canonicalId ? { athleteCanonicalId: athlete.canonicalId } : {}),
          ...(entry.position !== undefined ? { rank: entry.position } : {}),
          blocked: !athlete?.canonicalId,
        };
      }),
    };
  });

  return { athletes, competitions, results, rankingSnapshots, warnings, errors };
}
