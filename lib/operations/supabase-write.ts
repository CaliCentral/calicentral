import "server-only";

import { createHash } from "node:crypto";

import { stableDataOpsUuid } from "@/lib/data-ops/identity";
import {
  createPrivateNoteIdentifiers,
  createSubmissionUpdateIdentifiers,
} from "@/lib/operations/idempotency";
import { hasReachedActiveSubmissionLimit } from "@/lib/operations/limits";
import { OperationalError } from "@/lib/operations/errors";
import {
  assertSubmissionHistoryCapacity,
  submissionContentPatch,
  transitionEvent,
  type SubmissionMutationTarget,
} from "@/lib/operations/submissions";
import type {
  AdminContributorDetail,
  OperationalActor,
  SubmissionStatus,
} from "@/lib/operations/types";
import type {
  SubmissionDraftInput,
  SubmissionForReviewInput,
} from "@/lib/operations/validation";
import { assertSubmissionTransition } from "@/lib/operations/workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseRepositoryError } from "@/lib/supabase/repository";

type SubmissionWriteInput = SubmissionDraftInput | SubmissionForReviewInput;
type CreatedSubmissionResult = {
  readonly id: string;
  readonly submissionNumber: string;
  readonly status: SubmissionStatus;
};

function failure(message: string): never {
  throw new SupabaseRepositoryError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function client() {
  return createSupabaseServerClient();
}

async function insertAuditEvent(input: {
  readonly eventType: string;
  readonly actor: OperationalActor;
  readonly targetType: "submission" | "contributor";
  readonly targetId: string;
  readonly summary: string;
  readonly metadata?: {
    readonly previousValue?: string;
    readonly nextValue?: string;
    readonly noteKind?: string;
  };
}) {
  const supabase = await client();
  const { error } = await supabase.from("audit_events").insert({
    event_type: input.eventType,
    actor_member_id: input.actor.id,
    target_type: input.targetType,
    target_id: input.targetId,
    summary: input.summary.slice(0, 500),
    metadata: input.metadata
      ? {
          ...(input.metadata.previousValue ? { previousValue: input.metadata.previousValue.slice(0, 160) } : {}),
          ...(input.metadata.nextValue ? { nextValue: input.metadata.nextValue.slice(0, 160) } : {}),
          ...(input.metadata.noteKind ? { noteKind: input.metadata.noteKind.slice(0, 80) } : {}),
        }
      : {},
  });
  if (error) failure(error.message);
}

// ------------------------------------------------------------- submissions

export async function getSupabaseSubmissionMutationTarget(
  submissionId: string,
): Promise<SubmissionMutationTarget | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, owner_member_id, submission_type, status, payload, contributor_feedback, assigned_to, private_editorial_notes, updated_at")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) failure(error.message);
  if (!data) return null;

  const auditResult = await supabase
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "submission")
    .eq("target_id", submissionId);
  if (auditResult.error) failure(auditResult.error.message);

  const payload = isRecord(data.payload) ? data.payload : {};
  const notes = Array.isArray(data.private_editorial_notes) ? data.private_editorial_notes : [];
  const priority = ["normal", "elevated", "urgent"].includes(payload.priority as string)
    ? (payload.priority as "normal" | "elevated" | "urgent")
    : "normal";

  return {
    id: data.id,
    revisionId: data.updated_at,
    submitterId: data.owner_member_id,
    submissionType: data.submission_type,
    status: data.status,
    title: typeof payload.title === "string" ? payload.title : "",
    revisionNumber: typeof payload.revisionNumber === "number" ? Math.max(1, payload.revisionNumber) : 1,
    priority,
    ...(data.assigned_to ? { assignedReviewerId: data.assigned_to } : {}),
    contributorVisibleFeedback: data.contributor_feedback ?? "",
    auditEventCount: auditResult.count ?? 0,
    privateEditorialNoteCount: notes.length,
  };
}

