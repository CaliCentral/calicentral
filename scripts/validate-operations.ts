import { readFileSync } from "node:fs";

import {
  operationalDocumentIdSchema,
  contributorProfileUpdateSchema,
  safeHttpUrlSchema,
  storyPitchSchema,
  submissionDraftSchema,
  submissionForReviewSchema,
  submissionIdempotencyKeySchema,
  mutationOperationKeySchema,
} from "@/lib/operations/validation";
import {
  resolveTrustedAuthRedirect,
  safeAuthReturnPath,
} from "@/lib/auth/redirects";
import {
  canTransitionSubmission,
  isContributorEditableStatus,
} from "@/lib/operations/workflow";
import {
  canAccessSubmission,
  canEditSubmission,
  canReviewSubmission,
  countEffectiveAdministratorCandidates,
  higherRole,
  wouldRemoveFinalAdministrator,
} from "@/lib/operations/permissions";
import type { OperationalActor } from "@/lib/operations/types";
import {
  CONTRIBUTOR_IDENTITY_PROJECTION,
  SUBMISSION_MUTATION_TARGET_PROJECTION,
} from "@/lib/operations/projections";
import {
  createPrivateNoteIdentifiers,
  createSubmissionCreateIdentifiers,
  createSubmissionUpdateIdentifiers,
} from "@/lib/operations/idempotency";
import {
  hasReachedActiveSubmissionLimit,
  MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR,
} from "@/lib/operations/limits";

let assertionCount = 0;

function assert(condition: unknown, message: string): asserts condition {
  assertionCount += 1;

  if (!condition) {
    throw new Error(message);
  }
}

type WranglerConfigSubset = {
  assets?: {
    binding?: string;
    directory?: string;
    run_worker_first?: boolean;
  };
  compatibility_date?: string;
  compatibility_flags?: string[];
  main?: string;
};

const deploymentWranglerConfig = JSON.parse(
  readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
) as WranglerConfigSubset;
const typegenWranglerConfig = JSON.parse(
  readFileSync(new URL("../wrangler.typegen.jsonc", import.meta.url), "utf8"),
) as WranglerConfigSubset;

assert(
  typegenWranglerConfig.main === undefined,
  "The deterministic Wrangler type-generation config must not be deployable.",
);
assert(
  typegenWranglerConfig.compatibility_date ===
    deploymentWranglerConfig.compatibility_date,
  "Wrangler deployment and type-generation compatibility dates drifted.",
);
assert(
  JSON.stringify(typegenWranglerConfig.compatibility_flags) ===
    JSON.stringify(deploymentWranglerConfig.compatibility_flags),
  "Wrangler deployment and type-generation compatibility flags drifted.",
);
assert(
  JSON.stringify(typegenWranglerConfig.assets) ===
    JSON.stringify(deploymentWranglerConfig.assets),
  "Wrangler deployment and type-generation asset bindings drifted.",
);

for (const link of [
  "https://example.com/source",
  "http://example.com/path",
]) {
  assert(
    safeHttpUrlSchema.safeParse(link).success,
    `Valid HTTP(S) URL was rejected: ${link}`,
  );
}

for (const link of [
  "javascript:alert(1)",
  "data:text/plain,unsafe",
  "file:///tmp/private",
  "ftp://example.com/source",
  "https://user:password@example.com/private",
]) {
  assert(
    !safeHttpUrlSchema.safeParse(link).success,
    `Unsupported URL protocol was accepted: ${link}`,
  );
}

const completeStoryPitch = {
  submissionType: "storyPitch",
  title: "A complete story pitch",
  summary: "This summary contains enough useful editorial context.",
  details:
    "This submission contains enough bounded detail for editorial review and safe server validation.",
  contributorNote: "",
  supportingLinks: [],
  termsAccepted: true,
  storyPitchDetails: {
    proposedHeadline: "A complete proposed headline",
    section: "Stories",
    pitchSummary: "A focused editorial pitch with sufficient detail.",
    reportingApproach:
      "Interview public sources and verify every central claim.",
    relevantPeople: [],
    relevantLocations: [],
    estimatedLength: "800 words",
    conflictDisclosure: "",
  },
};

