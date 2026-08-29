import { existsSync, readFileSync } from "node:fs";

import { athletes } from "@/data/athletes";
import {
  athleteCompetitionCategoryValues,
  athleteSpecialtyValues,
} from "@/lib/athlete-taxonomy";
import { countries, unitedStatesAdministrativeAreas } from "@/lib/geography";
import {
  ACCOUNT_CAPABILITIES,
  JOIN_INTENTS,
  isAccountCapability,
  joinIntentReturnPath,
  resolveJoinIntent,
} from "@/lib/account/capabilities";

import {
  operationalDocumentIdSchema,
  athleteNominationDetailsSchema,
  contributorProfileUpdateSchema,
  safeHttpUrlSchema,
  storyPitchSchema,
  submissionDraftSchema,
  submissionForReviewSchema,
  submissionIdempotencyKeySchema,
  teamApplicationDetailsSchema,
  mutationOperationKeySchema,
  mediaPitchDetailsSchema,
  organizationClaimDetailsSchema,
  productSubmissionDetailsSchema,
  videoSubmissionDetailsSchema,
} from "@/lib/operations/validation";
import {
  resolveTrustedAuthRedirect,
  safeAuthReturnPath,
} from "@/lib/auth/redirects";
import { PORTAL_ROLES } from "@/lib/auth/types";
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
import {
  MAX_PUBLIC_SEARCH_QUERY_LENGTH,
  PUBLIC_SEARCH_FILTERS,
  normalizePublicSearchQuery,
  resolvePublicSearchFilter,
} from "@/lib/search/contracts";
import {
  getVerifiedCompetitionResults,
  isPublishableCompetitionStanding,
  isVerifiedCompetitionResult,
} from "@/lib/standings/publication";
import type { Competition, CompetitionResult } from "@/types/competition";
import type { RankingCategory } from "@/types/ranking";
import { accessibleTeamMarkColors, contrastRatio } from "@/lib/teams/branding";

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
const sanityWriteClientSource = readFileSync(
  new URL("../sanity/lib/write-client.ts", import.meta.url),
  "utf8",
);
const sanityReadClientSource = readFileSync(
  new URL("../sanity/lib/client.ts", import.meta.url),
  "utf8",
);

assert(
  !sanityWriteClientSource.includes("let cachedClient") &&
    sanityWriteClientSource.includes("return createClient({") &&
    sanityWriteClientSource.includes("fetch: true") &&
    sanityReadClientSource.includes("fetch: true"),
  "Sanity clients must remain request-safe on Cloudflare Workers.",
);

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

assert(
  new Set(ACCOUNT_CAPABILITIES).size === ACCOUNT_CAPABILITIES.length &&
    JOIN_INTENTS.length === ACCOUNT_CAPABILITIES.length &&
    JOIN_INTENTS.every((intent) => isAccountCapability(intent.capability)),
  "Join intents and the reusable account-capability contract drifted.",
);
assert(
  ACCOUNT_CAPABILITIES.every(
    (capability) =>
      !(PORTAL_ROLES.slice(1) as readonly string[]).includes(capability),
  ),
  "A self-selected account capability overlapped a privileged portal role.",
);
assert(
  resolveJoinIntent("organizer").capability === "organizer" &&
    resolveJoinIntent("admin").capability === "member" &&
    !isAccountCapability("admin"),
  "Join-intent validation accepted a privileged or unsupported value.",
);
assert(
  safeAuthReturnPath(joinIntentReturnPath("athlete")) ===
    "/account/onboarding?intent=athlete",
  "A valid Join callback did not remain on the trusted account route.",
);

assert(
  normalizePublicSearchQuery("  athlete   profile ") === "athlete profile" &&
    normalizePublicSearchQuery("x".repeat(200)).length ===
      MAX_PUBLIC_SEARCH_QUERY_LENGTH,
  "Public search query normalization is not bounded and deterministic.",
);
assert(
  resolvePublicSearchFilter("athletes") === "athletes" &&
    resolvePublicSearchFilter("submissions") === "all" &&
    !PUBLIC_SEARCH_FILTERS.includes("submissions" as never),
  "Public search accepted a private or unsupported record category.",
);

for (const routeFile of [
  "../app/(site)/join/page.tsx",
  "../app/(site)/search/page.tsx",
  "../app/(site)/verification/page.tsx",
  "../app/(site)/corrections/page.tsx",
  "../app/(site)/editorial-standards/page.tsx",
  "../app/(site)/standings/page.tsx",
  "../app/(site)/standings/methodology/page.tsx",
  "../app/(site)/competitions/calendar/page.tsx",
  "../app/(account)/account/onboarding/page.tsx",
]) {
  assert(
    existsSync(new URL(routeFile, import.meta.url)),
    `Required global account or trust route is missing: ${routeFile}`,
  );
}

