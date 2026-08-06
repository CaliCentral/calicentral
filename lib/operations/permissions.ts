import { OperationalError } from "@/lib/operations/errors";
import type {
  AccessStatus,
  ContributorRole,
  OperationalActor,
  SubmissionStatus,
} from "@/lib/operations/types";
import {
  isContributorEditableStatus,
  isContributorWithdrawableStatus,
} from "@/lib/operations/workflow";

const ROLE_LEVEL: Readonly<Record<ContributorRole, number>> = {
  contributor: 0,
  editor: 1,
  admin: 2,
};

export function hasRole(
  role: ContributorRole,
  minimumRole: ContributorRole,
): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimumRole];
}

export function higherRole(
  first: ContributorRole,
  second: ContributorRole,
): ContributorRole {
  return ROLE_LEVEL[first] >= ROLE_LEVEL[second] ? first : second;
}

export function canUpdateOwnProfile(accessStatus: AccessStatus): boolean {
  return accessStatus === "active" || accessStatus === "pending";
}

export function canMutateContributorContent(
  accessStatus: AccessStatus,
): boolean {
  return accessStatus === "active";
}

export function canAccessSubmission(
  actor: OperationalActor,
  submitterId: string,
): boolean {
  if (actor.accessStatus !== "active") {
    return false;
  }

  return actor.id === submitterId || hasRole(actor.role, "editor");
}

export function canEditSubmission(
  actor: OperationalActor,
  submitterId: string,
  status: SubmissionStatus,
): boolean {
  return (
    actor.accessStatus === "active" &&
    actor.id === submitterId &&
    isContributorEditableStatus(status)
  );
}

export function canWithdrawSubmission(
  actor: OperationalActor,
  submitterId: string,
  status: SubmissionStatus,
): boolean {
  return (
    actor.accessStatus === "active" &&
    actor.id === submitterId &&
    isContributorWithdrawableStatus(status)
  );
}

export function canReviewSubmission(actor: OperationalActor): boolean {
  return actor.accessStatus === "active" && hasRole(actor.role, "editor");
}

export function canAdministerContributors(actor: OperationalActor): boolean {
  return actor.accessStatus === "active" && actor.role === "admin";
}

export function assertProfileMutationAccess(actor: OperationalActor): void {
  if (!canUpdateOwnProfile(actor.accessStatus)) {
    throw new OperationalError(
      "access_denied",
      "Your portal access does not currently allow profile changes.",
    );
  }
}

export function assertContributorMutationAccess(
  actor: OperationalActor,
): void {
  if (!canMutateContributorContent(actor.accessStatus)) {
    throw new OperationalError(
      "access_denied",
      "Your portal access does not currently allow submission changes.",
    );
  }
}

export function assertSubmissionOwner(
  actor: OperationalActor,
  submitterId: string,
): void {
  if (actor.id !== submitterId) {
    // Deliberately identical to a missing-record failure so an object ID cannot
    // be used to discover another contributor's submission.
    throw new OperationalError("not_found", "Submission not found.");
  }
}

export function assertCanEditSubmission(
  actor: OperationalActor,
  submitterId: string,
  status: SubmissionStatus,
): void {
  if (!canEditSubmission(actor, submitterId, status)) {
    throw new OperationalError(
      "access_denied",
      "This submission cannot be edited in its current status.",
    );
  }
}

export function assertCanWithdrawSubmission(
  actor: OperationalActor,
  submitterId: string,
  status: SubmissionStatus,
): void {
  if (!canWithdrawSubmission(actor, submitterId, status)) {
    throw new OperationalError(
      "access_denied",
      "This submission cannot be withdrawn in its current status.",
    );
  }
}

export function assertCanReviewSubmission(actor: OperationalActor): void {
  if (!canReviewSubmission(actor)) {
    throw new OperationalError(
      "access_denied",
      "Editor access is required for this action.",
    );
  }
}

export function assertCanAdministerContributors(
  actor: OperationalActor,
): void {
  if (!canAdministerContributors(actor)) {
    throw new OperationalError(
      "access_denied",
      "Administrator access is required for this action.",
    );
  }
}

export function wouldRemoveFinalAdministrator(input: {
  readonly targetIsEffectiveAdministrator: boolean;
  readonly otherEffectiveAdministratorCount: number;
}): boolean {
  return (
    input.targetIsEffectiveAdministrator &&
    input.otherEffectiveAdministratorCount < 1
  );
}

export function countEffectiveAdministratorCandidates(input: {
  readonly activeProfileAdministratorCount: number;
  readonly bootstrapAdminEmails: readonly string[];
  readonly provisionedBootstrapEmails: readonly string[];
}): number {
  if (
    !Number.isInteger(input.activeProfileAdministratorCount) ||
    input.activeProfileAdministratorCount < 0
  ) {
    throw new Error("The active administrator count is invalid.");
  }

  const bootstrapAdminEmails = new Set(input.bootstrapAdminEmails);
  const provisionedBootstrapEmails = new Set(
    input.provisionedBootstrapEmails,
  );
  const unprovisionedBootstrapCount = [...bootstrapAdminEmails].filter(
    (email) => !provisionedBootstrapEmails.has(email),
  ).length;

  return (
    input.activeProfileAdministratorCount + unprovisionedBootstrapCount
  );
}
