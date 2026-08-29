export type WclStanding = {
  readonly teamId: string;
  readonly matchWins: number;
  readonly matchPointsFor: number;
  readonly matchPointsAgainst: number;
  readonly specialtyDivisionWins: number;
  readonly finalStandWins: number;
  readonly completedFinalStandTimes: readonly number[];
};

export type WclStandingResolution = WclStanding & { readonly requiresPlayoff: boolean };

function average(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : Infinity;
}

export function rankWclStandings(
  standings: readonly WclStanding[],
  headToHeadWins: Readonly<Record<string, number>> = {},
): WclStandingResolution[] {
  const sorted = standings.slice().sort((a, b) =>
    b.matchWins - a.matchWins ||
    (headToHeadWins[`${b.teamId}:${a.teamId}`] ?? 0) - (headToHeadWins[`${a.teamId}:${b.teamId}`] ?? 0) ||
    (b.matchPointsFor - b.matchPointsAgainst) - (a.matchPointsFor - a.matchPointsAgainst) ||
    b.specialtyDivisionWins - a.specialtyDivisionWins ||
    b.finalStandWins - a.finalStandWins ||
    average(a.completedFinalStandTimes) - average(b.completedFinalStandTimes) ||
    a.teamId.localeCompare(b.teamId),
  );

  return sorted.map((standing, index) => {
    const neighbor = sorted[index === 0 ? 1 : index - 1];
    const requiresPlayoff = Boolean(neighbor) &&
      standing.matchWins === neighbor.matchWins &&
      (headToHeadWins[`${standing.teamId}:${neighbor.teamId}`] ?? 0) ===
        (headToHeadWins[`${neighbor.teamId}:${standing.teamId}`] ?? 0) &&
      standing.matchPointsFor - standing.matchPointsAgainst === neighbor.matchPointsFor - neighbor.matchPointsAgainst &&
      standing.specialtyDivisionWins === neighbor.specialtyDivisionWins &&
      standing.finalStandWins === neighbor.finalStandWins &&
      average(standing.completedFinalStandTimes) === average(neighbor.completedFinalStandTimes);
    return { ...standing, requiresPlayoff };
  });
}

