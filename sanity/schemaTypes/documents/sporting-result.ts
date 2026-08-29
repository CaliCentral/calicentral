import {defineArrayMember, defineField, defineType} from "sanity"

export const sportingResult = defineType({
  name: "sportingResult",
  title: "Structured sporting result",
  type: "document",
  fields: [
    defineField({name: "competition", title: "Competition edition", type: "reference", to: [{type: "competition"}], validation: (Rule) => Rule.required()}),
    defineField({name: "athlete", title: "Athlete", type: "reference", to: [{type: "athlete"}]}),
    defineField({name: "team", title: "Team", type: "reference", to: [{type: "team"}]}),
    defineField({name: "ruleset", title: "Ruleset used", type: "reference", to: [{type: "ruleset"}]}),
    defineField({name: "division", title: "Division", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "event", title: "Event", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "placement", title: "Placement", type: "number", validation: (Rule) => Rule.integer().positive()}),
    defineField({name: "performances", title: "Performances", type: "array", of: [defineArrayMember({type: "resultPerformance"})], validation: (Rule) => Rule.max(30)}),
    defineField({name: "penalties", title: "Penalties", type: "number"}),
    defineField({name: "resultStatus", title: "Result status", type: "string", options: {list: ["imported", "submitted", "provisional", "source-confirmed", "official", "corrected", "disputed", "disqualified", "withdrawn", "superseded"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "source", title: "Source provenance", type: "provenanceSource", validation: (Rule) => Rule.required()}),
    defineField({name: "equipmentCompliance", title: "WCL equipment compliance", type: "wclEquipmentCompliance"}),
    defineField({name: "supersedes", title: "Supersedes result", type: "reference", to: [{type: "sportingResult"}]}),
  ],
  preview: {select: {athlete: "athlete.name", team: "team.name", event: "event", status: "resultStatus"}, prepare({athlete, team, event, status}) {return {title: athlete || team || "Result", subtitle: [event, status].filter(Boolean).join(" · ")}}},
})

