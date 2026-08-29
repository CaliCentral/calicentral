import {defineArrayMember, defineField, defineType} from "sanity"
import type {ValidationContext} from "sanity"

import {prototypeStatusOptions} from "../constants"
import {
  optionTitle,
  submissionPriorityOptions,
  submissionStatusOptions,
  submissionTypeOptions,
  validateOptionValue,
} from "../operations-constants"

const incompleteStatuses = new Set(["draft", "withdrawn"])

const requiresCompleteContent = (context: ValidationContext) => {
  const status = context.document?.status

  return typeof status === "string" && !incompleteStatuses.has(status)
}

const requireWorkflowContent = (
  value: unknown,
  context: ValidationContext,
  label: string,
) =>
  requiresCompleteContent(context) &&
  (typeof value !== "string" || !value.trim())
    ? `${label} is required after a draft enters editorial review.`
    : true

const requireSelectedDetails = (
  value: unknown,
  context: ValidationContext,
  submissionType: string,
  label: string,
) => {
  if (value && context.document?.submissionType !== submissionType) {
    return `${label} do not match the selected submission type.`
  }

  return requiresCompleteContent(context) &&
    context.document?.submissionType === submissionType &&
    !value
    ? `${label} are required after a draft enters editorial review.`
    : true
}

const validateUniqueLinks = (links: unknown[] | undefined) => {
  const urls = (links || [])
    .map((link) => {
      if (typeof link !== "object" || link === null || !("url" in link)) {
        return undefined
      }

      return typeof link.url === "string"
        ? link.url.trim().toLowerCase()
        : undefined
    })
    .filter((url): url is string => Boolean(url))

  return new Set(urls).size === urls.length
    ? true
    : "Each supporting URL may be listed only once."
}

