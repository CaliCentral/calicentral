"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBootstrapRole, getCurrentUser, isBootstrapAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/operations/action-result";
import { getBootstrapAdminEmails } from "@/lib/operations/bootstrap";
import {
  countActiveContributorSubmissions,
  countOtherEffectiveAdministrators,
  getAssignableReviewers,
  getContributorForAdmin,
  getOwnContributorProfile,
  updateContributorAccessRecord,
  updateContributorInternalNotesRecord,
  updateContributorProfileRecord,
  updateContributorRoleRecord,
} from "@/lib/operations/contributors";
import { isOperationalError, OperationalError } from "@/lib/operations/errors";
import {
  assertCanAdministerContributors,
  assertCanEditSubmission,
  assertCanReviewSubmission,
  assertCanWithdrawSubmission,
  assertContributorMutationAccess,
  assertProfileMutationAccess,
  assertSubmissionOwner,
  hasRole,
  higherRole,
  wouldRemoveFinalAdministrator,
} from "@/lib/operations/permissions";
import {
  getAdministratorMutationGuard,
  type OperationalLockGuard,
} from "@/lib/operations/locks";
import {
  addPrivateEditorialNoteRecord,
  assignSubmissionReviewerRecord,
  createSubmissionRecord,
  getSubmissionForContributor,
  getSubmissionForReview,
  getSubmissionMutationTarget,
  transitionSubmissionRecord,
  updateSubmissionPriorityRecord,
  updateSubmissionRecord,
  updateVisibleFeedbackRecord,
} from "@/lib/operations/submissions";
import type {
  AdminContributorDetail,
  ContributorRole,
  ContributorSubmissionDetail,
  OperationalActor,
  SubmissionStatus,
  SupportingLinkInput,
} from "@/lib/operations/types";
import {
  archiveSchema,
  assignmentSchema,
  contributorAccessSchema,
  contributorInternalNotesSchema,
  contributorProfileUpdateSchema,
  contributorRoleSchema,
  mutationOperationKeySchema,
  privateNoteSchema,
  priorityUpdateSchema,
  rejectionSchema,
  reviewActionSchema,
  revisionRequestSchema,
  submissionDraftSchema,
  submissionForReviewSchema,
  submissionIdempotencyKeySchema,
  visibleFeedbackSchema,
} from "@/lib/operations/validation";
import { safeLog } from "@/lib/observability/logger";
import { featureConfig } from "@/lib/features/config";
import { getCommunityApplicationRepository, getCommunityRuntime } from "@/lib/community/runtime";
import { enforceCommunityRateLimit } from "@/lib/community/rate-limit";
import { ORGANIZATION_CAPABILITIES } from "@/lib/community/types";
import { getAthletePage } from "@/lib/content";
import type {
  SubmissionDraftInput,
  SubmissionForReviewInput,
} from "@/lib/operations/validation";

type MinimumRole = "contributor" | "editor" | "admin";

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalTextField(
  formData: FormData,
  name: string,
): string | undefined {
  return textField(formData, name) || undefined;
}

function booleanField(formData: FormData, name: string): boolean {
  const value = textField(formData, name).toLowerCase();
  return ["1", "on", "true", "yes"].includes(value);
}

function listField(formData: FormData, name: string): string[] {
  const values = formData
    .getAll(name)
    .flatMap((value) => (typeof value === "string" ? value.split(/\r?\n/) : []))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)];
}

function linkField(formData: FormData, name: string): SupportingLinkInput[] {
  return listField(formData, name).map((url) => ({ url }));
}

function athleteCompetitionHistoryField(formData: FormData) {
  return Array.from({ length: 12 }, (_, index) => {
    const entry = {
      eventName: textField(formData, `competitionEventName${index}`),
      organizer: textField(formData, `competitionOrganizer${index}`),
      date: textField(formData, `competitionDate${index}`),
      country: textField(formData, `competitionCountry${index}`),
      city: textField(formData, `competitionCity${index}`),
      divisionCategory: textField(
        formData,
        `competitionDivisionCategory${index}`,
      ),
      placement: textField(formData, `competitionPlacement${index}`),
      score: textField(formData, `competitionScore${index}`),
      officialResultUrl: textField(
        formData,
        `competitionOfficialResultUrl${index}`,
      ),
      eventUrl: textField(formData, `competitionEventUrl${index}`),
      videoUrl: textField(formData, `competitionVideoUrl${index}`),
    };

    return Object.values(entry).some(Boolean) ? entry : null;
  }).filter((entry) => entry !== null);
}

function teamApplicationRosterField(formData: FormData) {
  return Array.from({ length: 8 }, (_, index) => {
    const entry = {
      name: textField(formData, `teamRosterName${index}`),
      privateEmail: textField(formData, `teamRosterEmail${index}`),
      privatePhone: textField(formData, `teamRosterPhone${index}`),
      existingProfileSlug: textField(formData, `teamRosterProfileSlug${index}`),
      relationshipToTeam: textField(formData, `teamRosterRelationship${index}`),
      role: textField(formData, `teamRosterRole${index}`),
      rosterStatus: textField(formData, `teamRosterStatus${index}`),
      specialty: textField(formData, `teamRosterSpecialty${index}`),
      consentStatus: textField(formData, `teamRosterConsent${index}`),
    };
    const populated = [
      entry.name,
      entry.privateEmail,
      entry.privatePhone,
      entry.existingProfileSlug,
      entry.relationshipToTeam,
      entry.specialty,
    ].some(Boolean);
    return populated ? entry : null;
  }).filter((entry) => entry !== null);
}

function assertSubmissionFeatureEnabled(submissionType: string): void {
  if (submissionType === "teamApplication" && !featureConfig.teamApplications) {
    throw new OperationalError(
      "access_denied",
      "Team applications are not currently accepting changes.",
    );
  }
  if (
    submissionType === "organizationClaim" &&
    !featureConfig.organizationClaims
  ) {
    throw new OperationalError(
      "access_denied",
      "Organization claims are not currently accepting changes.",
    );
  }
  if (submissionType === "videoSubmission" && !featureConfig.videoSubmissions) {
    throw new OperationalError(
      "access_denied",
      "Video submissions are not currently accepting changes.",
    );
  }
  if (submissionType === "mediaPitch" && !featureConfig.mediaSubmissions) {
    throw new OperationalError(
      "access_denied",
      "Photo and media submissions are not currently accepting changes.",
    );
  }
  if (
    submissionType === "productSubmission" &&
    !featureConfig.productSubmissions
  ) {
    throw new OperationalError(
      "access_denied",
      "Product submissions are not currently accepting changes.",
    );
  }
}

