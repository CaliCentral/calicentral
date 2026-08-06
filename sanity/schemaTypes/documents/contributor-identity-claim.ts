import {defineField, defineType} from "sanity"

/**
 * Server-managed uniqueness claim for a normalized contributor email hash.
 * The raw address is never stored in this document or its identifier.
 */
export const contributorIdentityClaim = defineType({
  name: "contributorIdentityClaim",
  title: "Contributor identity claim",
  type: "document",
  readOnly: true,
  description:
    "Internal uniqueness guard for contributor provisioning. Managed only by trusted server transactions.",
  fields: [
    defineField({
      name: "contributor",
      title: "Contributor",
      type: "reference",
      readOnly: true,
      to: [{type: "contributorProfile"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      contributor: "contributor.displayName",
      createdAt: "createdAt",
    },
    prepare({contributor, createdAt}) {
      return {
        title: "Contributor identity claim",
        subtitle: [contributor, createdAt].filter(Boolean).join(" · "),
      }
    },
  },
})