const sourcedResult: CompetitionResult = {
  key: "result-1",
  placement: 1,
  athleteName: "Verified Athlete",
  region: "France",
  category: "Weighted strength",
  division: "Open",
  scoreDisplay: "80 kg",
  resultLabel: "First place",
  movementNote: "",
  verificationStatus: "verified",
  sourceType: "official-event-results",
  sourceName: "Official event results",
  sourceUrl: "https://example.com/results",
};
const completedVerifiedCompetition = {
  status: "completed",
  resultsStatus: "verified-results",
} as unknown as Competition;

assert(
  isVerifiedCompetitionResult(completedVerifiedCompetition, sourcedResult),
  "A completed, source-backed verified competition result failed its publication gate.",
);
assert(
  !isVerifiedCompetitionResult(
    {
      status: "completed",
      resultsStatus: "sample-results",
    } as unknown as Competition,
    sourcedResult,
  ),
  "A sample result entered the verified-results gate.",
);
assert(
  getVerifiedCompetitionResults([
    {
      slug: "sample-event",
      name: "Sample event",
      startDate: "2026-01-01",
      country: "United States",
      status: "completed",
      resultsStatus: "sample-results",
      results: [sourcedResult],
    } as unknown as Competition,
  ]).length === 0,
  "The verified-results archive included a sample competition result.",
);

const publishableStanding = {
  slug: "open-2026",
  title: "Open 2026",
  subtitle: "",
  discipline: "Weighted strength",
  division: "Open",
  region: "Worldwide",
  scope: "competition",
  status: "published",
  methodologyStatus: "approved",
  seasonLabel: "2026",
  updatedLabel: "August 2026",
  description: "Source-backed competition standing.",
  disclaimer: "Published methodology applies.",
  entries: [
    {
      rank: 1,
      athleteSlug: "verified-athlete",
      athleteName: "Verified Athlete",
      region: "France",
      points: 100,
      movement: { direction: "new", amount: 0, label: "New" },
      statusLabel: "Published standing",
      sources: [
        {
          competitionSlug: "verified-event",
          competitionName: "Verified event",
          resultKey: "result-1",
          sourceName: "Official event results",
          sourceUrl: "https://example.com/results",
          verificationStatus: "verified",
        },
      ],
    },
  ],
} satisfies RankingCategory;

assert(
  isPublishableCompetitionStanding(publishableStanding) &&
    !isPublishableCompetitionStanding({
      ...publishableStanding,
      methodologyStatus: "draft",
    }) &&
    !isPublishableCompetitionStanding({
      ...publishableStanding,
      entries: [{ ...publishableStanding.entries[0], sources: [] }],
    }),
  "The standings gate accepted a draft or unsourced board, or rejected a valid sourced board.",
);

const publicSearchSource = readFileSync(
  new URL("../lib/content/search.ts", import.meta.url),
  "utf8",
);
assert(
  publicSearchSource.includes("publishedOnly: true") &&
    publicSearchSource.includes("stega: false") &&
    !publicSearchSource.includes("getContributor") &&
    !publicSearchSource.includes("getSubmission"),
  "Public search is not visibly isolated from drafts or operational records.",
);

const globalBrandSource = [
  "../data/homepage.ts",
  "../components/home/hero-section.tsx",
  "../components/layout/mobile-navigation.tsx",
  "../components/layout/site-footer.tsx",
  "../lib/content/fallback.ts",
]
  .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
  .join("\n");
assert(
  !/California base|California to worldwide|California to the global stage|CA 36\.7783/i.test(
    globalBrandSource,
  ),
  "Global brand surfaces still position California as the platform boundary.",
);

assert(
  countries.length >= 249 &&
    new Set(countries.map((country) => country.code)).size ===
      countries.length &&
    new Set(countries.map((country) => country.name)).size === countries.length,
  "Reusable worldwide country data is incomplete or duplicated.",
);
assert(
  unitedStatesAdministrativeAreas.length === 51 &&
    unitedStatesAdministrativeAreas.some((area) => area.code === "DC") &&
    new Set(unitedStatesAdministrativeAreas.map((area) => area.code)).size ===
      unitedStatesAdministrativeAreas.length,
  "United States geography must contain all 50 states and District of Columbia.",
);
assert(
  new Set(athleteCompetitionCategoryValues).size ===
    athleteCompetitionCategoryValues.length &&
    new Set(athleteSpecialtyValues).size === athleteSpecialtyValues.length,
  "Athlete category or specialty values are duplicated.",
);
assert(
  athletes.every(
    (athlete) =>
      athlete.country &&
      athlete.administrativeArea &&
      athlete.primaryCategory &&
      athlete.rankingEligible === false &&
      athlete.verification.identityStatus === "unverified" &&
      athlete.verification.profileStatus === "not-reviewed",
  ),
  "Fallback athlete records contain missing geography or unsupported ranking/verification claims.",
);

