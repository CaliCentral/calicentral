import "server-only";

import { randomUUID } from "node:crypto";

import { createAuditEventDocument } from "@/lib/operations/audit";
import { requireOperationsClient } from "@/lib/operations/client";
import { OperationalError } from "@/lib/operations/errors";
import {
  createPrivateNoteIdentifiers,
  createSubmissionCreateIdentifiers,
  createSubmissionUpdateIdentifiers,
} from "@/lib/operations/idempotency";
import { hasReachedActiveSubmissionLimit } from "@/lib/operations/limits";
import {
  normalizeAdminSubmissionDetail,
  normalizeAdminSubmissionSummary,
  normalizeAuditEvent,
  normalizeContributorSubmissionDetail,
  normalizeContributorSubmissionSummary,
  normalizeOwnContributorProfile,
  normalizedSubmissionStatus,
  normalizedSubmissionType,
} from "@/lib/operations/normalize";
import { SUBMISSION_MUTATION_TARGET_PROJECTION } from "@/lib/operations/projections";
import { SUBMISSION_STATUSES } from "@/lib/operations/types";
import type {
  AdminDashboard,
  AdminSubmissionDetail,
  AdminSubmissionSummary,
  AuditEvent,
  ContributorAccountOverview,
  ContributorSubmissionDetail,
  ContributorSubmissionSummary,
  OperationalActor,
  SubmissionPriority,
  SubmissionStatus,
  SubmissionType,
  SupportingLinkInput,
} from "@/lib/operations/types";
import type {
  SubmissionDraftInput,
  SubmissionForReviewInput,
} from "@/lib/operations/validation";
import { operationalDocumentIdSchema } from "@/lib/operations/validation";
import { assertSubmissionTransition } from "@/lib/operations/workflow";

const SUPPORTING_LINK_PROJECTION = `{
  "key": _key,
  label,
  url
}`;

const CONTRIBUTOR_REFERENCE_PROJECTION = `{
  "id": _id,
  displayName,
  avatarUrl,
  role,
  accessStatus
}`;

const AUDIT_PROJECTION = `{
  "id": _id,
  eventType,
  actorRole,
  targetType,
  targetDocumentId,
  "submissionId": submission._ref,
  "contributorId": contributor._ref,
  previousStatus,
  nextStatus,
  summary,
  createdAt,
  metadata,
  "actor": actor->${CONTRIBUTOR_REFERENCE_PROJECTION}
}`;

const SUBMISSION_CONTENT_PROJECTION = `{
  "id": _id,
  submissionNumber,
  submissionType,
  title,
  summary,
  details,
  status,
  revisionNumber,
  createdAt,
  updatedAt,
  submittedAt,
  withdrawnAt,
  reviewedAt,
  resolvedAt,
  "supportingLinks": supportingLinks[]${SUPPORTING_LINK_PROJECTION},
  contributorNote,
  contributorVisibleFeedback,
  storyPitchDetails {
    proposedHeadline,
    section,
    pitchSummary,
    reportingApproach,
    relevantPeople,
    relevantLocations,
    estimatedLength,
    conflictDisclosure
  },
  athleteNominationDetails {
    requestKind,
    existingAthleteSlug,
    athleteName,
    displayName,
    country,
    administrativeArea,
    city,
    biography,
    primaryCategory,
    specialties,
    yearsActive,
    profileImageUrl,
    coverImageUrl,
    "socialLinks": socialLinks[]${SUPPORTING_LINK_PROJECTION},
    "competitionHistory": competitionHistory[]{
      "key": _key,
      eventName,
      organizer,
      date,
      country,
      city,
      divisionCategory,
      placement,
      score,
      officialResultUrl,
      eventUrl,
      videoUrl
    },
    discipline,
    nominationReason,
    "publicReferenceLinks": publicReferenceLinks[]${SUPPORTING_LINK_PROJECTION},
    relationshipToAthlete,
    permissionStatus
  },
  competitionListingDetails {
    eventName,
    city,
    proposedDate,
    format,
    divisions,
    organizerRelationship,
    "publicReferenceLinks": publicReferenceLinks[]${SUPPORTING_LINK_PROJECTION},
    scheduleStatus
  },
  mediaPitchDetails {
    proposedTitle,
    series,
    format,
    subject,
    location,
    visualApproach,
    estimatedDuration,
    sourcePlatform,
    sourceAccount,
    originalPostUrl,
    mediaPermissionStatus,
    "publicReferenceLinks": publicReferenceLinks[]${SUPPORTING_LINK_PROJECTION}
  },
  correctionRequestDetails {
    affectedUrl,
    issueSummary,
    requestedCorrection,
    "sourceLinks": sourceLinks[]${SUPPORTING_LINK_PROJECTION},
    relationshipToSubject
  }
}`;

const CONTRIBUTOR_SUMMARY_PROJECTION = `{
  "id": _id,
  submissionNumber,
  submissionType,
  title,
  status,
  revisionNumber,
  createdAt,
  updatedAt,
  submittedAt,
  "assignedForReview": defined(assignedReviewer),
  "hasVisibleFeedback": length(coalesce(contributorVisibleFeedback, "")) > 0
}`;

