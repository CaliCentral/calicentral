import {defineArrayMember, defineField, defineType} from "sanity"
import {validateSlugLength} from "../validation"

export const rankingProvider = defineType({
  name: "rankingProvider",
  title: "Ranking provider",
  type: "document",
  fields: [
    defineField({name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required().max(140)}),
    defineField({name: "slug", title: "Slug", type: "slug", options: {source: "name", maxLength: 96}, validation: (Rule) => Rule.required().custom(validateSlugLength)}),
    defineField({name: "organization", title: "Organization", type: "reference", to: [{type: "organization"}]}),
    defineField({name: "website", title: "Website", type: "url", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "description", title: "Description", type: "text", rows: 4, validation: (Rule) => Rule.required().max(1000)}),
    defineField({name: "status", title: "Status", type: "string", options: {list: ["active", "inactive", "under-review"]}, initialValue: "under-review", validation: (Rule) => Rule.required()}),
    defineField({name: "disciplines", title: "Disciplines", type: "array", of: [defineArrayMember({type: "string"})], validation: (Rule) => Rule.unique().max(20)}),
    defineField({name: "geographicScope", title: "Geographic scope", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "integrationMethod", title: "Integration method", type: "string", options: {list: ["manual", "editorial", "structured-import", "authorized-api", "licensed-feed"]}, initialValue: "manual", validation: (Rule) => Rule.required()}),
    defineField({name: "attributionRequirement", title: "Attribution requirement", type: "text", rows: 3, validation: (Rule) => Rule.required().max(1000)}),
    defineField({name: "sourcePolicyNotes", title: "Source policy notes", type: "text", rows: 4, validation: (Rule) => Rule.max(1500)}),
    defineField({name: "lastReviewedAt", title: "Last reviewed at", type: "datetime"}),
  ],
  preview: {select: {title: "name", status: "status", scope: "geographicScope"}, prepare({title, status, scope}) {return {title, subtitle: [status, scope].filter(Boolean).join(" · ")}}},
})

