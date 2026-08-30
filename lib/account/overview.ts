import "server-only";

import type { PortalUser } from "@/lib/auth";
import { getContributorAccountOverview as getLegacyContributorAccountOverview } from "@/lib/operations/submissions";
import {
  SUBMISSION_STATUSES,
  type ContributorAccountOverview,
  type ContributorSubmissionSummary,
  type SubmissionStatus,
  type SubmissionType,
} from "@/lib/operations/types";
import { useSupabaseAuth } from "@/lib/supabase/config";
import { SupabaseRepositoryError } from "@/lib/supabase/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

type SupabaseProfile = {
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly biography: string;
  readonly country: string | null;
  readonly administrative_area: string | null;
  readonly city: string | null;
  readonly interests: string[];
  readonly profile_configured: boolean;
  readonly created_at: string;
};

type SupabaseSubmission = {
  readonly id: string;
  readonly submission_type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly payload: unknown;
  readonly contributor_feedback: string;
  readonly assigned_to: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

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
  const nestedCandidates = [
    payload.storyPitchDetails,
    payload.athleteNominationDetails,
    payload.competitionListingDetails,
    payload.teamApplicationDetails,
    payload.organizationClaimDetails,
    payload.videoSubmissionDetails,
    payload.mediaPitchDetails,
    payload.productSubmissionDetails,
    payload.correctionRequestDetails,
  ];
  const direct = stringValue(payload.title);
  if (direct) return direct;

  for (const candidate of nestedCandidates) {
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

export function mapSupabaseSubmissionSummary(
  row: SupabaseSubmission,
): ContributorSubmissionSummary {
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

export function buildSupabaseAccountOverview(input: {
  readonly user: PortalUser;
  readonly profile: SupabaseProfile;
  readonly submissions: readonly SupabaseSubmission[];
}): ContributorAccountOverview {
  const counts = Object.fromEntries(
    SUBMISSION_STATUSES.map((status) => [status, 0]),
  ) as Record<SubmissionStatus, number>;

  for (const submission of input.submissions) counts[submission.status] += 1;

  const location = [
    input.profile.country,
    input.profile.administrative_area,
    input.profile.city,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");

  return {
    profile: {
      id: input.user.id,
      displayName: input.profile.display_name,
      normalizedEmail: input.user.email,
      avatarUrl: input.profile.avatar_url ?? undefined,
      role: input.user.role,
      accessStatus: input.user.accessStatus,
      biography: input.profile.biography,
      location,
      areasOfInterest: input.profile.interests,
      contributorSince: input.profile.created_at,
      lastSignedInAt: input.profile.created_at,
    },
    counts,
    totalSubmissions: input.submissions.length,
    latestSubmissions: input.submissions
      .slice()
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
      .slice(0, 5)
      .map(mapSupabaseSubmissionSummary),
    feedbackAlertCount: input.submissions.filter(
      (submission) =>
        submission.status === "revisionRequested" &&
        submission.contributor_feedback.trim().length > 0,
    ).length,
    profileComplete: input.profile.profile_configured,
  };
}

async function getSupabaseAccountOverview(
  user: PortalUser,
): Promise<ContributorAccountOverview | null> {
  const client = await createSupabaseServerClient();
  const [profileResult, submissionsResult] = await Promise.all([
    client
      .from("profiles")
      .select(
        "display_name, avatar_url, biography, country, administrative_area, city, interests, profile_configured, created_at",
      )
      .eq("member_id", user.id)
      .maybeSingle(),
    client
      .from("submissions")
      .select(
        "id, submission_type, status, payload, contributor_feedback, assigned_to, created_at, updated_at",
      )
      .eq("owner_member_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw new SupabaseRepositoryError(profileResult.error.message);
  }
  if (submissionsResult.error) {
    throw new SupabaseRepositoryError(submissionsResult.error.message);
  }
  if (!profileResult.data) return null;

  return buildSupabaseAccountOverview({
    user,
    profile: profileResult.data as SupabaseProfile,
    submissions: (submissionsResult.data ?? []) as SupabaseSubmission[],
  });
}

export function getAccountOverview(
  user: PortalUser,
): Promise<ContributorAccountOverview | null> {
  return useSupabaseAuth
    ? getSupabaseAccountOverview(user)
    : getLegacyContributorAccountOverview(user.id);
}
