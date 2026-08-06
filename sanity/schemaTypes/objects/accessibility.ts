import {defineField, defineType} from "sanity"

import {validateImageAlt} from "../validation"

export const accessibleImage = defineType({
  name: "accessibleImage",
  title: "Accessible image",
  type: "image",
  options: {
    hotspot: true,
  },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description:
        "Describe the image's purpose for people who cannot see it.",
      validation: (Rule) =>
        Rule.max(180).custom((value, context) =>
          validateImageAlt(value, context),
        ),
    }),
    defineField({
      name: "decorative",
      title: "Decorative image",
      type: "boolean",
      description:
        "Use only when the image adds no information. Alternative text must then be empty.",
      initialValue: false,
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "credit",
      title: "Credit",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: {
      title: "alt",
      decorative: "decorative",
      media: "asset",
    },
    prepare({title, decorative, media}) {
      return {
        title: decorative ? "Decorative image" : title || "Image needs alt text",
        media,
      }
    },
  },
})

export const seo = defineType({
  name: "seo",
  title: "Search and social",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "socialImage",
      title: "Social image",
      type: "accessibleImage",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      initialValue: false,
    }),
  ],
})