assert(
  storyPitchSchema.safeParse(completeStoryPitch).success,
  "A valid story pitch was rejected.",
);
assert(
  !submissionForReviewSchema.safeParse({
    ...completeStoryPitch,
    submitterId: "contributor.client-controlled",
  }).success,
  "A review submission accepted a client-controlled submitter identity.",
);

const validProfileUpdate = {
  displayName: "Example Contributor",
  biography: "Independent reporting and athlete profiles.",
  location: "California",
  areasOfInterest: ["Competition reporting"],
};
assert(
  contributorProfileUpdateSchema.safeParse(validProfileUpdate).success,
  "A valid contributor profile update was rejected.",
);
assert(
  !contributorProfileUpdateSchema.safeParse({
    ...validProfileUpdate,
    role: "admin",
  }).success,
  "A contributor profile form accepted a client-controlled role.",
);

const incompleteDraft = {
  submissionType: "correctionRequest",
  title: "Draft correction",
  summary: "",
  details: "",
  contributorNote: "",
  supportingLinks: [],
  correctionRequestDetails: {
    sourceLinks: [],
    relationshipToSubject: "",
  },
};

assert(
  submissionDraftSchema.safeParse(incompleteDraft).success,
  "An eligible incomplete draft was rejected.",
);
assert(
  canTransitionSubmission("contributor", "draft", "submitted"),
  "The required draft-to-submitted transition was rejected.",
);
assert(
  !canTransitionSubmission("contributor", "submitted", "approved"),
  "A contributor was allowed to approve a submission.",
);
assert(
  canTransitionSubmission("editor", "inReview", "approved"),
  "An editor was prevented from approving an in-review submission.",
);
assert(
  canTransitionSubmission("editor", "approved", "archived"),
  "An editor was prevented from archiving an approved submission.",
);
assert(
  canTransitionSubmission("admin", "rejected", "archived"),
  "An administrator was prevented from archiving a rejected submission.",
);
assert(
  !canTransitionSubmission("editor", "inReview", "archived"),
  "An editor was allowed to archive an unresolved submission.",
);
assert(
  !canTransitionSubmission("contributor", "approved", "archived"),
  "A contributor was allowed to archive a resolved submission.",
);
assert(
  isContributorEditableStatus("revisionRequested"),
  "A requested revision was not editable by its owner.",
);
assert(
  !isContributorEditableStatus("inReview"),
  "An in-review submission was editable by its owner.",
);

const contributorActor: OperationalActor = {
  id: "contributor.owner",
  displayName: "Owner",
  role: "contributor",
  accessStatus: "active",
};
const editorActor: OperationalActor = {
  id: "contributor.editor",
  displayName: "Editor",
  role: "editor",
  accessStatus: "active",
};
const suspendedAdminActor: OperationalActor = {
  id: "contributor.suspended-admin",
  displayName: "Suspended administrator",
  role: "admin",
  accessStatus: "suspended",
};
assert(
  canAccessSubmission(contributorActor, contributorActor.id),
  "A contributor could not access their own submission.",
);
assert(
  !canAccessSubmission(contributorActor, "contributor.someone-else"),
  "A contributor could access another contributor's submission.",
);
assert(
  canAccessSubmission(editorActor, contributorActor.id),
  "An active editor could not access a contributor submission.",
);
assert(
  canEditSubmission(
    contributorActor,
    contributorActor.id,
    "revisionRequested",
  ),
  "A contributor could not edit their own requested revision.",
);
assert(
  !canEditSubmission(editorActor, contributorActor.id, "draft"),
  "An editor was allowed to edit contributor-owned draft content.",
);
assert(
  canReviewSubmission(editorActor),
  "An active editor could not review submissions.",
);
assert(
  !canReviewSubmission(suspendedAdminActor),
  "A suspended administrator retained review permissions.",
);
assert(
  higherRole("contributor", "admin") === "admin" &&
    higherRole("editor", "contributor") === "editor",
  "Effective role precedence did not preserve the higher trusted role.",
);
assert(
  wouldRemoveFinalAdministrator({
    targetIsEffectiveAdministrator: true,
    otherEffectiveAdministratorCount: 0,
  }),
  "The final-administrator safeguard did not activate.",
);
assert(
  !wouldRemoveFinalAdministrator({
    targetIsEffectiveAdministrator: true,
    otherEffectiveAdministratorCount: 1,
  }),
  "A safe administrator change was incorrectly blocked.",
);
assert(
  SUBMISSION_MUTATION_TARGET_PROJECTION.includes('"revisionId": _rev'),
  "The submission mutation projection omitted its Sanity revision guard.",
);
assert(
  CONTRIBUTOR_IDENTITY_PROJECTION.includes('"revisionId": _rev'),
  "The contributor identity projection omitted its Sanity revision guard.",
);