function rawSubmissionInput(formData: FormData, includeTerms: boolean) {
  const common = {
    submissionType: textField(formData, "submissionType"),
    title: textField(formData, "title"),
    summary: textField(formData, "summary"),
    details: textField(formData, "details"),
    contributorNote: textField(formData, "contributorNote"),
    supportingLinks: linkField(formData, "supportingLinks"),
    ...(includeTerms
      ? { termsAccepted: booleanField(formData, "termsAccepted") }
      : {}),
  };

  switch (common.submissionType) {
    case "storyPitch":
      return {
        ...common,
        submissionType: "storyPitch",
        storyPitchDetails: {
          proposedHeadline: optionalTextField(formData, "proposedHeadline"),
          section: optionalTextField(formData, "section"),
          pitchSummary: optionalTextField(formData, "pitchSummary"),
          reportingApproach: optionalTextField(formData, "reportingApproach"),
          relevantPeople: listField(formData, "relevantPeople"),
          relevantLocations: listField(formData, "relevantLocations"),
          estimatedLength: textField(formData, "estimatedLength"),
          conflictDisclosure: textField(formData, "conflictDisclosure"),
        },
      };
    case "athleteNomination":
      return {
        ...common,
        submissionType: "athleteNomination",
        athleteNominationDetails: {
          requestKind: textField(formData, "requestKind"),
          existingAthleteSlug: textField(formData, "existingAthleteSlug"),
          athleteName: optionalTextField(formData, "athleteName"),
          displayName: textField(formData, "displayName"),
          country: optionalTextField(formData, "country"),
          administrativeArea: textField(formData, "administrativeArea"),
          city: textField(formData, "city"),
          biography: textField(formData, "biography"),
          primaryCategory: optionalTextField(formData, "primaryCategory"),
          specialties: listField(formData, "specialties"),
          yearsActive: textField(formData, "yearsActive"),
          profileImageUrl: textField(formData, "profileImageUrl"),
          coverImageUrl: textField(formData, "coverImageUrl"),
          socialLinks: linkField(formData, "socialLinks"),
          competitionHistory: athleteCompetitionHistoryField(formData),
          discipline: optionalTextField(formData, "discipline"),
          nominationReason: optionalTextField(formData, "nominationReason"),
          publicReferenceLinks: linkField(formData, "publicReferenceLinks"),
          relationshipToAthlete: textField(formData, "relationshipToAthlete"),
          permissionStatus: textField(formData, "permissionStatus"),
        },
      };
    case "competitionListing":
      return {
        ...common,
        submissionType: "competitionListing",
        competitionListingDetails: {
          eventName: optionalTextField(formData, "eventName"),
          city: optionalTextField(formData, "city"),
          proposedDate: textField(formData, "proposedDate"),
          format: optionalTextField(formData, "format"),
          divisions: listField(formData, "divisions"),
          organizerRelationship: textField(formData, "organizerRelationship"),
          publicReferenceLinks: linkField(formData, "publicReferenceLinks"),
          scheduleStatus: textField(formData, "scheduleStatus"),
        },
      };
    case "teamApplication":
      return {
        ...common,
        submissionType: "teamApplication",
        teamApplicationDetails: {
          proposedTeamName: optionalTextField(formData, "proposedTeamName"),
          shortName: optionalTextField(formData, "teamShortName"),
          code: optionalTextField(formData, "teamCode"),
          teamType: optionalTextField(formData, "teamType"),
          representedIdentity: optionalTextField(
            formData,
            "representedIdentity",
          ),
          country: optionalTextField(formData, "teamCountry"),
          administrativeArea: textField(formData, "teamAdministrativeArea"),
          city: textField(formData, "teamCity"),
          trainingBase: textField(formData, "teamTrainingBase"),
          foundingYear: textField(formData, "teamFoundingYear"),
          description: optionalTextField(formData, "teamDescription"),
          disciplines: listField(formData, "teamDisciplines"),
          competitionIntentions: optionalTextField(
            formData,
            "competitionIntentions",
          ),
          website: textField(formData, "teamWebsite"),
          socialLinks: linkField(formData, "teamSocialLinks"),
          primaryColor: optionalTextField(formData, "teamPrimaryColor"),
          secondaryColor: optionalTextField(formData, "teamSecondaryColor"),
          accentColor: textField(formData, "teamAccentColor"),
          crestReferenceUrl: textField(formData, "crestReferenceUrl"),
          wordmarkReferenceUrl: textField(formData, "wordmarkReferenceUrl"),
          brandingPermissionAcknowledged: booleanField(
            formData,
            "brandingPermissionAcknowledged",
          ),
          proposedUniformDesign: textField(formData, "proposedUniformDesign"),
          proposedRoster: teamApplicationRosterField(formData),
        },
      };
    case "organizationClaim":
      return {
        ...common,
        submissionType: "organizationClaim",
        organizationClaimDetails: {
          requestKind: textField(formData, "organizationRequestKind"),
          existingOrganizationId: textField(formData, "existingOrganizationId"),
          organizationName: optionalTextField(formData, "organizationName"),
          organizationType: optionalTextField(formData, "organizationType"),
          country: optionalTextField(formData, "organizationCountry"),
          website: textField(formData, "organizationWebsite"),
          relationshipToOrganization: optionalTextField(
            formData,
            "relationshipToOrganization",
          ),
          requestedCapabilities: listField(formData, "requestedCapabilities"),
          evidenceLinks: linkField(formData, "organizationEvidenceLinks"),
        },
      };
    case "videoSubmission":
      return {
        ...common,
        submissionType: "videoSubmission",
        videoSubmissionDetails: {
          submittingIdentityId: textField(formData, "submittingIdentityId"),
          submittingIdentityType: textField(formData, "submittingIdentityId")
            ? "organization"
            : "member",
          videoTitle: optionalTextField(formData, "videoTitle"),
          description: optionalTextField(formData, "videoDescription"),
          category: optionalTextField(formData, "videoCategory"),
          discipline: textField(formData, "videoDiscipline"),
          sourceHost: optionalTextField(formData, "videoSourceHost"),
          originalPublicUrl: optionalTextField(
            formData,
            "videoOriginalPublicUrl",
          ),
          submitterRelationship: optionalTextField(
            formData,
            "videoSubmitterRelationship",
          ),
          creatorName: optionalTextField(formData, "videoCreatorName"),
          creatorProfileUrl: textField(formData, "videoCreatorProfileUrl"),
          featuredAthletes: listField(formData, "videoFeaturedAthletes"),
          featuredTeams: listField(formData, "videoFeaturedTeams"),
          organizationId: textField(formData, "videoOrganizationId"),
          competition: textField(formData, "videoCompetition"),
          eventDate: textField(formData, "videoEventDate"),
          location: textField(formData, "videoLocation"),
          thumbnailReferenceUrl: textField(
            formData,
            "videoThumbnailReferenceUrl",
          ),
          rightsDeclaration: optionalTextField(
            formData,
            "videoRightsDeclaration",
          ),
          ownershipSourceDeclaration: optionalTextField(
            formData,
            "videoOwnershipSourceDeclaration",
          ),
          sourceAccount: textField(formData, "videoSourceAccount"),
          editorialNote: textField(formData, "videoEditorialNote"),
          contentWarnings: listField(formData, "videoContentWarnings"),
        },
      };
    case "mediaPitch":
      return {
        ...common,
        submissionType: "mediaPitch",
        mediaPitchDetails: {
          mediaKind: textField(formData, "mediaKind") || "photo",
          submittingIdentityId: textField(formData, "submittingIdentityId"),
          submittingIdentityType: textField(formData, "submittingIdentityId")
            ? "organization"
            : "member",
          proposedTitle: optionalTextField(formData, "proposedTitle"),
          series: textField(formData, "series"),
          format: optionalTextField(formData, "format"),
          subject: optionalTextField(formData, "subject"),
          location: textField(formData, "location"),
          visualApproach: optionalTextField(formData, "visualApproach"),
          estimatedDuration: textField(formData, "estimatedDuration"),
          sourcePlatform: textField(formData, "sourcePlatform"),
          sourceAccount: textField(formData, "sourceAccount"),
          originalPostUrl: textField(formData, "originalPostUrl"),
          creatorName: textField(formData, "mediaCreatorName"),
          caption: textField(formData, "mediaCaption"),
          altText: textField(formData, "mediaAltText"),
          mediaPermissionStatus: textField(formData, "mediaPermissionStatus"),
          publicReferenceLinks: linkField(formData, "publicReferenceLinks"),
        },
      };
    case "productSubmission":
      return {
        ...common,
        submissionType: "productSubmission",
        productSubmissionDetails: {
          organizationId: optionalTextField(formData, "productOrganizationId"),
          productName: optionalTextField(formData, "productName"),
          category: optionalTextField(formData, "productCategory"),
          productSummary: optionalTextField(formData, "productSummary"),
          standardProductUrl: optionalTextField(formData, "standardProductUrl"),
          affiliateUrl: textField(formData, "affiliateUrl"),
          affiliateRelationship: optionalTextField(
            formData,
            "affiliateRelationship",
          ),
          submitterRelationship: optionalTextField(
            formData,
            "productSubmitterRelationship",
          ),
          commercialDisclosure: optionalTextField(
            formData,
            "commercialDisclosure",
          ),
        },
      };
    case "correctionRequest":
      return {
        ...common,
        submissionType: "correctionRequest",
        correctionRequestDetails: {
          affectedUrl: optionalTextField(formData, "affectedUrl"),
          issueSummary: optionalTextField(formData, "issueSummary"),
          requestedCorrection: optionalTextField(
            formData,
            "requestedCorrection",
          ),
          sourceLinks: linkField(formData, "sourceLinks"),
          relationshipToSubject: textField(formData, "relationshipToSubject"),
        },
      };
    default:
      return common;
  }
}