const EDITOR_CONTRIBUTOR_PROJECTION = `{
  "id": _id,
  displayName,
  normalizedEmail,
  avatarUrl,
  role,
  accessStatus,
  biography,
  location,
  areasOfInterest,
  contributorSince,
  lastSignedInAt,
  termsAcceptedAt,
  "linkedAuthorId": linkedAuthor._ref,
  "linkedAthleteId": linkedAthlete._ref,
  "submissionCount": count(*[
    _type == "submission" &&
    submitter._ref == ^._id
  ]),
  "activeReviewCount": count(*[
    _type == "submission" &&
    submitter._ref == ^._id &&
    status in ["submitted", "inReview", "revisionRequested"]
  ])
}`;

type SubmissionWriteInput = SubmissionDraftInput | SubmissionForReviewInput;
const MAX_OPERATIONAL_LIST_RESULTS = 250;

export type SubmissionMutationTarget = {
  readonly id: string;
  readonly revisionId: string;
  readonly submitterId: string;
  readonly submissionType: SubmissionType;
  readonly status: SubmissionStatus;
  readonly title: string;
  readonly revisionNumber: number;
  readonly priority: SubmissionPriority;
  readonly assignedReviewerId?: string;
  readonly contributorVisibleFeedback: string;
  readonly auditEventCount: number;
  readonly privateEditorialNoteCount: number;
};

type CreatedSubmissionResult = {
  readonly id: string;
  readonly submissionNumber: string;
  readonly status: SubmissionStatus;
};

function isMutationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

function createSupportingLinkDocuments(
  links: readonly SupportingLinkInput[],
) {
  return links.map((link) => ({
    _key: randomUUID(),
    _type: "supportingLink",
    ...(link.label ? { label: link.label } : {}),
    url: link.url,
  }));
}

function createAthleteCompetitionHistoryDocuments(
  entries: readonly Record<string, unknown>[],
) {
  return entries.map((entry) => ({
    _key: randomUUID(),
    _type: "athleteCompetitionHistorySubmission",
    ...compactRecord(entry),
  }));
}

function compactRecord(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
}

function submissionContentPatch(input: SubmissionWriteInput) {
  const common = {
    submissionType: input.submissionType,
    title: input.title,
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.details ? { details: input.details } : {}),
    ...(input.contributorNote
      ? { contributorNote: input.contributorNote }
      : {}),
    supportingLinks: createSupportingLinkDocuments(input.supportingLinks),
  };

  switch (input.submissionType) {
    case "storyPitch":
      return {
        ...common,
        storyPitchDetails: compactRecord({
          _type: "storyPitchDetails",
          ...input.storyPitchDetails,
        }),
      };
    case "athleteNomination":
      return {
        ...common,
        athleteNominationDetails: compactRecord({
          _type: "athleteNominationDetails",
          ...input.athleteNominationDetails,
          socialLinks: createSupportingLinkDocuments(
            input.athleteNominationDetails.socialLinks ?? [],
          ),
          competitionHistory: createAthleteCompetitionHistoryDocuments(
            input.athleteNominationDetails.competitionHistory ?? [],
          ),
          publicReferenceLinks: createSupportingLinkDocuments(
            input.athleteNominationDetails.publicReferenceLinks ?? [],
          ),
        }),
      };
    case "competitionListing":
      return {
        ...common,
        competitionListingDetails: compactRecord({
          _type: "competitionListingDetails",
          ...input.competitionListingDetails,
          publicReferenceLinks: createSupportingLinkDocuments(
            input.competitionListingDetails.publicReferenceLinks ?? [],
          ),
        }),
      };
    case "mediaPitch":
      return {
        ...common,
        mediaPitchDetails: compactRecord({
          _type: "mediaPitchDetails",
          ...input.mediaPitchDetails,
          publicReferenceLinks: createSupportingLinkDocuments(
            input.mediaPitchDetails.publicReferenceLinks ?? [],
          ),
        }),
      };
    case "correctionRequest":
      return {
        ...common,
        correctionRequestDetails: compactRecord({
          _type: "correctionRequestDetails",
          ...input.correctionRequestDetails,
          sourceLinks: createSupportingLinkDocuments(
            input.correctionRequestDetails.sourceLinks ?? [],
          ),
        }),
      };
  }
}

function auditReference(auditId: string) {
  return {
    _key: randomUUID(),
    _type: "reference",
    _ref: auditId,
  };
}

function assertSubmissionHistoryCapacity(
  target: SubmissionMutationTarget,
): void {
  if (target.auditEventCount >= 500) {
    throw new OperationalError(
      "operation_failed",
      "This submission has reached its prototype audit-history limit.",
    );
  }
}

