import type { AthleteRankingSnapshot } from "@/types/ranking-source";

export function addPreviousRankingPositions(
  snapshots: readonly AthleteRankingSnapshot[],
): readonly AthleteRankingSnapshot[] {
  const bySystem = new Map<string, AthleteRankingSnapshot[]>();
  for (const snapshot of snapshots) {
    const group = bySystem.get(snapshot.systemSlug) ?? [];
    group.push(snapshot);
    bySystem.set(snapshot.systemSlug, group);
  }
  return [...bySystem.values()].flatMap((group) => {
    const ordered = [...group].sort((left, right) => right.rankingDate.localeCompare(left.rankingDate));
    return ordered.map((snapshot, index) => {
      const prior = ordered[index + 1];
      if (!prior) return snapshot;
      const priorPositions = new Map(prior.entries.flatMap((entry) => {
        const identity = entry.athleteId ?? entry.externalAthleteId;
        return identity && entry.position !== undefined ? [[identity, entry.position] as const] : [];
      }));
      return {
        ...snapshot,
        entries: snapshot.entries.map((entry) => {
          const identity = entry.athleteId ?? entry.externalAthleteId;
          const previousPosition = identity ? priorPositions.get(identity) : undefined;
          return previousPosition === undefined ? entry : { ...entry, previousPosition };
        }),
      };
    });
  });
}
