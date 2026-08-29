import { defineArrayMember, defineField, defineType } from "sanity";

import {
  athleteCompetitionCategoryOptions,
  athleteSpecialtyOptions,
  countryOptions,
} from "../constants";

const supportingLinkValidation = (links: unknown[] | undefined) => {
  const urls = (links || [])
    .map((link) => {
      if (typeof link !== "object" || link === null || !("url" in link)) {
        return undefined;
      }

      return typeof link.url === "string"
        ? link.url.trim().toLowerCase()
        : undefined;
    })
    .filter((url): url is string => Boolean(url));

  return new Set(urls).size === urls.length
    ? true
    : "Each supporting URL may be listed only once.";
};

const validateUrlLength = (value: string | undefined) =>
  !value || value.length <= 2_000
    ? true
    : "URLs cannot exceed 2,000 characters.";

const stringArrayMember = (title: string, maxLength: number) =>
  defineArrayMember({
    type: "string",
    title,
    validation: (Rule) => Rule.min(1).max(maxLength),
  });

const supportingLinksField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [defineArrayMember({ type: "supportingLink" })],
    validation: (Rule) =>
      Rule.unique()
        .max(8)
        .custom((value) => supportingLinkValidation(value)),
  });

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
          .uri({ allowRelative: false, scheme: ["http", "https"] })
          .custom((value) => validateUrlLength(value)),
    }),
  ],
  preview: {
    select: { label: "label", url: "url" },
    prepare({ label, url }) {
      let domain: string | undefined;

      if (typeof url === "string") {
        try {
          domain = new URL(url).hostname;
        } catch {
          domain = undefined;
        }
      }

      return {
        title: label || domain || "Supporting link",
        subtitle: typeof url === "string" ? url : undefined,
      };
    },
  },
});

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
      to: [{ type: "contributorProfile" }],
      readOnly: true,
      options: {
        filter: 'role in ["editor", "admin"] && accessStatus == "active"',
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
    prepare({ author, text, createdAt }) {
      const date =
        typeof createdAt === "string"
          ? new Date(createdAt).toLocaleString()
          : undefined;

      return {
        title:
          typeof author === "string"
            ? `Private note by ${author}`
            : "Private editorial note",
        subtitle: [date, text].filter(Boolean).join(" · "),
      };
    },
  },
});

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
});

export const athleteCompetitionHistorySubmission = defineType({
  name: "athleteCompetitionHistorySubmission",
  title: "Submitted competition history entry",
  type: "object",
  description:
    "Submitter-provided history. This is evidence for review, not a verified or published result.",
  fields: [
    defineField({
      name: "eventName",
      title: "Competition",
      type: "string",
      validation: (Rule) => Rule.min(2).max(140),
    }),
    defineField({
      name: "organizer",
      title: "Organizer",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      options: { list: countryOptions },
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "divisionCategory",
      title: "Division or category",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "placement",
      title: "Placement",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "score",
      title: "Published score",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    ...["officialResultUrl", "eventUrl", "videoUrl"].map((name) =>
      defineField({
        name,
        title:
          name === "officialResultUrl"
            ? "Official result URL"
            : name === "eventUrl"
              ? "Event URL"
              : "Video URL",
        type: "url",
        validation: (Rule) =>
          Rule.uri({ allowRelative: false, scheme: ["http", "https"] }).custom(
            (value) => validateUrlLength(value),
          ),
      }),
    ),
  ],
  preview: {
    select: {
      eventName: "eventName",
      date: "date",
      category: "divisionCategory",
    },
    prepare({ eventName, date, category }) {
      return {
        title: eventName || "Competition history entry",
        subtitle: [date, category].filter(Boolean).join(" · "),
      };
    },
  },
});

export const athleteNominationDetails = defineType({
  name: "athleteNominationDetails",
  title: "Athlete nomination details",
  type: "object",
  fields: [
    defineField({
      name: "requestKind",
      title: "Request kind",
      type: "string",
      options: {
        list: [
          { title: "Create a profile", value: "create" },
          { title: "Claim an existing profile", value: "claim" },
        ],
      },
      initialValue: "create",
    }),
    defineField({
      name: "existingAthleteSlug",
      title: "Existing athlete slug",
      type: "string",
      description: "Public profile slug supplied for a claim request.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "athleteName",
      title: "Public athlete name",
      type: "string",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "displayName",
      title: "Alternate display name",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      options: { list: countryOptions },
    }),
    defineField({
      name: "administrativeArea",
      title: "State, province, or region",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "city",
      title: "Public city or training base",
      type: "string",
      description: "Do not submit a private home address.",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "biography",
      title: "Submitted biography",
      type: "text",
      rows: 6,
      validation: (Rule) => Rule.max(3_000),
    }),
    defineField({
      name: "primaryCategory",
      title: "Primary competition category",
      type: "string",
      options: { list: athleteCompetitionCategoryOptions },
    }),
    defineField({
      name: "specialties",
      title: "Specialties",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          options: { list: athleteSpecialtyOptions },
        }),
      ],
      validation: (Rule) => Rule.unique().max(athleteSpecialtyOptions.length),
    }),
    defineField({
      name: "yearsActive",
      title: "Years active",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "profileImageUrl",
      title: "Profile image reference URL",
      type: "url",
      description:
        "Public reference only; never imported or published automatically.",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }).custom(
          (value) => validateUrlLength(value),
        ),
    }),
    defineField({
      name: "coverImageUrl",
      title: "Cover image reference URL",
      type: "url",
      description:
        "Public reference only; never imported or published automatically.",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }).custom(
          (value) => validateUrlLength(value),
        ),
    }),
    supportingLinksField("socialLinks", "Public social profile links"),
    defineField({
      name: "competitionHistory",
      title: "Submitted competition history",
      type: "array",
      of: [defineArrayMember({ type: "athleteCompetitionHistorySubmission" })],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: "discipline",
      title: "Legacy discipline",
      type: "string",
      description: "Retained for older nomination records.",
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
          { title: "Not requested", value: "notRequested" },
          { title: "Requested", value: "requested" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Not applicable", value: "notApplicable" },
          { title: "Unknown", value: "unknown" },
        ],
      },
    }),
  ],
});

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
          { title: "Unconfirmed", value: "unconfirmed" },
          { title: "Provisional", value: "provisional" },
          { title: "Confirmed by organizer", value: "confirmed" },
        ],
      },
    }),
  ],
});