function transitionEvent(
  currentStatus: SubmissionStatus,
  nextStatus: SubmissionStatus,
) {
  if (nextStatus === "submitted") {
    return currentStatus === "revisionRequested"
      ? {
          eventType: "submissionResubmitted" as const,
          summary: "Contributor resubmitted the requested revision.",
        }
      : {
          eventType: "submissionSubmitted" as const,
          summary: "Contributor submitted the draft for editorial review.",
        };
  }

  const byStatus = {
    inReview: {
      eventType: "reviewStarted" as const,
      summary: "Editorial review started.",
    },
    revisionRequested: {
      eventType: "revisionRequested" as const,
      summary: "Editor requested a contributor revision.",
    },
    approved: {
      eventType: "submissionApproved" as const,
      summary: "Submission approved for editorial development.",
    },
    rejected: {
      eventType: "submissionRejected" as const,
      summary: "Submission rejected after editorial review.",
    },
    withdrawn: {
      eventType: "submissionWithdrawn" as const,
      summary: "Contributor withdrew the submission.",
    },
    archived: {
      eventType: "submissionArchived" as const,
      summary: "Editorial staff archived the resolved submission.",
    },
    draft: null,
    submitted: null,
  } satisfies Record<
    SubmissionStatus,
    | {
        eventType:
          | "reviewStarted"
          | "revisionRequested"
          | "submissionApproved"
          | "submissionRejected"
          | "submissionWithdrawn"
          | "submissionArchived";
        summary: string;
      }
    | null
  >;

  return byStatus[nextStatus];
}

export async function getContributorSubmissions(
  contributorId: string,
): Promise<ContributorSubmissionSummary[]> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(
    `*[
      _type == "submission" &&
      submitter._ref == $contributorId
    ] | order(updatedAt desc)[0...$limit] ${CONTRIBUTOR_SUMMARY_PROJECTION}`,
    { contributorId: id, limit: MAX_OPERATIONAL_LIST_RESULTS },
  );
  return result.flatMap((value) => {
    const normalized = normalizeContributorSubmissionSummary(value);
    return normalized ? [normalized] : [];
  });
}

export async function countContributorSubmissions(
  contributorId: string,
): Promise<number> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  const count = await client.fetch<number>(
    `count(*[
      _type == "submission" &&
      submitter._ref == $contributorId
    ])`,
    { contributorId: id },
  );

  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export async function getSubmissionForContributor(
  submissionId: string,
  contributorId: string,
): Promise<ContributorSubmissionDetail | null> {
  const id = operationalDocumentIdSchema.parse(submissionId);
  const ownerId = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  return normalizeContributorSubmissionDetail(
    await client.fetch<unknown>(
      `*[
        _type == "submission" &&
        _id == $id &&
        submitter._ref == $contributorId
      ][0] {
        ${SUBMISSION_CONTENT_PROJECTION.slice(1, -1)},
        "assignedForReview": defined(assignedReviewer)
      }`,
      { id, contributorId: ownerId },
    ),
  );
}

export async function getContributorAccountOverview(
  contributorId: string,
): Promise<ContributorAccountOverview | null> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  const result = await client.fetch<{
    profile: unknown;
    counts: Partial<Record<SubmissionStatus, number>>;
    feedbackAlertCount: number;
    totalSubmissions: number;
    latestSubmissions: unknown[];
  }>(
    `{
      "profile": *[
        _type == "contributorProfile" &&
        _id == $contributorId
      ][0] {
        "id": _id,
        displayName,
        normalizedEmail,
        avatarUrl,
        role,
        accessStatus,
        biography,
        location,
        areasOfInterest,
        contributorSince,
        lastSignedInAt,
        termsAcceptedAt,
        "linkedAuthorId": linkedAuthor._ref,
        "linkedAthleteId": linkedAthlete._ref
      },
      "counts": {
        "draft": count(*[_type == "submission" && submitter._ref == $contributorId && status == "draft"]),
        "submitted": count(*[_type == "submission" && submitter._ref == $contributorId && status == "submitted"]),
        "inReview": count(*[_type == "submission" && submitter._ref == $contributorId && status == "inReview"]),
        "revisionRequested": count(*[_type == "submission" && submitter._ref == $contributorId && status == "revisionRequested"]),
        "approved": count(*[_type == "submission" && submitter._ref == $contributorId && status == "approved"]),
        "rejected": count(*[_type == "submission" && submitter._ref == $contributorId && status == "rejected"]),
        "withdrawn": count(*[_type == "submission" && submitter._ref == $contributorId && status == "withdrawn"]),
        "archived": count(*[_type == "submission" && submitter._ref == $contributorId && status == "archived"])
      },
      "totalSubmissions": count(*[
        _type == "submission" &&
        submitter._ref == $contributorId
      ]),
      "feedbackAlertCount": count(*[
        _type == "submission" &&
        submitter._ref == $contributorId &&
        status == "revisionRequested" &&
        length(coalesce(contributorVisibleFeedback, "")) > 0
      ]),
      "latestSubmissions": *[
        _type == "submission" &&
        submitter._ref == $contributorId
      ] | order(updatedAt desc)[0...5] ${CONTRIBUTOR_SUMMARY_PROJECTION}
    }`,
    { contributorId: id },
  );
  const profile = normalizeOwnContributorProfile(result.profile);

  if (!profile) {
    return null;
  }

  const latestSubmissions = result.latestSubmissions.flatMap((value) => {
    const normalized = normalizeContributorSubmissionSummary(value);
    return normalized ? [normalized] : [];
  });
  const counts: Record<SubmissionStatus, number> = {
    draft: 0,
    submitted: 0,
    inReview: 0,
    revisionRequested: 0,
    approved: 0,
    rejected: 0,
    withdrawn: 0,
    archived: 0,
  };

  for (const status of SUBMISSION_STATUSES) {
    const value = result.counts?.[status];
    counts[status] =
      typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
  }

  return {
    profile,
    counts,
    totalSubmissions:
      typeof result.totalSubmissions === "number" &&
      Number.isFinite(result.totalSubmissions)
        ? Math.max(0, result.totalSubmissions)
        : 0,
    latestSubmissions,
    feedbackAlertCount:
      typeof result.feedbackAlertCount === "number" &&
      Number.isFinite(result.feedbackAlertCount)
        ? Math.max(0, result.feedbackAlertCount)
        : 0,
    profileComplete:
      profile.displayName.length >= 2 &&
      (profile.biography.length > 0 ||
        profile.location.length > 0 ||
        profile.areasOfInterest.length > 0),
  };
}