export async function createSupabaseSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly content: SubmissionWriteInput;
  readonly submitImmediately: boolean;
  readonly idempotencyKey: string;
}): Promise<CreatedSubmissionResult> {
  const supabase = await client();
  const now = new Date();
  const timestamp = now.toISOString();
  const id = stableDataOpsUuid(
    "cali-central:submission-create:v1",
    `${input.actor.id} ${input.idempotencyKey}`,
  );
  const submissionNumber = `CC-${now.getUTCFullYear()}-${createHash("sha256").update(id).digest("hex").slice(0, 10).toUpperCase()}`;

  const existing = await supabase
    .from("submissions")
    .select("id, owner_member_id, submission_type, status, payload")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) failure(existing.error.message);
  if (existing.data) {
    if (existing.data.owner_member_id !== input.actor.id) {
      throw new OperationalError("operation_failed", "This submission could not be loaded after it was saved.");
    }
    const payload = isRecord(existing.data.payload) ? existing.data.payload : {};
    return {
      id: existing.data.id,
      submissionNumber: typeof payload.submissionNumber === "string" ? payload.submissionNumber : submissionNumber,
      status: existing.data.status,
    };
  }

  const countResult = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("owner_member_id", input.actor.id)
    .in("status", ["draft", "submitted", "inReview", "revisionRequested"]);
  if (countResult.error) failure(countResult.error.message);
  if (hasReachedActiveSubmissionLimit(countResult.count ?? Number.NaN)) {
    throw new OperationalError(
      "operation_failed",
      "Resolve or archive an existing submission before creating another.",
    );
  }

  const status: SubmissionStatus = input.submitImmediately ? "submitted" : "draft";
  const payload = {
    ...submissionContentPatch(input.content),
    submissionNumber,
    revisionNumber: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(input.submitImmediately ? { submittedAt: timestamp } : {}),
  };

  const insertResult = await supabase.from("submissions").insert({
    id,
    owner_member_id: input.actor.id,
    submission_type: input.content.submissionType,
    status,
    payload,
    contributor_feedback: "",
    private_editorial_notes: [],
    created_at: timestamp,
    updated_at: timestamp,
  });
  if (insertResult.error) {
    // A concurrent identical-intent replay racing this same insert lands
    // here as a unique-violation on the deterministic id -- re-read and
    // return the now-committed row rather than surfacing a spurious error.
    if (insertResult.error.code === "23505") {
      const replay = await supabase
        .from("submissions")
        .select("id, status, payload")
        .eq("id", id)
        .maybeSingle();
      if (!replay.error && replay.data) {
        const replayPayload = isRecord(replay.data.payload) ? replay.data.payload : {};
        return {
          id: replay.data.id,
          submissionNumber: typeof replayPayload.submissionNumber === "string" ? replayPayload.submissionNumber : submissionNumber,
          status: replay.data.status,
        };
      }
    }
    failure(insertResult.error.message);
  }

  await insertAuditEvent({
    eventType: "submissionCreated",
    actor: input.actor,
    targetType: "submission",
    targetId: id,
    summary: "Contributor created a submission record.",
  });
  if (input.submitImmediately) {
    await insertAuditEvent({
      eventType: "submissionSubmitted",
      actor: input.actor,
      targetType: "submission",
      targetId: id,
      summary: "Contributor submitted the new record for editorial review.",
    });
  }

  return { id, submissionNumber, status };
}

export async function updateSupabaseSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly content: SubmissionDraftInput;
  readonly operationKey: string;
}): Promise<"updated" | "replayed"> {
  const supabase = await client();
  const identifiers = createSubmissionUpdateIdentifiers({
    contributorId: input.actor.id,
    submissionId: input.target.id,
    operationKey: input.operationKey,
    content: input.content,
  });

  async function isReplay(): Promise<boolean> {
    const result = await supabase
      .from("audit_events")
      .select("id")
      .eq("target_type", "submission")
      .eq("target_id", input.target.id)
      .eq("event_type", "submissionUpdated")
      .eq("actor_member_id", input.actor.id)
      .contains("metadata", { nextValue: identifiers.intentFingerprint.slice(0, 160) })
      .limit(1);
    if (result.error) failure(result.error.message);
    return (result.data ?? []).length > 0;
  }

  if (await isReplay()) return "replayed";

  assertSubmissionHistoryCapacity(input.target);
  const now = new Date().toISOString();
  const current = await supabase.from("submissions").select("payload").eq("id", input.target.id).maybeSingle();
  if (current.error) failure(current.error.message);
  const currentPayload = isRecord(current.data?.payload) ? current.data!.payload : {};
  const nextPayload = {
    ...currentPayload,
    ...submissionContentPatch(input.content),
    revisionNumber: input.target.revisionNumber + 1,
    updatedAt: now,
  };

  const updateResult = await supabase
    .from("submissions")
    .update({ payload: nextPayload, updated_at: now })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    if (await isReplay()) return "replayed";
    throw new OperationalError(
      "operation_failed",
      "This draft form was already used for different changes. Reload the page and try again.",
    );
  }

  await insertAuditEvent({
    eventType: "submissionUpdated",
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: "Contributor saved a new submission revision.",
    metadata: {
      previousValue: `${input.target.revisionNumber}`,
      nextValue: identifiers.intentFingerprint,
    },
  });
  return "updated";
}

