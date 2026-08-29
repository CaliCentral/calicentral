import {defineArrayMember, defineField, defineType} from "sanity"

import {
  athleteCompetitionCategoryOptions,
  athleteDisciplineOptions,
  athleteSpecialtyOptions,
  countryOptions,
  prototypeStatusOptions,
} from "../constants"
import {
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueReferences,
  validateUniqueStringFields,
} from "../validation"

export const athlete = defineType({
  name: "athlete",
  title: "Athlete",
  type: "document",
  groups: [
    {name: "profile", title: "Profile", default: true},
    {name: "record", title: "Record"},
    {name: "media", title: "Media"},
    {name: "verification", title: "Social & verification"},
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
      description: "Optional public city or locality. Never enter a private address.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "state",
      title: "Legacy state or province",
      type: "string",
      group: "profile",
      description:
        "Legacy field retained during migration. Use Administrative area for new records.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "administrativeArea",
      title: "State, province, or region",
      type: "string",
      group: "profile",
      description:
        "Optional first-level administrative area. Countries do not all use states.",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      group: "profile",
      options: {list: countryOptions},
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "region",
      title: "Legacy editorial subregion",
      type: "string",
      group: "profile",
      description:
        "Legacy field retained for compatibility. It is not used as the global administrative-area filter.",
      validation: (Rule) => Rule.max(100),
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
      name: "primaryCategory",
      title: "Primary competition category",
      type: "string",
      group: "profile",
      description:
        "A flexible Cali Central category, not a claim of universal governing-body standardization.",
      options: {list: athleteCompetitionCategoryOptions},
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
      name: "specialties",
      title: "Specialties",
      type: "array",
      group: "profile",
      of: [
        defineArrayMember({
          type: "string",
          options: {list: athleteSpecialtyOptions},
        }),
      ],
      validation: (Rule) => Rule.max(12).unique(),
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
      validation: (Rule) => Rule.min(40).max(500),
    }),
    defineField({
      name: "fullProfile",
      title: "Full profile",
      type: "portableText",
      group: "profile",
      validation: (Rule) => Rule.min(1),
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
      title: "Legacy ranking eligible",
      type: "boolean",
      group: "profile",
      description:
        "Compatibility field for prototype ranking records. It is not displayed as athlete verification.",
      initialValue: false,
    }),
    defineField({
      name: "socialLinks",
      title: "Public social links",
      type: "array",
      group: "verification",
      of: [defineArrayMember({type: "athleteSocialLink"})],
      validation: (Rule) =>
        Rule.max(8).custom((value) =>
          validateUniqueStringFields(value, "platform", "Each social platform"),
        ),
    }),
    defineField({
      name: "verification",
      title: "Verification states",
      type: "athleteVerification",
      group: "verification",
      initialValue: {
        _type: "athleteVerification",
        identityStatus: "unverified",
        profileStatus: "not-reviewed",
      },
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
      name: "sportingMeasurements",
      title: "Sourced sporting measurements",
      type: "array",
      group: "record",
      description:
        "Structured value, unit, date, and provenance. Unknown values remain absent rather than zero.",
      of: [defineArrayMember({type: "sportingMeasurement"})],
      validation: (Rule) => Rule.max(30),
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
      name: "competitionHistory",
      title: "Competition history",
      type: "array",
      group: "record",
      description:
        "Result-level records with independent evidence status. Never infer verification from the athlete profile.",
      of: [defineArrayMember({type: "athleteCompetitionRecord"})],
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "profileImage",
      title: "Profile image",
      type: "accessibleImage",
      group: "media",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
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
      name: "relatedCompetitions",
      title: "Related competitions",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "competition"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "relatedVideos",
      title: "Related videos",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "video"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      group: "metadata",
      options: {list: prototypeStatusOptions, layout: "radio"},
      description:
        "Optional marker for fictional/sample content only. Leave empty for real internal athlete records; public eligibility is reviewed separately.",
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
