"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser, hasRole } from "@/lib/auth";
import type { PortalRole, PortalUser } from "@/lib/auth/types";
import { type ActionResult } from "@/lib/operations/action-result";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";
import {
  addRankingEntrySchema,
  createAthleteSchema,
  createCompetitionSchema,
  createEditorialDraftSchema,
  createOrganizationSchema,
  createProvenanceSchema,
  createRankingProviderSchema,
  createRankingSnapshotSchema,
  createRankingSystemSchema,
  createSourceRecordSchema,
  createSportingResultSchema,
  transitionEditorialSchema,
  updateAthleteSchema,
  updateCompetitionSchema,
  updateEditorialCoreSchema,
  updateOrganizationSchema,
  updateRankingProviderSchema,
  updateSportingResultStatusSchema,
  updateStoryFieldsSchema,
  updateVideoFieldsSchema,
} from "@/lib/supabase/admin-validation";
import { SupabaseRepositoryError } from "@/lib/supabase/repository";
import { SupabaseContentRepository } from "@/lib/supabase/repository";

const repository = new SupabaseAdminRepository();
const contentRepository = new SupabaseContentRepository();

async function requireAdminActor(minimumRole: PortalRole = "editor"): Promise<PortalUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in before making this change.");
  if (user.accessStatus !== "active") throw new Error("Your account isn't active yet.");
  if (!hasRole(user.role, minimumRole)) throw new Error("You don't have permission to do that.");
  return user;
}

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validationFailure(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string[]> = {};
  let formError: string | undefined;
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (!field) {
      formError ??= issue.message;
      continue;
    }
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }
  return { success: false, message: "Review the highlighted fields and try again.", fieldErrors, formError };
}

const RLS_REJECTION_PATTERN = /row-level security|permission denied|new row violates|42501/i;

function safeFailure(error: unknown): ActionResult {
  if (error instanceof SupabaseRepositoryError) {
    const insufficientPrivilege = RLS_REJECTION_PATTERN.test(error.message);
    return {
      success: false,
      message: insufficientPrivilege
        ? "Supabase rejected this write: your account doesn't hold the required capability for this action (see member_capabilities -- editorial.review, editorial.publish, sport.write_source_truth, or ranking.write)."
        : "Supabase rejected this write.",
      formError: insufficientPrivilege ? "Missing the required Supabase capability for this action." : error.message,
    };
  }
  if (error instanceof Error) {
    return { success: false, message: error.message, formError: error.message };
  }
  return { success: false, message: "Something went wrong.", formError: "Unexpected error." };
}

function formToObject(formData: FormData, fields: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) result[field] = textField(formData, field);
  return result;
}

// ------------------------------------------------------------------ athletes

