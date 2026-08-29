"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  communityActionFailure,
  requireCommunityActor,
} from "@/lib/community/actions/shared";
import { resolveCommunityTarget } from "@/lib/community/targets";
import type { TrainingMovementInput, TrainingSetInput } from "@/lib/training/types";
import { getTrainingRepository } from "@/lib/training/runtime";
import type { ActionResult } from "@/lib/operations/action-result";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function number(formData: FormData, name: string): number | undefined {
  const value = text(formData, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function trainingMovements(formData: FormData): TrainingMovementInput[] {
  return Array.from({ length: 8 }, (_, movementIndex) => {
    const movementId = text(formData, `movementId${movementIndex}`) || undefined;
    const customMovementName = text(formData, `customMovementName${movementIndex}`) || undefined;
    const sets = Array.from({ length: 6 }, (_, setIndex) => {
      const set: TrainingSetInput = {
        reps: number(formData, `reps${movementIndex}_${setIndex}`),
        addedLoadKg: number(formData, `addedLoadKg${movementIndex}_${setIndex}`),
        totalWeightKg: number(formData, `totalWeightKg${movementIndex}_${setIndex}`),
        durationSeconds: number(formData, `durationSeconds${movementIndex}_${setIndex}`),
        distanceMeters: number(formData, `distanceMeters${movementIndex}_${setIndex}`),
        rpe: number(formData, `rpe${movementIndex}_${setIndex}`),
        rir: number(formData, `rir${movementIndex}_${setIndex}`),
        completion: z.enum(["attempted", "completed", "failed"]).optional().parse(text(formData, `completion${movementIndex}_${setIndex}`) || undefined),
        progression: text(formData, `progression${movementIndex}_${setIndex}`) || undefined,
        score: number(formData, `score${movementIndex}_${setIndex}`),
        notes: text(formData, `setNotes${movementIndex}_${setIndex}`) || undefined,
      };
      return Object.values(set).some((value) => value !== undefined) ? set : null;
    }).filter((set): set is TrainingSetInput => set !== null);
    return movementId || customMovementName || sets.length
      ? [{
          movementId,
          customMovementName,
          notes: text(formData, `movementNotes${movementIndex}`) || undefined,
          sets,
        } satisfies TrainingMovementInput]
      : [];
  }).flat();
}

export async function createTrainingSessionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { member } = await requireCommunityActor("training", "/account/training");
    const repository = await getTrainingRepository();
    if (!repository.available) throw new Error("Training persistence is unavailable.");
    const id = await repository.createSession({
      memberId: member.id,
      sessionDate: text(formData, "sessionDate"),
      title: text(formData, "title") || undefined,
      notes: text(formData, "notes") || undefined,
      bodyweightKg: number(formData, "bodyweightKg"),
      durationSeconds: number(formData, "durationMinutes") !== undefined
        ? Math.round((number(formData, "durationMinutes") ?? 0) * 60)
        : undefined,
      visibility: z.enum(["private", "followers", "public"]).parse(text(formData, "visibility")),
      movements: trainingMovements(formData),
    });
    revalidatePath("/account");
    revalidatePath("/account/training");
    return { success: true, message: "Training session logged.", recordId: id };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function createPersonalRecordAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { member } = await requireCommunityActor("record", "/account/records");
    const sourceType = z.enum(["self-reported", "competition-linked"]).parse(text(formData, "sourceType"));
    const competitionCandidate = text(formData, "canonicalCompetitionId");
    const canonicalCompetitionId = sourceType === "competition-linked"
      ? (await resolveCommunityTarget("competition", competitionCandidate))?.id
      : undefined;
    if (sourceType === "competition-linked" && !canonicalCompetitionId) {
      throw new Error("Choose a public competition by stable ID or slug.");
    }
    const repository = await getTrainingRepository();
    const id = await repository.createManualRecord({
      memberId: member.id,
      movementId: text(formData, "movementId") || undefined,
      customMovementName: text(formData, "customMovementName") || undefined,
      recordType: z.enum([
        "maximum-added-weight", "total-system-weight", "repetition-maximum",
        "max-repetitions", "hold-duration", "skill-achievement",
        "competition-total", "competition-score",
      ]).parse(text(formData, "recordType")),
      value: z.coerce.number().finite().parse(text(formData, "value")),
      unit: z.enum(["kg", "lb", "reps", "seconds", "points", "completion"]).parse(text(formData, "unit")),
      repetitions: number(formData, "repetitions"),
      achievedOn: text(formData, "achievedOn"),
      notes: text(formData, "notes") || undefined,
      publicVisible: formData.get("publicVisible") === "on",
      sourceType,
      canonicalCompetitionId,
    });
    revalidatePath("/account");
    revalidatePath("/account/records");
    revalidatePath(`/members/${member.handle}`);
    return { success: true, message: "Personal record added with its provenance label.", recordId: id };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function createTrainingRecordAction(formData: FormData): Promise<void> {
  const { member } = await requireCommunityActor("record", "/account/training");
  const setId = z.string().trim().min(1).max(200).parse(formData.get("trainingSetId"));
  await (await getTrainingRepository()).createTrainingRecord(member.id, setId);
  revalidatePath("/account");
  revalidatePath("/account/training");
  revalidatePath("/account/records");
}

export async function updateSkillProgressAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { member } = await requireCommunityActor("skill", "/account/skills");
    const id = await (await getTrainingRepository()).upsertSkill({
      memberId: member.id,
      movementId: text(formData, "movementId"),
      status: z.enum(["not-started", "working-on", "achieved"]).parse(text(formData, "status")),
      achievedOn: text(formData, "achievedOn") || undefined,
      notes: text(formData, "notes") || undefined,
      proofMediaId: text(formData, "proofMediaId") || undefined,
      publicVisible: formData.get("publicVisible") === "on",
    });
    revalidatePath("/account");
    revalidatePath("/account/skills");
    revalidatePath(`/members/${member.handle}`);
    return { success: true, message: "Skill progress saved without verification claims.", recordId: id };
  } catch (error) {
    return communityActionFailure(error);
  }
}