export async function getAdminSubmissionQueue(): Promise<
  AdminSubmissionSummary[]
> {
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(
    `*[_type == "submission"] | order(updatedAt desc)[0...250] {
      "id": _id,
      "revisionId": _rev,
      submissionNumber,
      submissionType,
      title,
      status,
      createdAt,
      updatedAt,
      submittedAt,
      priority,
      "submitter": submitter->${CONTRIBUTOR_REFERENCE_PROJECTION},
      "assignedReviewer": assignedReviewer->${CONTRIBUTOR_REFERENCE_PROJECTION}
    }`,
  );
  return result.flatMap((value) => {
    const normalized = normalizeAdminSubmissionSummary(value);
    return normalized ? [normalized] : [];
  });
}

export async function countAdminSubmissions(): Promise<number> {
  const client = requireOperationsClient();
  const count = await client.fetch<number>(
    `count(*[_type == "submission"])`,
  );
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export async function getSubmissionForReview(
  submissionId: string,
): Promise<AdminSubmissionDetail | null> {
  const id = operationalDocumentIdSchema.parse(submissionId);
  const client = requireOperationsClient();
  return normalizeAdminSubmissionDetail(
    await client.fetch<unknown>(
      `*[_type == "submission" && _id == $id][0] {
        ${SUBMISSION_CONTENT_PROJECTION.slice(1, -1)},
        priority,
        "submitter": submitter->${EDITOR_CONTRIBUTOR_PROJECTION},
        "assignedReviewer": assignedReviewer->${CONTRIBUTOR_REFERENCE_PROJECTION},
        "privateEditorialNotes": privateEditorialNotes[]{
          "key": _key,
          text,
          createdAt,
          "author": author->${CONTRIBUTOR_REFERENCE_PROJECTION}
        },
        "auditEvents": auditEvents[]->${AUDIT_PROJECTION},
        "linkedDocuments": [
          select(defined(linkedStory) => {"type": "story", "id": linkedStory._ref}),
          select(defined(linkedAthlete) => {"type": "athlete", "id": linkedAthlete._ref}),
          select(defined(linkedCompetition) => {"type": "competition", "id": linkedCompetition._ref}),
          select(defined(linkedVideo) => {"type": "video", "id": linkedVideo._ref})
        ],
        createdDraftDocumentId
      }`,
      { id },
    ),
  );
}

export async function getAuditEvents(limit = 150): Promise<AuditEvent[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(
    `*[_type == "auditEvent"] | order(createdAt desc)[0...$limit] ${AUDIT_PROJECTION}`,
    { limit: safeLimit },
  );
  return result.flatMap((value) => {
    const normalized = normalizeAuditEvent(value);
    return normalized ? [normalized] : [];
  });
}

export async function getContributorAuditEvents(
  contributorId: string,
  limit = 100,
): Promise<AuditEvent[]> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 150);
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(
    `*[
      _type == "auditEvent" &&
      contributor._ref == $contributorId
    ] | order(createdAt desc)[0...$limit] ${AUDIT_PROJECTION}`,
    { contributorId: id, limit: safeLimit },
  );

  return result.flatMap((value) => {
    const normalized = normalizeAuditEvent(value);
    return normalized ? [normalized] : [];
  });
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const client = requireOperationsClient();
  const result = await client.fetch<{
    awaitingReview: number;
    inReview: number;
    revisionRequested: number;
    approved: number;
    rejected: number;
    activeContributors: number;
    suspendedContributors: number;
    recentAuditEvents: unknown[];
  }>(`{
    "awaitingReview": count(*[_type == "submission" && status == "submitted"]),
    "inReview": count(*[_type == "submission" && status == "inReview"]),
    "revisionRequested": count(*[_type == "submission" && status == "revisionRequested"]),
    "approved": count(*[_type == "submission" && status == "approved"]),
    "rejected": count(*[_type == "submission" && status == "rejected"]),
    "activeContributors": count(*[_type == "contributorProfile" && accessStatus == "active"]),
    "suspendedContributors": count(*[_type == "contributorProfile" && accessStatus == "suspended"]),
    "recentAuditEvents": *[_type == "auditEvent"] | order(createdAt desc)[0...8] ${AUDIT_PROJECTION}
  }`);

  return {
    submissions: {
      awaitingReview: result.awaitingReview,
      inReview: result.inReview,
      revisionRequested: result.revisionRequested,
      approved: result.approved,
      rejected: result.rejected,
    },
    contributors: {
      active: result.activeContributors,
      suspended: result.suspendedContributors,
    },
    recentAuditEvents: result.recentAuditEvents.flatMap((value) => {
      const normalized = normalizeAuditEvent(value);
      return normalized ? [normalized] : [];
    }),
  };
}