const idempotencyKey = "4d6f61bf-ece0-43de-8a5c-e660c49116e2";
assert(
  submissionIdempotencyKeySchema.safeParse(idempotencyKey).success,
  "A valid server-generated submission idempotency key was rejected.",
);
assert(
  !submissionIdempotencyKeySchema.safeParse("replayed-form").success,
  "An invalid submission idempotency key was accepted.",
);
assert(
  mutationOperationKeySchema.safeParse(idempotencyKey).success &&
    !mutationOperationKeySchema.safeParse("stale-operation").success,
  "Server-generated mutation operation keys were not UUID validated.",
);

const firstSubmissionIdentifiers = createSubmissionCreateIdentifiers({
  contributorId: "contributor.actor-one",
  idempotencyKey,
  year: 2026,
});
const replayedSubmissionIdentifiers = createSubmissionCreateIdentifiers({
  contributorId: "contributor.actor-one",
  idempotencyKey,
  year: 2026,
});
const otherActorIdentifiers = createSubmissionCreateIdentifiers({
  contributorId: "contributor.actor-two",
  idempotencyKey,
  year: 2026,
});
const otherRequestIdentifiers = createSubmissionCreateIdentifiers({
  contributorId: "contributor.actor-one",
  idempotencyKey: "f9aba460-5454-480c-a1fc-6e9ac72ee00e",
  year: 2026,
});

assert(
  JSON.stringify(firstSubmissionIdentifiers) ===
    JSON.stringify(replayedSubmissionIdentifiers),
  "A replay did not resolve to the same submission and audit identifiers.",
);
assert(
  firstSubmissionIdentifiers.id !== otherActorIdentifiers.id,
  "Submission idempotency identifiers were not scoped to the contributor.",
);
assert(
  firstSubmissionIdentifiers.id !== otherRequestIdentifiers.id,
  "Different create requests resolved to the same submission identifier.",
);
assert(
  [
    firstSubmissionIdentifiers.id,
    firstSubmissionIdentifiers.createdAuditId,
    firstSubmissionIdentifiers.submittedAuditId,
  ].every(
    (identifier) =>
      operationalDocumentIdSchema.safeParse(identifier).success,
  ),
  "An idempotent submission identifier is invalid for Sanity.",
);

const firstUpdateIdentifiers = createSubmissionUpdateIdentifiers({
  contributorId: "contributor.actor-one",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
  content: { title: "Updated title", nested: { second: 2, first: 1 } },
});
const reorderedUpdateIdentifiers = createSubmissionUpdateIdentifiers({
  contributorId: "contributor.actor-one",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
  content: { nested: { first: 1, second: 2 }, title: "Updated title" },
});
const changedUpdateIdentifiers = createSubmissionUpdateIdentifiers({
  contributorId: "contributor.actor-one",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
  content: { title: "Different update" },
});
assert(
  JSON.stringify(firstUpdateIdentifiers) ===
    JSON.stringify(reorderedUpdateIdentifiers),
  "Equivalent draft-update replays did not resolve to stable identifiers.",
);
assert(
  firstUpdateIdentifiers.auditId === changedUpdateIdentifiers.auditId &&
    firstUpdateIdentifiers.intentFingerprint !==
      changedUpdateIdentifiers.intentFingerprint,
  "A reused draft-update key could not distinguish a changed operation intent.",
);

