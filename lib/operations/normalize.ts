import type {
  AccessStatus,
  AdminContributorDetail,
  AdminSubmissionDetail,
  AdminSubmissionSummary,
  AthleteNominationDetails,
  AuditEvent,
  AuditEventType,
  CompetitionListingDetails,
  ContributorIdentityRecord,
  ContributorReference,
  ContributorRole,
  ContributorSubmissionDetail,
  ContributorSubmissionSummary,
  CorrectionRequestDetails,
  EditorContributorSummary,
  MediaPitchDetails,
  OwnContributorProfile,
  PrivateEditorialNote,
  SubmissionBase,
  SubmissionPriority,
  SubmissionStatus,
  SubmissionType,
  StoryPitchDetails,
  SupportingLink,
} from "@/lib/operations/types";
import {
  ACCESS_STATUSES,
  AUDIT_EVENT_TYPES,
  CONTRIBUTOR_ROLES,
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
} from "@/lib/operations/types";
import { safeHttpUrlSchema } from "@/lib/operations/validation";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  const normalized = stringValue(value).trim();
  return normalized || undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function enumValue<const T extends readonly string[], F>(
  value: unknown,
  values: T,
  fallback: F,
): T[number] | F {
  return typeof value === "string" && values.includes(value)
    ? (value as T[number])
    : fallback;
}

function requiredId(value: unknown): string | null {
  const id = optionalString(value);
  return id ?? null;
}

export function normalizeSupportingLinks(value: unknown): SupportingLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      return [];
    }

    const parsedUrl = safeHttpUrlSchema.safeParse(item.url);

    if (!parsedUrl.success) {
      return [];
    }

    return [
      {
        key: optionalString(item.key) ?? optionalString(item._key) ?? `${index}`,
        label: optionalString(item.label),
        url: parsedUrl.data,
        domain: new URL(parsedUrl.data).hostname.toLowerCase(),
      },
    ];
  });
}

export function normalizeContributorReference(
  value: unknown,
): ContributorReference | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = requiredId(value.id);

  if (!id) {
    return null;
  }

  return {
    id,
    displayName: stringValue(value.displayName, "Contributor"),
    role: enumValue(value.role, CONTRIBUTOR_ROLES, "contributor"),
    accessStatus: enumValue(value.accessStatus, ACCESS_STATUSES, "archived"),
    avatarUrl: optionalString(value.avatarUrl),
  };
}

export function normalizeContributorIdentity(
  value: unknown,
): ContributorIdentityRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const reference = normalizeContributorReference(value);
  const normalizedEmail = optionalString(value.normalizedEmail);
  const authProvider = optionalString(value.authProvider);
  const providerAccountId = optionalString(value.providerAccountId);
  const revisionId = optionalString(value.revisionId);

  if (
    !reference ||
    !normalizedEmail ||
    !authProvider ||
    !providerAccountId ||
    !revisionId
  ) {
    return null;
  }

  return {
    ...reference,
    revisionId,
    normalizedEmail,
    authProvider,
    providerAccountId,
    contributorSince: stringValue(value.contributorSince),
    lastSignedInAt: stringValue(value.lastSignedInAt),
  };
}

export function normalizeOwnContributorProfile(
  value: unknown,
): OwnContributorProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  const reference = normalizeContributorReference(value);
  const normalizedEmail = optionalString(value.normalizedEmail);

  if (!reference || !normalizedEmail) {
    return null;
  }

  return {
    ...reference,
    normalizedEmail,
    biography: stringValue(value.biography),
    location: stringValue(value.location),
    areasOfInterest: stringArray(value.areasOfInterest),
    contributorSince: stringValue(value.contributorSince),
    lastSignedInAt: stringValue(value.lastSignedInAt),
    termsAcceptedAt: optionalString(value.termsAcceptedAt),
    linkedAuthorId: optionalString(value.linkedAuthorId),
    linkedAthleteId: optionalString(value.linkedAthleteId),
  };
}