export const mediaPitchDetails = defineType({
  name: "mediaPitchDetails",
  title: "Media pitch details",
  type: "object",
  fields: [
    defineField({
      name: "mediaKind",
      title: "Media kind",
      type: "string",
      options: {
        list: [
          { title: "Photo", value: "photo" },
          { title: "Photo series", value: "photo-series" },
          { title: "Mixed media", value: "mixed-media" },
          { title: "Other visual media", value: "other" },
        ],
      },
    }),
    defineField({
      name: "submittingIdentityType",
      title: "Submitting identity",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Authenticated member", value: "member" },
          { title: "Approved organization", value: "organization" },
        ],
      },
    }),
    defineField({
      name: "submittingIdentityId",
      title: "Submitting identity record ID",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.max(128),
    }),
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
    defineField({
      name: "sourcePlatform",
      title: "Source platform",
      type: "string",
      options: {
        list: [
          { title: "Cali Central", value: "Cali Central" },
          { title: "Instagram", value: "Instagram" },
          { title: "TikTok", value: "TikTok" },
          { title: "YouTube", value: "YouTube" },
          { title: "Facebook", value: "Facebook" },
          { title: "X", value: "X" },
          { title: "Threads", value: "Threads" },
          { title: "Website", value: "Website" },
        ],
      },
    }),
    defineField({
      name: "sourceAccount",
      title: "Source account",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "originalPostUrl",
      title: "Original post URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "creatorName",
      title: "Creator / photographer",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "caption",
      title: "Caption / context",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.max(1_000),
    }),
    defineField({
      name: "altText",
      title: "Image description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "mediaPermissionStatus",
      title: "Submitter's media relationship",
      type: "string",
      options: {
        list: [
          { title: "Unknown", value: "unknown" },
          { title: "Submitter owns it", value: "submitter-owned" },
          { title: "Permission confirmed", value: "permission-confirmed" },
          { title: "Public reference only", value: "public-reference-only" },
        ],
      },
      initialValue: "unknown",
    }),
    supportingLinksField("publicReferenceLinks", "Public reference links"),
  ],
});

