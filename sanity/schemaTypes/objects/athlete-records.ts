import {defineField, defineType} from "sanity"

export const athleteStatistic = defineType({
  name: "athleteStatistic",
  title: "Athlete statistic",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "value",
      title: "Display value",
      type: "string",
      description:
        "A presentation value such as “12 reps” or “00:42”. Do not enter a claim that has not been verified.",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "string",
      validation: (Rule) => Rule.max(140),
    }),
    defineField({
      name: "emphasis",
      title: "Emphasize",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: "label", value: "value", context: "context"},
    prepare({title, value, context}) {
      return {
        title: `${title || "Statistic"}: ${value || "No value"}`,
        subtitle: context,
      }
    },
  },
})

export const athleteAchievement = defineType({
  name: "athleteAchievement",
  title: "Athlete achievement",
  type: "object",
  fields: [
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (Rule) =>
        Rule.required().integer().min(1900).max(2200),
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
      rows: 3,
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: "status",
      title: "Verification status",
      type: "string",
      description:
        "A truthful display label such as “Sample recognition” or “Verified result”.",
      validation: (Rule) => Rule.required().max(80),
    }),
  ],
  preview: {
    select: {title: "title", year: "year", status: "status"},
    prepare({title, year, status}) {
      return {
        title: title || "Untitled achievement",
        subtitle: [year, status].filter(Boolean).join(" · "),
      }
    },
  },
})

export const timelineEntry = defineType({
  name: "timelineEntry",
  title: "Timeline entry",
  type: "object",
  fields: [
    defineField({
      name: "dateLabel",
      title: "Date label",
      type: "string",
      description: "A public display label, such as “Spring 2026”.",
      validation: (Rule) => Rule.required().max(80),
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
      rows: 3,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "type",
      title: "Entry type",
      type: "string",
      options: {
        list: [
          {title: "Training", value: "Training"},
          {title: "Discipline", value: "Discipline"},
          {title: "Community", value: "Community"},
          {title: "Development", value: "Development"},
          {title: "Competition", value: "Competition"},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Workflow status",
      type: "string",
      description:
        "Optional event-timeline state used by competition records.",
      options: {
        list: [
          {title: "Complete", value: "complete"},
          {title: "Current", value: "current"},
          {title: "Pending", value: "pending"},
          {title: "Paused", value: "paused"},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      dateLabel: "dateLabel",
      type: "type",
      status: "status",
    },
    prepare({title, dateLabel, type, status}) {
      return {
        title: title || "Timeline entry",
        subtitle: [dateLabel, type, status].filter(Boolean).join(" · "),
      }
    },
  },
})
