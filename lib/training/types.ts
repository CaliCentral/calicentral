export type MovementMeasurementType =
  | "reps"
  | "weight-reps"
  | "total-weight"
  | "hold-duration"
  | "duration"
  | "distance"
  | "completion"
  | "progression"
  | "score";

export type MovementDefinition = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly category:
    | "strength"
    | "skill"
    | "hold"
    | "conditioning"
    | "mobility"
    | "freestyle"
    | "other";
  readonly measurementTypes: readonly MovementMeasurementType[];
};

export type TrainingSetInput = {
  readonly reps?: number;
  readonly addedLoadKg?: number;
  readonly totalWeightKg?: number;
  readonly durationSeconds?: number;
  readonly distanceMeters?: number;
  readonly rpe?: number;
  readonly rir?: number;
  readonly completion?: "attempted" | "completed" | "failed";
  readonly progression?: string;
  readonly score?: number;
  readonly notes?: string;
};

export type TrainingMovementInput = {
  readonly movementId?: string;
  readonly customMovementName?: string;
  readonly notes?: string;
  readonly sets: TrainingSetInput[];
};

export type TrainingSet = TrainingSetInput & {
  readonly id: string;
  readonly setOrder: number;
};

export type TrainingMovement = {
  readonly id: string;
  readonly movementId?: string;
  readonly name: string;
  readonly notes: string;
  readonly sets: readonly TrainingSet[];
};

export type TrainingSession = {
  readonly id: string;
  readonly sessionDate: string;
  readonly title: string;
  readonly notes: string;
  readonly bodyweightKg?: number;
  readonly durationSeconds?: number;
  readonly visibility: "private" | "followers" | "public";
  readonly movements: readonly TrainingMovement[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PersonalRecord = {
  readonly id: string;
  readonly movementId?: string;
  readonly movementName: string;
  readonly recordType:
    | "maximum-added-weight"
    | "total-system-weight"
    | "repetition-maximum"
    | "max-repetitions"
    | "hold-duration"
    | "skill-achievement"
    | "competition-total"
    | "competition-score";
  readonly value: number;
  readonly unit: "kg" | "lb" | "reps" | "seconds" | "points" | "completion";
  readonly repetitions?: number;
  readonly achievedOn: string;
  readonly sourceType:
    | "self-reported"
    | "training-recorded"
    | "competition-linked"
    | "source-confirmed"
    | "editorially-verified";
  readonly verificationStatus:
    | "unverified"
    | "linked"
    | "source-confirmed"
    | "editorially-verified"
    | "disputed";
  readonly notes: string;
  readonly publicVisible: boolean;
};

export type SkillProgress = {
  readonly id: string;
  readonly movementId: string;
  readonly movementName: string;
  readonly status: "not-started" | "working-on" | "achieved";
  readonly achievedOn?: string;
  readonly notes: string;
  readonly proofMediaId?: string;
  readonly publicVisible: boolean;
  readonly updatedAt: string;
};

export type DailyAthleteSummary = {
  readonly recentSessions: readonly TrainingSession[];
  readonly currentRecords: readonly PersonalRecord[];
  readonly skills: readonly SkillProgress[];
};