async function assertSubmissionIdentityAuthorized(
  actor: OperationalActor,
  content: SubmissionDraftInput | SubmissionForReviewInput,
): Promise<void> {
  if (
    content.submissionType !== "videoSubmission" &&
    content.submissionType !== "mediaPitch" &&
    content.submissionType !== "productSubmission"
  ) {
    return;
  }

  const identity =
    content.submissionType === "videoSubmission"
      ? content.videoSubmissionDetails
      : content.submissionType === "mediaPitch"
        ? content.mediaPitchDetails
        : null;
  if (identity?.submittingIdentityType === "member") {
    if (identity.submittingIdentityId) {
      throw new OperationalError(
        "invalid_input",
        "A member submission cannot include another identity ID.",
      );
    }
    return;
  }

  const organizationId =
    content.submissionType === "productSubmission"
      ? content.productSubmissionDetails.organizationId
      : identity?.submittingIdentityId;
  const capability =
    content.submissionType === "productSubmission"
      ? "submit-products"
      : "submit-media";
  if (!organizationId || !actor.principalId) {
    throw new OperationalError(
      "access_denied",
      "A verified organization relationship is required for this submission identity.",
    );
  }

  const repository = await getCommunityApplicationRepository();
  if (!repository.availability.writable) {
    throw new OperationalError(
      "configuration_unavailable",
      "Organization capability records are unavailable. This submission cannot be saved.",
    );
  }
  const member = await repository.getMemberProfileByPrincipalId(
    actor.principalId,
  );
  if (member?.status !== "active") {
    throw new OperationalError(
      "access_denied",
      "An active member profile is required for organization submissions.",
    );
  }
  const authorized = member
    ? await repository.hasOrganizationCapability(
        member.id,
        organizationId,
        capability,
      )
    : false;
  if (!authorized) {
    throw new OperationalError(
      "access_denied",
      "Only an active approved organization representative may submit with this organization identity.",
    );
  }
}

function linksForValidation(
  links: ContributorSubmissionDetail["supportingLinks"],
) {
  return links.map(({ label, url }) => ({ label: label ?? "", url }));
}

