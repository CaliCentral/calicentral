import {defineField, defineType} from "sanity"

import {prototypeStatusOptions} from "../constants"
import {validateSlugLength} from "../validation"

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "initials",
      title: "Initials",
      type: "string",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(4)
          .uppercase()
          .regex(/^[A-Z0-9]+$/, {name: "uppercase initials"}),
    }),
    defineField({
      name: "shortBio",
      title: "Short biography",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "accessibleImage",
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
      title: "Name, A–Z",
      name: "nameAsc",
      by: [{field: "name", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "name",
      role: "role",
      status: "prototypeStatus",
      media: "portrait",
    },
    prepare({title, role, status, media}) {
      return {
        title: title || "Unnamed author",
        subtitle: [role, status].filter(Boolean).join(" · "),
        media,
      }
    },
  },
})
