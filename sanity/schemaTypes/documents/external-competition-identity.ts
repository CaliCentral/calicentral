import {defineField, defineType} from "sanity"

export const externalCompetitionIdentity = defineType({
  name: "externalCompetitionIdentity",
  title: "External competition identity",
  type: "document",
  description:
    "Private provider-to-canonical matching record. It preserves provider identity without making the canonical competition public.",
  fields: [
    defineField({
      name: "competition",
      title: "Canonical competition",
      type: "reference",
      to: [{type: "competition"}],
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "reference",
      to: [{type: "rankingProvider"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "providerCompetitionId",
      title: "Provider competition ID",
      type: "string",
      validation: (Rule) => Rule.required().max(180),
    }),
    defineField({
      name: "providerCompetitionUrl",
      title: "Provider competition URL",
      type: "url",
      validation: (Rule) => Rule.uri({scheme: ["http", "https"]}),
    }),
    defineField({
      name: "providerDisplayName",
      title: "Provider display name",
      type: "string",
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: "matchingStatus",
      title: "Matching status",
      type: "string",
      options: {
        list: [
          {title: "Unmatched", value: "unmatched"},
          {title: "Candidate", value: "candidate"},
          {title: "Confirmed", value: "confirmed"},
          {title: "Rejected", value: "rejected"},
          {title: "Manually linked", value: "manually-linked"},
          {title: "Do not auto-match", value: "do-not-auto-match"},
        ],
      },
      initialValue: "unmatched",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reviewStatus",
      title: "Review status",
      type: "string",
      options: {
        list: [
          {title: "Not reviewed", value: "not-reviewed"},
          {title: "In review", value: "in-review"},
          {title: "Reviewed", value: "reviewed"},
        ],
      },
      initialValue: "not-reviewed",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "privateReviewNotes",
      title: "Private review notes",
      type: "text",
      rows: 5,
      description: "Internal notes. Never include this field in public or admin list projections.",
      validation: (Rule) => Rule.max(2000),
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "providerDisplayName",
      provider: "provider.name",
      status: "matchingStatus",
    },
    prepare({title, provider, status}) {
      return {
        title: title || "External competition",
        subtitle: [provider, status].filter(Boolean).join(" · "),
      }
    },
  },
})
