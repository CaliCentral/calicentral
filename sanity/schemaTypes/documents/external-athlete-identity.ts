import {defineArrayMember, defineField, defineType} from "sanity"

export const externalAthleteIdentity = defineType({
  name: "externalAthleteIdentity",
  title: "External athlete identity",
  type: "document",
  description: "Private provider-to-canonical matching record. Never use names alone to merge athletes or project review notes publicly.",
  fields: [
    defineField({name: "athlete", title: "Canonical athlete", type: "reference", to: [{type: "athlete"}]}),
    defineField({name: "provider", title: "Provider", type: "reference", to: [{type: "rankingProvider"}], validation: (Rule) => Rule.required()}),
    defineField({name: "providerAthleteId", title: "Provider athlete ID", type: "string", validation: (Rule) => Rule.required().max(180)}),
    defineField({name: "providerAthleteUrl", title: "Provider athlete URL", type: "url", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "providerDisplayName", title: "Provider display name", type: "string", validation: (Rule) => Rule.required().max(140)}),
    defineField({name: "aliases", title: "Preserved aliases", type: "array", of: [defineArrayMember({type: "externalAlias"})], validation: (Rule) => Rule.max(20)}),
    defineField({name: "matchingStatus", title: "Matching status", type: "string", options: {list: ["unmatched", "candidate", "confirmed", "rejected", "manually-linked", "do-not-auto-match"]}, initialValue: "unmatched", validation: (Rule) => Rule.required()}),
    defineField({name: "reviewStatus", title: "Review status", type: "string", options: {list: ["not-reviewed", "in-review", "reviewed"]}, initialValue: "not-reviewed", validation: (Rule) => Rule.required()}),
    defineField({name: "privateReviewNotes", title: "Private review notes", type: "text", rows: 5, validation: (Rule) => Rule.max(2000)}),
    defineField({name: "createdAt", title: "Created at", type: "datetime", validation: (Rule) => Rule.required()}),
    defineField({name: "updatedAt", title: "Updated at", type: "datetime", validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: "providerDisplayName", provider: "provider.name", status: "matchingStatus"}, prepare({title, provider, status}) {return {title, subtitle: [provider, status].filter(Boolean).join(" · ")}}},
})