export async function getSubmissionMutationTarget(
  submissionId: string,
): Promise<SubmissionMutationTarget | null> {
  const id = operationalDocumentIdSchema.parse(submissionId);
  const client = requireOperationsClient();
  const result = await client.fetch<Record<string, unknown> | null>(
    `*[_type == "submission" && _id == $id][0] ${SUBMISSION_MUTATION_TARGET_PROJECTION}`,
    { id },
  );

  if (!result) {
    return null;
  }

  const submissionType = normalizedSubmissionType(result.submissionType);
  const status = normalizedSubmissionStatus(result.status);
  const submitterId =
    typeof result.submitterId === "string" ? result.submitterId : null;
  const revisionId =
    typeof result.revisionId === "string" ? result.revisionId : null;

  if (!submissionType || !status || !submitterId || !revisionId) {
    return null;
  }

  return {
    id,
    revisionId,
    submitterId,
    submissionType,
    status,
    title: typeof result.title === "string" ? result.title : "",
    revisionNumber:
      typeof result.revisionNumber === "number"
        ? Math.max(1, result.revisionNumber)
        : 1,
    priority:
      result.priority === "elevated" || result.priority === "urgent"
        ? result.priority
        : "normal",
    assignedReviewerId:
      typeof result.assignedReviewerId === "string"
        ? result.assignedReviewerId
        : undefined,
    contributorVisibleFeedback:
      typeof result.contributorVisibleFeedback === "string"
        ? result.contributorVisibleFeedback
        : "",
    auditEventCount:
      typeof result.auditEventCount === "number"
        ? Math.max(0, result.auditEventCount)
        : 0,
    privateEditorialNoteCount:
      typeof result.privateEditorialNoteCount === "number"
        ? Math.max(0, result.privateEditorialNoteCount)
        : 0,
  };
}

async function getCreatedSubmissionResult(
  client: ReturnType<typeof requireOperationsClient>,
  submissionId: string,
  contributorId: string,
): Promise<CreatedSubmissionResult | null> {
  const persisted = await client.fetch<{
    id?: unknown;
    submissionNumber?: unknown;
    status?: unknown;
    submitterId?: unknown;
  } | null>(
    `*[
      _type == "submission" &&
      _id == $id
    ][0] {
      "id": _id,
      submissionNumber,
      status,
      "submitterId": submitter._ref
    }`,
    { id: submissionId },
  );

  if (!persisted) {
    return null;
  }

  if (
    persisted.id !== submissionId ||
    persisted.submitterId !== contributorId ||
    typeof persisted.submissionNumber !== "string" ||
    !SUBMISSION_STATUSES.includes(
      persisted.status as SubmissionStatus,
    )
  ) {
    throw new OperationalError(
      "operation_failed",
      "The submission could not be loaded after it was saved.",
    );
  }

  return {
    id: submissionId,
    submissionNumber: persisted.submissionNumber,
    status: persisted.status as SubmissionStatus,
  };
}

type OperationAuditState = {
  readonly eventType?: unknown;
  readonly actorId?: unknown;
  readonly targetDocumentId?: unknown;
  readonly submissionId?: unknown;
  readonly intentFingerprint?: unknown;
  readonly noteKind?: unknown;
};

async function isSubmissionUpdateReplay(
  client: ReturnType<typeof requireOperationsClient>,
  input: {
    readonly submissionId: string;
    readonly auditId: string;
    readonly actorId: string;
    readonly intentFingerprint: string;
  },
): Promise<boolean> {
  const state = await client.fetch<{
    audit?: OperationAuditState | null;
    hasAuditReference?: unknown;
  }>(
    `{
      "audit": *[
        _type == "auditEvent" &&
        _id == $auditId
      ][0] {
        eventType,
        "actorId": actor._ref,
        targetDocumentId,
        "submissionId": submission._ref,
        "intentFingerprint": metadata.nextValue
      },
      "hasAuditReference": count(*[
        _type == "submission" &&
        _id == $submissionId &&
        $auditId in coalesce(auditEvents[]._ref, [])
      ]) > 0
    }`,
    {
      submissionId: input.submissionId,
      auditId: input.auditId,
    },
  );
  const audit = state.audit ?? null;
  const hasAuditReference = state.hasAuditReference === true;

  if (!audit && !hasAuditReference) {
    return false;
  }

  if (
    audit?.eventType === "submissionUpdated" &&
    audit.actorId === input.actorId &&
    audit.targetDocumentId === input.submissionId &&
    audit.submissionId === input.submissionId &&
    audit.intentFingerprint === input.intentFingerprint &&
    hasAuditReference
  ) {
    return true;
  }

  throw new OperationalError(
    "operation_failed",
    "This draft form was already used for different changes. Reload the page and try again.",
  );
}