const firstPrivateNoteIdentifiers = createPrivateNoteIdentifiers({
  actorId: "contributor.editor",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
});
const replayedPrivateNoteIdentifiers = createPrivateNoteIdentifiers({
  actorId: "contributor.editor",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
});
const otherEditorPrivateNoteIdentifiers = createPrivateNoteIdentifiers({
  actorId: "contributor.other-editor",
  submissionId: firstSubmissionIdentifiers.id,
  operationKey: idempotencyKey,
});
assert(
  JSON.stringify(firstPrivateNoteIdentifiers) ===
    JSON.stringify(replayedPrivateNoteIdentifiers),
  "A private-note replay did not resolve to stable note and audit identifiers.",
);
assert(
  firstPrivateNoteIdentifiers.auditId !==
    otherEditorPrivateNoteIdentifiers.auditId,
  "Private-note identifiers were not scoped to the authenticated editor.",
);
assert(
  operationalDocumentIdSchema.safeParse(firstUpdateIdentifiers.auditId)
    .success &&
    operationalDocumentIdSchema.safeParse(
      firstPrivateNoteIdentifiers.auditId,
    ).success &&
    operationalDocumentIdSchema.safeParse(firstPrivateNoteIdentifiers.noteKey)
      .success,
  "A replay-safe mutation identifier is invalid for Sanity.",
);

assert(
  countEffectiveAdministratorCandidates({
    activeProfileAdministratorCount: 0,
    bootstrapAdminEmails: ["suspended@example.com"],
    provisionedBootstrapEmails: ["suspended@example.com"],
  }) === 0,
  "A provisioned but inactive bootstrap profile was counted as usable.",
);
assert(
  countEffectiveAdministratorCandidates({
    activeProfileAdministratorCount: 1,
    bootstrapAdminEmails: ["active@example.com"],
    provisionedBootstrapEmails: ["active@example.com"],
  }) === 1,
  "An active bootstrap profile was counted twice.",
);
assert(
  countEffectiveAdministratorCandidates({
    activeProfileAdministratorCount: 0,
    bootstrapAdminEmails: ["unprovisioned@example.com"],
    provisionedBootstrapEmails: [],
  }) === 1,
  "An unprovisioned bootstrap administrator was not counted as provisionable.",
);

assert(
  !hasReachedActiveSubmissionLimit(
    MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR - 1,
  ),
  "The active-submission quota activated below its boundary.",
);
assert(
  hasReachedActiveSubmissionLimit(
    MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR,
  ),
  "The active-submission quota did not activate at its boundary.",
);

const trustedOrigin = "https://cali.example";
assert(
  safeAuthReturnPath("/account/submissions") ===
    "/account/submissions",
  "A safe account return path was rejected.",
);
assert(
  safeAuthReturnPath("/\\evil.example") === "/account" &&
    safeAuthReturnPath("/account\u0000/admin") === "/account",
  "An unsafe normalized return path was accepted.",
);
assert(
  resolveTrustedAuthRedirect("/account", trustedOrigin) ===
    "https://cali.example/account",
  "A safe relative authentication redirect was rejected.",
);
assert(
  resolveTrustedAuthRedirect("/\\evil.example", trustedOrigin) ===
    trustedOrigin,
  "A backslash-normalized cross-origin redirect was accepted.",
);
assert(
  resolveTrustedAuthRedirect(
    "https://user:password@cali.example/account",
    trustedOrigin,
  ) === trustedOrigin,
  "A same-origin redirect containing credentials was accepted.",
);
assert(
  resolveTrustedAuthRedirect(
    "https://evil.example/account",
    trustedOrigin,
  ) === trustedOrigin,
  "A cross-origin authentication redirect was accepted.",
);

console.log(
  `Repository integrity checks passed (${assertionCount} assertions).`,
);
