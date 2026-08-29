import { z } from "zod";

import {
  athleteCompetitionCategoryValues,
  athleteSpecialtyValues,
} from "@/lib/athlete-taxonomy";
import { countries } from "@/lib/geography";
import {
  ACCESS_STATUSES,
  CONTRIBUTOR_ROLES,
  SUBMISSION_PRIORITIES,
  SUBMISSION_TYPES,
} from "@/lib/operations/types";

const FIELD_LIMITS = {
  short: 120,
  displayName: 80,
  title: 140,
  summary: 500,
  details: 8_000,
  biography: 1_000,
  contributorNote: 2_000,
  feedback: 4_000,
  privateNote: 6_000,
  internalNotes: 6_000,
  url: 2_048,
} as const;

const trimmedOptionalString = (maximum: number) =>
  z.string().trim().max(maximum).default("");

const boundedList = (
  maximumItems: number,
  itemMaximum: number = FIELD_LIMITS.short,
) =>
  z
    .array(z.string().trim().min(1).max(itemMaximum))
    .max(maximumItems)
    .default([]);

export const operationalDocumentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "The requested record identifier is invalid.",
  );

export const submissionIdempotencyKeySchema = z
  .string()
  .trim()
  .uuid("This submission form has expired. Reload the page and try again.");

export const mutationOperationKeySchema = z
  .string()
  .trim()
  .uuid("This form has expired. Reload the page and try again.");

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a URL.")
  .max(FIELD_LIMITS.url, "The URL is too long.")
  .url("Enter a complete URL beginning with http:// or https://.")
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http:// and https:// links are allowed." },
  )
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    },
    {
      message: "Links containing embedded credentials are not allowed.",
    },
  );

export function getSafeUrlDomain(value: string): string {
  const parsed = safeHttpUrlSchema.parse(value);
  return new URL(parsed).hostname.toLowerCase();
}

export const supportingLinkSchema = z
  .object({
    label: trimmedOptionalString(100),
    url: safeHttpUrlSchema,
  })
  .strict();

const supportingLinksSchema = z
  .array(supportingLinkSchema)
  .max(8, "Add no more than 8 links.")
  .superRefine((links, context) => {
    const normalizedUrls = links.map((link) => link.url.toLowerCase());

    if (new Set(normalizedUrls).size !== normalizedUrls.length) {
      context.addIssue({
        code: "custom",
        message: "Each supporting URL may be listed only once.",
      });
    }
  })
  .default([]);

const optionalSafeHttpUrlSchema = safeHttpUrlSchema
  .or(z.literal(""))
  .default("");

const knownCountrySchema = z
  .string()
  .trim()
  .min(2, "Select a country.")
  .max(FIELD_LIMITS.short)
  .refine(
    (value) => countries.some((country) => country.name === value),
    "Select a country from the list.",
  );

export const contributorProfileUpdateSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must contain at least 2 characters.")
      .max(
        FIELD_LIMITS.displayName,
        `Display name must contain at most ${FIELD_LIMITS.displayName} characters.`,
      ),
    biography: trimmedOptionalString(FIELD_LIMITS.biography),
    location: trimmedOptionalString(FIELD_LIMITS.short),
    areasOfInterest: boundedList(8, 80),
  })
  .strict();

const fullSubmissionCommonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must contain at least 5 characters.")
      .max(FIELD_LIMITS.title),
    summary: z
      .string()
      .trim()
      .min(20, "Summary must contain at least 20 characters.")
      .max(FIELD_LIMITS.summary),
    details: z
      .string()
      .trim()
      .min(50, "Details must contain at least 50 characters.")
      .max(FIELD_LIMITS.details),
    contributorNote: trimmedOptionalString(FIELD_LIMITS.contributorNote),
    supportingLinks: supportingLinksSchema,
    termsAccepted: z.literal(true, {
      error: "Acknowledge the submission terms before submitting.",
    }),
  })
  .strict();

const draftSubmissionCommonShape = {
  title: z
    .string()
    .trim()
    .min(5, "Add a working title of at least 5 characters.")
    .max(FIELD_LIMITS.title),
  summary: trimmedOptionalString(FIELD_LIMITS.summary),
  details: trimmedOptionalString(FIELD_LIMITS.details),
  contributorNote: trimmedOptionalString(FIELD_LIMITS.contributorNote),
  supportingLinks: supportingLinksSchema,
} as const;

