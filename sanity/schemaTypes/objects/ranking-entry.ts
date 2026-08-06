import {defineArrayMember, defineField, defineType} from "sanity"

import {
  movementDirectionOptions,
  resultVerificationStatusOptions,
} from "../constants"
import {validateMovementAmount} from "../validation"

export const standingResultSource = defineType({
  name: "standingResultSource",
  title: "Verified result source",
  type: "object",
  fields: [
    defineField({
      name: "competition",
      title: "Competition",
      type: "reference",
      to: [{type: "competition"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resultKey",
      title: "Competition result key",
      type: "string",
      description:
        "The stable _key of the verified result inside the competition document.",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "sourceName",
      title: "Public source name",
      type: "string",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "sourceUrl",
      title: "Public source URL",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({allowRelative: false, scheme: ["http", "https"]}),
    }),
    defineField({
      name: "verificationStatus",
      title: "Verification status",
      type: "string",
      options: {list: resultVerificationStatusOptions, layout: "radio"},
      initialValue: "unverified",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "competition.name",
      sourceName: "sourceName",
      status: "verificationStatus",
    },
    prepare({title, sourceName, status}) {
      return {
        title: title || "Competition result source",
        subtitle: [sourceName, status].filter(Boolean).join(" · "),
      }
    },
  },
})

export const rankingEntry = defineType({
  name: "rankingEntry",
  title: "Ranking entry",
  type: "object",
  fields: [
    defineField({
      name: "rank",
      title: "Rank",
      type: "number",
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: "athlete",
      title: "Athlete",
      type: "reference",
      to: [{type: "athlete"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "points",
      title: "Standing points",
      type: "number",
      description:
        "Use only under the centrally documented and approved methodology.",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "movementDirection",
      title: "Movement direction",
      type: "string",
      options: {list: movementDirectionOptions, layout: "radio"},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "movementAmount",
      title: "Movement amount",
      type: "number",
      initialValue: 0,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(0)
          .custom((value, context) =>
            validateMovementAmount(value, context),
          ),
    }),
    defineField({
      name: "movementLabel",
      title: "Movement label",
      type: "string",
      description: "Required public label, including for hold and new entries.",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "status",
      title: "Entry status",
      type: "string",
      description:
        "A public disclosure label, such as “Illustrative standing”.",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "sources",
      title: "Verified result sources",
      type: "array",
      description:
        "Every public standing entry must trace to reviewed competition results.",
      of: [defineArrayMember({type: "standingResultSource"})],
      validation: (Rule) => Rule.unique().max(50),
    }),
  ],
  preview: {
    select: {
      rank: "rank",
      athleteName: "athlete.name",
      points: "points",
      movement: "movementLabel",
    },
    prepare({rank, athleteName, points, movement}) {
      return {
        title: `${rank ? `#${rank}` : "—"} ${athleteName || "No athlete"}`,
        subtitle: [
          typeof points === "number" ? `${points} pts` : undefined,
          movement,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
