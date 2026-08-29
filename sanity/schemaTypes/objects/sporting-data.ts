import {defineField, defineType} from "sanity"

export const provenanceSource = defineType({
  name: "provenanceSource",
  title: "Source provenance",
  type: "object",
  fields: [
    defineField({name: "provider", title: "Provider", type: "reference", to: [{type: "rankingProvider"}]}),
    defineField({name: "sourceTitle", title: "Source title", type: "string", validation: (Rule) => Rule.required().max(180)}),
    defineField({
      name: "sourceType",
      title: "Source type",
      type: "string",
      options: {list: [
        {title: "Official results page", value: "official-results-page"},
        {title: "Organization ranking page", value: "organization-ranking-page"},
        {title: "Official result sheet", value: "official-result-sheet"},
        {title: "Organizer source", value: "organizer-source"},
        {title: "Athlete submitted", value: "athlete-submitted"},
        {title: "Editor confirmed", value: "editor-confirmed"},
        {title: "Other", value: "other"},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: "url", title: "Public source URL", type: "url", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "externalRecordId", title: "External record ID", type: "string", validation: (Rule) => Rule.max(180)}),
    defineField({name: "publishedAt", title: "Source published date", type: "datetime"}),
    defineField({name: "checkedAt", title: "Checked or retrieved at", type: "datetime", validation: (Rule) => Rule.required()}),
    defineField({
      name: "verificationStatus",
      title: "Verification status",
      type: "string",
      options: {list: [
        {title: "Unverified", value: "unverified"},
        {title: "Submitted", value: "submitted"},
        {title: "Source confirmed", value: "source-confirmed"},
        {title: "Official", value: "official"},
        {title: "Disputed", value: "disputed"},
        {title: "Superseded", value: "superseded"},
      ]},
      initialValue: "unverified",
      validation: (Rule) => Rule.required(),
    }),
  ],
})

export const rankingSnapshotEntry = defineType({
  name: "rankingSnapshotEntry",
  title: "Ranking snapshot entry",
  type: "object",
  fields: [
    defineField({name: "athlete", title: "Canonical athlete", type: "reference", to: [{type: "athlete"}]}),
    defineField({name: "sourceDisplayName", title: "Source display name", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "providerAthleteId", title: "Provider athlete ID", type: "string", validation: (Rule) => Rule.max(180)}),
    defineField({name: "position", title: "Ordinal position", type: "number", validation: (Rule) => Rule.integer().positive()}),
    defineField({name: "points", title: "Points", type: "number"}),
    defineField({name: "rating", title: "Rating", type: "number"}),
    defineField({name: "previousPosition", title: "Previous position", type: "number", validation: (Rule) => Rule.integer().positive()}),
    defineField({
      name: "status",
      title: "Entry status",
      type: "string",
      options: {list: [
        {title: "Ranked", value: "ranked"},
        {title: "Provisional", value: "provisional"},
        {title: "Inactive", value: "inactive"},
        {title: "Unmatched", value: "unmatched"},
      ]},
      initialValue: "unmatched",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {athlete: "athlete.name", sourceDisplayName: "sourceDisplayName", position: "position"},
    prepare({athlete, sourceDisplayName, position}) {
      return {title: athlete || sourceDisplayName || "Unmatched ranking entry", subtitle: position ? `Position ${position}` : "No ordinal position"}
    },
  },
})

export const sportingMeasurement = defineType({
  name: "sportingMeasurement",
  title: "Sporting measurement",
  type: "object",
  fields: [
    defineField({name: "measurementType", title: "Measurement type", type: "string", validation: (Rule) => Rule.required().max(100)}),
    defineField({name: "value", title: "Value", type: "number", validation: (Rule) => Rule.required()}),
    defineField({name: "unit", title: "Unit", type: "string", validation: (Rule) => Rule.required().max(30)}),
    defineField({name: "measuredAt", title: "Measured at", type: "datetime"}),
    defineField({name: "source", title: "Source", type: "provenanceSource", validation: (Rule) => Rule.required()}),
  ],
})

export const resultPerformance = defineType({
  name: "resultPerformance",
  title: "Result performance",
  type: "object",
  fields: [
    defineField({name: "metric", title: "Metric", type: "string", validation: (Rule) => Rule.required().max(100)}),
    defineField({name: "value", title: "Value", type: "number", description: "Leave empty when unknown; unknown is not zero."}),
    defineField({name: "unit", title: "Unit", type: "string", validation: (Rule) => Rule.max(30)}),
    defineField({name: "status", title: "Attempt status", type: "string", options: {list: [
      {title: "Completed", value: "completed"},
      {title: "Did not start", value: "dns"},
      {title: "Disqualified", value: "disqualified"},
      {title: "Withdrawn", value: "withdrawn"},
    ]}, validation: (Rule) => Rule.required()}),
  ],
})

export const teamBranding = defineType({
  name: "teamBranding",
  title: "Team branding",
  type: "object",
  fields: [
    defineField({name: "primaryColor", title: "Primary color", type: "string", validation: (Rule) => Rule.required().regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "secondaryColor", title: "Secondary color", type: "string", validation: (Rule) => Rule.required().regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "accentColor", title: "Accent color", type: "string", validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "crest", title: "Crest", type: "accessibleImage"}),
    defineField({name: "wordmark", title: "Wordmark", type: "accessibleImage"}),
    defineField({name: "uniformNotes", title: "Uniform notes", type: "text", rows: 4, validation: (Rule) => Rule.max(1000)}),
    defineField({name: "approvalStatus", title: "Branding approval status", type: "string", options: {list: [
      {title: "Not reviewed", value: "not-reviewed"},
      {title: "In review", value: "in-review"},
      {title: "Approved", value: "approved"},
    ]}, initialValue: "not-reviewed", validation: (Rule) => Rule.required()}),
  ],
})

export const teamSocialLink = defineType({
  name: "teamSocialLink",
  title: "Team social link",
  type: "object",
  fields: [
    defineField({name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required().max(80)}),
    defineField({name: "url", title: "URL", type: "url", validation: (Rule) => Rule.required().uri({scheme: ["http", "https"]})}),
  ],
})

export const teamSeasonMember = defineType({
  name: "teamSeasonMember",
  title: "Team season member",
  type: "object",
  fields: [
    defineField({name: "athlete", title: "Athlete", type: "reference", to: [{type: "athlete"}], validation: (Rule) => Rule.required()}),
    defineField({name: "role", title: "Roster role", type: "string", options: {list: ["starter", "reserve", "coach", "manager", "administrator", "media-manager"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "specialty", title: "WCL specialty", type: "string", options: {list: ["strength", "control", "endurance", "freestyle"]}}),
    defineField({name: "athleteNumber", title: "Athlete number", type: "string", validation: (Rule) => Rule.max(12)}),
    defineField({name: "captain", title: "Captain", type: "boolean", initialValue: false}),
    defineField({name: "joinedAt", title: "Joined at", type: "date"}),
    defineField({name: "leftAt", title: "Left at", type: "date"}),
    defineField({name: "membershipStatus", title: "Membership status", type: "string", options: {list: ["proposed", "active", "inactive", "transferred"]}, initialValue: "proposed", validation: (Rule) => Rule.required()}),
    defineField({name: "consentStatus", title: "Consent status", type: "string", options: {list: ["pending", "accepted", "declined", "revoked"]}, initialValue: "pending", validation: (Rule) => Rule.required()}),
    defineField({name: "verificationStatus", title: "Verification status", type: "string", options: {list: ["unverified", "editor-confirmed", "league-confirmed"]}, initialValue: "unverified", validation: (Rule) => Rule.required()}),
  ],
})

export const wclEquipmentCompliance = defineType({
  name: "wclEquipmentCompliance",
  title: "WCL equipment compliance",
  type: "object",
  fields: [
    defineField({name: "inspectionStatus", title: "Inspection status", type: "string", options: {list: ["not-inspected", "pending", "compliant", "non-compliant"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "specificationVersion", title: "Specification version", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "calibrationStatus", title: "Calibration status", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "scaleStatus", title: "Scale status", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "apparatusCompliant", title: "Competition apparatus compliant", type: "boolean"}),
    defineField({name: "safetyEquipmentCompliant", title: "Safety equipment compliant", type: "boolean"}),
    defineField({name: "notes", title: "Official notes", type: "text", rows: 3, validation: (Rule) => Rule.max(1000)}),
  ],
})

export const externalAlias = defineType({
  name: "externalAlias",
  title: "External alias",
  type: "object",
  fields: [
    defineField({name: "name", title: "Alias", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "source", title: "Source", type: "provenanceSource"}),
  ],
})