export const storyPitchDetailsSchema = z
  .object({
    proposedHeadline: z.string().trim().min(5).max(FIELD_LIMITS.title),
    section: z.string().trim().min(2).max(80),
    pitchSummary: z.string().trim().min(20).max(2_000),
    reportingApproach: z.string().trim().min(20).max(3_000),
    relevantPeople: boundedList(8, 100),
    relevantLocations: boundedList(8),
    estimatedLength: trimmedOptionalString(80),
    conflictDisclosure: trimmedOptionalString(1_000),
  })
  .strict();

const athleteCompetitionHistoryEntrySchema = z
  .object({
    eventName: z.string().trim().min(2).max(FIELD_LIMITS.title),
    organizer: trimmedOptionalString(FIELD_LIMITS.short),
    date: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Enter an event date in YYYY-MM-DD format.",
      ),
    country: knownCountrySchema,
    city: trimmedOptionalString(FIELD_LIMITS.short),
    divisionCategory: z.string().trim().min(2).max(FIELD_LIMITS.short),
    placement: trimmedOptionalString(80),
    score: trimmedOptionalString(120),
    officialResultUrl: optionalSafeHttpUrlSchema,
    eventUrl: optionalSafeHttpUrlSchema,
    videoUrl: optionalSafeHttpUrlSchema,
  })
  .strict();

const athleteNominationDetailsObjectSchema = z
  .object({
    requestKind: z.enum(["create", "claim"]).default("create"),
    existingAthleteSlug: z
      .string()
      .trim()
      .max(120)
      .regex(
        /^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Enter a valid existing athlete profile slug.",
      )
      .default(""),
    athleteName: z.string().trim().min(2).max(FIELD_LIMITS.short),
    displayName: trimmedOptionalString(FIELD_LIMITS.short),
    country: knownCountrySchema,
    administrativeArea: trimmedOptionalString(FIELD_LIMITS.short),
    city: trimmedOptionalString(FIELD_LIMITS.short),
    biography: trimmedOptionalString(3_000),
    primaryCategory: z.enum(athleteCompetitionCategoryValues),
    specialties: z
      .array(z.enum(athleteSpecialtyValues))
      .max(athleteSpecialtyValues.length)
      .default([]),
    yearsActive: trimmedOptionalString(80),
    profileImageUrl: optionalSafeHttpUrlSchema,
    coverImageUrl: optionalSafeHttpUrlSchema,
    socialLinks: supportingLinksSchema,
    competitionHistory: z
      .array(athleteCompetitionHistoryEntrySchema)
      .max(12)
      .default([]),
    discipline: trimmedOptionalString(FIELD_LIMITS.short),
    nominationReason: z.string().trim().min(20).max(3_000),
    publicReferenceLinks: supportingLinksSchema,
    relationshipToAthlete: trimmedOptionalString(160),
    permissionStatus: z
      .enum([
        "notRequested",
        "requested",
        "confirmed",
        "notApplicable",
        "unknown",
      ])
      .or(z.literal(""))
      .default(""),
  })
  .strict();

export const athleteNominationDetailsSchema =
  athleteNominationDetailsObjectSchema.superRefine((value, context) => {
    if (value.requestKind === "claim" && !value.existingAthleteSlug) {
      context.addIssue({
        code: "custom",
        path: ["existingAthleteSlug"],
        message: "Identify the existing athlete profile being claimed.",
      });
    }
  });

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value)
  );
}

const optionalCalendarDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isCalendarDate(value),
    "Enter a valid date in YYYY-MM-DD format.",
  )
  .default("");

export const competitionListingDetailsSchema = z
  .object({
    eventName: z.string().trim().min(2).max(FIELD_LIMITS.title),
    city: z.string().trim().min(2).max(FIELD_LIMITS.short),
    proposedDate: optionalCalendarDateSchema,
    format: z.string().trim().min(2).max(FIELD_LIMITS.short),
    divisions: boundedList(12, 80),
    organizerRelationship: trimmedOptionalString(160),
    publicReferenceLinks: supportingLinksSchema,
    scheduleStatus: z
      .enum(["unconfirmed", "provisional", "confirmed"])
      .or(z.literal(""))
      .default(""),
  })
  .strict();

