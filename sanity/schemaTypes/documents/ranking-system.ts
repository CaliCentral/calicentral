import {defineField, defineType} from "sanity"
import {validateSlugLength} from "../validation"

export const rankingSystem = defineType({
  name: "rankingSystem",
  title: "Athlete ranking system",
  type: "document",
  fields: [
    defineField({name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required().max(160)}),
    defineField({name: "slug", title: "Slug", type: "slug", options: {source: "name", maxLength: 96}, validation: (Rule) => Rule.required().custom(validateSlugLength)}),
    defineField({name: "provider", title: "Provider", type: "reference", to: [{type: "rankingProvider"}], validation: (Rule) => Rule.required()}),
    defineField({name: "rankingKind", title: "Ranking kind", type: "string", options: {list: ["ordinal-position", "points", "rating", "season-standings", "qualification-ranking", "record-leaderboard", "relative-strength"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "discipline", title: "Discipline", type: "string", validation: (Rule) => Rule.required().max(100)}),
    defineField({name: "movement", title: "Movement", type: "string", validation: (Rule) => Rule.max(100)}),
    defineField({name: "category", title: "Category", type: "string", validation: (Rule) => Rule.max(100)}),
    defineField({name: "division", title: "Division", type: "string", validation: (Rule) => Rule.max(100)}),
    defineField({name: "weightClass", title: "Weight class", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "sexDivision", title: "Source-defined sex/division", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "ageGroup", title: "Source-defined age group", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "geographicScope", title: "Geographic scope", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "methodologyVersion", title: "Methodology version", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "methodologyNotes", title: "Methodology notes", type: "text", rows: 5, validation: (Rule) => Rule.max(2000)}),
    defineField({name: "status", title: "Status", type: "string", options: {list: ["draft", "active", "inactive"]}, initialValue: "draft", validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: "name", provider: "provider.name", discipline: "discipline"}, prepare({title, provider, discipline}) {return {title, subtitle: [provider, discipline].filter(Boolean).join(" · ")}}},
})

