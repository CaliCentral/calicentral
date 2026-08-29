export type ControlHoldResult = {
  readonly athleteId: string;
  readonly legalAttemptSeconds: readonly number[];
  readonly suddenDeathWon?: boolean;
};

export type ControlHoldAttempt = {
  readonly durationSeconds: number;
  readonly feetOffFloor: boolean;
  readonly lockedElbows: boolean;
  readonly legalInvertedPosition: boolean;
  readonly handsWithinMarkedBoxes: boolean;
  readonly officialStop: boolean;
};

function legalDuration(attempt: ControlHoldAttempt): number | null {
  return Number.isFinite(attempt.durationSeconds) &&
    attempt.durationSeconds >= 0 &&
    attempt.feetOffFloor &&
    attempt.lockedElbows &&
    attempt.legalInvertedPosition &&
    attempt.handsWithinMarkedBoxes &&
    attempt.officialStop
    ? attempt.durationSeconds
    : null;
}

export function controlHoldResultFromAttempts(input: {
  readonly athleteId: string;
  readonly attempts: readonly ControlHoldAttempt[];
  readonly suddenDeathWon?: boolean;
}): ControlHoldResult {
  if (input.attempts.length > 2) {
    throw new Error("Control hold events allow at most two regulation attempts.");
  }
  return {
    athleteId: input.athleteId,
    legalAttemptSeconds: input.attempts.flatMap((attempt) => {
      const duration = legalDuration(attempt);
      return duration === null ? [] : [duration];
    }),
    suddenDeathWon: input.suddenDeathWon,
  };
}

function descendingLegalAttempts(result: ControlHoldResult): number[] {
  return result.legalAttemptSeconds
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice(0, 2)
    .sort((a, b) => b - a);
}

export function compareControlHolds(
  first: ControlHoldResult,
  second: ControlHoldResult,
): number | null {
  const a = descendingLegalAttempts(first);
  const b = descendingLegalAttempts(second);
  const comparison = (b[0] ?? 0) - (a[0] ?? 0) || (b[1] ?? 0) - (a[1] ?? 0);
  if (comparison !== 0) return comparison;
  if (Boolean(first.suddenDeathWon) !== Boolean(second.suddenDeathWon)) {
    return Number(Boolean(second.suddenDeathWon)) - Number(Boolean(first.suddenDeathWon));
  }
  return null;
}

export function controlDivisionWinner(eventWinners: readonly string[]): string | null {
  return eventWinners.length === 3
    ? eventWinners.find((id) => eventWinners.filter((winner) => winner === id).length >= 2) ?? null
    : null;
}