const teamApplicationRosterEntrySchema = z
  .object({
    name: z.string().trim().min(2).max(FIELD_LIMITS.short),
    privateEmail: z.string().trim().email().max(320).or(z.literal("")),
    privatePhone: trimmedOptionalString(40),
    existingProfileSlug: z
      .string()
      .trim()
      .max(120)
      .regex(
        /^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Enter a valid public profile slug.",
      ),
    relationshipToTeam: trimmedOptionalString(160),
    role: z.enum([
      "captain",
      "athlete",
      "reserve",
      "coach",
      "manager",
      "administrator",
      "media-manager",
    ]),
    rosterStatus: z.enum(["proposed", "invited", "accepted", "declined"]),
    specialty: z.enum(["", "strength", "control", "endurance", "freestyle"]),
    consentStatus: z.enum(["not-contacted", "pending", "accepted", "declined"]),
  })
  .strict();

const teamApplicationDetailsObjectSchema = z
  .object({
    proposedTeamName: z.string().trim().min(2).max(FIELD_LIMITS.title),
    shortName: z.string().trim().min(2).max(80),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(8)
      .regex(/^[A-Z0-9-]+$/, "Use 2–8 uppercase letters, numbers, or hyphens."),
    teamType: z.enum([
      "prospective-wcl-team",
      "competitive-team",
      "crew",
      "club",
      "gym-team",
      "national-team",
      "other",
    ]),
    representedIdentity: z.string().trim().min(2).max(160),
    country: knownCountrySchema,
    administrativeArea: trimmedOptionalString(FIELD_LIMITS.short),
    city: trimmedOptionalString(FIELD_LIMITS.short),
    trainingBase: trimmedOptionalString(FIELD_LIMITS.short),
    foundingYear: z
      .string()
      .trim()
      .regex(
        /^$|^(18|19|20)\d{2}$/,
        "Enter a four-digit year or leave it blank.",
      ),
    description: z.string().trim().min(20).max(2_000),
    disciplines: boundedList(12, 80),
    competitionIntentions: z.string().trim().min(10).max(2_000),
    website: optionalSafeHttpUrlSchema,
    socialLinks: supportingLinksSchema,
    primaryColor: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color such as #C9252D."),
    secondaryColor: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color such as #F4F1EA."),
    accentColor: z
      .string()
      .trim()
      .regex(
        /^$|^#[0-9A-Fa-f]{6}$/,
        "Use a six-digit hex color or leave it blank.",
      ),
    crestReferenceUrl: optionalSafeHttpUrlSchema,
    wordmarkReferenceUrl: optionalSafeHttpUrlSchema,
    brandingPermissionAcknowledged: z.literal(
      true,
      "Confirm authority to submit the proposed branding.",
    ),
    proposedUniformDesign: trimmedOptionalString(2_000),
    proposedRoster: z.array(teamApplicationRosterEntrySchema).max(8),
  })
  .strict();

export const teamApplicationDetailsSchema = teamApplicationDetailsObjectSchema;

const mediaPitchDetailsObjectSchema = z
  .object({
    mediaKind: z
      .enum(["photo", "photo-series", "mixed-media", "other"])
      .default("photo"),
    submittingIdentityType: z
      .enum(["member", "organization"])
      .default("member"),
    submittingIdentityId: operationalDocumentIdSchema
      .or(z.literal(""))
      .default(""),
    proposedTitle: z.string().trim().min(5).max(FIELD_LIMITS.title),
    series: trimmedOptionalString(FIELD_LIMITS.short),
    format: z.string().trim().min(2).max(FIELD_LIMITS.short),
    subject: z.string().trim().min(2).max(300),
    location: trimmedOptionalString(FIELD_LIMITS.short),
    visualApproach: z.string().trim().min(20).max(3_000),
    estimatedDuration: trimmedOptionalString(80),
    sourcePlatform: z
      .enum([
        "",
        "Cali Central",
        "Instagram",
        "TikTok",
        "YouTube",
        "Facebook",
        "X",
        "Threads",
        "Website",
      ])
      .default(""),
    sourceAccount: trimmedOptionalString(FIELD_LIMITS.short),
    originalPostUrl: safeHttpUrlSchema.or(z.literal("")).default(""),
    creatorName: trimmedOptionalString(FIELD_LIMITS.short),
    caption: trimmedOptionalString(1_000),
    altText: trimmedOptionalString(500),
    mediaPermissionStatus: z
      .enum([
        "unknown",
        "submitter-owned",
        "permission-confirmed",
        "public-reference-only",
      ])
      .default("unknown"),
    publicReferenceLinks: supportingLinksSchema,
  })
  .strict();

