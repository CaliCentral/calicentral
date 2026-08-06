/**
 * Kept outside the server-only repository so focused validation can assert
 * that optimistic-concurrency fields remain part of mutation reads.
 */
export const SUBMISSION_MUTATION_TARGET_PROJECTION = `{
  "id": _id,
  "revisionId": _rev,
  "submitterId": submitter._ref,
  submissionType,
  status,
  title,
  revisionNumber,
  priority,
  "assignedReviewerId": assignedReviewer._ref,
  contributorVisibleFeedback,
  "auditEventCount": count(coalesce(auditEvents, [])),
  "privateEditorialNoteCount": count(coalesce(privateEditorialNotes, []))
}`;

export const CONTRIBUTOR_IDENTITY_PROJECTION = `{
  "id": _id,
  "revisionId": _rev,
  displayName,
  normalizedEmail,
  authProvider,
  providerAccountId,
  avatarUrl,
  role,
  accessStatus,
  contributorSince,
  lastSignedInAt
}`;
