import { createHash } from "node:crypto";

const SUBMISSION_IDEMPOTENCY_NAMESPACE =
  "cali-central:submission-create:v1";
const SUBMISSION_UPDATE_NAMESPACE = "cali-central:submission-update:v1";
const SUBMISSION_UPDATE_INTENT_NAMESPACE =
  "cali-central:submission-update-intent:v1";
const PRIVATE_NOTE_NAMESPACE = "cali-central:private-note:v1";

export type SubmissionCreateIdentifiers = {
  readonly id: string;
  readonly submissionNumber: string;
  readonly createdAuditId: string;
  readonly submittedAuditId: string;
};

export type SubmissionUpdateIdentifiers = {
  readonly auditId: string;
  readonly intentFingerprint: string;
};

export type PrivateNoteIdentifiers = {
  readonly auditId: string;
  readonly noteKey: string;
};

function operationDigest(
  namespace: string,
  values: readonly string[],
): string {
  if (values.some((value) => !value)) {
    throw new Error("Operation idempotency inputs are invalid.");
  }

  return createHash("sha256")
    .update([namespace, ...values].join("\u0000"), "utf8")
    .digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }

  return value;
}

/**
 * Derive opaque, non-PII document identifiers from an authenticated
 * contributor and a server-generated request key. The contributor scope
 * prevents the same browser-visible key from colliding across accounts.
 */
export function createSubmissionCreateIdentifiers({
  contributorId,
  idempotencyKey,
  year,
}: {
  readonly contributorId: string;
  readonly idempotencyKey: string;
  readonly year: number;
}): SubmissionCreateIdentifiers {
  if (!contributorId || !idempotencyKey || !Number.isInteger(year)) {
    throw new Error("Submission idempotency inputs are invalid.");
  }

  const digest = createHash("sha256")
    .update(
      `${SUBMISSION_IDEMPOTENCY_NAMESPACE}\u0000${contributorId}\u0000${idempotencyKey}`,
      "utf8",
    )
    .digest("hex");
  const displaySuffix = digest.slice(0, 10).toUpperCase();

  return {
    id: `submission.${digest}`,
    submissionNumber: `CC-${year}-${displaySuffix}`,
    createdAuditId: `audit.submission-created.${digest}`,
    submittedAuditId: `audit.submission-submitted.${digest}`,
  };
}

/**
 * Reserve one deterministic audit document per rendered draft-update form.
 * The separate intent fingerprint makes a reused key safe only when the
 * validated update content is identical to the committed request.
 */
export function createSubmissionUpdateIdentifiers({
  contributorId,
  submissionId,
  operationKey,
  content,
}: {
  readonly contributorId: string;
  readonly submissionId: string;
  readonly operationKey: string;
  readonly content: unknown;
}): SubmissionUpdateIdentifiers {
  const digest = operationDigest(SUBMISSION_UPDATE_NAMESPACE, [
    contributorId,
    submissionId,
    operationKey,
  ]);
  const serializedContent = JSON.stringify(canonicalize(content));

  if (!serializedContent) {
    throw new Error("Submission update content is invalid.");
  }

  return {
    auditId: `audit.submission-updated.${digest}`,
    intentFingerprint: operationDigest(
      SUBMISSION_UPDATE_INTENT_NAMESPACE,
      [digest, serializedContent],
    ),
  };
}

/**
 * Scope a private-note array key and audit document to the authenticated
 * editor, target submission, and one server-rendered form operation.
 */
export function createPrivateNoteIdentifiers({
  actorId,
  submissionId,
  operationKey,
}: {
  readonly actorId: string;
  readonly submissionId: string;
  readonly operationKey: string;
}): PrivateNoteIdentifiers {
  const digest = operationDigest(PRIVATE_NOTE_NAMESPACE, [
    actorId,
    submissionId,
    operationKey,
  ]);

  return {
    auditId: `audit.private-note-added.${digest}`,
    noteKey: digest,
  };
}
