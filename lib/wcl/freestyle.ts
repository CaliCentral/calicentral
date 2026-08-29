export type FreestyleCategories = {
  readonly difficulty: number;
  readonly execution: number;
  readonly creativity: number;
  readonly flow: number;
  readonly control: number;
};

export type FreestyleJudgeScore = FreestyleCategories & {
  readonly judgeId: string;
  readonly deduction: number;
};

export type FreestyleScore = {
  readonly finalScore: number;
  readonly judgeTotals: readonly number[];
  readonly categoryAverages: FreestyleCategories;
};

function validScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 10;
}

export function scoreFreestyle(judges: readonly FreestyleJudgeScore[]): FreestyleScore {
  if (judges.length !== 5) throw new Error("Exactly five freestyle judges are required.");
  const categoryKeys = ["difficulty", "execution", "creativity", "flow", "control"] as const;
  for (const judge of judges) {
    if (categoryKeys.some((key) => !validScore(judge[key])) || judge.deduction < 0) {
      throw new Error("Freestyle category scores must be 0–10 and deductions non-negative.");
    }
  }
  const judgeTotals = judges.map((judge) =>
    Math.max(0, categoryKeys.reduce((total, key) => total + judge[key], 0) - judge.deduction),
  );
  const middleThree = judgeTotals.slice().sort((a, b) => a - b).slice(1, 4);
  const average = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const categoryAverages = Object.fromEntries(
    categoryKeys.map((key) => [key, average(judges.map((judge) => judge[key]))]),
  ) as FreestyleCategories;
  return { finalScore: average(middleThree), judgeTotals, categoryAverages };
}

export function compareFreestyleScores(first: FreestyleScore, second: FreestyleScore): number | null {
  const comparison =
    second.finalScore - first.finalScore ||
    second.categoryAverages.execution - first.categoryAverages.execution ||
    second.categoryAverages.difficulty - first.categoryAverages.difficulty ||
    second.categoryAverages.control - first.categoryAverages.control;
  return comparison === 0 ? null : comparison;
}

