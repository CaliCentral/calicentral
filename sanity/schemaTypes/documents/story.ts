import {defineArrayMember, defineField, defineType} from "sanity"

import {
  prototypeStatusOptions,
  storyCategoryOptions,
} from "../constants"
import {
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueReferences,
} from "../validation"

export const story = defineType({
  name: "story",
  title: "Story",
  type: "document",
  groups: [
    {name: "content", title: "Story", default: true},
    {name: "media", title: "Media"},
    {name: "relationships", title: "Related content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: {source: "title", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "content",
      options: {list: storyCategoryOptions},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 4,
      group: "content",
      validation: (Rule) => Rule.required().min(40).max(300),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{type: "author"}],
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "readTimeMinutes",
      title: "Read time (minutes)",
      type: "number",
      group: "content",
      validation: (Rule) => Rule.required().integer().positive().max(180),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "content",
      initialValue: false,
    }),
    defineField({
      name: "homepageFeatured",
      title: "Homepage featured",
      type: "boolean",
      group: "content",
      description:
        "Legacy editorial flag. The featured story in Site settings is authoritative.",
      initialValue: false,
    }),
    defineField({
      name: "issueNumber",
      title: "Issue number",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "portableText",
      group: "content",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "accessibleImage",
      group: "media",
    }),
    defineField({
      name: "heroVisualVariant",
      title: "Hero visual variant",
      type: "string",
      group: "media",
      options: {
        list: [
          {title: "Signal", value: "signal"},
          {title: "Field", value: "field"},
          {title: "Frame", value: "frame"},
        ],
      },
      initialValue: "signal",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "metadata",
      of: [defineArrayMember({type: "string"})],
      validation: (Rule) => Rule.max(12).unique(),
    }),
    defineField({
      name: "relatedStories",
      title: "Related stories",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "story"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(8)
          .custom((value, context) => {
            const unique = validateUniqueReferences(value)

            return unique === true
              ? validateNoSelfReference(value, context)
              : unique
          }),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      group: "metadata",
      options: {list: prototypeStatusOptions, layout: "radio"},
      initialValue: "fictional-prototype",
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
      title: "Publication date, newest",
      name: "publishedAtDesc",
      by: [{field: "publishedAt", direction: "desc"}],
    },
    {
      title: "Title, A–Z",
      name: "titleAsc",
      by: [{field: "title", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      publishedAt: "publishedAt",
      authorName: "author.name",
      status: "prototypeStatus",
      media: "heroImage",
    },
    prepare({title, category, publishedAt, authorName, status, media}) {
      const published =
        typeof publishedAt === "string" ? publishedAt.slice(0, 10) : undefined

      return {
        title: title || "Untitled story",
        subtitle: [category, published, authorName, status]
          .filter(Boolean)
          .join(" · "),
        media,
      }
    },
  },
})
