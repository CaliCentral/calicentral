import {defineArrayMember, defineField, defineType} from "sanity"

import {
  prototypeStatusOptions,
  rankingStatusOptions,
} from "../constants"
import {
  validateSlugLength,
  validateUniqueNumbers,
  validateUniqueReferences,
} from "../validation"

export const rankingCategory = defineType({
  name: "rankingCategory",
  title: "Ranking category",
  type: "document",
  groups: [
    {name: "category", title: "Category", default: true},
    {name: "standings", title: "Standings"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "category",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "category",
      options: {source: "title", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      group: "category",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      group: "category",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "division",
      title: "Division",
      type: "string",
      group: "category",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "category",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "status",
      title: "Ranking status",
      type: "string",
      group: "category",
      options: {list: rankingStatusOptions, layout: "radio"},
      initialValue: "prototype",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      group: "category",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      group: "category",
      validation: (Rule) => Rule.required().max(600),
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      group: "category",
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: "entries",
      title: "Entries",
      type: "array",
      group: "standings",
      of: [defineArrayMember({type: "rankingEntry"})],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(500)
          .custom((value) => {
            const uniqueRanks = validateUniqueNumbers(value, "rank", "Ranks")

            return uniqueRanks === true
              ? validateUniqueReferences(value, "athlete")
              : uniqueRanks
          }),
    }),
    defineField({
      name: "methodologyNote",
      title: "Methodology note",
      type: "text",
      rows: 4,
      group: "standings",
      description:
        "Explain the methodology and clearly disclose prototype or unofficial standings.",
      validation: (Rule) => Rule.required().max(1000),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      group: "metadata",
      options: {list: prototypeStatusOptions, layout: "radio"},
      initialValue: "not-official",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "metadata",
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrderAsc",
      by: [
        {field: "displayOrder", direction: "asc"},
        {field: "title", direction: "asc"},
      ],
    },
    {
      title: "Updated, newest",
      name: "updatedAtDesc",
      by: [{field: "updatedAt", direction: "desc"}],
    },
  ],
  preview: {
    select: {
      title: "title",
      discipline: "discipline",
      division: "division",
      region: "region",
      status: "status",
      updatedAt: "updatedAt",
    },
    prepare({title, discipline, division, region, status, updatedAt}) {
      return {
        title: title || "Untitled ranking category",
        subtitle: [
          discipline,
          division,
          region,
          status,
          typeof updatedAt === "string" ? updatedAt.slice(0, 10) : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