export const mediaPitchDetailsSchema =
  mediaPitchDetailsObjectSchema.superRefine((value, context) => {
    if (
      value.submittingIdentityType === "organization" &&
      !value.submittingIdentityId
    ) {
      context.addIssue({
        code: "custom",
        path: ["submittingIdentityId"],
        message: "Select an organization you are authorized to represent.",
      });
    }
    if (
      value.submittingIdentityType === "member" &&
      value.submittingIdentityId
    ) {
      context.addIssue({
        code: "custom",
        path: ["submittingIdentityId"],
        message: "A member submission cannot include another identity ID.",
      });
    }
    if (!value.originalPostUrl) {
      context.addIssue({
        code: "custom",
        path: ["originalPostUrl"],
        message:
          "Add the original public media URL. Direct uploads are not configured.",
      });
    }
    if (value.mediaPermissionStatus === "unknown") {
      context.addIssue({
        code: "custom",
        path: ["mediaPermissionStatus"],
        message: "Declare ownership, permission, or public-reference status.",
      });
    }
    if (
      value.mediaPermissionStatus === "public-reference-only" &&
      !value.originalPostUrl
    ) {
      context.addIssue({
        code: "custom",
        path: ["originalPostUrl"],
        message: "Add the original public post URL for referenced media.",
      });
    }
  });

const organizationClaimDetailsObjectSchema = z
  .object({
    requestKind: z.enum(["create", "claim"]).default("claim"),
    existingOrganizationId: operationalDocumentIdSchema.or(z.literal("")),
    organizationName: z.string().trim().min(2).max(FIELD_LIMITS.title),
    organizationType: z.enum([
      "federation",
      "league",
      "competition-organizer",
      "gym",
      "training-facility",
      "team-operator",
      "brand",
      "retailer",
      "media-company",
      "community-organization",
      "other",
    ]),
    country: knownCountrySchema,
    website: optionalSafeHttpUrlSchema,
    relationshipToOrganization: z.string().trim().min(10).max(1_000),
    requestedCapabilities: z
      .array(z.enum(["manage-profile", "submit-media", "submit-products"]))
      .min(1)
      .max(3),
    evidenceLinks: supportingLinksSchema,
  })
  .strict();

export const organizationClaimDetailsSchema =
  organizationClaimDetailsObjectSchema.superRefine((value, context) => {
    if (value.requestKind === "claim" && !value.existingOrganizationId) {
      context.addIssue({
        code: "custom",
        path: ["existingOrganizationId"],
        message: "Enter the stable organization record ID being claimed.",
      });
    }
    if (value.requestKind === "claim" && !value.evidenceLinks.length) {
      context.addIssue({
        code: "custom",
        path: ["evidenceLinks"],
        message: "Add at least one public evidence link for a claim.",
      });
    }
  });

