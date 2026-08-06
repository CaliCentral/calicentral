import {defineArrayMember, defineField, defineType} from "sanity"

const supportingLinkValidation = (links: unknown[] | undefined) => {
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

const validateUrlLength = (value: string | undefined) =>
  !value || value.length <= 2_000
    ? true
    : "URLs cannot exceed 2,000 characters."

const stringArrayMember = (
  title: string,
  maxLength: number,
) =>
  defineArrayMember({
    type: "string",
    title,
    validation: (Rule) => Rule.min(1).max(maxLength),
  })

const supportingLinksField = (
  name: string,
  title: string,
) =>
  defineField({
    name,
    title,
    type: "array",
    of: [defineArrayMember({type: "supportingLink"})],
    validation: (Rule) =>
      Rule.unique()
        .max(8)
        .custom((value) => supportingLinkValidation(value)),
  })

export const supportingLink = defineType({
  name: "supportingLink",
  title: "Supporting link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "Optional plain-language description of the public source.",
      validation: (Rule) => Rule.min(1).max(100),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      description:
        "Public HTTP or HTTPS source only. The portal never fetches or previews this URL.",
      validation: (Rule) =>
        Rule.required()
          .uri({allowRelative: false, scheme: ["http", "https"]})
          .custom((value) => validateUrlLength(value)),
    }),
  ],
  preview: {
    select: {label: "label", url: "url"},
    prepare({label, url}) {
      let domain: string | undefined

      if (typeof url === "string") {
        try {
          domain = new URL(url).hostname
        } catch {
          domain = undefined
        }
      }

      return {
        title: label || domain || "Supporting link",
        subtitle: typeof url === "string" ? url : undefined,
      }
    },
  },
})

