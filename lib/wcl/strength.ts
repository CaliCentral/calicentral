export type StrengthAttemptSummary = {
  readonly athleteId: string;
  readonly addedLoadKg: number;
  readonly failedAttemptsAtLoad: number;
  readonly successfulCompletionOrder: number;
  readonly suddenDeathWon?: boolean;
  readonly bodyweightKg?: number;
};

export function compareStrengthAttempts(
  first: StrengthAttemptSummary,
  second: StrengthAttemptSummary,
): number {
  return (
    second.addedLoadKg - first.addedLoadKg ||
    first.failedAttemptsAtLoad - second.failedAttemptsAtLoad ||
    first.successfulCompletionOrder - second.successfulCompletionOrder ||
    Number(Boolean(second.suddenDeathWon)) - Number(Boolean(first.suddenDeathWon))
  );
}

export function strengthDivisionWinner(
  eventWinners: readonly string[],
): string | null {
  if (eventWinners.length !== 3) return null;
  const wins = new Map<string, number>();
  eventWinners.forEach((id) => wins.set(id, (wins.get(id) ?? 0) + 1));
  return [...wins.entries()].find(([, count]) => count >= 2)?.[0] ?? null;
}

export function addedLoadRatio(result: StrengthAttemptSummary): number | null {
  return result.bodyweightKg && result.bodyweightKg > 0
    ? result.addedLoadKg / result.bodyweightKg
    : null;
}