const videoSubmissionDetailsObjectSchema = z
  .object({
    submittingIdentityType: z
      .enum(["member", "organization"])
      .default("member"),
    submittingIdentityId: operationalDocumentIdSchema
      .or(z.literal(""))
      .default(""),
    videoTitle: z.string().trim().min(5).max(FIELD_LIMITS.title),
    description: z.string().trim().min(20).max(3_000),
    category: z.string().trim().min(2).max(FIELD_LIMITS.short),
    discipline: trimmedOptionalString(FIELD_LIMITS.short),
    sourceHost: z.enum(["youtube", "instagram", "tiktok", "other-approved"]),
    originalPublicUrl: safeHttpUrlSchema,
    submitterRelationship: z.string().trim().min(2).max(300),
    creatorName: z.string().trim().min(2).max(FIELD_LIMITS.short),
    creatorProfileUrl: optionalSafeHttpUrlSchema,
    featuredAthletes: boundedList(12, 120),
    featuredTeams: boundedList(12, 120),
    organizationId: operationalDocumentIdSchema.or(z.literal("")),
    competition: trimmedOptionalString(FIELD_LIMITS.title),
    eventDate: optionalCalendarDateSchema,
    location: trimmedOptionalString(FIELD_LIMITS.short),
    thumbnailReferenceUrl: optionalSafeHttpUrlSchema,
    rightsDeclaration: z.enum([
      "submitter-owned",
      "permission-confirmed",
      "public-reference-only",
    ]),
    ownershipSourceDeclaration: z.string().trim().min(20).max(1_000),
    sourceAccount: trimmedOptionalString(FIELD_LIMITS.short),
    editorialNote: trimmedOptionalString(2_000),
    contentWarnings: boundedList(8, 120),
  })
  .strict();

export const videoSubmissionDetailsSchema =
  videoSubmissionDetailsObjectSchema.superRefine((value, context) => {
    if (
      value.submittingIdentityType === "organization" &&
      !value.submittingIdentityId
    ) {
      context.addIssue({
        code: "custom",
        path: ["submittingIdentityId"],
        message: "Select an organization you are authorized to represent.",
      });
    }
    if (
      value.submittingIdentityType === "member" &&
      value.submittingIdentityId
    ) {
      context.addIssue({
        code: "custom",
        path: ["submittingIdentityId"],
        message: "A member submission cannot include another identity ID.",
      });
    }
    const hostname = new URL(value.originalPublicUrl).hostname
      .toLowerCase()
      .replace(/^www\./, "");
    const allowed =
      value.sourceHost === "youtube"
        ? hostname === "youtu.be" ||
          hostname === "youtube.com" ||
          hostname.endsWith(".youtube.com")
        : value.sourceHost === "instagram"
          ? hostname === "instagram.com" || hostname.endsWith(".instagram.com")
          : value.sourceHost === "tiktok"
            ? hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")
            : true;

    if (!allowed) {
      context.addIssue({
        code: "custom",
        path: ["originalPublicUrl"],
        message: "The source URL does not match the selected host.",
      });
    }
  });

const productSubmissionDetailsObjectSchema = z
  .object({
    organizationId: operationalDocumentIdSchema,
    productName: z.string().trim().min(2).max(FIELD_LIMITS.title),
    category: z.string().trim().min(2).max(FIELD_LIMITS.short),
    productSummary: z.string().trim().min(20).max(2_000),
    standardProductUrl: safeHttpUrlSchema,
    affiliateUrl: optionalSafeHttpUrlSchema,
    affiliateRelationship: z.enum(["none", "pending", "active"]),
    submitterRelationship: z.string().trim().min(10).max(500),
    commercialDisclosure: z.string().trim().min(10).max(1_000),
  })
  .strict();

export const productSubmissionDetailsSchema =
  productSubmissionDetailsObjectSchema.superRefine((value, context) => {
    if (value.affiliateRelationship === "active" && !value.affiliateUrl) {
      context.addIssue({
        code: "custom",
        path: ["affiliateUrl"],
        message:
          "An active affiliate relationship requires its destination URL.",
      });
    }
    if (value.affiliateRelationship !== "active" && value.affiliateUrl) {
      context.addIssue({
        code: "custom",
        path: ["affiliateUrl"],
        message:
          "Do not provide an affiliate URL unless the relationship is active.",
      });
    }
  });

export const correctionRequestDetailsSchema = z
  .object({
    affectedUrl: safeHttpUrlSchema,
    issueSummary: z.string().trim().min(20).max(2_000),
    requestedCorrection: z.string().trim().min(20).max(3_000),
    sourceLinks: supportingLinksSchema,
    relationshipToSubject: trimmedOptionalString(160),
  })
  .strict();