export function normalizeEditorContributor(
  value: unknown,
): EditorContributorSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const own = normalizeOwnContributorProfile(value);

  if (!own) {
    return null;
  }

  return {
    ...own,
    submissionCount: Math.max(0, numberValue(value.submissionCount)),
    activeReviewCount: Math.max(0, numberValue(value.activeReviewCount)),
  };
}

export function normalizeAdminContributor(
  value: unknown,
): AdminContributorDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const editor = normalizeEditorContributor(value);
  const revisionId = optionalString(value.revisionId);
  const authProvider = optionalString(value.authProvider);
  const providerAccountId = optionalString(value.providerAccountId);

  if (!editor || !revisionId || !authProvider || !providerAccountId) {
    return null;
  }

  return {
    ...editor,
    revisionId,
    authProvider,
    providerAccountId,
    internalNotes: stringValue(value.internalNotes),
    createdAt: stringValue(value.createdAt),
    updatedAt: stringValue(value.updatedAt),
  };
}

function normalizeStoryPitchDetails(value: unknown): StoryPitchDetails {
  const source = isRecord(value) ? value : {};
  return {
    proposedHeadline: stringValue(source.proposedHeadline),
    section: stringValue(source.section),
    pitchSummary: stringValue(source.pitchSummary),
    reportingApproach: stringValue(source.reportingApproach),
    relevantPeople: stringArray(source.relevantPeople),
    relevantLocations: stringArray(source.relevantLocations),
    estimatedLength: stringValue(source.estimatedLength),
    conflictDisclosure: stringValue(source.conflictDisclosure),
  };
}

function normalizeAthleteNominationDetails(
  value: unknown,
): AthleteNominationDetails {
  const source = isRecord(value) ? value : {};
  return {
    athleteName: stringValue(source.athleteName),
    city: stringValue(source.city),
    discipline: stringValue(source.discipline),
    nominationReason: stringValue(source.nominationReason),
    publicReferenceLinks: normalizeSupportingLinks(source.publicReferenceLinks),
    relationshipToAthlete: stringValue(source.relationshipToAthlete),
    permissionStatus: stringValue(source.permissionStatus),
  };
}

function normalizeCompetitionListingDetails(
  value: unknown,
): CompetitionListingDetails {
  const source = isRecord(value) ? value : {};
  return {
    eventName: stringValue(source.eventName),
    city: stringValue(source.city),
    proposedDate: stringValue(source.proposedDate),
    format: stringValue(source.format),
    divisions: stringArray(source.divisions),
    organizerRelationship: stringValue(source.organizerRelationship),
    publicReferenceLinks: normalizeSupportingLinks(source.publicReferenceLinks),
    scheduleStatus: stringValue(source.scheduleStatus),
  };
}

function normalizeMediaPitchDetails(value: unknown): MediaPitchDetails {
  const source = isRecord(value) ? value : {};
  return {
    proposedTitle: stringValue(source.proposedTitle),
    series: stringValue(source.series),
    format: stringValue(source.format),
    subject: stringValue(source.subject),
    location: stringValue(source.location),
    visualApproach: stringValue(source.visualApproach),
    estimatedDuration: stringValue(source.estimatedDuration),
    publicReferenceLinks: normalizeSupportingLinks(source.publicReferenceLinks),
  };
}

function normalizeCorrectionRequestDetails(
  value: unknown,
): CorrectionRequestDetails {
  const source = isRecord(value) ? value : {};
  return {
    affectedUrl: stringValue(source.affectedUrl),
    issueSummary: stringValue(source.issueSummary),
    requestedCorrection: stringValue(source.requestedCorrection),
    sourceLinks: normalizeSupportingLinks(source.sourceLinks),
    relationshipToSubject: stringValue(source.relationshipToSubject),
  };
}