export async function transitionSupabaseSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly workflowActor: "contributor" | "editor" | "admin";
  readonly target: SubmissionMutationTarget;
  readonly nextStatus: SubmissionStatus;
  readonly visibleFeedback?: string;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  assertSubmissionTransition(input.workflowActor, input.target.status, input.nextStatus);
  const event = transitionEvent(input.target.status, input.nextStatus);
  if (!event) {
    throw new OperationalError("invalid_transition", "This workflow transition is not available.");
  }

  const supabase = await client();
  const now = new Date().toISOString();
  const current = await supabase.from("submissions").select("payload").eq("id", input.target.id).maybeSingle();
  if (current.error) failure(current.error.message);
  const currentPayload = isRecord(current.data?.payload) ? current.data!.payload : {};
  const timestampPatch = {
    ...(input.nextStatus === "submitted" ? { submittedAt: now } : {}),
    ...(input.nextStatus === "inReview" ? { reviewedAt: now } : {}),
    ...(input.nextStatus === "revisionRequested" ? { reviewedAt: now } : {}),
    ...(input.nextStatus === "withdrawn" ? { withdrawnAt: now } : {}),
    ...(input.nextStatus === "approved" || input.nextStatus === "rejected"
      ? { reviewedAt: now, resolvedAt: now }
      : {}),
  };
  const nextPayload = {
    ...currentPayload,
    status: input.nextStatus,
    updatedAt: now,
    ...timestampPatch,
    ...(input.visibleFeedback !== undefined ? { contributorVisibleFeedback: input.visibleFeedback } : {}),
  };

  const updateResult = await supabase
    .from("submissions")
    .update({
      status: input.nextStatus,
      updated_at: now,
      payload: nextPayload,
      ...(input.visibleFeedback !== undefined ? { contributor_feedback: input.visibleFeedback } : {}),
    })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This record changed while the action was running. Refresh and try again.",
    );
  }

  await insertAuditEvent({
    eventType: event.eventType,
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: event.summary,
    metadata: { previousValue: input.target.status, nextValue: input.nextStatus },
  });
}

export async function assignSupabaseSubmissionReviewer(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly reviewerId: string;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const supabase = await client();
  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("submissions")
    .update({ assigned_to: input.reviewerId, updated_at: now })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This record changed while the action was running. Refresh and try again.",
    );
  }
  await insertAuditEvent({
    eventType: "reviewerAssigned",
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: input.target.assignedReviewerId ? "Editor reassigned the submission reviewer." : "Editor assigned a submission reviewer.",
    metadata: {
      ...(input.target.assignedReviewerId ? { previousValue: input.target.assignedReviewerId } : {}),
      nextValue: input.reviewerId,
    },
  });
}

export async function addSupabasePrivateEditorialNote(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly note: string;
  readonly operationKey: string;
}): Promise<"created" | "replayed"> {
  const supabase = await client();
  const identifiers = createPrivateNoteIdentifiers({
    actorId: input.actor.id,
    submissionId: input.target.id,
    operationKey: input.operationKey,
  });

  const current = await supabase
    .from("submissions")
    .select("private_editorial_notes")
    .eq("id", input.target.id)
    .maybeSingle();
  if (current.error) failure(current.error.message);
  const notes = Array.isArray(current.data?.private_editorial_notes) ? current.data!.private_editorial_notes : [];
  const existingNote = notes.find((note: unknown) => isRecord(note) && note.key === identifiers.noteKey);
  if (existingNote && isRecord(existingNote)) {
    if (existingNote.text === input.note && isRecord(existingNote.author) && existingNote.author._ref === input.actor.id) {
      return "replayed";
    }
    throw new OperationalError(
      "operation_failed",
      "This private-note form was already used for different content. Reload the page and try again.",
    );
  }

  assertSubmissionHistoryCapacity(input.target);
  if (input.target.privateEditorialNoteCount >= 100) {
    throw new OperationalError("operation_failed", "This submission has reached its private-note limit.");
  }

  const now = new Date().toISOString();
  const nextNotes = [
    ...notes,
    { key: identifiers.noteKey, text: input.note, author: { _ref: input.actor.id }, createdAt: now },
  ];
  const updateResult = await supabase
    .from("submissions")
    .update({ private_editorial_notes: nextNotes, updated_at: now })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This private-note form was already used for different content. Reload the page and try again.",
    );
  }

  await insertAuditEvent({
    eventType: "privateNoteAdded",
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: "Editor added a private editorial note.",
    metadata: { noteKind: "privateEditorialNote" },
  });
  return "created";
}

