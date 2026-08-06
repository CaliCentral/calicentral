import { z } from "zod";

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
  .uuid(
    "This submission form has expired. Reload the page and try again.",
  );

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

export const athleteNominationDetailsSchema = z
  .object({
    athleteName: z.string().trim().min(2).max(FIELD_LIMITS.short),
    city: trimmedOptionalString(FIELD_LIMITS.short),
    discipline: z.string().trim().min(2).max(FIELD_LIMITS.short),
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

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
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

export const mediaPitchDetailsSchema = z
  .object({
    proposedTitle: z.string().trim().min(5).max(FIELD_LIMITS.title),
    series: trimmedOptionalString(FIELD_LIMITS.short),
    format: z.string().trim().min(2).max(FIELD_LIMITS.short),
    subject: z.string().trim().min(2).max(300),
    location: trimmedOptionalString(FIELD_LIMITS.short),
    visualApproach: z.string().trim().min(20).max(3_000),
    estimatedDuration: trimmedOptionalString(80),
    publicReferenceLinks: supportingLinksSchema,
  })
  .strict();

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

function typeSpecificLinkCount(value: {
  submissionType: string;
  athleteNominationDetails?: { publicReferenceLinks?: unknown[] };
  competitionListingDetails?: { publicReferenceLinks?: unknown[] };
  mediaPitchDetails?: { publicReferenceLinks?: unknown[] };
  correctionRequestDetails?: { sourceLinks?: unknown[] };
}): number {
  switch (value.submissionType) {
    case "athleteNomination":
      return value.athleteNominationDetails?.publicReferenceLinks?.length ?? 0;
    case "competitionListing":
      return value.competitionListingDetails?.publicReferenceLinks?.length ?? 0;
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
    mediaPitchSchema,
    correctionRequestSchema,
  ])
  .superRefine(enforceCombinedLinkLimit);

const storyPitchDraftDetailsSchema = storyPitchDetailsSchema.partial();
const athleteNominationDraftDetailsSchema =
  athleteNominationDetailsSchema.partial();
const competitionListingDraftDetailsSchema =
  competitionListingDetailsSchema.partial();
const mediaPitchDraftDetailsSchema = mediaPitchDetailsSchema.partial();
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
        submissionType: z.literal("athleteNomination"),
        athleteNominationDetails:
          athleteNominationDraftDetailsSchema.default({}),
      })
      .strict(),
    z
      .object({
        ...draftSubmissionCommonShape,
        submissionType: z.literal("competitionListing"),
        competitionListingDetails:
          competitionListingDraftDetailsSchema.default({}),
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
        correctionRequestDetails:
          correctionRequestDraftDetailsSchema.default({}),
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
