import {defineField, defineType} from "sanity"

import {movementDirectionOptions} from "../constants"
import {validateMovementAmount} from "../validation"

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
      title: "Points",
      type: "number",
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
