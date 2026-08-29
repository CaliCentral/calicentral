import type { WclValidationResult } from "@/lib/wcl/types";

export const finalStandStations = [
  { id: "muscle-ups", target: 10, unit: "reps" },
  { id: "pull-ups", target: 20, unit: "reps" },
  { id: "dips", target: 30, unit: "reps" },
  { id: "push-ups", target: 40, unit: "reps" },
  { id: "handstand-walk", target: 30, unit: "meters" },
] as const;

export type FinalStandAssignment = {
  readonly stationId: (typeof finalStandStations)[number]["id"];
  readonly athleteId: string;
};

export type FinalStandResult = {
  readonly completed: boolean;
  readonly legalProgress: number;
  readonly noReps: number;
  readonly finishTimeSeconds?: number;
  readonly suddenDeathWon?: boolean;
};

export type FinalStandStationProgress = FinalStandAssignment & {
  readonly completedAmount: number;
  readonly noReps: number;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly status: "not-started" | "in-progress" | "completed" | "medical-stop";
};

export function validateFinalStandAssignments(
  assignments: readonly FinalStandAssignment[],
  starterIds: readonly string[],
): WclValidationResult {
  const errors: string[] = [];
  const expectedStations = finalStandStations.map((station) => station.id);
  if (assignments.length !== finalStandStations.length) {
    errors.push("Every Final Stand station requires an assignment.");
  }
  if (
    assignments.some(
      (assignment, index) => assignment.stationId !== expectedStations[index],
    )
  ) {
    errors.push("Final Stand stations must follow the versioned official course order.");
  }
  if (starterIds.length !== 4 || new Set(starterIds).size !== 4) {
    errors.push("Exactly four unique starters must be declared for Final Stand.");
  }
  const firstFour = assignments.slice(0, 4).map((item) => item.athleteId);
  if (new Set(firstFour).size !== 4 || starterIds.some((id) => !firstFour.includes(id))) {
    errors.push("All four starters must complete a station before a second assignment.");
  }
  if (assignments.some((item) => !starterIds.includes(item.athleteId))) {
    errors.push("Only starters may receive Final Stand stations.");
  }
  return { valid: errors.length === 0, errors };
}

export function compareFinalStandResults(
  first: FinalStandResult,
  second: FinalStandResult,
): number | null {
  if (first.completed !== second.completed) return first.completed ? -1 : 1;
  if (first.completed && second.completed) {
    return (first.finishTimeSeconds ?? Infinity) - (second.finishTimeSeconds ?? Infinity);
  }
  const comparison =
    second.legalProgress - first.legalProgress ||
    first.noReps - second.noReps;
  if (comparison !== 0) return comparison;
  if (Boolean(first.suddenDeathWon) !== Boolean(second.suddenDeathWon)) {
    return first.suddenDeathWon ? -1 : 1;
  }
  return null;
}
