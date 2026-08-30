import "server-only";

import { getBootstrapRole } from "@/lib/auth/config";
import {
  normalizeAdminSubmissionDetail,
  normalizeContributorSubmissionDetail,
} from "@/lib/operations/normalize";
import { higherRole } from "@/lib/operations/permissions";
import { SupabaseRepositoryError } from "@/lib/supabase/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ACCESS_STATUSES,
  AUDIT_EVENT_TYPES,
  CONTRIBUTOR_ROLES,
  SUBMISSION_PRIORITIES,
  SUBMISSION_TYPES,
  type AdminContributorDetail,
  type AdminDashboard,
  type AdminSubmissionDetail,
  type AdminSubmissionSummary,
  type AuditEvent,
  type ContributorReference,
  type ContributorRole,
  type ContributorSubmissionDetail,
  type ContributorSubmissionSummary,
  type EditorContributorSummary,
  type OwnContributorProfile,
  type PrivateEditorialNote,
  type SubmissionPriority,
  type SubmissionStatus,
  type SubmissionType,
} from "@/lib/operations/types";

type JsonRecord = Record<string, unknown>;

type SubmissionRow = {
  readonly id: string;
  readonly owner_member_id: string;
  readonly submission_type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly payload: unknown;
  readonly contributor_feedback: string;
  readonly assigned_to: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

const MAX_OPERATIONAL_LIST_RESULTS = 250;
const roleWeight: Readonly<Record<ContributorRole, number>> = {
  contributor: 0,
  editor: 1,
  admin: 2,
};

function failure(message: string): never {
  throw new SupabaseRepositoryError(message);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function submissionTitle(payload: JsonRecord, type: SubmissionType): string {
  const direct = stringValue(payload.title);
  if (direct) return direct;

  for (const candidate of [
    payload.storyPitchDetails,
    payload.athleteNominationDetails,
    payload.competitionListingDetails,
    payload.teamApplicationDetails,
    payload.organizationClaimDetails,
    payload.videoSubmissionDetails,
    payload.mediaPitchDetails,
    payload.productSubmissionDetails,
    payload.correctionRequestDetails,
  ]) {
    if (!isRecord(candidate)) continue;
    const nested =
      stringValue(candidate.proposedHeadline) ??
      stringValue(candidate.athleteName) ??
      stringValue(candidate.eventName) ??
      stringValue(candidate.proposedTeamName) ??
      stringValue(candidate.organizationName) ??
      stringValue(candidate.videoTitle) ??
      stringValue(candidate.proposedTitle) ??
      stringValue(candidate.productName) ??
      stringValue(candidate.issueSummary);
    if (nested) return nested;
  }

  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function mapSubmissionSummary(row: SubmissionRow): ContributorSubmissionSummary {
  const payload = isRecord(row.payload) ? row.payload : {};
  const submittedAt = stringValue(payload.submittedAt);
  return {
    id: row.id,
    submissionNumber:
      stringValue(payload.submissionNumber) ?? `CC-${row.id.slice(0, 8)}`,
    submissionType: row.submission_type,
    title: submissionTitle(payload, row.submission_type),
    status: row.status,
    revisionNumber: numberValue(payload.revisionNumber),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(submittedAt ? { submittedAt } : {}),
    assignedForReview: row.assigned_to !== null,
    hasVisibleFeedback: row.contributor_feedback.trim().length > 0,
  };
}

function highestRole(values: readonly string[]): ContributorRole {
  let role: ContributorRole = "contributor";
  for (const value of values) {
    if (!CONTRIBUTOR_ROLES.includes(value as ContributorRole)) continue;
    const candidate = value as ContributorRole;
    if (roleWeight[candidate] > roleWeight[role]) role = candidate;
  }
  return role;
}

async function loadContributorReferences(
  memberIds: readonly string[],
): Promise<ReadonlyMap<string, ContributorReference>> {
  const ids = [...new Set(memberIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const client = await createSupabaseServerClient();
  const [membersResult, profilesResult, rolesResult] = await Promise.all([
    client.from("members").select("id, access_status").in("id", ids),
    client.from("profiles").select("member_id, display_name, avatar_url").in("member_id", ids),
    client.from("member_roles").select("member_id, role_name, revoked_at").in("member_id", ids).is("revoked_at", null),
  ]);
  if (membersResult.error) failure(membersResult.error.message);
  if (profilesResult.error) failure(profilesResult.error.message);
  if (rolesResult.error) failure(rolesResult.error.message);

  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.member_id, profile]),
  );
  const roles = new Map<string, string[]>();
  for (const row of rolesResult.data ?? []) {
    roles.set(row.member_id, [...(roles.get(row.member_id) ?? []), row.role_name]);
  }
  return new Map(
    (membersResult.data ?? []).flatMap((member) => {
      const profile = profiles.get(member.id);
      if (!profile || !ACCESS_STATUSES.includes(member.access_status)) return [];
      return [[member.id, {
        id: member.id,
        displayName: profile.display_name,
        role: highestRole(roles.get(member.id) ?? []),
        accessStatus: member.access_status,
        ...(profile.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
      } satisfies ContributorReference] as const];
    }),
  );
}

export async function getSupabaseOwnContributorProfile(
  memberId: string,
): Promise<OwnContributorProfile | null> {
  const client = await createSupabaseServerClient();
  const [memberResult, profileResult, rolesResult, authorResult] = await Promise.all([
    client.from("members").select("id, email_normalized, access_status, last_signed_in_at, created_at").eq("id", memberId).maybeSingle(),
    client.from("profiles").select("member_id, display_name, avatar_url, biography, country, administrative_area, city, interests").eq("member_id", memberId).maybeSingle(),
    client.from("member_roles").select("role_name").eq("member_id", memberId).is("revoked_at", null),
    client.from("authors").select("id").eq("member_id", memberId).limit(1).maybeSingle(),
  ]);
  if (memberResult.error) failure(memberResult.error.message);
  if (profileResult.error) failure(profileResult.error.message);
  if (rolesResult.error) failure(rolesResult.error.message);
  if (authorResult.error) failure(authorResult.error.message);
  if (!memberResult.data || !profileResult.data) return null;
  const member = memberResult.data;
  const profile = profileResult.data;
  if (!member.email_normalized || !ACCESS_STATUSES.includes(member.access_status)) return null;
  const location = [profile.city, profile.administrative_area, profile.country]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");
  return {
    id: member.id,
    displayName: profile.display_name,
    normalizedEmail: member.email_normalized,
    role: highestRole((rolesResult.data ?? []).map((row) => row.role_name)),
    accessStatus: member.access_status,
    ...(profile.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
    biography: profile.biography,
    location,
    areasOfInterest: profile.interests,
    contributorSince: member.created_at,
    lastSignedInAt: member.last_signed_in_at ?? member.created_at,
    ...(authorResult.data ? { linkedAuthorId: authorResult.data.id } : {}),
  };
}

async function listSubmissionRows(ownerMemberId?: string): Promise<SubmissionRow[]> {
  const client = await createSupabaseServerClient();
  let query = client
    .from("submissions")
    .select("id, owner_member_id, submission_type, status, payload, contributor_feedback, assigned_to, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_OPERATIONAL_LIST_RESULTS);
  if (ownerMemberId) query = query.eq("owner_member_id", ownerMemberId);
  const { data, error } = await query;
  if (error) failure(error.message);
  return (data ?? []) as SubmissionRow[];
}

export async function getSupabaseContributorSubmissions(
  memberId: string,
): Promise<ContributorSubmissionSummary[]> {
  return (await listSubmissionRows(memberId)).map(mapSubmissionSummary);
}

export async function countSupabaseContributorSubmissions(
  memberId: string,
): Promise<number> {
  const client = await createSupabaseServerClient();
  const { count, error } = await client
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("owner_member_id", memberId);
  if (error) failure(error.message);
  return count ?? 0;
}

export async function getSupabaseAdminSubmissionQueue(): Promise<AdminSubmissionSummary[]> {
  const rows = await listSubmissionRows();
  const references = await loadContributorReferences(
    rows.flatMap((row) => [row.owner_member_id, ...(row.assigned_to ? [row.assigned_to] : [])]),
  );
  return rows.flatMap((row) => {
    const submitter = references.get(row.owner_member_id);
    if (!submitter) return [];
    const summary = mapSubmissionSummary(row);
    const payload = isRecord(row.payload) ? row.payload : {};
    const priority = SUBMISSION_PRIORITIES.includes(payload.priority as SubmissionPriority)
      ? payload.priority as SubmissionPriority
      : "normal";
    const assignedReviewer = row.assigned_to
      ? references.get(row.assigned_to)
      : undefined;
    return [{
      id: summary.id,
      submissionNumber: summary.submissionNumber,
      submissionType: summary.submissionType,
      title: summary.title,
      status: summary.status,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      ...(summary.submittedAt ? { submittedAt: summary.submittedAt } : {}),
      priority,
      submitter,
      ...(assignedReviewer ? { assignedReviewer } : {}),
    }];
  });
}

export async function countSupabaseAdminSubmissions(): Promise<number> {
  const client = await createSupabaseServerClient();
  const { count, error } = await client.from("submissions").select("id", { count: "exact", head: true });
  if (error) failure(error.message);
  return count ?? 0;
}

export type SupabaseAdminActionableSubmissionCount = {
  readonly submissionType: SubmissionType;
  readonly count: number;
};

export async function getSupabaseAdminActionableSubmissionCounts(): Promise<readonly SupabaseAdminActionableSubmissionCount[]> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("submissions")
    .select("submission_type, status")
    .in("status", ["submitted", "inReview"]);
  if (error) failure(error.message);
  return SUBMISSION_TYPES.map((submissionType) => ({
    submissionType,
    count: (data ?? []).filter((row) => row.submission_type === submissionType).length,
  }));
}

function mapAuditEvent(
  row: Record<string, unknown>,
  references: ReadonlyMap<string, ContributorReference>,
): AuditEvent | null {
  const eventType = stringValue(row.event_type);
  const targetId = stringValue(row.target_id);
  const summary = stringValue(row.summary);
  const createdAt = stringValue(row.created_at);
  if (!eventType || !AUDIT_EVENT_TYPES.includes(eventType as AuditEvent["eventType"]) || !targetId || !summary || !createdAt) return null;
  const actorId = stringValue(row.actor_member_id);
  const actor = actorId ? references.get(actorId) : undefined;
  const targetType = row.target_type === "submission" ? "submission" : "contributor";
  const metadata = isRecord(row.metadata) ? row.metadata : undefined;
  return {
    id: String(row.id),
    eventType: eventType as AuditEvent["eventType"],
    ...(actor ? { actor } : {}),
    actorRole: actor?.role ?? "admin",
    targetType,
    targetDocumentId: targetId,
    ...(targetType === "submission" ? { submissionId: targetId } : { contributorId: targetId }),
    summary,
    createdAt,
    ...(metadata
      ? {
          metadata: {
            previousValue: stringValue(metadata.previousValue),
            nextValue: stringValue(metadata.nextValue),
            noteKind: stringValue(metadata.noteKind),
          },
        }
      : {}),
  };
}

function privateNoteAuthorIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((raw) => {
    if (!isRecord(raw) || !isRecord(raw.author)) return [];
    const id = stringValue(raw.author._ref);
    return id ? [id] : [];
  });
}

function mapPrivateEditorialNotes(
  value: unknown,
  references: ReadonlyMap<string, ContributorReference>,
): PrivateEditorialNote[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const key = stringValue(raw.key) ?? stringValue(raw._key);
    const authorId = isRecord(raw.author) ? stringValue(raw.author._ref) : undefined;
    const author = authorId ? references.get(authorId) : undefined;
    if (!key || !author) return [];
    return [{
      key,
      text: stringValue(raw.text) ?? "",
      author,
      createdAt: stringValue(raw.createdAt) ?? "",
    }];
  });
}

function submissionDetailSource(row: {
  readonly id: string;
  readonly submission_type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly payload: unknown;
  readonly contributor_feedback: string;
  readonly assigned_to: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}): JsonRecord {
  const payload = isRecord(row.payload) ? row.payload : {};
  return {
    ...payload,
    id: row.id,
    submissionType: row.submission_type,
    status: row.status,
    contributorVisibleFeedback: row.contributor_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadEditorContributorSummary(
  memberId: string,
): Promise<EditorContributorSummary | null> {
  const own = await getSupabaseOwnContributorProfile(memberId);
  if (!own) {
    return null;
  }
  const client = await createSupabaseServerClient();
  const [totalResult, activeResult] = await Promise.all([
    client.from("submissions").select("id", { count: "exact", head: true }).eq("owner_member_id", memberId),
    client
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("owner_member_id", memberId)
      .in("status", ["submitted", "inReview", "revisionRequested"]),
  ]);
  if (totalResult.error) failure(totalResult.error.message);
  if (activeResult.error) failure(activeResult.error.message);
  return {
    ...own,
    submissionCount: totalResult.count ?? 0,
    activeReviewCount: activeResult.count ?? 0,
  };
}

export async function getSupabaseSubmissionForContributor(
  submissionId: string,
  contributorId: string,
): Promise<ContributorSubmissionDetail | null> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("submissions")
    .select("id, submission_type, status, payload, contributor_feedback, assigned_to, created_at, updated_at")
    .eq("id", submissionId)
    .eq("owner_member_id", contributorId)
    .maybeSingle();
  if (error) failure(error.message);
  if (!data) return null;
  return normalizeContributorSubmissionDetail({
    ...submissionDetailSource(data),
    assignedForReview: data.assigned_to !== null,
  });
}

export async function getSupabaseSubmissionForReview(
  submissionId: string,
): Promise<AdminSubmissionDetail | null> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("submissions")
    .select(
      "id, owner_member_id, submission_type, status, payload, contributor_feedback, private_editorial_notes, assigned_to, created_at, updated_at",
    )
    .eq("id", submissionId)
    .maybeSingle();
  if (error) failure(error.message);
  if (!data) return null;

  const auditResult = await client
    .from("audit_events")
    .select("id, event_type, actor_member_id, target_type, target_id, summary, created_at, metadata")
    .eq("target_type", "submission")
    .eq("target_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(150);
  if (auditResult.error) failure(auditResult.error.message);
  const auditRows = auditResult.data ?? [];

  const referenceIds = [
    ...(data.assigned_to ? [data.assigned_to] : []),
    ...privateNoteAuthorIds(data.private_editorial_notes),
    ...auditRows.flatMap((row) => (row.actor_member_id ? [row.actor_member_id] : [])),
  ];
  const [submitter, references] = await Promise.all([
    loadEditorContributorSummary(data.owner_member_id),
    loadContributorReferences(referenceIds),
  ]);
  if (!submitter) return null;

  return normalizeAdminSubmissionDetail({
    ...submissionDetailSource(data),
    submitter,
    ...(data.assigned_to && references.get(data.assigned_to)
      ? { assignedReviewer: references.get(data.assigned_to) }
      : {}),
    privateEditorialNotes: mapPrivateEditorialNotes(data.private_editorial_notes, references),
    auditEvents: auditRows.flatMap((row) => {
      const event = mapAuditEvent(row, references);
      return event ? [event] : [];
    }),
    linkedDocuments: [],
  });
}

export async function getSupabaseAuditEvents(limit = 150): Promise<AuditEvent[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("audit_events")
    .select("id, event_type, actor_member_id, target_type, target_id, summary, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) failure(error.message);
  const rows = data ?? [];
  const references = await loadContributorReferences(
    rows.flatMap((row) => (row.actor_member_id ? [row.actor_member_id] : [])),
  );
  return rows.flatMap((row) => {
    const event = mapAuditEvent(row, references);
    return event ? [event] : [];
  });
}

export async function getSupabaseContributorAuditEvents(
  contributorId: string,
  limit = 100,
): Promise<AuditEvent[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 150);
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("audit_events")
    .select("id, event_type, actor_member_id, target_type, target_id, summary, created_at, metadata")
    .eq("target_type", "contributor")
    .eq("target_id", contributorId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) failure(error.message);
  const rows = data ?? [];
  const references = await loadContributorReferences(
    rows.flatMap((row) => (row.actor_member_id ? [row.actor_member_id] : [])),
  );
  return rows.flatMap((row) => {
    const event = mapAuditEvent(row, references);
    return event ? [event] : [];
  });
}

export async function getSupabaseContributorForEditor(
  contributorId: string,
): Promise<EditorContributorSummary | null> {
  return loadEditorContributorSummary(contributorId);
}

export async function getSupabaseContributorForAdmin(
  contributorId: string,
): Promise<AdminContributorDetail | null> {
  const editor = await loadEditorContributorSummary(contributorId);
  if (!editor) return null;
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("members")
    .select("auth_user_id, created_at, updated_at")
    .eq("id", contributorId)
    .maybeSingle();
  if (error) failure(error.message);
  if (!data) return null;
  return {
    ...editor,
    revisionId: data.updated_at,
    // Supabase Auth (not a per-record Sanity-style provider/account pair) is
    // the sole identity provider in this mode; internalNotes has no Supabase
    // column yet -- this surfaces as empty rather than failing the page.
    authProvider: "supabase",
    providerAccountId: data.auth_user_id ?? "",
    internalNotes: "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSupabaseAssignableReviewers(): Promise<
  readonly ContributorReference[]
> {
  const client = await createSupabaseServerClient();
  const { data: activeMembers, error: membersError } = await client
    .from("members")
    .select("id, email_normalized")
    .eq("access_status", "active")
    .limit(MAX_OPERATIONAL_LIST_RESULTS);
  if (membersError) failure(membersError.message);
  const ids = (activeMembers ?? []).map((member) => member.id);
  if (!ids.length) return [];

  const [profilesResult, rolesResult] = await Promise.all([
    client.from("profiles").select("member_id, display_name, avatar_url").in("member_id", ids),
    client.from("member_roles").select("member_id, role_name, revoked_at").in("member_id", ids).is("revoked_at", null),
  ]);
  if (profilesResult.error) failure(profilesResult.error.message);
  if (rolesResult.error) failure(rolesResult.error.message);

  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.member_id, profile]),
  );
  const roles = new Map<string, string[]>();
  for (const row of rolesResult.data ?? []) {
    roles.set(row.member_id, [...(roles.get(row.member_id) ?? []), row.role_name]);
  }

  return (activeMembers ?? [])
    .flatMap((member) => {
      const profile = profiles.get(member.id);
      if (!profile) return [];
      const storedRole = highestRole(roles.get(member.id) ?? []);
      const bootstrapRole = member.email_normalized
        ? getBootstrapRole(member.email_normalized)
        : null;
      const effectiveRole = bootstrapRole ? higherRole(storedRole, bootstrapRole) : storedRole;
      if (effectiveRole === "contributor") return [];
      return [{
        id: member.id,
        displayName: profile.display_name,
        role: effectiveRole,
        accessStatus: "active" as const,
        ...(profile.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
      }];
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function getSupabaseAdminDashboard(): Promise<AdminDashboard> {
  const client = await createSupabaseServerClient();
  const [submissionsResult, membersResult, auditResult] = await Promise.all([
    client.from("submissions").select("status"),
    client.from("members").select("access_status"),
    client.from("audit_events").select("id, event_type, actor_member_id, target_type, target_id, summary, created_at").order("created_at", { ascending: false }).limit(25),
  ]);
  if (submissionsResult.error) failure(submissionsResult.error.message);
  if (membersResult.error) failure(membersResult.error.message);
  if (auditResult.error) failure(auditResult.error.message);
  const auditRows = (auditResult.data ?? []) as Array<Record<string, unknown>>;
  const references = await loadContributorReferences(
    auditRows.map((row) => stringValue(row.actor_member_id)).filter((value): value is string => Boolean(value)),
  );
  const statuses = submissionsResult.data ?? [];
  const members = membersResult.data ?? [];
  return {
    submissions: {
      awaitingReview: statuses.filter((row) => row.status === "submitted").length,
      inReview: statuses.filter((row) => row.status === "inReview").length,
      revisionRequested: statuses.filter((row) => row.status === "revisionRequested").length,
      approved: statuses.filter((row) => row.status === "approved").length,
      rejected: statuses.filter((row) => row.status === "rejected").length,
    },
    contributors: {
      active: members.filter((row) => row.access_status === "active").length,
      suspended: members.filter((row) => row.access_status === "suspended").length,
    },
    recentAuditEvents: auditRows.flatMap((row) => {
      const event = mapAuditEvent(row, references);
      return event ? [event] : [];
    }).slice(0, 8),
  };
}