function storedSubmissionInput(
  submission: ContributorSubmissionDetail,
  termsAccepted: boolean,
) {
  const common = {
    submissionType: submission.submissionType,
    title: submission.title,
    summary: submission.summary,
    details: submission.details,
    contributorNote: submission.contributorNote,
    supportingLinks: linksForValidation(submission.supportingLinks),
    termsAccepted,
  };

  switch (submission.submissionType) {
    case "storyPitch":
      return {
        ...common,
        submissionType: "storyPitch" as const,
        storyPitchDetails: submission.storyPitchDetails,
      };
    case "athleteNomination":
      return {
        ...common,
        submissionType: "athleteNomination" as const,
        athleteNominationDetails: {
          ...submission.athleteNominationDetails,
          socialLinks: linksForValidation(
            submission.athleteNominationDetails.socialLinks,
          ),
          competitionHistory:
            submission.athleteNominationDetails.competitionHistory.map(
              (entry) => ({
                eventName: entry.eventName,
                organizer: entry.organizer,
                date: entry.date,
                country: entry.country,
                city: entry.city,
                divisionCategory: entry.divisionCategory,
                placement: entry.placement,
                score: entry.score,
                officialResultUrl: entry.officialResultUrl,
                eventUrl: entry.eventUrl,
                videoUrl: entry.videoUrl,
              }),
            ),
          publicReferenceLinks: linksForValidation(
            submission.athleteNominationDetails.publicReferenceLinks,
          ),
        },
      };
    case "competitionListing":
      return {
        ...common,
        submissionType: "competitionListing" as const,
        competitionListingDetails: {
          ...submission.competitionListingDetails,
          publicReferenceLinks: linksForValidation(
            submission.competitionListingDetails.publicReferenceLinks,
          ),
        },
      };
    case "teamApplication":
      return {
        ...common,
        submissionType: "teamApplication" as const,
        teamApplicationDetails: {
          ...submission.teamApplicationDetails,
          socialLinks: linksForValidation(
            submission.teamApplicationDetails.socialLinks,
          ),
          proposedRoster: submission.teamApplicationDetails.proposedRoster.map(
            (entry) => ({
              name: entry.name,
              privateEmail: entry.privateEmail,
              privatePhone: entry.privatePhone,
              existingProfileSlug: entry.existingProfileSlug,
              relationshipToTeam: entry.relationshipToTeam,
              role: entry.role,
              rosterStatus: entry.rosterStatus,
              specialty: entry.specialty,
              consentStatus: entry.consentStatus,
            }),
          ),
        },
      };
    case "organizationClaim":
      return {
        ...common,
        submissionType: "organizationClaim" as const,
        organizationClaimDetails: {
          ...submission.organizationClaimDetails,
          evidenceLinks: linksForValidation(
            submission.organizationClaimDetails.evidenceLinks,
          ),
        },
      };
    case "videoSubmission":
      return {
        ...common,
        submissionType: "videoSubmission" as const,
        videoSubmissionDetails: submission.videoSubmissionDetails,
      };
    case "mediaPitch":
      return {
        ...common,
        submissionType: "mediaPitch" as const,
        mediaPitchDetails: {
          ...submission.mediaPitchDetails,
          publicReferenceLinks: linksForValidation(
            submission.mediaPitchDetails.publicReferenceLinks,
          ),
        },
      };
    case "productSubmission":
      return {
        ...common,
        submissionType: "productSubmission" as const,
        productSubmissionDetails: submission.productSubmissionDetails,
      };
    case "correctionRequest":
      return {
        ...common,
        submissionType: "correctionRequest" as const,
        correctionRequestDetails: {
          ...submission.correctionRequestDetails,
          sourceLinks: linksForValidation(
            submission.correctionRequestDetails.sourceLinks,
          ),
        },
      };
  }
}