export async function createAthleteAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createAthleteSchema.safeParse(
      formToObject(formData, [
        "permanentId", "slug", "name", "displayName", "biography", "country",
        "administrativeArea", "city", "disciplines", "specialties", "identityState", "editorialState", "provenanceStatus",
      ]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createAthlete(parsed.data);
    revalidatePath("/admin/db/athletes");
    return { success: true, message: "Athlete created.", recordId: id, redirectTo: `/admin/db/athletes/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateAthleteAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    if (!id) return { success: false, message: "Missing athlete id.", formError: "Missing athlete id." };
    const parsed = updateAthleteSchema.safeParse(
      formToObject(formData, [
        "slug", "name", "displayName", "biography", "country",
        "administrativeArea", "city", "disciplines", "specialties", "identityState", "editorialState", "provenanceStatus",
      ]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.updateAthlete(id, parsed.data);
    revalidatePath("/admin/db/athletes");
    revalidatePath(`/admin/db/athletes/${id}`);
    return { success: true, message: "Athlete updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

// -------------------------------------------------------------- organizations

export async function createOrganizationAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createOrganizationSchema.safeParse(
      formToObject(formData, ["slug", "name", "organizationType", "website", "country", "description", "reviewState", "provenanceStatus"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createOrganization(parsed.data);
    revalidatePath("/admin/db/organizations");
    return { success: true, message: "Organization created.", recordId: id, redirectTo: `/admin/db/organizations/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateOrganizationAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    if (!id) return { success: false, message: "Missing organization id.", formError: "Missing organization id." };
    const parsed = updateOrganizationSchema.safeParse(
      formToObject(formData, ["slug", "name", "organizationType", "website", "country", "description", "reviewState", "provenanceStatus"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.updateOrganization(id, parsed.data);
    revalidatePath("/admin/db/organizations");
    revalidatePath(`/admin/db/organizations/${id}`);
    return { success: true, message: "Organization updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

// -------------------------------------------------------------- competitions

export async function createCompetitionAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createCompetitionSchema.safeParse(
      formToObject(formData, [
        "permanentId", "slug", "name", "shortName", "status", "organizationId", "rulesetId",
        "startDate", "endDate", "country", "city", "summary", "disciplines", "publicState", "provenanceStatus",
      ]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createCompetition(parsed.data);
    revalidatePath("/admin/db/competitions");
    return { success: true, message: "Competition created.", recordId: id, redirectTo: `/admin/db/competitions/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateCompetitionAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    if (!id) return { success: false, message: "Missing competition id.", formError: "Missing competition id." };
    const parsed = updateCompetitionSchema.safeParse(
      formToObject(formData, [
        "slug", "name", "shortName", "status", "organizationId", "rulesetId",
        "startDate", "endDate", "country", "city", "summary", "disciplines", "publicState", "provenanceStatus",
      ]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.updateCompetition(id, parsed.data);
    revalidatePath("/admin/db/competitions");
    revalidatePath(`/admin/db/competitions/${id}`);
    return { success: true, message: "Competition updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

// ------------------------------------------------------------------ rankings

export async function createRankingProviderAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createRankingProviderSchema.safeParse(
      formToObject(formData, ["slug", "name", "organizationId", "website", "status", "integrationMethod", "attributionRequirement", "sourcePolicyNotes"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createRankingProvider(parsed.data);
    revalidatePath("/admin/db/rankings");
    return { success: true, message: "Ranking provider created.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateRankingProviderAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    if (!id) return { success: false, message: "Missing provider id.", formError: "Missing provider id." };
    const parsed = updateRankingProviderSchema.safeParse(formToObject(formData, ["status", "website", "sourcePolicyNotes"]));
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.updateRankingProvider(id, { ...parsed.data, lastReviewedAt: new Date().toISOString() });
    revalidatePath("/admin/db/rankings");
    return { success: true, message: "Ranking provider updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createRankingSystemAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createRankingSystemSchema.safeParse(
      formToObject(formData, [
        "providerId", "slug", "name", "rankingKind", "discipline", "geographicScope",
        "movement", "division", "weightClass", "sexDivision", "ageGroup", "methodologyNotes", "status",
      ]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createRankingSystem(parsed.data);
    revalidatePath("/admin/db/rankings");
    return { success: true, message: "Ranking system created.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateRankingSystemStatusAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    const status = textField(formData, "status");
    if (!id || !status) return { success: false, message: "Missing ranking system id or status.", formError: "Missing id or status." };
    await repository.updateRankingSystemStatus(id, status);
    revalidatePath("/admin/db/rankings");
    return { success: true, message: "Ranking system status updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createRankingSnapshotAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createRankingSnapshotSchema.safeParse(
      formToObject(formData, ["rankingSystemId", "rankingDate", "sourceRecordId", "checkedAt", "season", "methodologyVersion", "publicationStatus"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createRankingSnapshot(parsed.data);
    revalidatePath("/admin/db/rankings");
    return { success: true, message: "Ranking snapshot created.", recordId: id, redirectTo: `/admin/db/rankings/snapshots/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateRankingSnapshotStatusAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const id = textField(formData, "id");
    const publicationStatus = textField(formData, "publicationStatus");
    if (!id || !publicationStatus) return { success: false, message: "Missing snapshot id or status.", formError: "Missing id or status." };
    await repository.updateRankingSnapshotStatus(id, publicationStatus);
    revalidatePath("/admin/db/rankings");
    revalidatePath(`/admin/db/rankings/snapshots/${id}`);
    return { success: true, message: "Ranking snapshot status updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function addRankingEntryAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = addRankingEntrySchema.safeParse(
      formToObject(formData, ["rankingSnapshotId", "athleteId", "rank", "points", "rating", "entryStatus"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.addRankingEntry(parsed.data);
    revalidatePath(`/admin/db/rankings/snapshots/${parsed.data.rankingSnapshotId}`);
    return { success: true, message: "Ranking entry added." };
  } catch (error) {
    return safeFailure(error);
  }
}

// -------------------------------------------------------------- sport results

export async function createSportingResultAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createSportingResultSchema.safeParse(
      formToObject(formData, ["competitionId", "athleteId", "teamId", "division", "event", "placement", "resultStatus", "sourceRecordId", "rulesetId"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createSportingResult(parsed.data);
    revalidatePath("/admin/db/sporting-results");
    return { success: true, message: "Sporting result created.", recordId: id, redirectTo: `/admin/db/sporting-results/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateSportingResultStatusAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = updateSportingResultStatusSchema.safeParse(formToObject(formData, ["id", "resultStatus"]));
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.updateSportingResultStatus(parsed.data.id, parsed.data.resultStatus);
    revalidatePath("/admin/db/sporting-results");
    revalidatePath(`/admin/db/sporting-results/${parsed.data.id}`);
    return { success: true, message: "Sporting result status updated.", recordId: parsed.data.id };
  } catch (error) {
    return safeFailure(error);
  }
}

// ---------------------------------------------------------------- editorial

export async function createEditorialDraftAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createEditorialDraftSchema.safeParse(formToObject(formData, ["contentType", "slug", "title", "excerpt"]));
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await contentRepository.createEditorialDraft(parsed.data);
    if (parsed.data.contentType === "video") {
      await repository.createVideoFields(id, { ownershipStatus: "third-party-attributed" });
    }
    revalidatePath("/admin/db/editorial");
    return { success: true, message: "Draft created.", recordId: id, redirectTo: `/admin/db/editorial/${id}` };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateEditorialCoreAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = updateEditorialCoreSchema.safeParse(formToObject(formData, ["id", "title", "excerpt", "slug"]));
    if (!parsed.success) return validationFailure(parsed.error);
    const { id, ...rest } = parsed.data;
    await repository.updateEditorialCore(id, rest);
    revalidatePath(`/admin/db/editorial/${id}`);
    return { success: true, message: "Content updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function transitionEditorialAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = transitionEditorialSchema.safeParse(formToObject(formData, ["id", "state", "reason"]));
    if (!parsed.success) return validationFailure(parsed.error);
    await contentRepository.setPublicationState({ contentId: parsed.data.id, state: parsed.data.state, reason: parsed.data.reason });
    revalidatePath(`/admin/db/editorial/${parsed.data.id}`);
    revalidatePath("/admin/db/editorial");
    return { success: true, message: `Publication state set to "${parsed.data.state}".`, recordId: parsed.data.id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateStoryFieldsAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = updateStoryFieldsSchema.safeParse(formToObject(formData, ["id", "category", "eyebrow", "featured", "readTimeMinutes"]));
    if (!parsed.success) return validationFailure(parsed.error);
    const { id, ...rest } = parsed.data;
    await repository.updateStoryFields(id, rest);
    revalidatePath(`/admin/db/editorial/${id}`);
    return { success: true, message: "Story fields updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateVideoFieldsAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = updateVideoFieldsSchema.safeParse(
      formToObject(formData, ["id", "ownershipStatus", "sourcePlatform", "sourceAccount", "originalPostUrl", "durationSeconds"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const { id, ...rest } = parsed.data;
    await repository.updateVideoFields(id, rest);
    revalidatePath(`/admin/db/editorial/${id}`);
    return { success: true, message: "Video fields updated.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

// --------------------------------------------------- provenance / source truth

export async function createSourceRecordAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createSourceRecordSchema.safeParse(
      formToObject(formData, ["provider", "sourceType", "publicUrl", "title", "externalRecordId", "publicationDate", "verificationState"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    const id = await repository.createSourceRecord(parsed.data);
    return { success: true, message: "Source record created.", recordId: id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createProvenanceAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminActor("editor");
    const parsed = createProvenanceSchema.safeParse(
      formToObject(formData, ["targetType", "targetId", "sourceRecordId", "trustClass", "fieldPath"]),
    );
    if (!parsed.success) return validationFailure(parsed.error);
    await repository.createProvenance(parsed.data);
    revalidatePath(`/admin/db/${parsed.data.targetType}/${parsed.data.targetId}`);
    return { success: true, message: "Provenance record added." };
  } catch (error) {
    return safeFailure(error);
  }
}
