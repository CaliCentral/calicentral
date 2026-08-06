import { OperationalError } from "@/lib/operations/errors";
import type {
  ContributorRole,
  SubmissionStatus,
} from "@/lib/operations/types";

type WorkflowActor = "contributor" | "editor" | "admin";

const CONTRIBUTOR_TRANSITIONS = {
  draft: ["submitted", "withdrawn"],
  submitted: ["withdrawn"],
  inReview: [],
  revisionRequested: ["submitted", "withdrawn"],
  approved: [],
  rejected: [],
  withdrawn: [],
  archived: [],
} as const satisfies Record<SubmissionStatus, readonly SubmissionStatus[]>;

const EDITOR_TRANSITIONS = {
  draft: [],
  submitted: ["inReview", "revisionRequested", "approved", "rejected"],
  inReview: ["revisionRequested", "approved", "rejected"],
  revisionRequested: [],
  approved: ["archived"],
  rejected: ["archived"],
  withdrawn: [],
  archived: [],
} as const satisfies Record<SubmissionStatus, readonly SubmissionStatus[]>;

const ADMIN_TRANSITIONS = EDITOR_TRANSITIONS;

export const SUBMISSION_TRANSITIONS = {
  contributor: CONTRIBUTOR_TRANSITIONS,
  editor: EDITOR_TRANSITIONS,
  admin: ADMIN_TRANSITIONS,
} as const;

export function workflowActorForRole(role: ContributorRole): WorkflowActor {
  return role;
}

export function canTransitionSubmission(
  actor: WorkflowActor,
  currentStatus: SubmissionStatus,
  nextStatus: SubmissionStatus,
): boolean {
  const allowed = SUBMISSION_TRANSITIONS[actor][currentStatus] as readonly string[];
  return allowed.includes(nextStatus);
}

export function assertSubmissionTransition(
  actor: WorkflowActor,
  currentStatus: SubmissionStatus,
  nextStatus: SubmissionStatus,
): void {
  if (!canTransitionSubmission(actor, currentStatus, nextStatus)) {
    throw new OperationalError(
      "invalid_transition",
      `This submission cannot move from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

export function isContributorEditableStatus(
  status: SubmissionStatus,
): boolean {
  return status === "draft" || status === "revisionRequested";
}

export function isContributorWithdrawableStatus(
  status: SubmissionStatus,
): boolean {
  return (
    status === "draft" ||
    status === "submitted" ||
    status === "revisionRequested"
  );
}

export function isActiveSubmissionStatus(status: SubmissionStatus): boolean {
  return !["approved", "rejected", "withdrawn", "archived"].includes(status);
}
