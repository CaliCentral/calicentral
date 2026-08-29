import { z } from "zod";

import { communityIdSchema } from "@/lib/community/validation";

const optionalNumber = (minimum: number, maximum: number) =>
  z.number().finite().min(minimum).max(maximum).optional();

export const trainingSetSchema = z
  .object({
    reps: z.number().int().min(0).max(10_000).optional(),
    addedLoadKg: optionalNumber(-100, 1_000),
    totalWeightKg: optionalNumber(0, 1_500),
    durationSeconds: optionalNumber(0, 86_400),
    distanceMeters: optionalNumber(0, 1_000_000),
    rpe: optionalNumber(0, 10),
    rir: optionalNumber(0, 20),
    completion: z.enum(["attempted", "completed", "failed"]).optional(),
    progression: z.string().trim().max(120).optional(),
    score: z.number().finite().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.reps !== undefined ||
      value.addedLoadKg !== undefined ||
      value.totalWeightKg !== undefined ||
      value.durationSeconds !== undefined ||
      value.distanceMeters !== undefined ||
      value.completion !== undefined ||
      Boolean(value.progression) ||
      value.score !== undefined,
    "Record at least one measurable value for each set.",
  );

export const trainingMovementSchema = z
  .object({
    movementId: communityIdSchema.optional(),
    customMovementName: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(1_000).optional(),
    sets: z.array(trainingSetSchema).min(1).max(20),
  })
  .strict()
  .refine(
    (value) => Boolean(value.movementId) !== Boolean(value.customMovementName),
    "Choose one catalog movement or enter one custom movement.",
  );

export const trainingSessionSchema = z
  .object({
    memberId: communityIdSchema,
    sessionDate: z.iso.date(),
    title: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(4_000).optional(),
    bodyweightKg: optionalNumber(20, 350),
    durationSeconds: z.number().int().min(1).max(86_400).optional(),
    visibility: z.enum(["private", "followers", "public"]),
    movements: z.array(trainingMovementSchema).min(1).max(12),
  })
  .strict();

export const manualPersonalRecordSchema = z
  .object({
    memberId: communityIdSchema,
    movementId: communityIdSchema.optional(),
    customMovementName: z.string().trim().min(1).max(120).optional(),
    recordType: z.enum([
      "maximum-added-weight",
      "total-system-weight",
      "repetition-maximum",
      "max-repetitions",
      "hold-duration",
      "skill-achievement",
      "competition-total",
      "competition-score",
    ]),
    value: z.number().finite(),
    unit: z.enum(["kg", "lb", "reps", "seconds", "points", "completion"]),
    repetitions: z.number().int().min(1).max(10_000).optional(),
    achievedOn: z.iso.date(),
    notes: z.string().trim().max(1_000).optional(),
    publicVisible: z.boolean(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.movementId) !== Boolean(value.customMovementName),
    "Choose one catalog movement or enter one custom movement.",
  );

export const skillProgressSchema = z
  .object({
    memberId: communityIdSchema,
    movementId: communityIdSchema,
    status: z.enum(["not-started", "working-on", "achieved"]),
    achievedOn: z.iso.date().optional(),
    notes: z.string().trim().max(1_000).optional(),
    proofMediaId: communityIdSchema.optional(),
    publicVisible: z.boolean(),
  })
  .strict()
  .refine(
    (value) => value.status !== "achieved" || Boolean(value.achievedOn),
    "Add the date achieved.",
  );