export const submission = defineType({
  name: "submission",
  title: "Submission",
  type: "document",
  readOnly: true,
  description:
    "Contributor intake and review record. Approval accepts work for editorial development; it never publishes content.",
  groups: [
    {name: "overview", title: "Overview", default: true},
    {name: "typeDetails", title: "Type-specific details"},
    {name: "review", title: "Editorial review"},
    {name: "relationships", title: "CMS relationships"},
    {name: "history", title: "History"},
    {name: "system", title: "Managed fields"},
  ],
  fields: [
    defineField({
      name: "submissionNumber",
      title: "Submission number",
      type: "string",
      group: "overview",
      readOnly: true,
      description:
        "Stable, server-generated display identifier. It is not the Sanity document ID.",
      validation: (Rule) =>
        Rule.required()
          .max(32)
          .regex(/^CC-\d{4}-[A-Z0-9]{6,12}$/, {
            name: "Cali Central submission number",
          }),
    }),
    defineField({
      name: "submissionType",
      title: "Submission type",
      type: "string",
      group: "overview",
      options: {list: submissionTypeOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            submissionTypeOptions,
            value,
            "submission type",
          ),
        ),
    }),
    defineField({
      name: "title",
      title: "Submission title",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.min(5)
          .max(140)
          .custom((value, context) =>
            requireWorkflowContent(value, context, "A title"),
          ),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      group: "overview",
      validation: (Rule) =>
        Rule.min(20)
          .max(500)
          .custom((value, context) =>
            requireWorkflowContent(value, context, "A summary"),
          ),
    }),
    defineField({
      name: "details",
      title: "Full details",
      type: "text",
      rows: 10,
      group: "overview",
      description:
        "Plain text only. Do not include confidential information or private athlete contact details.",
      validation: (Rule) =>
        Rule.min(50)
          .max(8_000)
          .custom((value, context) =>
            requireWorkflowContent(value, context, "Full details"),
          ),
    }),
    defineField({
      name: "supportingLinks",
      title: "Supporting links",
      type: "array",
      group: "overview",
      of: [defineArrayMember({type: "supportingLink"})],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value) => validateUniqueLinks(value)),
    }),
    defineField({
      name: "contributorNote",
      title: "Contributor note",
      type: "text",
      rows: 4,
      group: "overview",
      validation: (Rule) => Rule.max(2_000),
    }),
    defineField({
      name: "storyPitchDetails",
      title: "Story pitch details",
      type: "storyPitchDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "storyPitch",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "storyPitch",
            "Story pitch details",
          ),
        ),
    }),
    defineField({
      name: "athleteNominationDetails",
      title: "Athlete nomination details",
      type: "athleteNominationDetails",
      group: "typeDetails",
      hidden: ({document}) =>
        document?.submissionType !== "athleteNomination",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "athleteNomination",
            "Athlete nomination details",
          ),
        ),
    }),
    defineField({
      name: "competitionListingDetails",
      title: "Competition listing details",
      type: "competitionListingDetails",
      group: "typeDetails",
      hidden: ({document}) =>
        document?.submissionType !== "competitionListing",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "competitionListing",
            "Competition listing details",
          ),
        ),
    }),
    defineField({
      name: "mediaPitchDetails",
      title: "Media pitch details",
      type: "mediaPitchDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "mediaPitch",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "mediaPitch",
            "Media pitch details",
          ),
        ),
    }),
    defineField({
      name: "organizationClaimDetails",
      title: "Organization claim details",
      type: "organizationClaimDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "organizationClaim",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "organizationClaim",
            "Organization claim details",
          ),
        ),
    }),
    defineField({
      name: "videoSubmissionDetails",
      title: "Video submission details",
      type: "videoSubmissionDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "videoSubmission",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "videoSubmission",
            "Video submission details",
          ),
        ),
    }),
    defineField({
      name: "productSubmissionDetails",
      title: "Product submission details",
      type: "productSubmissionDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "productSubmission",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "productSubmission",
            "Product submission details",
          ),
        ),
    }),
    defineField({
      name: "teamApplicationDetails",
      title: "Team application details",
      type: "teamApplicationDetails",
      group: "typeDetails",
      hidden: ({document}) => document?.submissionType !== "teamApplication",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "teamApplication",
            "Team application details",
          ),
        ),
    }),
    defineField({
      name: "correctionRequestDetails",
      title: "Correction request details",
      type: "correctionRequestDetails",
      group: "typeDetails",
      hidden: ({document}) =>
        document?.submissionType !== "correctionRequest",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireSelectedDetails(
            value,
            context,
            "correctionRequest",
            "Correction request details",
          ),
        ),
    }),
    defineField({
      name: "status",
      title: "Workflow status",
      type: "string",
      group: "review",
      readOnly: true,
      description:
        "Managed by authorized server-side transition rules. Approved means accepted for editorial development, not published.",
      options: {list: submissionStatusOptions, layout: "radio"},
      initialValue: "draft",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            submissionStatusOptions,
            value,
            "workflow status",
          ),
        ),
    }),
    defineField({
      name: "priority",
      title: "Internal priority",
      type: "string",
      group: "review",
      readOnly: true,
      description:
        "Internal editorial signal managed by editors and administrators.",
      options: {list: submissionPriorityOptions, layout: "radio"},
      initialValue: "normal",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            submissionPriorityOptions,
            value,
            "priority",
          ),
        ),
    }),
    defineField({
      name: "assignedReviewer",
      title: "Assigned reviewer",
      type: "reference",
      group: "review",
      readOnly: true,
      to: [{type: "contributorProfile"}],
      options: {
        filter:
          'role in ["editor", "admin"] && accessStatus == "active"',
      },
      description:
        "The server verifies current editor or administrator access before assignment.",
    }),
    defineField({
      name: "contributorVisibleFeedback",
      title: "Contributor-visible feedback",
      type: "text",
      rows: 6,
      group: "review",
      readOnly: true,
      description:
        "This text is returned to the submission owner. Keep it concise and professional.",
      validation: (Rule) => Rule.max(4_000),
    }),
    defineField({
      name: "privateEditorialNotes",
      title: "Private editorial notes",
      type: "array",
      group: "review",
      readOnly: true,
      description:
        "Editor and administrator context only. Never project this array into contributor pages.",
      of: [defineArrayMember({type: "privateEditorialNote"})],
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "linkedStory",
      title: "Linked story",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "story"}],
    }),
    defineField({
      name: "linkedAthlete",
      title: "Linked athlete",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "athlete"}],
    }),
    defineField({
      name: "linkedCompetition",
      title: "Linked competition",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "competition"}],
    }),
    defineField({
      name: "linkedVideo",
      title: "Linked video",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "video"}],
    }),
    defineField({
      name: "linkedOrganization",
      title: "Linked organization",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "organization"}],
    }),
    defineField({
      name: "linkedProduct",
      title: "Linked product",
      type: "reference",
      group: "relationships",
      readOnly: true,
      to: [{type: "product"}],
    }),
    defineField({
      name: "createdDraftDocumentId",
      title: "Created editorial draft ID",
      type: "string",
      group: "relationships",
      readOnly: true,
      description:
        "Server-managed Sanity draft identifier. Conversion never publishes content.",
      validation: (Rule) =>
        Rule.max(200).regex(/^drafts\.[A-Za-z0-9_.-]+$/, {
          name: "Sanity draft document ID",
          invert: false,
        }),
    }),
    defineField({
      name: "auditEvents",
      title: "Audit events",
      type: "array",
      group: "history",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "reference",
          to: [{type: "auditEvent"}],
        }),
      ],
      validation: (Rule) => Rule.unique().max(500),
    }),
    defineField({
      name: "submitter",
      title: "Submitter",
      type: "reference",
      group: "system",
      readOnly: true,
      to: [{type: "contributorProfile"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "revisionNumber",
      title: "Revision number",
      type: "number",
      group: "system",
      readOnly: true,
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requiresCompleteContent(context) && !value
            ? "Submissions in editorial workflow require a managed submission timestamp."
            : true,
        ),
    }),
    defineField({
      name: "withdrawnAt",
      title: "Withdrawn at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.status === "withdrawn" && !value
            ? "Withdrawn submissions require a managed withdrawal timestamp."
            : true,
        ),
    }),
    defineField({
      name: "reviewedAt",
      title: "Review started at",
      type: "datetime",
      group: "system",
      readOnly: true,
    }),
    defineField({
      name: "resolvedAt",
      title: "Resolved at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) =>
        Rule.custom((value, context) =>
          ["approved", "rejected", "archived"].includes(
            typeof context.document?.status === "string"
              ? context.document.status
              : "",
          ) && !value
            ? "Resolved or archived submissions require a managed resolution timestamp."
            : true,
        ),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Prototype record status",
      type: "string",
      group: "system",
      readOnly: true,
      description:
        "Optional marker for non-authentic review fixtures. It does not change workflow state.",
      options: {list: prototypeStatusOptions},
    }),
  ],
  orderings: [
    {
      title: "Recently updated",
      name: "updatedAtDesc",
      by: [{field: "updatedAt", direction: "desc"}],
    },
    {
      title: "Newest submissions",
      name: "createdAtDesc",
      by: [{field: "createdAt", direction: "desc"}],
    },
    {
      title: "Submission number",
      name: "submissionNumberDesc",
      by: [{field: "submissionNumber", direction: "desc"}],
    },
  ],
  preview: {
    select: {
      title: "title",
      submissionNumber: "submissionNumber",
      submissionType: "submissionType",
      status: "status",
      submitter: "submitter.displayName",
    },
    prepare({
      title,
      submissionNumber,
      submissionType,
      status,
      submitter,
    }) {
      const typeTitle = optionTitle(submissionTypeOptions, submissionType)
      const statusTitle = optionTitle(submissionStatusOptions, status)

      return {
        title: title || submissionNumber || "Untitled submission",
        subtitle: [
          submissionNumber,
          typeTitle,
          statusTitle,
          submitter,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