function normalizeSubmissionDetails(
  source: JsonRecord,
  submissionType: SubmissionType,
): SubmissionBase | null {
  const id = requiredId(source.id);
  const submissionNumber = optionalString(source.submissionNumber);

  if (!id || !submissionNumber) {
    return null;
  }

  const common = {
    id,
    submissionNumber,
    title: stringValue(source.title),
    summary: stringValue(source.summary),
    details: stringValue(source.details),
    status: enumValue(
      source.status,
      SUBMISSION_STATUSES,
      "archived",
    ) as SubmissionStatus,
    revisionNumber: Math.max(1, numberValue(source.revisionNumber, 1)),
    createdAt: stringValue(source.createdAt),
    updatedAt: stringValue(source.updatedAt),
    submittedAt: optionalString(source.submittedAt),
    withdrawnAt: optionalString(source.withdrawnAt),
    reviewedAt: optionalString(source.reviewedAt),
    resolvedAt: optionalString(source.resolvedAt),
    supportingLinks: normalizeSupportingLinks(source.supportingLinks),
    contributorNote: stringValue(source.contributorNote),
    contributorVisibleFeedback: stringValue(
      source.contributorVisibleFeedback,
    ),
  };

  switch (submissionType) {
    case "storyPitch":
      return {
        ...common,
        submissionType,
        storyPitchDetails: normalizeStoryPitchDetails(source.storyPitchDetails),
      };
    case "athleteNomination":
      return {
        ...common,
        submissionType,
        athleteNominationDetails: normalizeAthleteNominationDetails(
          source.athleteNominationDetails,
        ),
      };
    case "competitionListing":
      return {
        ...common,
        submissionType,
        competitionListingDetails: normalizeCompetitionListingDetails(
          source.competitionListingDetails,
        ),
      };
    case "mediaPitch":
      return {
        ...common,
        submissionType,
        mediaPitchDetails: normalizeMediaPitchDetails(source.mediaPitchDetails),
      };
    case "correctionRequest":
      return {
        ...common,
        submissionType,
        correctionRequestDetails: normalizeCorrectionRequestDetails(
          source.correctionRequestDetails,
        ),
      };
  }
}

export function normalizeContributorSubmissionSummary(
  value: unknown,
): ContributorSubmissionSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const submissionType = enumValue(
    value.submissionType,
    SUBMISSION_TYPES,
    null,
  );

  if (!submissionType) {
    return null;
  }

  const detail = normalizeSubmissionDetails(value, submissionType);

  if (!detail) {
    return null;
  }

  return {
    id: detail.id,
    submissionNumber: detail.submissionNumber,
    submissionType: detail.submissionType,
    title: detail.title,
    status: detail.status,
    revisionNumber: detail.revisionNumber,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    submittedAt: detail.submittedAt,
    assignedForReview: value.assignedForReview === true,
    hasVisibleFeedback: value.hasVisibleFeedback === true,
  };
}

function normalizeLinkedDocument(
  value: unknown,
):
  | {
      type: "story" | "athlete" | "competition" | "video";
      id: string;
    }
  | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = optionalString(value.id);
  const type = enumValue(
    value.type,
    ["story", "athlete", "competition", "video"] as const,
    null,
  );

  return id && type ? { id, type } : undefined;
}

export function normalizeContributorSubmissionDetail(
  value: unknown,
): ContributorSubmissionDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const submissionType = enumValue(
    value.submissionType,
    SUBMISSION_TYPES,
    null,
  );

  if (!submissionType) {
    return null;
  }

  const detail = normalizeSubmissionDetails(value, submissionType);

  return detail
    ? {
        ...detail,
        assignedForReview: value.assignedForReview === true,
      }
    : null;
}