export const storyPitchSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("storyPitch"),
    storyPitchDetails: storyPitchDetailsSchema,
  })
  .strict();

export const athleteNominationSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("athleteNomination"),
    athleteNominationDetails: athleteNominationDetailsSchema,
  })
  .strict();

export const competitionListingSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("competitionListing"),
    competitionListingDetails: competitionListingDetailsSchema,
  })
  .strict();

export const teamApplicationSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("teamApplication"),
    teamApplicationDetails: teamApplicationDetailsSchema,
  })
  .strict();

export const organizationClaimSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("organizationClaim"),
    organizationClaimDetails: organizationClaimDetailsSchema,
  })
  .strict();

export const videoSubmissionSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("videoSubmission"),
    videoSubmissionDetails: videoSubmissionDetailsSchema,
  })
  .strict();

export const mediaPitchSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("mediaPitch"),
    mediaPitchDetails: mediaPitchDetailsSchema,
  })
  .strict();

export const correctionRequestSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("correctionRequest"),
    correctionRequestDetails: correctionRequestDetailsSchema,
  })
  .strict();

export const productSubmissionSchema = fullSubmissionCommonSchema
  .extend({
    submissionType: z.literal("productSubmission"),
    productSubmissionDetails: productSubmissionDetailsSchema,
  })
  .strict();

function typeSpecificLinkCount(value: {
  submissionType: string;
  athleteNominationDetails?: { publicReferenceLinks?: unknown[] };
  competitionListingDetails?: { publicReferenceLinks?: unknown[] };
  teamApplicationDetails?: { socialLinks?: unknown[] };
  organizationClaimDetails?: { evidenceLinks?: unknown[] };
  mediaPitchDetails?: { publicReferenceLinks?: unknown[] };
  correctionRequestDetails?: { sourceLinks?: unknown[] };
}): number {
  switch (value.submissionType) {
    case "athleteNomination":
      return value.athleteNominationDetails?.publicReferenceLinks?.length ?? 0;
    case "competitionListing":
      return value.competitionListingDetails?.publicReferenceLinks?.length ?? 0;
    case "teamApplication":
      return value.teamApplicationDetails?.socialLinks?.length ?? 0;
    case "organizationClaim":
      return value.organizationClaimDetails?.evidenceLinks?.length ?? 0;
    case "mediaPitch":
      return value.mediaPitchDetails?.publicReferenceLinks?.length ?? 0;
    case "correctionRequest":
      return value.correctionRequestDetails?.sourceLinks?.length ?? 0;
    default:
      return 0;
  }
}

function enforceCombinedLinkLimit(
  value: {
    submissionType: string;
    supportingLinks: unknown[];
    athleteNominationDetails?: { publicReferenceLinks?: unknown[] };
    competitionListingDetails?: { publicReferenceLinks?: unknown[] };
    teamApplicationDetails?: { socialLinks?: unknown[] };
    organizationClaimDetails?: { evidenceLinks?: unknown[] };
    mediaPitchDetails?: { publicReferenceLinks?: unknown[] };
    correctionRequestDetails?: { sourceLinks?: unknown[] };
  },
  context: z.RefinementCtx,
) {
  if (value.supportingLinks.length + typeSpecificLinkCount(value) > 8) {
    context.addIssue({
      code: "custom",
      path: ["supportingLinks"],
      message: "Add no more than 8 supporting links in total.",
    });
  }
}

export const submissionForReviewSchema = z
  .discriminatedUnion("submissionType", [
    storyPitchSchema,
    athleteNominationSchema,
    competitionListingSchema,
    teamApplicationSchema,
    organizationClaimSchema,
    videoSubmissionSchema,
    mediaPitchSchema,
    productSubmissionSchema,
    correctionRequestSchema,
  ])
  .superRefine(enforceCombinedLinkLimit);

const storyPitchDraftDetailsSchema = storyPitchDetailsSchema.partial();
const athleteNominationDraftDetailsSchema = athleteNominationDetailsObjectSchema
  .partial()
  .extend({
    competitionHistory: z
      .array(athleteCompetitionHistoryEntrySchema.partial())
      .max(12)
      .optional(),
  });
