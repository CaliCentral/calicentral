import {defineField, defineType} from "sanity"

import {
  athleteSocialPlatformOptions,
  countryOptions,
  resultVerificationStatusOptions,
} from "../constants"

const validateUrlLength = (value: string | undefined) =>
  !value || value.length <= 2_000
    ? true
    : "URLs cannot exceed 2,000 characters."

export const athleteSocialLink = defineType({
  name: "athleteSocialLink",
  title: "Athlete social link",
  type: "object",
  fields: [
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      options: {list: athleteSocialPlatformOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "url",
      title: "Public profile URL",
      type: "url",
      description:
        "Link to the athlete's public account. Cali Central does not import or claim ownership of third-party content.",
      validation: (Rule) =>
        Rule.required()
          .uri({allowRelative: false, scheme: ["http", "https"]})
          .custom((value) => validateUrlLength(value)),
    }),
    defineField({
      name: "handle",
      title: "Public handle",
      type: "string",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "confirmationStatus",
      title: "Account confirmation",
      type: "string",
      description:
        "Confirmed means the editorial team reviewed control of this specific account. It is not legal identity verification.",
      options: {
        list: [
          {title: "Unconfirmed", value: "unconfirmed"},
          {title: "Confirmed", value: "confirmed"},
        ],
        layout: "radio",
      },
      initialValue: "unconfirmed",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: "handle", platform: "platform", status: "confirmationStatus"},
    prepare({title, platform, status}) {
      return {
        title: title || platform || "Social link",
        subtitle: [platform, status].filter(Boolean).join(" · "),
      }
    },
  },
})

export const athleteVerification = defineType({
  name: "athleteVerification",
  title: "Athlete verification",
  type: "object",
  description:
    "Separate profile-control and editorial-review states. Neither field verifies competition results.",
  fields: [
    defineField({
      name: "identityStatus",
      title: "Profile control",
      type: "string",
      description:
        "Profile control confirmed means Cali Central reasonably confirmed control of the claimed profile. It does not claim government or legal identity verification.",
      options: {
        list: [
          {title: "Unverified", value: "unverified"},
          {
            title: "Profile control confirmed",
            value: "profile-control-confirmed",
          },
        ],
        layout: "radio",
      },
      initialValue: "unverified",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "profileStatus",
      title: "Editorial profile review",
      type: "string",
      description:
        "Approved means the public profile passed editorial review. It does not verify every fact or any competition result.",
      options: {
        list: [
          {title: "Not reviewed", value: "not-reviewed"},
          {title: "Approved", value: "approved"},
        ],
        layout: "radio",
      },
      initialValue: "not-reviewed",
      validation: (Rule) => Rule.required(),
    }),
  ],
})

export const athleteCompetitionRecord = defineType({
  name: "athleteCompetitionRecord",
  title: "Athlete competition record",
  type: "object",
  description:
    "A source-aware result record. Profile approval and social confirmation do not verify this result.",
  fields: [
    defineField({
      name: "competition",
      title: "Cali Central competition",
      type: "reference",
      to: [{type: "competition"}],
    }),
    defineField({
      name: "eventName",
      title: "Published event name",
      type: "string",
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: "date",
      title: "Result date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      options: {list: countryOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "administrativeArea",
      title: "State, province, or region",
      type: "string",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "divisionCategory",
      title: "Division or category",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "placement",
      title: "Published placement",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "score",
      title: "Published score",
      type: "string",
      description:
        "Preserve the organizer's notation. Do not convert this into a world-record claim.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "verificationStatus",
      title: "Result verification",
      type: "string",
      options: {list: resultVerificationStatusOptions, layout: "radio"},
      initialValue: "unverified",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sourceLabel",
      title: "Public source label",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "sourceUrl",
      title: "Public result source URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({allowRelative: false, scheme: ["http", "https"]})
          .custom((value) => validateUrlLength(value))
          .custom((value, context) => {
            const parent = context.parent as
              | {verificationStatus?: string}
              | undefined

            return parent?.verificationStatus === "verified" && !value
              ? "A verified result requires a public source URL."
              : true
          }),
    }),
    defineField({
      name: "videoUrl",
      title: "Public video URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({allowRelative: false, scheme: ["http", "https"]}).custom(
          (value) => validateUrlLength(value),
        ),
    }),
  ],
  preview: {
    select: {
      eventName: "eventName",
      date: "date",
      divisionCategory: "divisionCategory",
      status: "verificationStatus",
    },
    prepare({eventName, date, divisionCategory, status}) {
      return {
        title: eventName || "Competition record",
        subtitle: [date, divisionCategory, status].filter(Boolean).join(" · "),
      }
    },
  },
})

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
