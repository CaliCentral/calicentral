import {defineField, defineType} from "sanity"

/**
 * A revision-guarded lock used only to serialize high-risk administrator
 * mutations. It contains no identity, content, or secret values.
 */
export const operationalLock = defineType({
  name: "operationalLock",
  title: "Operational lock",
  type: "document",
  readOnly: true,
  description:
    "Internal transaction guard. Managed only by trusted server operations.",
  fields: [
    defineField({
      name: "purpose",
      title: "Purpose",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required().min(1).max(120),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: "purpose", updatedAt: "updatedAt"},
    prepare({title, updatedAt}) {
      return {
        title: title || "Operational lock",
        subtitle: typeof updatedAt === "string" ? updatedAt : undefined,
      }
    },
  },
})