function validationFailure(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string[]> = {};
  let formError: string | undefined;

  for (const issue of error.issues) {
    const field = issue.path.join(".");

    if (!field) {
      formError ??= issue.message;
      continue;
    }

    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return {
    success: false,
    message: "Review the highlighted fields and try again.",
    fieldErrors,
    formError,
  };
}

function safeFailure(error: unknown): ActionResult {
  if (isOperationalError(error)) {
    return {
      success: false,
      message: error.message,
      formError: error.message,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  ) {
    return {
      success: false,
      message:
        "This record changed while the action was running. Refresh and try again.",
      formError:
        "This record changed while the action was running. Refresh and try again.",
    };
  }

  safeLog({
    severity: "error",
    event: "operations.mutation_failed",
    routeCategory: "operations",
    errorCategory: "operation_error",
  });

  return {
    success: false,
    message: "The change could not be saved. Please try again.",
    formError: "The change could not be saved. Please try again.",
  };
}

async function currentActor(
  minimumRole: MinimumRole,
): Promise<OperationalActor> {
  const user = await getCurrentUser();

  if (!user) {
    throw new OperationalError(
      "authentication_required",
      "Sign in before making this change.",
    );
  }

  const profile = await getOwnContributorProfile(user.id);

  if (!profile) {
    throw new OperationalError(
      "configuration_unavailable",
      "Your contributor profile is not available. Account changes cannot be saved yet.",
    );
  }

  const bootstrapRole = getBootstrapRole(user.email);
  const effectiveRole = bootstrapRole
    ? higherRole(profile.role, bootstrapRole)
    : profile.role;
  const actor: OperationalActor = {
    id: profile.id,
    principalId: user.id,
    displayName: profile.displayName,
    normalizedEmail: profile.normalizedEmail,
    role: effectiveRole,
    accessStatus: profile.accessStatus,
  };

  if (!hasRole(actor.role, minimumRole)) {
    throw new OperationalError(
      "access_denied",
      minimumRole === "admin"
        ? "Administrator access is required for this action."
        : "Editor access is required for this action.",
    );
  }

  return actor;
}

function requireTarget(
  target: Awaited<ReturnType<typeof getSubmissionMutationTarget>>,
) {
  if (!target) {
    throw new OperationalError("not_found", "Submission not found.");
  }
  return target;
}

function revalidateContributorSubmission(
  contributorId: string,
  submissionId: string,
) {
  revalidatePath("/account");
  revalidatePath("/account/submissions");
  revalidatePath(`/account/submissions/${submissionId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/contributors");
  revalidatePath(`/admin/contributors/${contributorId}`);
}

function revalidatePrivateSubmissionChange(submissionId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/audit");
}

function revalidateContributorRecord(contributorId: string) {
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/access");
  revalidatePath("/admin");
  revalidatePath("/admin/contributors");
  revalidatePath(`/admin/contributors/${contributorId}`);
  revalidatePath("/admin/audit");
}

function revalidatePrivateContributorChange(contributorId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/contributors");
  revalidatePath(`/admin/contributors/${contributorId}`);
  revalidatePath("/admin/audit");
}

async function effectiveContributorRole(
  contributor: AdminContributorDetail,
): Promise<ContributorRole> {
  const bootstrapRole = getBootstrapRole(contributor.normalizedEmail);
  return bootstrapRole
    ? higherRole(contributor.role, bootstrapRole)
    : contributor.role;
}

async function assertAdminRemovalIsSafe(
  contributor: AdminContributorDetail,
  removesEffectiveAdmin: boolean,
): Promise<OperationalLockGuard | undefined> {
  if (!removesEffectiveAdmin) {
    return undefined;
  }

  if (isBootstrapAdmin(contributor.normalizedEmail)) {
    throw new OperationalError(
      "access_denied",
      "A bootstrap administrator cannot be demoted, suspended, or archived here.",
    );
  }

  const guard = await getAdministratorMutationGuard();
  const otherBootstrapAdminEmails = [...getBootstrapAdminEmails()].filter(
    (email) => email !== contributor.normalizedEmail,
  );
  const otherEffectiveAdministratorCount =
    await countOtherEffectiveAdministrators({
      contributorId: contributor.id,
      bootstrapAdminEmails: otherBootstrapAdminEmails,
    });

  if (
    wouldRemoveFinalAdministrator({
      targetIsEffectiveAdministrator: true,
      otherEffectiveAdministratorCount,
    })
  ) {
    throw new OperationalError(
      "access_denied",
      "Another effective administrator must remain active before removing this administrator's access.",
    );
  }

  return guard;
}

export async function updateContributorProfileAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertProfileMutationAccess(actor);
    const parsed = contributorProfileUpdateSchema.safeParse({
      displayName: textField(formData, "displayName"),
      biography: textField(formData, "biography"),
      location: textField(formData, "location"),
      areasOfInterest: listField(formData, "areasOfInterest"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const outcome = await updateContributorProfileRecord(actor, parsed.data);
    revalidateContributorRecord(actor.id);
    return {
      success: true,
      message:
        outcome === "updated"
          ? "Profile updated."
          : "Profile is already up to date.",
      recordId: actor.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertContributorMutationAccess(actor);
    const intent = textField(formData, "intent");
    assertSubmissionFeatureEnabled(textField(formData, "submissionType"));
    const parsedIdempotencyKey = submissionIdempotencyKeySchema.safeParse(
      textField(formData, "idempotencyKey"),
    );

    if (intent !== "saveDraft" && intent !== "submit") {
      throw new OperationalError(
        "invalid_input",
        "Choose whether to save a draft or submit it for review.",
      );
    }

    if (!parsedIdempotencyKey.success) {
      return validationFailure(parsedIdempotencyKey.error);
    }

    const submitImmediately = intent === "submit";
    const schema = submitImmediately
      ? submissionForReviewSchema
      : submissionDraftSchema;
    const parsed = schema.safeParse(
      rawSubmissionInput(formData, submitImmediately),
    );

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    await assertSubmissionIdentityAuthorized(actor, parsed.data);

    const created = await createSubmissionRecord({
      actor,
      content: parsed.data,
      submitImmediately,
      idempotencyKey: parsedIdempotencyKey.data,
    });
    revalidateContributorSubmission(actor.id, created.id);
    return {
      success: true,
      message:
        created.status === "draft"
          ? "Draft saved."
          : created.status === "submitted"
            ? "Submission sent for editorial review."
            : "Existing submission opened.",
      redirectTo: `/account/submissions/${created.id}`,
      recordId: created.id,
      submissionNumber: created.submissionNumber,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertContributorMutationAccess(actor);
    const parsedOperationKey = mutationOperationKeySchema.safeParse(
      textField(formData, "operationKey"),
    );

    if (!parsedOperationKey.success) {
      return validationFailure(parsedOperationKey.error);
    }

    const submissionId = textField(formData, "submissionId");
    const target = requireTarget(
      await getSubmissionMutationTarget(submissionId),
    );
    assertSubmissionFeatureEnabled(target.submissionType);
    assertSubmissionOwner(actor, target.submitterId);
    assertCanEditSubmission(actor, target.submitterId, target.status);
    const parsed = submissionDraftSchema.safeParse(
      rawSubmissionInput(formData, false),
    );

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    if (parsed.data.submissionType !== target.submissionType) {
      throw new OperationalError(
        "invalid_input",
        "A submission type cannot be changed after the draft is created.",
      );
    }

    await assertSubmissionIdentityAuthorized(actor, parsed.data);

    const outcome = await updateSubmissionRecord({
      actor,
      target,
      content: parsed.data,
      operationKey: parsedOperationKey.data,
    });
    revalidateContributorSubmission(actor.id, target.id);
    return {
      success: true,
      message:
        outcome === "replayed"
          ? "These draft changes were already saved."
          : "Draft changes saved.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

async function validateStoredSubmissionForReview(input: {
  actor: OperationalActor;
  submissionId: string;
  termsAccepted: boolean;
}): Promise<ActionResult | null> {
  const submission = await getSubmissionForContributor(
    input.submissionId,
    input.actor.id,
  );

  if (!submission) {
    throw new OperationalError("not_found", "Submission not found.");
  }

  assertSubmissionFeatureEnabled(submission.submissionType);

  const parsed = submissionForReviewSchema.safeParse(
    storedSubmissionInput(submission, input.termsAccepted),
  );

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  await assertSubmissionIdentityAuthorized(input.actor, parsed.data);

  return null;
}

export async function submitSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertContributorMutationAccess(actor);
    const submissionId = textField(formData, "submissionId");
    const target = requireTarget(
      await getSubmissionMutationTarget(submissionId),
    );
    assertSubmissionOwner(actor, target.submitterId);

    if (target.status !== "draft") {
      throw new OperationalError(
        "invalid_transition",
        "Only a draft can be submitted for review.",
      );
    }

    const validationError = await validateStoredSubmissionForReview({
      actor,
      submissionId,
      termsAccepted: booleanField(formData, "termsAccepted"),
    });

    if (validationError) {
      return validationError;
    }

    const claimDetail = target.submissionType === "athleteNomination"
      ? await getSubmissionForContributor(target.id, actor.id)
      : null;
    if (
      claimDetail?.submissionType === "athleteNomination" &&
      claimDetail.athleteNominationDetails.requestKind === "claim"
    ) {
      const runtime = await getCommunityRuntime();
      const member = runtime.repository.availability.writable
        ? await runtime.repository.getMemberProfileByPrincipalId(actor.id)
        : null;
      await enforceCommunityRateLimit({ limiter: runtime.rateLimiter, operation: "claim", memberId: member?.id ?? actor.id });
    }

    await transitionSubmissionRecord({
      actor,
      workflowActor: "contributor",
      target,
      nextStatus: "submitted",
      acceptTerms: true,
    });
    if (
      claimDetail?.submissionType === "athleteNomination" &&
      claimDetail.athleteNominationDetails.requestKind === "claim"
    ) {
      try {
        const slug = claimDetail.athleteNominationDetails.existingAthleteSlug;
        const canonicalAthlete = slug ? (await getAthletePage(slug, { stega: false }))?.athlete : null;
        await (await getCommunityApplicationRepository()).recordAthleteClaimAudit({
          eventType: "athleteClaimSubmitted",
          actorPrincipalId: actor.id,
          claimantPrincipalId: actor.id,
          submissionId: target.id,
          canonicalAthleteId: canonicalAthlete?.canonicalId,
        });
      } catch {
        safeLog({ severity: "error", event: "operations.mutation_failed", routeCategory: "operations", errorCategory: "community_error" });
      }
    }
    revalidateContributorSubmission(actor.id, target.id);
    return {
      success: true,
      message: "Submission sent for editorial review.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function withdrawSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertContributorMutationAccess(actor);
    const target = requireTarget(
      await getSubmissionMutationTarget(textField(formData, "submissionId")),
    );
    assertSubmissionOwner(actor, target.submitterId);
    assertCanWithdrawSubmission(actor, target.submitterId, target.status);
    await transitionSubmissionRecord({
      actor,
      workflowActor: "contributor",
      target,
      nextStatus: "withdrawn",
    });
    revalidateContributorSubmission(actor.id, target.id);
    return {
      success: true,
      message: "Submission withdrawn.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function resubmitSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("contributor");
    assertContributorMutationAccess(actor);
    const submissionId = textField(formData, "submissionId");
    const target = requireTarget(
      await getSubmissionMutationTarget(submissionId),
    );
    assertSubmissionOwner(actor, target.submitterId);

    if (target.status !== "revisionRequested") {
      throw new OperationalError(
        "invalid_transition",
        "Only a requested revision can be resubmitted.",
      );
    }

    const validationError = await validateStoredSubmissionForReview({
      actor,
      submissionId,
      termsAccepted: booleanField(formData, "termsAccepted"),
    });

    if (validationError) {
      return validationError;
    }

    await transitionSubmissionRecord({
      actor,
      workflowActor: "contributor",
      target,
      nextStatus: "submitted",
      acceptTerms: true,
    });
    revalidateContributorSubmission(actor.id, target.id);
    return {
      success: true,
      message: "Revision resubmitted for review.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function startReviewAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = reviewActionSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const target = requireTarget(
      await getSubmissionMutationTarget(parsed.data.submissionId),
    );
    await transitionSubmissionRecord({
      actor,
      workflowActor: actor.role,
      target,
      nextStatus: "inReview",
    });
    revalidateContributorSubmission(target.submitterId, target.id);
    return {
      success: true,
      message: "Editorial review started.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function assignReviewerAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = assignmentSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      reviewerId: textField(formData, "reviewerId"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const [target, reviewers] = await Promise.all([
      getSubmissionMutationTarget(parsed.data.submissionId),
      getAssignableReviewers(),
    ]);
    const resolvedTarget = requireTarget(target);
    const reviewer = reviewers.find(
      (candidate) => candidate.id === parsed.data.reviewerId,
    );

    if (
      !reviewer ||
      reviewer.accessStatus !== "active" ||
      !hasRole(reviewer.role, "editor")
    ) {
      throw new OperationalError(
        "invalid_input",
        "Choose an active editor or administrator as reviewer.",
      );
    }

    if (resolvedTarget.assignedReviewerId === reviewer.id) {
      return {
        success: true,
        message: "This reviewer is already assigned.",
        recordId: resolvedTarget.id,
      };
    }

    if (
      !["submitted", "inReview", "revisionRequested"].includes(
        resolvedTarget.status,
      )
    ) {
      throw new OperationalError(
        "invalid_transition",
        "A reviewer can be assigned only after submission for review.",
      );
    }

    await assignSubmissionReviewerRecord({
      actor,
      target: resolvedTarget,
      reviewerId: reviewer.id,
    });
    revalidateContributorSubmission(
      resolvedTarget.submitterId,
      resolvedTarget.id,
    );
    return {
      success: true,
      message: "Reviewer assigned.",
      recordId: resolvedTarget.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

async function transitionAfterReview(input: {
  actor: OperationalActor;
  submissionId: string;
  nextStatus: Extract<
    SubmissionStatus,
    "revisionRequested" | "approved" | "rejected"
  >;
  visibleFeedback?: string;
}): Promise<ActionResult> {
  const target = requireTarget(
    await getSubmissionMutationTarget(input.submissionId),
  );
  const claimDetail = target.submissionType === "athleteNomination"
    ? await getSubmissionForReview(target.id)
    : null;
  await transitionSubmissionRecord({
    actor: input.actor,
    workflowActor: input.actor.role,
    target,
    nextStatus: input.nextStatus,
    visibleFeedback: input.visibleFeedback,
  });
  try {
    await (await getCommunityApplicationRepository()).notifySubmissionStatus({
      contributorPrincipalId: target.submitterId,
      submissionId: target.id,
      status: input.nextStatus,
      operationKey: `${target.id}:${target.revisionNumber + 1}`,
    });
  } catch {
    safeLog({ severity: "error", event: "operations.mutation_failed", routeCategory: "operations", errorCategory: "community_error" });
  }
  if (
    claimDetail?.submissionType === "athleteNomination" &&
    claimDetail.athleteNominationDetails.requestKind === "claim" &&
    (input.nextStatus === "approved" || input.nextStatus === "rejected")
  ) {
    try {
      const slug = claimDetail.athleteNominationDetails.existingAthleteSlug;
      const canonicalAthlete = slug ? (await getAthletePage(slug, { stega: false }))?.athlete : null;
      await (await getCommunityApplicationRepository()).recordAthleteClaimAudit({
        eventType: input.nextStatus === "approved" ? "athleteClaimApproved" : "athleteClaimRejected",
        actorPrincipalId: input.actor.id,
        claimantPrincipalId: target.submitterId,
        submissionId: target.id,
        canonicalAthleteId: canonicalAthlete?.canonicalId,
      });
    } catch {
      safeLog({ severity: "error", event: "operations.mutation_failed", routeCategory: "operations", errorCategory: "community_error" });
    }
  }
  revalidateContributorSubmission(target.submitterId, target.id);
  return {
    success: true,
    message:
      input.nextStatus === "approved"
        ? "Approved for editorial development. No content was published."
        : input.nextStatus === "revisionRequested"
          ? "Revision requested."
          : "Submission rejected.",
    recordId: target.id,
  };
}

export async function requestRevisionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = revisionRequestSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      feedback: textField(formData, "feedback"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    return await transitionAfterReview({
      actor,
      submissionId: parsed.data.submissionId,
      nextStatus: "revisionRequested",
      visibleFeedback: parsed.data.feedback,
    });
  } catch (error) {
    return safeFailure(error);
  }
}

export async function approveSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = reviewActionSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    return await transitionAfterReview({
      actor,
      submissionId: parsed.data.submissionId,
      nextStatus: "approved",
    });
  } catch (error) {
    return safeFailure(error);
  }
}

export async function grantOrganizationClaimAccessAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("admin");
    assertCanAdministerContributors(actor);
    const parsed = reviewActionSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
    });
    if (!parsed.success) return validationFailure(parsed.error);

    const submission = await getSubmissionForReview(parsed.data.submissionId);
    if (
      !submission ||
      submission.status !== "approved" ||
      submission.submissionType !== "organizationClaim" ||
      submission.organizationClaimDetails.requestKind !== "claim" ||
      !submission.organizationClaimDetails.existingOrganizationId
    ) {
      throw new OperationalError(
        "invalid_transition",
        "Only an approved claim for an existing organization can grant access.",
      );
    }
    const capabilities = z
      .array(z.enum(ORGANIZATION_CAPABILITIES))
      .min(1)
      .parse(submission.organizationClaimDetails.requestedCapabilities);
    if (!actor.principalId) {
      throw new OperationalError(
        "access_denied",
        "A stable administrator identity is required.",
      );
    }
    const repository = await getCommunityApplicationRepository();
    if (!repository.availability.writable) {
      throw new OperationalError(
        "configuration_unavailable",
        "Organization capability records are temporarily unavailable.",
      );
    }
    const member = await repository.getMemberProfileByPrincipalId(
      submission.submitter.id,
    );
    if (!member || member.status !== "active") {
      throw new OperationalError(
        "access_denied",
        "The claimant needs an active member profile before access can be granted.",
      );
    }
    const granted = await repository.grantOrganizationMembership({
      memberPrincipalId: submission.submitter.id,
      organizationId:
        submission.organizationClaimDetails.existingOrganizationId,
      capabilities,
      reviewedByPrincipalId: actor.principalId,
    });
    if (!granted) {
      throw new OperationalError(
        "configuration_unavailable",
        "The reviewed organization capabilities could not be persisted.",
      );
    }
    revalidateContributorSubmission(submission.submitter.id, submission.id);
    return {
      success: true,
      message: "Reviewed organization capabilities granted.",
      recordId: submission.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function grantAthleteClaimAccessAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("admin");
    assertCanAdministerContributors(actor);
    const parsed = reviewActionSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
    });
    if (!parsed.success) return validationFailure(parsed.error);

    const submission = await getSubmissionForReview(parsed.data.submissionId);
    if (
      !submission ||
      submission.status !== "approved" ||
      submission.submissionType !== "athleteNomination" ||
      submission.athleteNominationDetails.requestKind !== "claim" ||
      !submission.athleteNominationDetails.existingAthleteSlug
    ) {
      throw new OperationalError(
        "invalid_transition",
        "Only an approved claim for an existing athlete can grant access.",
      );
    }
    if (!actor.principalId) {
      throw new OperationalError(
        "access_denied",
        "A stable administrator identity is required.",
      );
    }
    const athletePage = await getAthletePage(
      submission.athleteNominationDetails.existingAthleteSlug,
      { publishedOnly: true, stega: false },
    );
    if (
      !athletePage ||
      athletePage.athlete.slug !==
        submission.athleteNominationDetails.existingAthleteSlug
    ) {
      throw new OperationalError(
        "invalid_transition",
        "The approved claim must resolve to an existing public canonical athlete.",
      );
    }
    const athlete = athletePage.athlete;
    const repository = await getCommunityApplicationRepository();
    if (!repository.availability.writable) {
      throw new OperationalError(
        "configuration_unavailable",
        "Athlete control records are temporarily unavailable.",
      );
    }
    const granted = await repository.grantAthleteProfileControl({
      memberPrincipalId: submission.submitter.id,
      athleteId: athlete.canonicalId,
      submissionId: submission.id,
      reviewedByPrincipalId: actor.principalId,
    });
    if (!granted) {
      throw new OperationalError(
        "configuration_unavailable",
        "The reviewed athlete control could not be persisted.",
      );
    }
    revalidateContributorSubmission(submission.submitter.id, submission.id);
    revalidatePath(`/athletes/${athlete.slug}`);
    revalidatePath("/members", "layout");
    return {
      success: true,
      message: "Reviewed athlete profile control granted.",
      recordId: submission.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function rejectSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = rejectionSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      feedback: textField(formData, "feedback"),
      confirmation: textField(formData, "confirmation"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    return await transitionAfterReview({
      actor,
      submissionId: parsed.data.submissionId,
      nextStatus: "rejected",
      visibleFeedback: parsed.data.feedback,
    });
  } catch (error) {
    return safeFailure(error);
  }
}

export async function archiveSubmissionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = archiveSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      confirmation: textField(formData, "confirmation"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const target = requireTarget(
      await getSubmissionMutationTarget(parsed.data.submissionId),
    );

    if (!["approved", "rejected"].includes(target.status)) {
      throw new OperationalError(
        "invalid_transition",
        "Only an approved or rejected submission can be archived.",
      );
    }

    await transitionSubmissionRecord({
      actor,
      workflowActor: actor.role,
      target,
      nextStatus: "archived",
    });
    revalidateContributorSubmission(target.submitterId, target.id);
    return {
      success: true,
      message: "Submission archived.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function addPrivateNoteAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = privateNoteSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      operationKey: textField(formData, "operationKey"),
      note: textField(formData, "note"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const target = requireTarget(
      await getSubmissionMutationTarget(parsed.data.submissionId),
    );
    const outcome = await addPrivateEditorialNoteRecord({
      actor,
      target,
      note: parsed.data.note,
      operationKey: parsed.data.operationKey,
    });
    revalidatePrivateSubmissionChange(target.id);
    return {
      success: true,
      message:
        outcome === "replayed"
          ? "This private editorial note was already added."
          : "Private editorial note added.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateVisibleFeedbackAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = visibleFeedbackSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      feedback: textField(formData, "feedback"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const target = requireTarget(
      await getSubmissionMutationTarget(parsed.data.submissionId),
    );

    if (
      ![
        "submitted",
        "inReview",
        "revisionRequested",
        "approved",
        "rejected",
      ].includes(target.status)
    ) {
      throw new OperationalError(
        "invalid_transition",
        "Contributor feedback cannot be changed in this status.",
      );
    }

    if (target.contributorVisibleFeedback === parsed.data.feedback) {
      return {
        success: true,
        message: "Contributor-visible feedback is already up to date.",
        recordId: target.id,
      };
    }

    await updateVisibleFeedbackRecord({
      actor,
      target,
      feedback: parsed.data.feedback,
    });
    revalidateContributorSubmission(target.submitterId, target.id);
    return {
      success: true,
      message: "Contributor-visible feedback updated.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updatePriorityAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("editor");
    assertCanReviewSubmission(actor);
    const parsed = priorityUpdateSchema.safeParse({
      submissionId: textField(formData, "submissionId"),
      priority: textField(formData, "priority"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const target = requireTarget(
      await getSubmissionMutationTarget(parsed.data.submissionId),
    );

    if (target.priority === parsed.data.priority) {
      return {
        success: true,
        message: "Internal priority is already up to date.",
        recordId: target.id,
      };
    }

    if (
      ![
        "submitted",
        "inReview",
        "revisionRequested",
        "approved",
        "rejected",
      ].includes(target.status)
    ) {
      throw new OperationalError(
        "invalid_transition",
        "Priority is unavailable in this submission status.",
      );
    }

    await updateSubmissionPriorityRecord({
      actor,
      target,
      priority: parsed.data.priority,
    });
    revalidatePrivateSubmissionChange(target.id);
    return {
      success: true,
      message: "Internal priority updated.",
      recordId: target.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateContributorRoleAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("admin");
    assertCanAdministerContributors(actor);
    const parsed = contributorRoleSchema.safeParse({
      contributorId: textField(formData, "contributorId"),
      role: textField(formData, "role"),
      confirmation: textField(formData, "confirmation"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const contributor = await getContributorForAdmin(parsed.data.contributorId);

    if (!contributor) {
      throw new OperationalError("not_found", "Contributor not found.");
    }

    const currentEffectiveRole = await effectiveContributorRole(contributor);
    const elevatedChange =
      parsed.data.role === "admin" || currentEffectiveRole === "admin";

    if (elevatedChange && parsed.data.confirmation !== "confirm") {
      throw new OperationalError(
        "invalid_input",
        "Confirm this administrator role change before continuing.",
      );
    }

    if (contributor.role === parsed.data.role) {
      return {
        success: true,
        message: "Contributor role is already up to date.",
        recordId: contributor.id,
      };
    }

    const administratorGuard = await assertAdminRemovalIsSafe(
      contributor,
      contributor.accessStatus === "active" &&
        currentEffectiveRole === "admin" &&
        parsed.data.role !== "admin",
    );
    await updateContributorRoleRecord({
      actor,
      contributor,
      role: parsed.data.role,
      administratorGuard,
    });
    revalidateContributorRecord(contributor.id);
    return {
      success: true,
      message: "Contributor role updated.",
      recordId: contributor.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateContributorAccessAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("admin");
    assertCanAdministerContributors(actor);
    const parsed = contributorAccessSchema.safeParse({
      contributorId: textField(formData, "contributorId"),
      accessStatus: textField(formData, "accessStatus"),
      confirmation: textField(formData, "confirmation"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const contributor = await getContributorForAdmin(parsed.data.contributorId);

    if (!contributor) {
      throw new OperationalError("not_found", "Contributor not found.");
    }

    if (
      ["suspended", "archived"].includes(parsed.data.accessStatus) &&
      parsed.data.confirmation !== "confirm"
    ) {
      throw new OperationalError(
        "invalid_input",
        "Confirm this contributor access change before continuing.",
      );
    }

    if (contributor.accessStatus === parsed.data.accessStatus) {
      return {
        success: true,
        message: "Contributor access is already up to date.",
        recordId: contributor.id,
      };
    }

    if (
      parsed.data.accessStatus === "archived" &&
      (await countActiveContributorSubmissions(contributor.id)) > 0
    ) {
      throw new OperationalError(
        "invalid_transition",
        "Resolve or withdraw active submissions before archiving this contributor.",
      );
    }

    const effectiveRole = await effectiveContributorRole(contributor);
    const administratorGuard = await assertAdminRemovalIsSafe(
      contributor,
      contributor.accessStatus === "active" &&
        effectiveRole === "admin" &&
        parsed.data.accessStatus !== "active",
    );
    await updateContributorAccessRecord({
      actor,
      contributor,
      accessStatus: parsed.data.accessStatus,
      administratorGuard,
    });
    revalidateContributorRecord(contributor.id);
    return {
      success: true,
      message: "Contributor access updated.",
      recordId: contributor.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateContributorInternalNotesAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await currentActor("admin");
    assertCanAdministerContributors(actor);
    const parsed = contributorInternalNotesSchema.safeParse({
      contributorId: textField(formData, "contributorId"),
      internalNotes: textField(formData, "internalNotes"),
    });

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const contributor = await getContributorForAdmin(parsed.data.contributorId);

    if (!contributor) {
      throw new OperationalError("not_found", "Contributor not found.");
    }

    if (contributor.internalNotes === parsed.data.internalNotes) {
      return {
        success: true,
        message: "Private contributor notes are already up to date.",
        recordId: contributor.id,
      };
    }

    await updateContributorInternalNotesRecord({
      actor,
      contributor,
      internalNotes: parsed.data.internalNotes,
    });
    revalidatePrivateContributorChange(contributor.id);
    return {
      success: true,
      message: "Private contributor notes updated.",
      recordId: contributor.id,
    };
  } catch (error) {
    return safeFailure(error);
  }
}
