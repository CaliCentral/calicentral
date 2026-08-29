import {defineArrayMember, defineField, defineType} from "sanity"

export const ruleset = defineType({
  name: "ruleset",
  title: "Ruleset metadata",
  type: "document",
  fields: [
    defineField({name: "organization", title: "Organization", type: "reference", to: [{type: "organization"}], validation: (Rule) => Rule.required()}),
    defineField({name: "version", title: "Version", type: "string", validation: (Rule) => Rule.required().max(60)}),
    defineField({name: "status", title: "Status", type: "string", options: {list: [
      {title: "Current", value: "current"},
      {title: "Historical", value: "historical"},
      {title: "Proposed", value: "proposed"},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: "effectiveFrom", title: "Effective from", type: "date"}),
    defineField({name: "effectiveTo", title: "Effective to", type: "date"}),
    defineField({name: "implementationNotes", title: "Implementation notes", type: "text", rows: 5, validation: (Rule) => Rule.max(2000)}),
    defineField({name: "source", title: "Rulebook provenance", type: "provenanceSource", validation: (Rule) => Rule.required()}),
    defineField({name: "matchSequence", title: "Match sequence", type: "array", of: [defineArrayMember({type: "string"})], validation: (Rule) => Rule.max(20)}),
  ],
  preview: {
    select: {organization: "organization.name", version: "version", status: "status"},
    prepare({organization, version, status}) {return {title: `${organization || "Organization"} ${version || "Unversioned"}`, subtitle: status}},
  },
})

