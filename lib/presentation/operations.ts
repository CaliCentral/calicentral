const submissionTypeLabels: Record<string, string> = {
  storyPitch: "Story pitch",
  athleteNomination: "Athlete nomination",
  competitionListing: "Competition listing",
  teamApplication: "Team application",
  organizationClaim: "Organization claim",
  videoSubmission: "Video submission",
  mediaPitch: "Photo / media submission",
  productSubmission: "Product submission",
  correctionRequest: "Correction request",
};

const submissionStatusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  inReview: "In review",
  revisionRequested: "Revision requested",
  approved: "Approved for editorial development",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const submissionStatusDescriptions: Record<string, string> = {
  draft: "You can continue editing before sending this to the editorial desk.",
  submitted: "The editorial desk has received this submission.",
  inReview: "An editor is actively reviewing the submission.",
  revisionRequested:
    "The editorial desk has requested changes. Update the draft and resubmit it when ready.",
  approved:
    "The idea has been accepted for editorial development. Approval does not publish or verify it.",
  rejected:
    "The editorial desk will not move this submission into development.",
  withdrawn: "The contributor withdrew this submission from consideration.",
  archived: "This submission is retained as a historical operational record.",
};

const roleLabels: Record<string, string> = {
  contributor: "Contributor",
  editor: "Editor",
  admin: "Administrator",
};

const accessLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  archived: "Archived",
};

const priorityLabels: Record<string, string> = {
  normal: "Normal",
  elevated: "Elevated",
  urgent: "Urgent",
};

export function submissionTypeLabel(value: string): string {
  return submissionTypeLabels[value] ?? "Submission";
}

export function submissionStatusLabel(value: string): string {
  return submissionStatusLabels[value] ?? "Unknown status";
}

export function submissionStatusDescription(value: string): string {
  return (
    submissionStatusDescriptions[value] ??
    "Contact the editorial desk if you need help understanding this status."
  );
}

export function roleLabel(value: string): string {
  return roleLabels[value] ?? "Contributor";
}

export function accessStatusLabel(value: string): string {
  return accessLabels[value] ?? "Unavailable";
}

export function priorityLabel(value: string): string {
  return priorityLabels[value] ?? "Normal";
}

export function formatOperationsDate(
  value: string | null | undefined,
  includeTime = false,
): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }
      : {}),
  }).format(date);
}

export function safeExternalHostname(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.hostname
      : "External link";
  } catch {
    return "External link";
  }
}