async function isPrivateNoteReplay(
  client: ReturnType<typeof requireOperationsClient>,
  input: {
    readonly submissionId: string;
    readonly auditId: string;
    readonly noteKey: string;
    readonly actorId: string;
    readonly note: string;
  },
): Promise<boolean> {
  const state = await client.fetch<{
    audit?: OperationAuditState | null;
    note?: { text?: unknown; authorId?: unknown } | null;
    hasAuditReference?: unknown;
  }>(
    `{
      "audit": *[
        _type == "auditEvent" &&
        _id == $auditId
      ][0] {
        eventType,
        "actorId": actor._ref,
        targetDocumentId,
        "submissionId": submission._ref,
        "noteKind": metadata.noteKind
      },
      "note": *[
        _type == "submission" &&
        _id == $submissionId
      ][0].privateEditorialNotes[_key == $noteKey][0] {
        text,
        "authorId": author._ref
      },
      "hasAuditReference": count(*[
        _type == "submission" &&
        _id == $submissionId &&
        $auditId in coalesce(auditEvents[]._ref, [])
      ]) > 0
    }`,
    {
      submissionId: input.submissionId,
      auditId: input.auditId,
      noteKey: input.noteKey,
    },
  );
  const audit = state.audit ?? null;
  const note = state.note ?? null;
  const hasAuditReference = state.hasAuditReference === true;

  if (!audit && !note && !hasAuditReference) {
    return false;
  }

  if (
    audit?.eventType === "privateNoteAdded" &&
    audit.actorId === input.actorId &&
    audit.targetDocumentId === input.submissionId &&
    audit.submissionId === input.submissionId &&
    audit.noteKind === "privateEditorialNote" &&
    note?.text === input.note &&
    note.authorId === input.actorId &&
    hasAuditReference
  ) {
    return true;
  }

  throw new OperationalError(
    "operation_failed",
    "This private-note form was already used for different content. Reload the page and try again.",
  );
}

export async function createSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly content: SubmissionWriteInput;
  readonly submitImmediately: boolean;
  readonly idempotencyKey: string;
}): Promise<CreatedSubmissionResult> {
  const client = requireOperationsClient();
  const now = new Date();
  const timestamp = now.toISOString();
  const identifiers = createSubmissionCreateIdentifiers({
    contributorId: input.actor.id,
    idempotencyKey: input.idempotencyKey,
    year: now.getUTCFullYear(),
  });
  const existing = await getCreatedSubmissionResult(
    client,
    identifiers.id,
    input.actor.id,
  );

  if (existing) {
    return existing;
  }

  const quotaState = await client.fetch<{
    activeSubmissionCount?: unknown;
    contributorRevisionId?: unknown;
  }>(
    `{
      "activeSubmissionCount": count(*[
        _type == "submission" &&
        submitter._ref == $contributorId &&
        status in ["draft", "submitted", "inReview", "revisionRequested"]
      ]),
      "contributorRevisionId": *[
        _type == "contributorProfile" &&
        _id == $contributorId
      ][0]._rev
    }`,
    { contributorId: input.actor.id },
  );
  const activeSubmissionCount =
    typeof quotaState.activeSubmissionCount === "number"
      ? quotaState.activeSubmissionCount
      : Number.NaN;
  const contributorRevisionId =
    typeof quotaState.contributorRevisionId === "string"
      ? quotaState.contributorRevisionId
      : "";

  if (hasReachedActiveSubmissionLimit(activeSubmissionCount)) {
    throw new OperationalError(
      "operation_failed",
      "Resolve or archive an existing submission before creating another.",
    );
  }

  if (!contributorRevisionId) {
    throw new OperationalError(
      "operation_failed",
      "The contributor profile is not available for submission creation.",
    );
  }

  const createdAudit = createAuditEventDocument(
    {
      eventType: "submissionCreated",
      actor: input.actor,
      targetType: "submission",
      targetDocumentId: identifiers.id,
      submissionId: identifiers.id,
      contributorId: input.actor.id,
      summary: "Contributor created a submission record.",
    },
    identifiers.createdAuditId,
  );
  const submittedAudit = input.submitImmediately
    ? createAuditEventDocument(
        {
          eventType: "submissionSubmitted",
          actor: input.actor,
          targetType: "submission",
          targetDocumentId: identifiers.id,
          submissionId: identifiers.id,
          contributorId: input.actor.id,
          previousStatus: "draft",
          nextStatus: "submitted",
          summary:
            "Contributor submitted the new record for editorial review.",
        },
        identifiers.submittedAuditId,
      )
    : null;
  const auditEvents = [
    auditReference(createdAudit._id),
    ...(submittedAudit ? [auditReference(submittedAudit._id)] : []),
  ];
  const document: {
    _id: string;
    _type: string;
    [key: string]: unknown;
  } = {
    _id: identifiers.id,
    _type: "submission",
    submissionNumber: identifiers.submissionNumber,
    ...submissionContentPatch(input.content),
    submitter: {
      _type: "reference",
      _ref: input.actor.id,
    },
    status: input.submitImmediately ? "submitted" : "draft",
    priority: "normal",
    ...(input.submitImmediately ? { submittedAt: timestamp } : {}),
    revisionNumber: 1,
    auditEvents,
    privateEditorialNotes: [],
    contributorVisibleFeedback: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  let transaction = client
    .transaction()
    // The deterministic submission document is the transaction's
    // idempotency lock. A concurrent replay conflicts atomically, so it cannot
    // create an audit event for a different intent.
    .create(document)
    .create(createdAudit)
    // Serialize distinct create requests for this contributor. Without this
    // revision guard, two idempotent-but-different requests could both observe
    // the same quota count and exceed the active-submission limit.
    .patch(input.actor.id, (patch) => {
      let nextPatch = patch
        .ifRevisionId(contributorRevisionId)
        .set({ updatedAt: timestamp });

      if (input.submitImmediately) {
        nextPatch = nextPatch.setIfMissing({ termsAcceptedAt: timestamp });
      }

      return nextPatch;
    });

  if (submittedAudit) {
    transaction = transaction.create(submittedAudit);
  }

  try {
    await transaction.commit();
  } catch (error) {
    if (isMutationConflict(error)) {
      const replayed = await getCreatedSubmissionResult(
        client,
        identifiers.id,
        input.actor.id,
      );

      if (replayed) {
        return replayed;
      }
    }

    throw error;
  }

  const persisted = await getCreatedSubmissionResult(
    client,
    identifiers.id,
    input.actor.id,
  );

  if (!persisted) {
    throw new OperationalError(
      "operation_failed",
      "The submission could not be loaded after it was saved.",
    );
  }

  return persisted;
}

export async function updateSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly content: SubmissionDraftInput;
  readonly operationKey: string;
}): Promise<"updated" | "replayed"> {
  const client = requireOperationsClient();
  const identifiers = createSubmissionUpdateIdentifiers({
    contributorId: input.actor.id,
    submissionId: input.target.id,
    operationKey: input.operationKey,
    content: input.content,
  });
  const replayInput = {
    submissionId: input.target.id,
    auditId: identifiers.auditId,
    actorId: input.actor.id,
    intentFingerprint: identifiers.intentFingerprint,
  };

  if (await isSubmissionUpdateReplay(client, replayInput)) {
    return "replayed";
  }

  assertSubmissionHistoryCapacity(input.target);
  const audit = createAuditEventDocument(
    {
      eventType: "submissionUpdated",
      actor: input.actor,
      targetType: "submission",
      targetDocumentId: input.target.id,
      submissionId: input.target.id,
      contributorId: input.actor.id,
      summary: "Contributor saved a new submission revision.",
      metadata: {
        previousValue: `${input.target.revisionNumber}`,
        nextValue: identifiers.intentFingerprint,
      },
    },
    identifiers.auditId,
  );
  const transaction = client.transaction()
    .patch(input.target.id, (patch) => {
      let nextPatch = patch.ifRevisionId(input.target.revisionId).set({
        ...submissionContentPatch(input.content),
        revisionNumber: input.target.revisionNumber + 1,
        updatedAt: new Date().toISOString(),
      });
      const unsetFields = [
        !input.content.summary ? "summary" : null,
        !input.content.details ? "details" : null,
        !input.content.contributorNote ? "contributorNote" : null,
      ].filter((field): field is string => Boolean(field));

      if (unsetFields.length > 0) {
        nextPatch = nextPatch.unset(unsetFields);
      }

      return nextPatch
        .setIfMissing({ auditEvents: [] })
        .append("auditEvents", [auditReference(audit._id)]);
    })
    .create(audit);

  try {
    await transaction.commit();
  } catch (error) {
    if (
      isMutationConflict(error) &&
      (await isSubmissionUpdateReplay(client, replayInput))
    ) {
      return "replayed";
    }

    throw error;
  }

  return "updated";
}

