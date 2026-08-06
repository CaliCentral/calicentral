import {defineArrayMember, defineField, defineType} from "sanity"

import {
  prototypeStatusOptions,
  videoCategoryOptions,
  videoFormatOptions,
  videoStatusOptions,
} from "../constants"
import {
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueNumbers,
  validateUniqueReferences,
} from "../validation"

function formatDuration(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined
  }

  const minutes = Math.floor(value / 60)
  const seconds = String(value % 60).padStart(2, "0")

  return `${minutes}:${seconds}`
}

export const video = defineType({
  name: "video",
  title: "Video",
  type: "document",
  groups: [
    {name: "editorial", title: "Editorial", default: true},
    {name: "record", title: "Video record"},
    {name: "media", title: "Poster"},
    {name: "relationships", title: "Related content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "editorial",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "shortTitle",
      title: "Short title",
      type: "string",
      group: "editorial",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "editorial",
      options: {source: "title", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "series",
      title: "Series",
      type: "reference",
      group: "editorial",
      to: [{type: "videoSeries"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "episodeNumber",
      title: "Episode number",
      type: "number",
      group: "editorial",
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "editorial",
      options: {list: videoCategoryOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "format",
      title: "Format",
      type: "string",
      group: "editorial",
      options: {list: videoFormatOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Publication status",
      type: "string",
      group: "editorial",
      options: {list: videoStatusOptions, layout: "radio"},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "durationSeconds",
      title: "Duration (seconds)",
      type: "number",
      group: "record",
      description:
        "The authoritative duration. Public interfaces format this numeric value.",
      validation: (Rule) =>
        Rule.required().integer().positive().max(24 * 60 * 60),
    }),
    defineField({
      name: "publishedAt",
      title: "Publication date",
      type: "date",
      group: "editorial",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "editorial",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      group: "editorial",
      validation: (Rule) => Rule.required().min(40).max(400),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "portableText",
      group: "editorial",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "editorialNotes",
      title: "Editorial notes",
      type: "array",
      group: "editorial",
      of: [defineArrayMember({type: "editorialNote"})],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "editorial",
      initialValue: false,
    }),
    defineField({
      name: "homepageFeatured",
      title: "Homepage featured",
      type: "boolean",
      group: "editorial",
      description:
        "Legacy editorial flag. The featured video in Site settings is authoritative.",
      initialValue: false,
    }),
    defineField({
      name: "posterImage",
      title: "Poster image",
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
          {title: "Handstand", value: "handstand"},
          {title: "Static", value: "static"},
          {title: "Motion", value: "motion"},
          {title: "Team", value: "team"},
          {title: "Field", value: "field"},
          {title: "Portrait", value: "portrait"},
          {title: "Competition", value: "competition"},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "posterLabel",
      title: "Poster label",
      type: "string",
      group: "media",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "frameCode",
      title: "Frame code",
      type: "string",
      group: "media",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "chapters",
      title: "Chapters",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "videoChapter"})],
      validation: (Rule) =>
        Rule.max(100).custom((value) =>
          validateUniqueNumbers(value, "timestampSeconds", "Chapter timestamps"),
        ),
    }),
    defineField({
      name: "transcript",
      title: "Transcript",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "transcriptBlock"})],
      validation: (Rule) => Rule.max(1000),
    }),
    defineField({
      name: "credits",
      title: "Credits",
      type: "array",
      group: "record",
      of: [defineArrayMember({type: "videoCredit"})],
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "metadata",
      of: [defineArrayMember({type: "string"})],
      validation: (Rule) => Rule.max(20).unique(),
    }),
    defineField({
      name: "availabilityLabel",
      title: "Availability label",
      type: "string",
      group: "metadata",
      description:
        "A truthful public label. This prototype schema intentionally stores no playback URL.",
      validation: (Rule) => Rule.required().max(120),
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
          .custom((value) => validateUniqueReferences(value)),
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
      name: "relatedVideos",
      title: "Related videos",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "video"}]})],
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
      initialValue: "fictional-prototype",
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
      title: "Publication date, newest",
      name: "publishedAtDesc",
      by: [{field: "publishedAt", direction: "desc"}],
    },
    {
      title: "Title, A–Z",
      name: "titleAsc",
      by: [{field: "title", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "title",
      seriesTitle: "series.title",
      episodeNumber: "episodeNumber",
      durationSeconds: "durationSeconds",
      status: "status",
      prototypeStatus: "prototypeStatus",
      media: "posterImage",
    },
    prepare({
      title,
      seriesTitle,
      episodeNumber,
      durationSeconds,
      status,
      prototypeStatus,
      media,
    }) {
      return {
        title: title || "Untitled video",
        subtitle: [
          seriesTitle,
          typeof episodeNumber === "number"
            ? `Episode ${episodeNumber}`
            : undefined,
          formatDuration(durationSeconds),
          status,
          prototypeStatus,
        ]
          .filter(Boolean)
          .join(" · "),
        media,
      }
    },
  },
})