export const organizationClaimDetails = defineType({
  name: "organizationClaimDetails",
  title: "Organization claim details",
  type: "object",
  fields: [
    defineField({
      name: "requestKind",
      title: "Request",
      type: "string",
      options: {
        list: [
          { title: "Create", value: "create" },
          { title: "Claim", value: "claim" },
        ],
      },
    }),
    defineField({
      name: "existingOrganizationId",
      title: "Existing organization record ID",
      type: "string",
      validation: (Rule) => Rule.max(128),
    }),
    defineField({
      name: "organizationName",
      title: "Organization name",
      type: "string",
      validation: (Rule) => Rule.min(2).max(140),
    }),
    defineField({
      name: "organizationType",
      title: "Organization type",
      type: "string",
      options: {
        list: [
          { title: "Federation", value: "federation" },
          { title: "League", value: "league" },
          { title: "Competition organizer", value: "competition-organizer" },
          { title: "Gym", value: "gym" },
          { title: "Training facility", value: "training-facility" },
          { title: "Team operator", value: "team-operator" },
          { title: "Brand", value: "brand" },
          { title: "Retailer", value: "retailer" },
          { title: "Media company", value: "media-company" },
          { title: "Community organization", value: "community-organization" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      options: { list: countryOptions },
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "relationshipToOrganization",
      title: "Relationship and authority",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.max(1_000),
    }),
    defineField({
      name: "requestedCapabilities",
      title: "Requested capabilities",
      type: "array",
      of: [stringArrayMember("Capability", 80)],
    }),
    supportingLinksField("evidenceLinks", "Public evidence links"),
  ],
});

export const videoSubmissionDetails = defineType({
  name: "videoSubmissionDetails",
  title: "Video submission details",
  type: "object",
  fields: [
    defineField({
      name: "submittingIdentityType",
      title: "Submitting identity",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Authenticated member", value: "member" },
          { title: "Approved organization", value: "organization" },
        ],
      },
    }),
    defineField({
      name: "submittingIdentityId",
      title: "Submitting identity record ID",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.max(128),
    }),
    defineField({
      name: "videoTitle",
      title: "Video title",
      type: "string",
      validation: (Rule) => Rule.min(5).max(140),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.max(3_000),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "sourceHost",
      title: "Source host",
      type: "string",
      options: {
        list: [
          { title: "YouTube", value: "youtube" },
          { title: "Instagram", value: "instagram" },
          { title: "TikTok", value: "tiktok" },
          { title: "Other approved host", value: "other-approved" },
        ],
      },
    }),
    defineField({
      name: "originalPublicUrl",
      title: "Original public URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "submitterRelationship",
      title: "Submitter relationship",
      type: "string",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "creatorName",
      title: "Creator",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "creatorProfileUrl",
      title: "Creator profile URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "featuredAthletes",
      title: "Featured athletes",
      type: "array",
      of: [stringArrayMember("Athlete", 120)],
    }),
    defineField({
      name: "featuredTeams",
      title: "Featured teams",
      type: "array",
      of: [stringArrayMember("Team", 120)],
    }),
    defineField({
      name: "organizationId",
      title: "Related organization record ID",
      type: "string",
      validation: (Rule) => Rule.max(128),
    }),
    defineField({
      name: "competition",
      title: "Related competition",
      type: "string",
      validation: (Rule) => Rule.max(140),
    }),
    defineField({ name: "eventDate", title: "Event date", type: "date" }),
    defineField({
      name: "location",
      title: "Public location",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "thumbnailReferenceUrl",
      title: "Thumbnail reference URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "rightsDeclaration",
      title: "Rights declaration",
      type: "string",
      options: {
        list: [
          { title: "Submitter owned", value: "submitter-owned" },
          { title: "Permission confirmed", value: "permission-confirmed" },
          { title: "Public reference only", value: "public-reference-only" },
        ],
      },
    }),
    defineField({
      name: "ownershipSourceDeclaration",
      title: "Ownership / source declaration",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.max(1_000),
    }),
    defineField({
      name: "sourceAccount",
      title: "Source account",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "editorialNote",
      title: "Submitter note to editors",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.max(2_000),
    }),
    defineField({
      name: "contentWarnings",
      title: "Content warnings",
      type: "array",
      of: [stringArrayMember("Warning", 120)],
    }),
  ],
});

export const productSubmissionDetails = defineType({
  name: "productSubmissionDetails",
  title: "Product submission details",
  type: "object",
  fields: [
    defineField({
      name: "organizationId",
      title: "Represented organization record ID",
      type: "string",
      validation: (Rule) => Rule.max(128),
    }),
    defineField({
      name: "productName",
      title: "Product name",
      type: "string",
      validation: (Rule) => Rule.max(140),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "productSummary",
      title: "Product summary",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.max(2_000),
    }),
    defineField({
      name: "standardProductUrl",
      title: "Standard product URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "affiliateUrl",
      title: "Affiliate URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "affiliateRelationship",
      title: "Affiliate relationship",
      type: "string",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Pending", value: "pending" },
          { title: "Active", value: "active" },
        ],
      },
    }),
    defineField({
      name: "submitterRelationship",
      title: "Submitter relationship",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "commercialDisclosure",
      title: "Commercial disclosure",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.max(1_000),
    }),
  ],
});

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
});

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
});
