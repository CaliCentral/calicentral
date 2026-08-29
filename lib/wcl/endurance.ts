export type EnduranceAttempt = {
  readonly athleteId: string;
  readonly legalReps?: number;
  readonly noReps: number;
  readonly status: "completed" | "dns" | "dq" | "withdrawn";
  readonly terminationReason?: string;
};

export function compareEnduranceAttempts(
  first: EnduranceAttempt,
  second: EnduranceAttempt,
): number | null {
  if (first.status !== "completed" || second.status !== "completed") return null;
  if (first.legalReps === undefined || second.legalReps === undefined) return null;
  return second.legalReps - first.legalReps;
}

export function enduranceDivisionWinner(eventWinners: readonly string[]): string | null {
  return eventWinners.length === 3
    ? eventWinners.find((id) => eventWinners.filter((winner) => winner === id).length >= 2) ?? null
    : null;
}

