import {defineArrayMember, defineField, defineType} from "sanity"

import {
  prototypeStatusOptions,
  rankingStatusOptions,
  standingMethodologyStatusOptions,
  standingScopeOptions,
} from "../constants"
import {
  validateSlugLength,
  validateStandingPublicationStatus,
  validateUniqueNumbers,
  validateUniqueReferences,
} from "../validation"

export const rankingCategory = defineType({
  name: "rankingCategory",
  title: "Standing category",
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
      title: "Geographic scope label",
      type: "string",
      group: "category",
      description: "Use “Worldwide” unless the board has a narrower documented scope.",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "scope",
      title: "Standing scope",
      type: "string",
      group: "category",
      options: {list: standingScopeOptions, layout: "radio"},
      initialValue: "competition",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Publication status",
      type: "string",
      group: "category",
      options: {list: rankingStatusOptions, layout: "radio"},
      initialValue: "draft",
      validation: (Rule) =>
        Rule.required().custom((value, context) =>
          validateStandingPublicationStatus(value, context),
        ),
    }),
    defineField({
      name: "methodologyStatus",
      title: "Methodology status",
      type: "string",
      group: "standings",
      options: {list: standingMethodologyStatusOptions, layout: "radio"},
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seasonLabel",
      title: "Season label",
      type: "string",
      group: "category",
      description: "For example, “2027 season”. Required before publication.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "seasonStart",
      title: "Season start",
      type: "date",
      group: "category",
    }),
    defineField({
      name: "seasonEnd",
      title: "Season end",
      type: "date",
      group: "category",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const start = context.document?.seasonStart

          return !value || typeof start !== "string" || value >= start
            ? true
            : "Season end cannot be before season start."
        }),
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
        Rule.max(500)
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
        "Explain eligibility, sources, season boundaries, ties, corrections, disputes, and any scoring rules.",
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
        title: title || "Untitled standing category",
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