export const privateEditorialNote = defineType({
  name: "privateEditorialNote",
  title: "Private editorial note",
  type: "object",
  description:
    "Internal newsroom context. This object must never be returned to contributor-facing views.",
  fields: [
    defineField({
      name: "text",
      title: "Note",
      type: "text",
      rows: 5,
      readOnly: true,
      validation: (Rule) => Rule.required().min(1).max(6_000),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{type: "contributorProfile"}],
      readOnly: true,
      options: {
        filter:
          'role in ["editor", "admin"] && accessStatus == "active"',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      author: "author.displayName",
      text: "text",
      createdAt: "createdAt",
    },
    prepare({author, text, createdAt}) {
      const date =
        typeof createdAt === "string"
          ? new Date(createdAt).toLocaleString()
          : undefined

      return {
        title:
          typeof author === "string"
            ? `Private note by ${author}`
            : "Private editorial note",
        subtitle: [date, text].filter(Boolean).join(" · "),
      }
    },
  },
})

export const storyPitchDetails = defineType({
  name: "storyPitchDetails",
  title: "Story pitch details",
  type: "object",
  fields: [
    defineField({
      name: "proposedHeadline",
      title: "Proposed headline",
      type: "string",
      validation: (Rule) => Rule.min(5).max(140),
    }),
    defineField({
      name: "section",
      title: "Proposed section",
      type: "string",
      validation: (Rule) => Rule.min(2).max(80),
    }),
    defineField({
      name: "pitchSummary",
      title: "Pitch summary",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.min(20).max(2_000),
    }),
    defineField({
      name: "reportingApproach",
      title: "Reporting approach",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.min(20).max(3_000),
    }),
    defineField({
      name: "relevantPeople",
      title: "Relevant people",
      type: "array",
      of: [stringArrayMember("Person", 100)],
      validation: (Rule) => Rule.unique().max(8),
    }),
    defineField({
      name: "relevantLocations",
      title: "Relevant locations",
      type: "array",
      of: [stringArrayMember("Location", 120)],
      validation: (Rule) => Rule.unique().max(8),
    }),
    defineField({
      name: "estimatedLength",
      title: "Estimated length",
      type: "string",
      description: "A restrained estimate, such as “800–1,000 words”.",
      validation: (Rule) => Rule.min(2).max(80),
    }),
    defineField({
      name: "conflictDisclosure",
      title: "Conflict disclosure",
      type: "text",
      rows: 4,
      description:
        "Describe relevant conflicts or relationships. Do not include confidential information.",
      validation: (Rule) => Rule.max(1_000),
    }),
  ],
})

export const athleteNominationDetails = defineType({
  name: "athleteNominationDetails",
  title: "Athlete nomination details",
  type: "object",
  fields: [
    defineField({
      name: "athleteName",
      title: "Athlete name",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "city",
      title: "Public city or training base",
      type: "string",
      description: "Do not submit a private home address.",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "nominationReason",
      title: "Nomination reason",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.min(20).max(3_000),
    }),
    supportingLinksField("publicReferenceLinks", "Public reference links"),
    defineField({
      name: "relationshipToAthlete",
      title: "Relationship to athlete",
      type: "string",
      validation: (Rule) => Rule.min(2).max(160),
    }),
    defineField({
      name: "permissionStatus",
      title: "Permission status",
      type: "string",
      options: {
        list: [
          {title: "Not requested", value: "notRequested"},
          {title: "Requested", value: "requested"},
          {title: "Confirmed", value: "confirmed"},
          {title: "Not applicable", value: "notApplicable"},
          {title: "Unknown", value: "unknown"},
        ],
      },
    }),
  ],
})

export const competitionListingDetails = defineType({
  name: "competitionListingDetails",
  title: "Competition listing details",
  type: "object",
  fields: [
    defineField({
      name: "eventName",
      title: "Event name",
      type: "string",
      validation: (Rule) => Rule.min(2).max(140),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "proposedDate",
      title: "Proposed date",
      type: "date",
    }),
    defineField({
      name: "format",
      title: "Event format",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "divisions",
      title: "Divisions",
      type: "array",
      of: [stringArrayMember("Division", 100)],
      validation: (Rule) => Rule.unique().max(12),
    }),
    defineField({
      name: "organizerRelationship",
      title: "Relationship to organizer",
      type: "string",
      validation: (Rule) => Rule.min(2).max(160),
    }),
    supportingLinksField("publicReferenceLinks", "Public reference links"),
    defineField({
      name: "scheduleStatus",
      title: "Schedule status",
      type: "string",
      options: {
        list: [
          {title: "Unconfirmed", value: "unconfirmed"},
          {title: "Provisional", value: "provisional"},
          {title: "Confirmed by organizer", value: "confirmed"},
        ],
      },
    }),
  ],
})

export const mediaPitchDetails = defineType({
  name: "mediaPitchDetails",
  title: "Media pitch details",
  type: "object",
  fields: [
    defineField({
      name: "proposedTitle",
      title: "Proposed title",
      type: "string",
      validation: (Rule) => Rule.min(5).max(140),
    }),
    defineField({
      name: "series",
      title: "Proposed series",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "format",
      title: "Media format",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "subject",
      title: "Subject",
      type: "string",
      validation: (Rule) => Rule.min(2).max(300),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "visualApproach",
      title: "Visual approach",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.min(20).max(3_000),
    }),
    defineField({
      name: "estimatedDuration",
      title: "Estimated duration",
      type: "string",
      description: "A plain-language estimate, such as “6–8 minutes”.",
      validation: (Rule) => Rule.min(2).max(80),
    }),
    supportingLinksField("publicReferenceLinks", "Public reference links"),
  ],
})

export const correctionRequestDetails = defineType({
  name: "correctionRequestDetails",
  title: "Correction request details",
  type: "object",
  fields: [
    defineField({
      name: "affectedUrl",
      title: "Affected public URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: false,
          scheme: ["http", "https"],
        }).custom((value) => validateUrlLength(value)),
    }),
    defineField({
      name: "issueSummary",
      title: "Issue summary",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.min(20).max(2_000),
    }),
    defineField({
      name: "requestedCorrection",
      title: "Requested correction",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.min(20).max(3_000),
    }),
    supportingLinksField("sourceLinks", "Public source links"),
    defineField({
      name: "relationshipToSubject",
      title: "Relationship to subject",
      type: "string",
      validation: (Rule) => Rule.min(2).max(160),
    }),
  ],
})

export const auditMetadata = defineType({
  name: "auditMetadata",
  title: "Audit metadata",
  type: "object",
  description:
    "A constrained change summary. Never store secrets, tokens, or full submission content.",
  fields: [
    defineField({
      name: "previousValue",
      title: "Previous value",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "nextValue",
      title: "Next value",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "noteKind",
      title: "Note kind",
      type: "string",
      readOnly: true,
      description:
        "A non-sensitive category only; note bodies never belong in audit metadata.",
      validation: (Rule) => Rule.max(80),
    }),
  ],
})
