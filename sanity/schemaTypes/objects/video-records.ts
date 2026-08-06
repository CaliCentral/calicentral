import {defineField, defineType} from "sanity"

import {validateTimestampAgainstDuration} from "../validation"

export const videoChapter = defineType({
  name: "videoChapter",
  title: "Video chapter",
  type: "object",
  fields: [
    defineField({
      name: "timestampSeconds",
      title: "Timestamp (seconds)",
      type: "number",
      description: "Store the timestamp as a numeric offset, not formatted text.",
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(0)
          .custom((value, context) =>
            validateTimestampAgainstDuration(value, context),
          ),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(300),
    }),
  ],
  preview: {
    select: {title: "title", timestamp: "timestampSeconds"},
    prepare({title, timestamp}) {
      const seconds = typeof timestamp === "number" ? timestamp : 0
      const minutePart = Math.floor(seconds / 60)
      const secondPart = String(seconds % 60).padStart(2, "0")

      return {
        title: title || "Untitled chapter",
        subtitle: `${minutePart}:${secondPart}`,
      }
    },
  },
})

export const transcriptBlock = defineType({
  name: "transcriptBlock",
  title: "Transcript block",
  type: "object",
  fields: [
    defineField({
      name: "speaker",
      title: "Speaker",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "timestampSeconds",
      title: "Timestamp (seconds)",
      type: "number",
      validation: (Rule) =>
        Rule.integer()
          .min(0)
          .custom((value, context) =>
            validateTimestampAgainstDuration(value, context),
          ),
    }),
    defineField({
      name: "text",
      title: "Transcript text",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(2000),
    }),
  ],
  preview: {
    select: {title: "speaker", subtitle: "text"},
  },
})

export const videoCredit = defineType({
  name: "videoCredit",
  title: "Video credit",
  type: "object",
  fields: [
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      description:
        "A truthful public label such as “Fictional prototype credit”.",
      validation: (Rule) => Rule.required().max(100),
    }),
  ],
  preview: {
    select: {title: "name", role: "role", status: "status"},
    prepare({title, role, status}) {
      return {
        title: title || "Unnamed credit",
        subtitle: [role, status].filter(Boolean).join(" · "),
      }
    },
  },
})

export const editorialNote = defineType({
  name: "editorialNote",
  title: "Editorial note",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(1000),
    }),
  ],
  preview: {
    select: {title: "heading", subtitle: "text"},
  },
})
