import {defineField, defineType} from "sanity"

import {
  prototypeStatusOptions,
  videoCategoryOptions,
} from "../constants"
import {validateSlugLength} from "../validation"

export const videoSeries = defineType({
  name: "videoSeries",
  title: "Video series",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {source: "title", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "categoryFocus",
      title: "Category focus",
      type: "array",
      of: [
        {
          type: "string",
          options: {list: videoCategoryOptions},
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(5).unique(),
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      options: {list: prototypeStatusOptions, layout: "radio"},
      initialValue: "fictional-prototype",
      validation: (Rule) => Rule.required(),
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
  ],
  preview: {
    select: {
      title: "title",
      focus: "categoryFocus",
      displayOrder: "displayOrder",
      status: "prototypeStatus",
    },
    prepare({title, focus, displayOrder, status}) {
      const categories = Array.isArray(focus) ? focus.join(", ") : undefined

      return {
        title: title || "Untitled video series",
        subtitle: [
          typeof displayOrder === "number" ? `Order ${displayOrder}` : undefined,
          categories,
          status,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    },
  },
})
