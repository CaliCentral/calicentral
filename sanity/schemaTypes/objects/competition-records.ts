import {defineField, defineType} from "sanity"

import {
  disciplineCodeOptions,
  scheduleItemStatusOptions,
} from "../constants"

export const competitionDivision = defineType({
  name: "competitionDivision",
  title: "Competition division",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Identifier",
      type: "slug",
      options: {source: "name", maxLength: 80},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      options: {list: disciplineCodeOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "level",
      title: "Level",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "format",
      title: "Format",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "participantLimit",
      title: "Participant limit",
      type: "number",
      validation: (Rule) => Rule.integer().positive().max(10000),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
  ],
  preview: {
    select: {title: "name", discipline: "discipline", level: "level"},
    prepare({title, discipline, level}) {
      return {
        title: title || "Untitled division",
        subtitle: [discipline, level].filter(Boolean).join(" · "),
      }
    },
  },
})

export const competitionScheduleItem = defineType({
  name: "competitionScheduleItem",
  title: "Schedule item",
  type: "object",
  fields: [
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "A public, timezone-aware display value.",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "stage",
      title: "Stage",
      type: "string",
      validation: (Rule) => Rule.max(80),
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
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {list: scheduleItemStatusOptions},
      initialValue: "planned",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: "title", time: "time", stage: "stage"},
    prepare({title, time, stage}) {
      return {
        title: title || "Schedule item",
        subtitle: [time, stage].filter(Boolean).join(" · "),
      }
    },
  },
})

export const competitionParticipant = defineType({
  name: "competitionParticipant",
  title: "Competition participant",
  type: "object",
  fields: [
    defineField({
      name: "athlete",
      title: "Athlete",
      type: "reference",
      to: [{type: "athlete"}],
    }),
    defineField({
      name: "displayName",
      title: "Fallback display name",
      type: "string",
      description:
        "Use only when a participant does not yet have an athlete profile.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {athlete?: unknown} | undefined

          return parent?.athlete || value?.trim()
            ? true
            : "Choose an athlete or provide a fallback display name."
        }).max(100),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      options: {list: disciplineCodeOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seed",
      title: "Seed",
      type: "string",
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          {title: "Invited", value: "invited"},
          {title: "Sample entry", value: "sample-entry"},
          {title: "Preview", value: "preview"},
          {title: "Withdrawn", value: "withdrawn"},
        ],
      },
      initialValue: "sample-entry",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      athleteName: "athlete.name",
      displayName: "displayName",
      discipline: "discipline",
      seed: "seed",
    },
    prepare({athleteName, displayName, discipline, seed}) {
      return {
        title: athleteName || displayName || "Unnamed participant",
        subtitle: [discipline, seed && `Seed ${seed}`]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})

export const competitionResult = defineType({
  name: "competitionResult",
  title: "Competition result",
  type: "object",
  fields: [
    defineField({
      name: "placement",
      title: "Placement",
      type: "number",
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: "athlete",
      title: "Athlete",
      type: "reference",
      to: [{type: "athlete"}],
    }),
    defineField({
      name: "displayName",
      title: "Fallback display name",
      type: "string",
      description:
        "Use only when the result does not yet link to an athlete profile.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {athlete?: unknown} | undefined

          return parent?.athlete || value?.trim()
            ? true
            : "Choose an athlete or provide a fallback display name."
        }).max(100),
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "scoreDisplay",
      title: "Score display",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "resultLabel",
      title: "Result label",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "movementNote",
      title: "Movement note",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: {
      placement: "placement",
      athleteName: "athlete.name",
      displayName: "displayName",
      scoreDisplay: "scoreDisplay",
    },
    prepare({placement, athleteName, displayName, scoreDisplay}) {
      return {
        title: `${placement ? `#${placement}` : "—"} ${
          athleteName || displayName || "Unnamed result"
        }`,
        subtitle: scoreDisplay,
      }
    },
  },
})

export const competitionNotice = defineType({
  name: "competitionNotice",
  title: "Competition notice",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "text",
      title: "Notice",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "emphasis",
      title: "Emphasis",
      type: "string",
      options: {
        list: [
          {title: "Standard", value: "standard"},
          {title: "Signal", value: "signal"},
        ],
        layout: "radio",
      },
      initialValue: "standard",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: "label", subtitle: "text"},
  },
})