export async function updateSupabaseVisibleFeedback(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly feedback: string;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const supabase = await client();
  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("submissions")
    .update({ contributor_feedback: input.feedback, updated_at: now })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This record changed while the action was running. Refresh and try again.",
    );
  }
  await insertAuditEvent({
    eventType: "visibleFeedbackUpdated",
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: "Editor updated contributor-visible feedback.",
    metadata: { noteKind: "contributorVisibleFeedback" },
  });
}

export async function updateSupabaseSubmissionPriority(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly priority: "normal" | "elevated" | "urgent";
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const supabase = await client();
  const now = new Date().toISOString();
  const current = await supabase.from("submissions").select("payload").eq("id", input.target.id).maybeSingle();
  if (current.error) failure(current.error.message);
  const currentPayload = isRecord(current.data?.payload) ? current.data!.payload : {};
  const nextPayload = { ...currentPayload, priority: input.priority, updatedAt: now };

  const updateResult = await supabase
    .from("submissions")
    .update({ payload: nextPayload, updated_at: now })
    .eq("id", input.target.id)
    .eq("updated_at", input.target.revisionId)
    .select("id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This record changed while the action was running. Refresh and try again.",
    );
  }
  await insertAuditEvent({
    eventType: "priorityChanged",
    actor: input.actor,
    targetType: "submission",
    targetId: input.target.id,
    summary: "Editor changed internal submission priority.",
    metadata: { previousValue: input.target.priority, nextValue: input.priority },
  });
}

// ------------------------------------------------------------- contributors

export async function updateSupabaseContributorProfileRecord(
  actor: OperationalActor,
  input: { readonly displayName: string; readonly biography: string; readonly location: string; readonly areasOfInterest: readonly string[] },
): Promise<"updated" | "unchanged"> {
  const supabase = await client();
  const current = await supabase
    .from("profiles")
    .select("display_name, biography, administrative_area, city, country, interests, updated_at")
    .eq("member_id", actor.id)
    .maybeSingle();
  if (current.error) failure(current.error.message);
  if (!current.data) {
    throw new OperationalError("operation_failed", "The contributor profile is not available.");
  }
  const currentInterests = Array.isArray(current.data.interests) ? current.data.interests : [];
  const areasAreEqual =
    currentInterests.length === input.areasOfInterest.length &&
    currentInterests.every((value: string, index: number) => value === input.areasOfInterest[index]);
  const currentLocation = [current.data.city, current.data.administrative_area, current.data.country]
    .filter(Boolean)
    .join(", ");
  const unchanged =
    current.data.display_name === input.displayName &&
    (current.data.biography ?? "") === input.biography &&
    currentLocation === input.location &&
    areasAreEqual;
  if (unchanged) return "unchanged";

  const now = new Date().toISOString();
  const updateResult = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      biography: input.biography,
      interests: input.areasOfInterest,
      updated_at: now,
    })
    .eq("member_id", actor.id)
    .eq("updated_at", current.data.updated_at)
    .select("member_id");
  if (updateResult.error) failure(updateResult.error.message);
  if (!updateResult.data || updateResult.data.length === 0) {
    throw new OperationalError(
      "operation_failed",
      "This record changed while the action was running. Refresh and try again.",
    );
  }

  await insertAuditEvent({
    eventType: "profileUpdated",
    actor,
    targetType: "contributor",
    targetId: actor.id,
    summary: "Contributor updated approved profile fields.",
  });
  return "updated";
}

