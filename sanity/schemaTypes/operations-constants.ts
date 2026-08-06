export const contributorRoleOptions = [
  {title: "Contributor", value: "contributor"},
  {title: "Editor", value: "editor"},
  {title: "Administrator", value: "admin"},
]

export const contributorAccessStatusOptions = [
  {title: "Active", value: "active"},
  {title: "Pending", value: "pending"},
  {title: "Suspended", value: "suspended"},
  {title: "Archived", value: "archived"},
]

export const submissionTypeOptions = [
  {title: "Story pitch", value: "storyPitch"},
  {title: "Athlete nomination", value: "athleteNomination"},
  {title: "Competition listing", value: "competitionListing"},
  {title: "Media pitch", value: "mediaPitch"},
  {title: "Correction request", value: "correctionRequest"},
]

export const submissionStatusOptions = [
  {title: "Draft", value: "draft"},
  {title: "Submitted", value: "submitted"},
  {title: "In review", value: "inReview"},
  {title: "Revision requested", value: "revisionRequested"},
  {title: "Approved for editorial development", value: "approved"},
  {title: "Rejected", value: "rejected"},
  {title: "Withdrawn", value: "withdrawn"},
  {title: "Archived", value: "archived"},
]

export const submissionPriorityOptions = [
  {title: "Normal", value: "normal"},
  {title: "Elevated", value: "elevated"},
  {title: "Urgent", value: "urgent"},
]

export const auditEventTypeOptions = [
  {title: "Contributor created", value: "contributorCreated"},
  {title: "Profile updated", value: "profileUpdated"},
  {title: "Submission created", value: "submissionCreated"},
  {title: "Submission updated", value: "submissionUpdated"},
  {title: "Submission submitted", value: "submissionSubmitted"},
  {title: "Submission withdrawn", value: "submissionWithdrawn"},
  {title: "Submission resubmitted", value: "submissionResubmitted"},
  {title: "Review started", value: "reviewStarted"},
  {title: "Reviewer assigned", value: "reviewerAssigned"},
  {title: "Priority changed", value: "priorityChanged"},
  {title: "Revision requested", value: "revisionRequested"},
  {title: "Submission approved", value: "submissionApproved"},
  {title: "Submission rejected", value: "submissionRejected"},
  {title: "Submission archived", value: "submissionArchived"},
  {title: "Private note added", value: "privateNoteAdded"},
  {title: "Visible feedback updated", value: "visibleFeedbackUpdated"},
  {title: "Contributor role changed", value: "contributorRoleChanged"},
  {title: "Contributor suspended", value: "contributorSuspended"},
  {title: "Contributor reactivated", value: "contributorReactivated"},
  {title: "Contributor archived", value: "contributorArchived"},
  {
    title: "Contributor internal notes updated",
    value: "contributorInternalNotesUpdated",
  },
]

export function optionTitle(
  options: ReadonlyArray<{title: string; value: string}>,
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? options.find((option) => option.value === value)?.title
    : undefined
}

export function validateOptionValue(
  options: ReadonlyArray<{title: string; value: string}>,
  value: string | undefined,
  label: string,
): true | string {
  if (!value) {
    return true
  }

  return options.some((option) => option.value === value)
    ? true
    : `Choose a supported ${label}.`
}