const athleteClaim = athleteNominationDetailsSchema.safeParse({
  requestKind: "claim",
  existingAthleteSlug: "sample-athlete",
  athleteName: "Sample Athlete",
  displayName: "",
  country: "Japan",
  administrativeArea: "Tokyo",
  city: "",
  biography: "",
  primaryCategory: "skills-static",
  specialties: ["hand-balancing"],
  yearsActive: "",
  profileImageUrl: "",
  coverImageUrl: "",
  socialLinks: [{ url: "https://example.com/sample-athlete", label: "" }],
  competitionHistory: [
    {
      eventName: "Public sample event",
      organizer: "Sample organizer",
      date: "2026-01-15",
      country: "Japan",
      city: "Tokyo",
      divisionCategory: "Skills / Static",
      placement: "",
      score: "",
      officialResultUrl: "https://example.com/results",
      eventUrl: "",
      videoUrl: "",
    },
  ],
  discipline: "",
  nominationReason:
    "The submitter requests moderated review of this existing public profile.",
  publicReferenceLinks: [],
  relationshipToAthlete: "Self",
  permissionStatus: "confirmed",
});
assert(
  athleteClaim.success &&
    !athleteNominationDetailsSchema.safeParse({
      ...athleteClaim.data,
      existingAthleteSlug: "",
    }).success,
  "Athlete claim validation did not preserve structured profile data or require a target profile.",
);

for (const link of ["https://example.com/source", "http://example.com/path"]) {
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
  canEditSubmission(contributorActor, contributorActor.id, "revisionRequested"),
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
    (identifier) => operationalDocumentIdSchema.safeParse(identifier).success,
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
    operationalDocumentIdSchema.safeParse(firstPrivateNoteIdentifiers.auditId)
      .success &&
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
  !hasReachedActiveSubmissionLimit(MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR - 1),
  "The active-submission quota activated below its boundary.",
);
assert(
  hasReachedActiveSubmissionLimit(MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR),
  "The active-submission quota did not activate at its boundary.",
);

const trustedOrigin = "https://cali.example";
assert(
  safeAuthReturnPath("/account/submissions") === "/account/submissions",
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
  resolveTrustedAuthRedirect("https://evil.example/account", trustedOrigin) ===
    trustedOrigin,
  "A cross-origin authentication redirect was accepted.",
);

const validTeamApplication = {
  proposedTeamName: "Northstar Test Crew",
  shortName: "Northstar",
  code: "NST",
  teamType: "crew",
  representedIdentity: "Toronto",
  country: "Canada",
  administrativeArea: "Ontario",
  city: "Toronto",
  trainingBase: "Public training park",
  foundingYear: "2025",
  description:
    "A fictional team application used only for deterministic validation.",
  disciplines: ["Strength", "Freestyle"],
  competitionIntentions: "Regional competition participation after review.",
  website: "",
  socialLinks: [],
  primaryColor: "#121820",
  secondaryColor: "#F4F1EA",
  accentColor: "#C9252D",
  crestReferenceUrl: "https://example.com/fictional-crest",
  wordmarkReferenceUrl: "",
  brandingPermissionAcknowledged: true,
  proposedUniformDesign: "Fictional uniform concept.",
  proposedRoster: [
    {
      name: "Sample Captain",
      privateEmail: "captain@example.com",
      privatePhone: "",
      existingProfileSlug: "",
      relationshipToTeam: "Applicant",
      role: "captain",
      rosterStatus: "proposed",
      specialty: "strength",
      consentStatus: "accepted",
    },
  ],
};
assert(
  teamApplicationDetailsSchema.safeParse(validTeamApplication).success,
  "A valid structured team application was rejected.",
);
assert(
  !teamApplicationDetailsSchema.safeParse({
    ...validTeamApplication,
    primaryColor: "red",
  }).success,
  "A non-hex team color was accepted.",
);
assert(
  !teamApplicationDetailsSchema.safeParse({
    ...validTeamApplication,
    brandingPermissionAcknowledged: false,
  }).success,
  "A review-ready team application without branding authority was accepted.",
);