export async function countSupabaseOtherEffectiveAdministrators(input: {
  readonly contributorId: string;
  readonly bootstrapAdminEmails: readonly string[];
}): Promise<{ readonly activeProfileAdministratorCount: number; readonly provisionedBootstrapEmails: readonly string[] }> {
  const supabase = await client();
  const rolesResult = await supabase
    .from("member_roles")
    .select("member_id, members!inner(access_status, email_normalized)")
    .eq("role_name", "admin")
    .is("revoked_at", null)
    .neq("member_id", input.contributorId);
  if (rolesResult.error) failure(rolesResult.error.message);

  const activeAdminEmails = new Set<string>();
  let activeProfileAdministratorCount = 0;
  for (const row of rolesResult.data ?? []) {
    if (!isRecord(row) || !isRecord(row.members)) continue;
    if (row.members.access_status === "active") {
      activeProfileAdministratorCount += 1;
      if (typeof row.members.email_normalized === "string") activeAdminEmails.add(row.members.email_normalized);
    }
  }

  const provisionedBootstrapEmails: string[] = [];
  if (input.bootstrapAdminEmails.length) {
    const membersResult = await supabase
      .from("members")
      .select("email_normalized")
      .neq("id", input.contributorId)
      .in("email_normalized", [...input.bootstrapAdminEmails]);
    if (membersResult.error) failure(membersResult.error.message);
    for (const row of membersResult.data ?? []) {
      if (typeof row.email_normalized === "string") provisionedBootstrapEmails.push(row.email_normalized);
    }
  }

  return { activeProfileAdministratorCount, provisionedBootstrapEmails };
}

export async function updateSupabaseContributorRoleRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly role: "contributor" | "editor" | "admin";
}): Promise<void> {
  const supabase = await client();
  const now = new Date().toISOString();

  const revokeResult = await supabase
    .from("member_roles")
    .update({ revoked_at: now })
    .eq("member_id", input.contributor.id)
    .is("revoked_at", null);
  if (revokeResult.error) failure(revokeResult.error.message);

  if (input.role !== "contributor") {
    const grantResult = await supabase.from("member_roles").insert({
      member_id: input.contributor.id,
      role_name: input.role,
      granted_by: input.actor.id,
    });
    if (grantResult.error) failure(grantResult.error.message);
  }

  await insertAuditEvent({
    eventType: "contributorRoleChanged",
    actor: input.actor,
    targetType: "contributor",
    targetId: input.contributor.id,
    summary: "Administrator changed a contributor role.",
    metadata: { previousValue: input.contributor.role, nextValue: input.role },
  });
}

export async function updateSupabaseContributorAccessRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly accessStatus: "active" | "pending" | "suspended" | "archived";
}): Promise<void> {
  const supabase = await client();
  const eventType =
    input.accessStatus === "suspended"
      ? "contributorSuspended"
      : input.accessStatus === "archived"
        ? "contributorArchived"
        : "contributorReactivated";
  const updateResult = await supabase
    .from("members")
    .update({ access_status: input.accessStatus, updated_at: new Date().toISOString() })
    .eq("id", input.contributor.id);
  if (updateResult.error) failure(updateResult.error.message);

  await insertAuditEvent({
    eventType,
    actor: input.actor,
    targetType: "contributor",
    targetId: input.contributor.id,
    summary: "Administrator changed contributor portal access.",
    metadata: { previousValue: input.contributor.accessStatus, nextValue: input.accessStatus },
  });
}

export async function updateSupabaseContributorInternalNotesRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly internalNotes: string;
}): Promise<void> {
  const supabase = await client();
  const now = new Date().toISOString();
  const upsertResult = await supabase.from("contributor_internal_notes").upsert(
    { member_id: input.contributor.id, notes: input.internalNotes, updated_at: now, updated_by: input.actor.id },
    { onConflict: "member_id" },
  );
  if (upsertResult.error) failure(upsertResult.error.message);

  await insertAuditEvent({
    eventType: "contributorInternalNotesUpdated",
    actor: input.actor,
    targetType: "contributor",
    targetId: input.contributor.id,
    summary: "Administrator updated private contributor notes.",
    metadata: { noteKind: "privateContributorNote" },
  });
}