export async function transitionSubmissionRecord(input: {
  readonly actor: OperationalActor;
  readonly workflowActor: "contributor" | "editor" | "admin";
  readonly target: SubmissionMutationTarget;
  readonly nextStatus: SubmissionStatus;
  readonly visibleFeedback?: string;
  readonly acceptTerms?: boolean;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  assertSubmissionTransition(
    input.workflowActor,
    input.target.status,
    input.nextStatus,
  );
  const event = transitionEvent(input.target.status, input.nextStatus);

  if (!event) {
    throw new OperationalError(
      "invalid_transition",
      "This workflow transition is not available.",
    );
  }

  const client = requireOperationsClient();
  const now = new Date().toISOString();
  const audit = createAuditEventDocument({
    eventType: event.eventType,
    actor: input.actor,
    targetType: "submission",
    targetDocumentId: input.target.id,
    submissionId: input.target.id,
    contributorId: input.target.submitterId,
    previousStatus: input.target.status,
    nextStatus: input.nextStatus,
    summary: event.summary,
  });
  const timestampPatch = {
    ...(input.nextStatus === "submitted" ? { submittedAt: now } : {}),
    ...(input.nextStatus === "inReview" ? { reviewedAt: now } : {}),
    ...(input.nextStatus === "revisionRequested" ? { reviewedAt: now } : {}),
    ...(input.nextStatus === "withdrawn" ? { withdrawnAt: now } : {}),
    ...(input.nextStatus === "approved" || input.nextStatus === "rejected"
      ? { reviewedAt: now, resolvedAt: now }
      : {}),
  };
  let transaction = client
    .transaction()
    .patch(input.target.id, (patch) =>
      patch
        .ifRevisionId(input.target.revisionId)
        .set({
          status: input.nextStatus,
          updatedAt: now,
          ...timestampPatch,
          ...(input.visibleFeedback !== undefined
            ? { contributorVisibleFeedback: input.visibleFeedback }
            : {}),
        })
        .setIfMissing({ auditEvents: [] })
        .append("auditEvents", [auditReference(audit._id)]),
    )
    .create(audit);

  if (input.acceptTerms) {
    transaction = transaction.patch(input.actor.id, (patch) =>
      patch.setIfMissing({ termsAcceptedAt: now }),
    );
  }

  await transaction.commit();
}

export async function assignSubmissionReviewerRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly reviewerId: string;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const reviewerId = operationalDocumentIdSchema.parse(input.reviewerId);
  const client = requireOperationsClient();
  const audit = createAuditEventDocument({
    eventType: "reviewerAssigned",
    actor: input.actor,
    targetType: "submission",
    targetDocumentId: input.target.id,
    submissionId: input.target.id,
    contributorId: input.target.submitterId,
    summary: input.target.assignedReviewerId
      ? "Editor reassigned the submission reviewer."
      : "Editor assigned a submission reviewer.",
    metadata: {
      previousValue: input.target.assignedReviewerId,
      nextValue: reviewerId,
    },
  });
  await client
    .transaction()
    .patch(input.target.id, (patch) =>
      patch
        .ifRevisionId(input.target.revisionId)
        .set({
          assignedReviewer: {
            _type: "reference",
            _ref: reviewerId,
          },
          updatedAt: new Date().toISOString(),
        })
        .setIfMissing({ auditEvents: [] })
        .append("auditEvents", [auditReference(audit._id)]),
    )
    .create(audit)
    .commit();
}

export async function addPrivateEditorialNoteRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly note: string;
  readonly operationKey: string;
}): Promise<"created" | "replayed"> {
  const client = requireOperationsClient();
  const identifiers = createPrivateNoteIdentifiers({
    actorId: input.actor.id,
    submissionId: input.target.id,
    operationKey: input.operationKey,
  });
  const replayInput = {
    submissionId: input.target.id,
    auditId: identifiers.auditId,
    noteKey: identifiers.noteKey,
    actorId: input.actor.id,
    note: input.note,
  };

  if (await isPrivateNoteReplay(client, replayInput)) {
    return "replayed";
  }

  assertSubmissionHistoryCapacity(input.target);

  if (input.target.privateEditorialNoteCount >= 100) {
    throw new OperationalError(
      "operation_failed",
      "This submission has reached its private-note limit.",
    );
  }

  const now = new Date().toISOString();
  const audit = createAuditEventDocument(
    {
      eventType: "privateNoteAdded",
      actor: input.actor,
      targetType: "submission",
      targetDocumentId: input.target.id,
      submissionId: input.target.id,
      contributorId: input.target.submitterId,
      summary: "Editor added a private editorial note.",
      metadata: { noteKind: "privateEditorialNote" },
    },
    identifiers.auditId,
  );
  const transaction = client.transaction()
    .patch(input.target.id, (patch) =>
      patch
        .ifRevisionId(input.target.revisionId)
        .set({ updatedAt: now })
        .setIfMissing({ privateEditorialNotes: [], auditEvents: [] })
        .append("privateEditorialNotes", [
          {
            _key: identifiers.noteKey,
            _type: "privateEditorialNote",
            text: input.note,
            author: { _type: "reference", _ref: input.actor.id },
            createdAt: now,
          },
        ])
        .append("auditEvents", [auditReference(audit._id)]),
    )
    .create(audit);

  try {
    await transaction.commit();
  } catch (error) {
    if (
      isMutationConflict(error) &&
      (await isPrivateNoteReplay(client, replayInput))
    ) {
      return "replayed";
    }

    throw error;
  }

  return "created";
}

export async function updateVisibleFeedbackRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly feedback: string;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const client = requireOperationsClient();
  const audit = createAuditEventDocument({
    eventType: "visibleFeedbackUpdated",
    actor: input.actor,
    targetType: "submission",
    targetDocumentId: input.target.id,
    submissionId: input.target.id,
    contributorId: input.target.submitterId,
    summary: "Editor updated contributor-visible feedback.",
    metadata: { noteKind: "contributorVisibleFeedback" },
  });
  await client
    .transaction()
    .patch(input.target.id, (patch) =>
      patch
        .ifRevisionId(input.target.revisionId)
        .set({
          contributorVisibleFeedback: input.feedback,
          updatedAt: new Date().toISOString(),
        })
        .setIfMissing({ auditEvents: [] })
        .append("auditEvents", [auditReference(audit._id)]),
    )
    .create(audit)
    .commit();
}

export async function updateSubmissionPriorityRecord(input: {
  readonly actor: OperationalActor;
  readonly target: SubmissionMutationTarget;
  readonly priority: SubmissionPriority;
}): Promise<void> {
  assertSubmissionHistoryCapacity(input.target);
  const client = requireOperationsClient();
  const audit = createAuditEventDocument({
    eventType: "priorityChanged",
    actor: input.actor,
    targetType: "submission",
    targetDocumentId: input.target.id,
    submissionId: input.target.id,
    contributorId: input.target.submitterId,
    summary: "Editor changed internal submission priority.",
    metadata: {
      previousValue: input.target.priority,
      nextValue: input.priority,
    },
  });
  await client
    .transaction()
    .patch(input.target.id, (patch) =>
      patch
        .ifRevisionId(input.target.revisionId)
        .set({
          priority: input.priority,
          updatedAt: new Date().toISOString(),
        })
        .setIfMissing({ auditEvents: [] })
        .append("auditEvents", [auditReference(audit._id)]),
    )
    .create(audit)
    .commit();
}