const fictionalVideoSubmission = {
  submittingIdentityType: "member",
  videoTitle: "Fictional streetlifting meet recap",
  description:
    "A fictional public-link submission used only to test moderated video intake.",
  category: "streetlifting",
  discipline: "Weighted strength",
  sourceHost: "youtube",
  originalPublicUrl: "https://www.youtube.com/watch?v=fictional",
  submitterRelationship: "Creator and rights holder",
  creatorName: "Sample Creator",
  creatorProfileUrl: "https://example.com/creator",
  featuredAthletes: ["Sample Athlete"],
  featuredTeams: [],
  organizationId: "",
  competition: "Fictional test event",
  eventDate: "2026-07-01",
  location: "Toronto, Canada",
  thumbnailReferenceUrl: "",
  rightsDeclaration: "submitter-owned",
  ownershipSourceDeclaration:
    "The fictional submitter declares that they created and own this test video.",
  sourceAccount: "Sample Creator",
  editorialNote: "",
  contentWarnings: [],
};
assert(
  videoSubmissionDetailsSchema.safeParse(fictionalVideoSubmission).success &&
    !videoSubmissionDetailsSchema.safeParse({
      ...fictionalVideoSubmission,
      originalPublicUrl: "https://www.instagram.com/p/fictional",
    }).success &&
    !videoSubmissionDetailsSchema.safeParse({
      ...fictionalVideoSubmission,
      originalPublicUrl: "https://notyoutube.com/watch?v=lookalike",
    }).success,
  "Video intake failed a valid fictional submission or accepted a source-host mismatch.",
);
assert(
  ["draft", "submitted", "inReview", "approved"].every(
    (status, index, statuses) =>
      index === 0 ||
      canTransitionSubmission(
        index === 1 ? "contributor" : "editor",
        statuses[index - 1] as "draft" | "submitted" | "inReview",
        status as "submitted" | "inReview" | "approved",
      ),
  ),
  "The video submission workflow cannot reach editorial approval through authorized transitions.",
);

assert(
  mediaPitchDetailsSchema.safeParse({
    mediaKind: "photo",
    submittingIdentityType: "member",
    proposedTitle: "Fictional training photo",
    series: "",
    format: "Photo",
    subject: "Sample athlete",
    location: "",
    visualApproach:
      "A documentary-style fictional test image with clear creator credit.",
    estimatedDuration: "",
    sourcePlatform: "Website",
    sourceAccount: "Sample Creator",
    originalPostUrl: "https://example.com/fictional-photo",
    creatorName: "Sample Creator",
    caption: "Fictional test caption.",
    altText: "An athlete holding the top position of a pull-up.",
    mediaPermissionStatus: "permission-confirmed",
    publicReferenceLinks: [],
  }).success &&
    !mediaPitchDetailsSchema.safeParse({
      mediaKind: "photo",
      submittingIdentityType: "member",
      proposedTitle: "Missing source photo",
      series: "",
      format: "Photo",
      subject: "Sample athlete",
      location: "",
      visualApproach:
        "A fictional test record that intentionally omits its public source URL.",
      estimatedDuration: "",
      sourcePlatform: "Website",
      sourceAccount: "",
      originalPostUrl: "",
      creatorName: "",
      caption: "",
      altText: "",
      mediaPermissionStatus: "unknown",
      publicReferenceLinks: [],
    }).success,
  "Photo/media intake did not require a real public source and explicit rights declaration.",
);

assert(
  organizationClaimDetailsSchema.safeParse({
    requestKind: "claim",
    existingOrganizationId: "organization.fictional",
    organizationName: "Fictional Movement Federation",
    organizationType: "federation",
    country: "Canada",
    website: "https://example.com/fictional-organization",
    relationshipToOrganization:
      "Authorized representative for this fictional test record.",
    requestedCapabilities: ["manage-profile"],
    evidenceLinks: [
      { url: "https://example.com/fictional-evidence", label: "" },
    ],
  }).success,
  "A complete fictional organization claim was rejected.",
);

assert(
  productSubmissionDetailsSchema.safeParse({
    organizationId: "organization.fictional-brand",
    productName: "Fictional wooden parallettes",
    category: "Equipment",
    productSummary:
      "A fictional product proposal used only for offline validation of the moderated intake model.",
    standardProductUrl: "https://example.com/fictional-product",
    affiliateUrl: "",
    affiliateRelationship: "none",
    submitterRelationship: "Authorized fictional brand representative.",
    commercialDisclosure:
      "No real commercial or affiliate relationship exists.",
  }).success,
  "A non-affiliate fictional product submission was rejected.",
);
assert(
  ACCOUNT_CAPABILITIES.includes("team") &&
    PUBLIC_SEARCH_FILTERS.includes("teams"),
  "Team onboarding or public-search capability is missing.",
);
const safeTeamMark = accessibleTeamMarkColors({
  primaryColor: "#FFFFFF",
  secondaryColor: "#F4F4F4",
});
assert(
  contrastRatio(safeTeamMark.backgroundColor, safeTeamMark.color) >= 4.5,
  "Team branding was allowed to reduce mark text contrast below 4.5:1.",
);

console.log(
  `Repository integrity checks passed (${assertionCount} assertions).`,
);
