import {defineArrayMember, defineField, defineType} from "sanity"

import {
  athleteDisciplineOptions,
  prototypeStatusOptions,
} from "../constants"
import {
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueReferences,
} from "../validation"

export const athlete = defineType({
  name: "athlete",
  title: "Athlete",
  type: "document",
  groups: [
    {name: "profile", title: "Profile", default: true},
    {name: "record", title: "Record"},
    {name: "media", title: "Media"},
    {name: "relationships", title: "Related content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "profile",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "initials",
      title: "Initials",
      type: "string",
      group: "profile",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(4)
          .uppercase()
          .regex(/^[A-Z0-9]+$/, {name: "uppercase initials"}),
    }),
    defineField({
      name: "profileNumber",
      title: "Profile number",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "profileStatus",
      title: "Profile status",
      type: "string",
      group: "profile",
      description:
        "A truthful public status label, such as “Fictional athlete profile”.",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "state",
      title: "State or province",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "primaryDiscipline",
      title: "Primary discipline",
      type: "string",
      group: "profile",
      options: {list: athleteDisciplineOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "secondaryDisciplines",
      title: "Secondary disciplines",
      type: "array",
      group: "profile",
      of: [
        defineArrayMember({
          type: "string",
          options: {list: athleteDisciplineOptions},
        }),
      ],
      validation: (Rule) => Rule.max(5).unique(),
    }),
    defineField({
      name: "profileLabel",
      title: "Profile label",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "disciplineCode",
      title: "Discipline code",
      type: "string",
      group: "profile",
      description: "Optional compact editorial display code.",
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: "shortBio",
      title: "Short biography",
      type: "text",
      rows: 4,
      group: "profile",
      validation: (Rule) => Rule.required().min(40).max(500),
    }),
    defineField({
      name: "fullProfile",
      title: "Full profile",
      type: "portableText",
      group: "profile",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "quote",
      title: "Profile quote",
      type: "text",
      rows: 3,
      group: "profile",
      validation: (Rule) => Rule.max(360),
    }),
    defineField({
      name: "trainingBase",
      title: "Training base",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "yearsActive",
      title: "Years active",
      type: "string",
      group: "profile",
      description:
        "A truthful display label; sample records should retain their disclosure wording.",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "styleLabel",
      title: "Style label",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "profile",
      initialValue: false,
    }),
    defineField({
      name: "rankingEligible",
      title: "Ranking eligible",
      type: "boolean",
      group: "profile",
      description:
        "Eligibility does not imply a verified or official ranking.",
      initialValue: false,
    }),
    defineField({
      name: "statistics",
      title: "Statistics",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "athleteStatistic"})],
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: "achievements",
      title: "Achievements",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "athleteAchievement"})],
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: "timeline",
      title: "Timeline",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "timelineEntry"})],
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: "profileImage",
      title: "Profile image",
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
          {title: "Frame", value: "frame"},
          {title: "Motion", value: "motion"},
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
      title: "Name, A–Z",
      name: "nameAsc",
      by: [{field: "name", direction: "asc"}],
    },
    {
      title: "Profile number",
      name: "profileNumberAsc",
      by: [{field: "profileNumber", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "name",
      number: "profileNumber",
      discipline: "primaryDiscipline",
      location: "city",
      status: "prototypeStatus",
      media: "profileImage",
    },
    prepare({title, number, discipline, location, status, media}) {
      return {
        title: title || "Unnamed athlete",
        subtitle: [
          number && `#${number}`,
          discipline,
          location,
          status,
        ]
          .filter(Boolean)
          .join(" · "),
        media,
      }
    },
  },
})
