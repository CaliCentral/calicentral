export const CONTRIBUTOR_ROLES = ["contributor", "editor", "admin"] as const;
export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

export const ACCESS_STATUSES = [
  "active",
  "pending",
  "suspended",
  "archived",
] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const SUBMISSION_TYPES = [
  "storyPitch",
  "athleteNomination",
  "competitionListing",
  "mediaPitch",
  "correctionRequest",
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "inReview",
  "revisionRequested",
  "approved",
  "rejected",
  "withdrawn",
  "archived",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_PRIORITIES = [
  "normal",
  "elevated",
  "urgent",
] as const;
export type SubmissionPriority = (typeof SUBMISSION_PRIORITIES)[number];

export const AUDIT_EVENT_TYPES = [
  "contributorCreated",
  "profileUpdated",
  "submissionCreated",
  "submissionUpdated",
  "submissionSubmitted",
  "submissionResubmitted",
  "submissionWithdrawn",
  "reviewStarted",
  "reviewerAssigned",
  "revisionRequested",
  "submissionApproved",
  "submissionRejected",
  "submissionArchived",
  "privateNoteAdded",
  "visibleFeedbackUpdated",
  "priorityChanged",
  "contributorRoleChanged",
  "contributorSuspended",
  "contributorReactivated",
  "contributorArchived",
  "contributorInternalNotesUpdated",
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export type AuthIdentityInput = {
  readonly provider: "google" | "github" | (string & {});
  readonly providerAccountId: string;
  readonly email: string | null;
  readonly normalizedEmail?: string | null;
  readonly name: string | null;
  readonly image: string | null;
};

export type ContributorIdentityRecord = {
  readonly id: string;
  readonly revisionId: string;
  readonly displayName: string;
  readonly normalizedEmail: string;
  readonly authProvider: string;
  readonly providerAccountId: string;
  readonly avatarUrl?: string;
  readonly role: ContributorRole;
  readonly accessStatus: AccessStatus;
  readonly contributorSince: string;
  readonly lastSignedInAt: string;
};

export type ContributorReference = {
  readonly id: string;
  readonly displayName: string;
  readonly role: ContributorRole;
  readonly accessStatus: AccessStatus;
  readonly avatarUrl?: string;
};

export type OwnContributorProfile = ContributorReference & {
  readonly normalizedEmail: string;
  readonly biography: string;
  readonly location: string;
  readonly areasOfInterest: readonly string[];
  readonly contributorSince: string;
  readonly lastSignedInAt: string;
  readonly termsAcceptedAt?: string;
  readonly linkedAuthorId?: string;
  readonly linkedAthleteId?: string;
};

export type EditorContributorSummary = ContributorReference & {
  readonly normalizedEmail: string;
  readonly biography: string;
  readonly location: string;
  readonly areasOfInterest: readonly string[];
  readonly contributorSince: string;
  readonly lastSignedInAt: string;
  readonly linkedAuthorId?: string;
  readonly linkedAthleteId?: string;
  readonly submissionCount: number;
  readonly activeReviewCount: number;
};

export type AdminContributorDetail = EditorContributorSummary & {
  readonly revisionId: string;
  readonly authProvider: string;
  readonly providerAccountId: string;
  readonly internalNotes: string;
  readonly termsAcceptedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SupportingLink = {
  readonly key: string;
  readonly label?: string;
  readonly url: string;
  readonly domain: string;
};

export type SupportingLinkInput = {
  readonly label?: string;
  readonly url: string;
};

export type StoryPitchDetails = {
  readonly proposedHeadline: string;
  readonly section: string;
  readonly pitchSummary: string;
  readonly reportingApproach: string;
  readonly relevantPeople: readonly string[];
  readonly relevantLocations: readonly string[];
  readonly estimatedLength: string;
  readonly conflictDisclosure: string;
};

export type AthleteNominationDetails = {
  readonly athleteName: string;
  readonly city: string;
  readonly discipline: string;
  readonly nominationReason: string;
  readonly publicReferenceLinks: readonly SupportingLink[];
  readonly relationshipToAthlete: string;
  readonly permissionStatus: string;
};

export type CompetitionListingDetails = {
  readonly eventName: string;
  readonly city: string;
  readonly proposedDate: string;
  readonly format: string;
  readonly divisions: readonly string[];
  readonly organizerRelationship: string;
  readonly publicReferenceLinks: readonly SupportingLink[];
  readonly scheduleStatus: string;
};

export type MediaPitchDetails = {
  readonly proposedTitle: string;
  readonly series: string;
  readonly format: string;
  readonly subject: string;
  readonly location: string;
  readonly visualApproach: string;
  readonly estimatedDuration: string;
  readonly publicReferenceLinks: readonly SupportingLink[];
};

export type CorrectionRequestDetails = {
  readonly affectedUrl: string;
  readonly issueSummary: string;
  readonly requestedCorrection: string;
  readonly sourceLinks: readonly SupportingLink[];
  readonly relationshipToSubject: string;
};

export type SubmissionDetails =
  | {
      readonly submissionType: "storyPitch";
      readonly storyPitchDetails: StoryPitchDetails;
    }
  | {
      readonly submissionType: "athleteNomination";
      readonly athleteNominationDetails: AthleteNominationDetails;
    }
  | {
      readonly submissionType: "competitionListing";
      readonly competitionListingDetails: CompetitionListingDetails;
    }
  | {
      readonly submissionType: "mediaPitch";
      readonly mediaPitchDetails: MediaPitchDetails;
    }
  | {
      readonly submissionType: "correctionRequest";
      readonly correctionRequestDetails: CorrectionRequestDetails;
    };

export type SubmissionBase = {
  readonly id: string;
  readonly submissionNumber: string;
  readonly title: string;
  readonly summary: string;
  readonly details: string;
  readonly status: SubmissionStatus;
  readonly revisionNumber: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt?: string;
  readonly withdrawnAt?: string;
  readonly reviewedAt?: string;
  readonly resolvedAt?: string;
  readonly supportingLinks: readonly SupportingLink[];
  readonly contributorNote: string;
  readonly contributorVisibleFeedback: string;
} & SubmissionDetails;

export type ContributorSubmissionSummary = Pick<
  SubmissionBase,
  | "id"
  | "submissionNumber"
  | "submissionType"
  | "title"
  | "status"
  | "revisionNumber"
  | "createdAt"
  | "updatedAt"
  | "submittedAt"
> & {
  readonly assignedForReview: boolean;
  readonly hasVisibleFeedback: boolean;
};

export type ContributorSubmissionDetail = SubmissionBase & {
  readonly assignedForReview: boolean;
};

export type PrivateEditorialNote = {
  readonly key: string;
  readonly text: string;
  readonly author: ContributorReference;
  readonly createdAt: string;
};

export type AuditEvent = {
  readonly id: string;
  readonly eventType: AuditEventType;
  readonly actor?: ContributorReference;
  readonly actorRole: ContributorRole;
  readonly targetType: "submission" | "contributor";
  readonly targetDocumentId: string;
  readonly submissionId?: string;
  readonly contributorId?: string;
  readonly previousStatus?: string;
  readonly nextStatus?: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly metadata?: {
    readonly previousValue?: string;
    readonly nextValue?: string;
    readonly noteKind?: string;
  };
};

export type AdminSubmissionSummary = Pick<
  SubmissionBase,
  | "id"
  | "submissionNumber"
  | "submissionType"
  | "title"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "submittedAt"
> & {
  readonly priority: SubmissionPriority;
  readonly submitter: ContributorReference;
  readonly assignedReviewer?: ContributorReference;
};

export type AdminSubmissionDetail = SubmissionBase & {
  readonly priority: SubmissionPriority;
  readonly submitter: EditorContributorSummary;
  readonly assignedReviewer?: ContributorReference;
  readonly privateEditorialNotes: readonly PrivateEditorialNote[];
  readonly auditEvents: readonly AuditEvent[];
  readonly linkedDocuments: readonly {
    readonly type: "story" | "athlete" | "competition" | "video";
    readonly id: string;
  }[];
  readonly createdDraftDocumentId?: string;
};

export type ContributorAccountOverview = {
  readonly profile: OwnContributorProfile;
  readonly counts: Readonly<Record<SubmissionStatus, number>>;
  readonly totalSubmissions: number;
  readonly latestSubmissions: readonly ContributorSubmissionSummary[];
  readonly feedbackAlertCount: number;
  readonly profileComplete: boolean;
};

export type AdminDashboard = {
  readonly submissions: {
    readonly awaitingReview: number;
    readonly inReview: number;
    readonly revisionRequested: number;
    readonly approved: number;
    readonly rejected: number;
  };
  readonly contributors: {
    readonly active: number;
    readonly suspended: number;
  };
  readonly recentAuditEvents: readonly AuditEvent[];
};

export type OperationalActor = {
  readonly id: string;
  readonly displayName: string;
  readonly role: ContributorRole;
  readonly accessStatus: AccessStatus;
  readonly normalizedEmail?: string;
};

export type AuditEventInput = {
  readonly eventType: AuditEventType;
  readonly actor: OperationalActor;
  readonly targetType: "submission" | "contributor";
  readonly targetDocumentId: string;
  readonly submissionId?: string;
  readonly contributorId?: string;
  readonly previousStatus?: string;
  readonly nextStatus?: string;
  readonly summary: string;
  readonly metadata?: {
    readonly previousValue?: string;
    readonly nextValue?: string;
    readonly noteKind?: string;
  };
};