const competitionListingDraftDetailsSchema =
  competitionListingDetailsSchema.partial();
const teamApplicationDraftDetailsSchema = teamApplicationDetailsObjectSchema
  .partial()
  .extend({
    proposedRoster: z
      .array(teamApplicationRosterEntrySchema.partial())
      .max(8)
      .optional(),
  });
const mediaPitchDraftDetailsSchema = mediaPitchDetailsObjectSchema.partial();
const organizationClaimDraftDetailsSchema =
  organizationClaimDetailsObjectSchema.partial();
const videoSubmissionDraftDetailsSchema =
  videoSubmissionDetailsObjectSchema.partial();
const productSubmissionDraftDetailsSchema =
  productSubmissionDetailsObjectSchema.partial();
const correctionRequestDraftDetailsSchema =
  correctionRequestDetailsSchema.partial();

export const submissionDraftSchema = z
  .discriminatedUnion("submissionType", [
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("storyPitch"),
        storyPitchDetails: storyPitchDraftDetailsSchema.default({}),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("organizationClaim"),
        organizationClaimDetails: organizationClaimDraftDetailsSchema.default(
          {},
        ),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("videoSubmission"),
        videoSubmissionDetails: videoSubmissionDraftDetailsSchema.default({}),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("athleteNomination"),
        athleteNominationDetails: athleteNominationDraftDetailsSchema.default(
          {},
        ),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("productSubmission"),
        productSubmissionDetails: productSubmissionDraftDetailsSchema.default(
          {},
        ),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("competitionListing"),
        competitionListingDetails: competitionListingDraftDetailsSchema.default(
          {},
        ),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("teamApplication"),
        teamApplicationDetails: teamApplicationDraftDetailsSchema.default({}),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("mediaPitch"),
        mediaPitchDetails: mediaPitchDraftDetailsSchema.default({}),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("correctionRequest"),
        correctionRequestDetails: correctionRequestDraftDetailsSchema.default(
          {},
        ),
      })
      .strict(),
  ])
  .superRefine(enforceCombinedLinkLimit);

export const submissionTypeSchema = z.enum(SUBMISSION_TYPES);
export const submissionPrioritySchema = z.enum(SUBMISSION_PRIORITIES);

export const reviewActionSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
  })
  .strict();

export const assignmentSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    reviewerId: operationalDocumentIdSchema,
  })
  .strict();

export const revisionRequestSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    feedback: z.string().trim().min(10).max(FIELD_LIMITS.feedback),
  })
  .strict();

export const rejectionSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    feedback: z.string().trim().min(10).max(FIELD_LIMITS.feedback),
    confirmation: z.literal("confirm"),
  })
  .strict();

export const archiveSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    confirmation: z.literal("confirm"),
  })
  .strict();

export const privateNoteSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    operationKey: mutationOperationKeySchema,
    note: z.string().trim().min(1).max(FIELD_LIMITS.privateNote),
  })
  .strict();

export const visibleFeedbackSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    feedback: z.string().trim().max(FIELD_LIMITS.feedback),
  })
  .strict();

export const priorityUpdateSchema = z
  .object({
    submissionId: operationalDocumentIdSchema,
    priority: submissionPrioritySchema,
  })
  .strict();

export const contributorRoleSchema = z
  .object({
    contributorId: operationalDocumentIdSchema,
    role: z.enum(CONTRIBUTOR_ROLES),
    confirmation: z.string().trim().optional(),
  })
  .strict();

export const contributorAccessSchema = z
  .object({
    contributorId: operationalDocumentIdSchema,
    accessStatus: z.enum(ACCESS_STATUSES),
    confirmation: z.string().trim().optional(),
  })
  .strict();

export const contributorInternalNotesSchema = z
  .object({
    contributorId: operationalDocumentIdSchema,
    internalNotes: z.string().trim().max(FIELD_LIMITS.internalNotes),
  })
  .strict();

export type ContributorProfileUpdateInput = z.infer<
  typeof contributorProfileUpdateSchema
>;
export type SubmissionDraftInput = z.infer<typeof submissionDraftSchema>;
export type SubmissionForReviewInput = z.infer<
  typeof submissionForReviewSchema
>;