export function normalizeAuditEvent(value: unknown): AuditEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = requiredId(value.id);
  const targetDocumentId = requiredId(value.targetDocumentId);
  const eventType = enumValue(value.eventType, AUDIT_EVENT_TYPES, null);
  const actorRole = enumValue(value.actorRole, CONTRIBUTOR_ROLES, null);
  const targetType = enumValue(
    value.targetType,
    ["submission", "contributor"] as const,
    null,
  );
  const metadata = isRecord(value.metadata) ? value.metadata : undefined;

  if (!id || !targetDocumentId || !eventType || !actorRole || !targetType) {
    return null;
  }

  return {
    id,
    eventType: eventType as AuditEventType,
    actor: normalizeContributorReference(value.actor) ?? undefined,
    actorRole: actorRole as ContributorRole,
    targetType,
    targetDocumentId,
    submissionId: optionalString(value.submissionId),
    contributorId: optionalString(value.contributorId),
    previousStatus: optionalString(value.previousStatus),
    nextStatus: optionalString(value.nextStatus),
    summary: stringValue(value.summary),
    createdAt: stringValue(value.createdAt),
    metadata: metadata
      ? {
          previousValue: optionalString(metadata.previousValue),
          nextValue: optionalString(metadata.nextValue),
          noteKind: optionalString(metadata.noteKind),
        }
      : undefined,
  };
}

export function normalizeAdminSubmissionSummary(
  value: unknown,
): AdminSubmissionSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const summary = normalizeContributorSubmissionSummary(value);
  const submitter = normalizeContributorReference(value.submitter);

  if (!summary || !submitter) {
    return null;
  }

  return {
    id: summary.id,
    submissionNumber: summary.submissionNumber,
    submissionType: summary.submissionType,
    title: summary.title,
    status: summary.status,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    submittedAt: summary.submittedAt,
    priority: enumValue(
      value.priority,
      SUBMISSION_PRIORITIES,
      "normal",
    ) as SubmissionPriority,
    submitter,
    assignedReviewer:
      normalizeContributorReference(value.assignedReviewer) ?? undefined,
  };
}

function normalizePrivateNote(value: unknown): PrivateEditorialNote | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = optionalString(value.key) ?? optionalString(value._key);
  const author = normalizeContributorReference(value.author);

  if (!key || !author) {
    return null;
  }

  return {
    key,
    text: stringValue(value.text),
    author,
    createdAt: stringValue(value.createdAt),
  };
}

export function normalizeAdminSubmissionDetail(
  value: unknown,
): AdminSubmissionDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const submissionType = enumValue(
    value.submissionType,
    SUBMISSION_TYPES,
    null,
  );

  if (!submissionType) {
    return null;
  }

  const base = normalizeSubmissionDetails(value, submissionType);
  const submitter = normalizeEditorContributor(value.submitter);

  if (!base || !submitter) {
    return null;
  }

  const linkedDocuments = Array.isArray(value.linkedDocuments)
    ? value.linkedDocuments.flatMap((item) => {
        const normalized = normalizeLinkedDocument(item);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    ...base,
    priority: enumValue(
      value.priority,
      SUBMISSION_PRIORITIES,
      "normal",
    ) as SubmissionPriority,
    submitter,
    assignedReviewer:
      normalizeContributorReference(value.assignedReviewer) ?? undefined,
    privateEditorialNotes: Array.isArray(value.privateEditorialNotes)
      ? value.privateEditorialNotes.flatMap((note) => {
          const normalized = normalizePrivateNote(note);
          return normalized ? [normalized] : [];
        })
      : [],
    auditEvents: Array.isArray(value.auditEvents)
      ? value.auditEvents.flatMap((event) => {
          const normalized = normalizeAuditEvent(event);
          return normalized ? [normalized] : [];
        })
      : [],
    linkedDocuments,
    createdDraftDocumentId: optionalString(value.createdDraftDocumentId),
  };
}

export function normalizedSubmissionType(
  value: unknown,
): SubmissionType | null {
  return enumValue(value, SUBMISSION_TYPES, null);
}

export function normalizedSubmissionStatus(
  value: unknown,
): SubmissionStatus | null {
  return enumValue(value, SUBMISSION_STATUSES, null);
}

export function normalizedContributorRole(
  value: unknown,
): ContributorRole {
  return enumValue(value, CONTRIBUTOR_ROLES, "contributor");
}

export function normalizedAccessStatus(value: unknown): AccessStatus {
  return enumValue(value, ACCESS_STATUSES, "archived");
}
