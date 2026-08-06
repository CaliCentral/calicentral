import {defineArrayMember, defineField, defineType} from "sanity"

import {
  competitionStatusOptions,
  disciplineCodeOptions,
  prototypeStatusOptions,
  registrationStatusOptions,
  resultsStatusOptions,
  scheduleStatusOptions,
} from "../constants"
import {
  validateCompetitionEndDate,
  validateCompetitionResults,
  validateCompetitionResultsStatus,
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueReferences,
} from "../validation"

export const competition = defineType({
  name: "competition",
  title: "Competition",
  type: "document",
  groups: [
    {name: "overview", title: "Overview", default: true},
    {name: "operations", title: "Operations"},
    {name: "field", title: "Field & results"},
    {name: "media", title: "Media"},
    {name: "relationships", title: "Related content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "shortName",
      title: "Short name",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "overview",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "eventNumber",
      title: "Event number",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "status",
      title: "Event status",
      type: "string",
      group: "overview",
      options: {list: competitionStatusOptions, layout: "radio"},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      group: "overview",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      group: "overview",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          validateCompetitionEndDate(value, context),
        ),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "state",
      title: "State or province",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "venueName",
      title: "Venue name",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "venueType",
      title: "Venue type",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      group: "overview",
      validation: (Rule) => Rule.required().min(40).max(400),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "portableText",
      group: "overview",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      group: "overview",
      of: [
        defineArrayMember({
          type: "string",
          options: {list: disciplineCodeOptions},
        }),
      ],
      validation: (Rule) => Rule.required().min(1).max(6).unique(),
    }),
    defineField({
      name: "primaryDiscipline",
      title: "Primary discipline",
      type: "string",
      group: "overview",
      options: {list: disciplineCodeOptions},
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const disciplines = Array.isArray(context.document?.disciplines)
            ? context.document.disciplines
            : []

          return !value || disciplines.includes(value)
            ? true
            : "The primary discipline must also appear in Disciplines."
        }),
    }),
    defineField({
      name: "divisions",
      title: "Divisions",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionDivision"})],
      validation: (Rule) => Rule.required().min(1).max(50).unique(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "overview",
      initialValue: false,
    }),
    defineField({
      name: "registrationStatus",
      title: "Registration status",
      type: "string",
      group: "operations",
      options: {list: registrationStatusOptions, layout: "radio"},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "scheduleStatus",
      title: "Schedule status",
      type: "string",
      group: "operations",
      options: {list: scheduleStatusOptions, layout: "radio"},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resultsStatus",
      title: "Results status",
      type: "string",
      group: "operations",
      options: {list: resultsStatusOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.required().custom((value, context) =>
          validateCompetitionResultsStatus(value, context),
        ),
    }),
    defineField({
      name: "capacityLabel",
      title: "Capacity label",
      type: "string",
      group: "operations",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "organizerName",
      title: "Organizer name",
      type: "string",
      group: "operations",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "competitionFormat",
      title: "Competition format",
      type: "string",
      group: "operations",
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: "schedule",
      title: "Schedule",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionScheduleItem"})],
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "participants",
      title: "Participants",
      type: "array",
      group: "field",
      of: [defineArrayMember({type: "competitionParticipant"})],
      validation: (Rule) =>
        Rule.max(500).custom((value) =>
          validateUniqueReferences(value, "athlete"),
        ),
    }),
    defineField({
      name: "results",
      title: "Results",
      type: "array",
      group: "field",
      description:
        "Result entries are limited to completed competitions and must remain clearly marked as sample data when unverified.",
      of: [defineArrayMember({type: "competitionResult"})],
      validation: (Rule) =>
        Rule.max(500).custom((value, context) => {
          const statusValidation = validateCompetitionResults(value, context)

          return statusValidation === true
            ? validateUniqueReferences(value, "athlete")
            : statusValidation
        }),
    }),
    defineField({
      name: "timeline",
      title: "Timeline",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "timelineEntry"})],
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: "notices",
      title: "Notices",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionNotice"})],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "accessibleImage",
      group: "media",
    }),
    defineField({
      name: "visualVariant",
      title: "Visual variant",
      type: "string",
      group: "media",
      options: {
        list: [
          {title: "Signal", value: "signal"},
          {title: "Field", value: "field"},
          {title: "Frame", value: "frame"},
        ],
      },
      initialValue: "signal",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "relatedStories",
      title: "Related stories",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "story"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "relatedAthletes",
      title: "Related athletes",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "athlete"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(12)
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "relatedCompetitions",
      title: "Related competitions",
      type: "array",
      group: "relationships",
      of: [
        defineArrayMember({type: "reference", to: [{type: "competition"}]}),
      ],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value, context) => {
            const unique = validateUniqueReferences(value)

            return unique === true
              ? validateNoSelfReference(value, context)
              : unique
          }),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      group: "metadata",
      options: {list: prototypeStatusOptions, layout: "radio"},
      initialValue: "sample-record",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "metadata",
    }),
  ],
  orderings: [
    {
      title: "Start date, soonest",
      name: "startDateAsc",
      by: [{field: "startDate", direction: "asc"}],
    },
    {
      title: "Start date, newest",
      name: "startDateDesc",
      by: [{field: "startDate", direction: "desc"}],
    },
    {
      title: "Name, A–Z",
      name: "nameAsc",
      by: [{field: "name", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "name",
      shortName: "shortName",
      status: "status",
      startDate: "startDate",
      city: "city",
      prototypeStatus: "prototypeStatus",
      media: "heroImage",
    },
    prepare({
      title,
      shortName,
      status,
      startDate,
      city,
      prototypeStatus,
      media,
    }) {
      return {
        title: title || shortName || "Untitled competition",
        subtitle: [startDate, city, status, prototypeStatus]
          .filter(Boolean)
          .join(" · "),
        media,
      }
    },
  },
})
