import {defineArrayMember, defineField, defineType} from "sanity"

import {prototypeStatusOptions} from "../constants"
import {
  contributorAccessStatusOptions,
  contributorRoleOptions,
  optionTitle,
  validateOptionValue,
} from "../operations-constants"

const validateNormalizedEmail = (value: string | undefined) => {
  if (!value) {
    return true
  }

  return value === value.trim().toLowerCase()
    ? true
    : "Store the trimmed, lowercase email address."
}

const validateUrlLength = (value: string | undefined) =>
  !value || value.length <= 2_000
    ? true
    : "URLs cannot exceed 2,000 characters."

export const contributorProfile = defineType({
  name: "contributorProfile",
  title: "Contributor profile",
  type: "document",
  readOnly: true,
  description:
    "Private portal identity and access record. This is not a public athlete profile.",
  groups: [
    {name: "profile", title: "Contributor profile", default: true},
    {name: "identity", title: "Private identity"},
    {name: "access", title: "Access"},
    {name: "relationships", title: "Editorial relationships"},
    {name: "internal", title: "Internal"},
    {name: "system", title: "Managed timestamps"},
  ],
  fields: [
    defineField({
      name: "displayName",
      title: "Display name",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().min(2).max(80),
    }),
    defineField({
      name: "biography",
      title: "Short biography",
      type: "text",
      rows: 5,
      group: "profile",
      validation: (Rule) => Rule.max(1_000),
    }),
    defineField({
      name: "location",
      title: "Public location",
      type: "string",
      group: "profile",
      description:
        "Use a general city, region, or training base. Do not store a private address.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "areasOfInterest",
      title: "Areas of interest",
      type: "array",
      group: "profile",
      of: [
        defineArrayMember({
          type: "string",
          validation: (Rule) => Rule.min(1).max(80),
        }),
      ],
      validation: (Rule) => Rule.unique().max(8),
    }),
    defineField({
      name: "normalizedEmail",
      title: "Normalized email",
      type: "string",
      group: "identity",
      readOnly: true,
      description:
        "Private authentication identifier. Never expose this field in public queries.",
      validation: (Rule) =>
        Rule.required()
          .email()
          .max(254)
          .custom((value) => validateNormalizedEmail(value)),
    }),
    defineField({
      name: "authProvider",
      title: "Authentication provider",
      type: "string",
      group: "identity",
      readOnly: true,
      options: {
        list: [
          {title: "Google", value: "google"},
          {title: "GitHub", value: "github"},
        ],
      },
      validation: (Rule) =>
        Rule.required().custom((value) =>
          ["google", "github"].includes(value || "")
            ? true
            : "Choose a supported authentication provider.",
        ),
    }),
    defineField({
      name: "providerAccountId",
      title: "Provider account ID",
      type: "string",
      group: "identity",
      readOnly: true,
      description:
        "Stable provider identifier. OAuth access and refresh tokens are never stored here.",
      validation: (Rule) => Rule.required().min(1).max(255),
    }),
    defineField({
      name: "avatarUrl",
      title: "Avatar URL",
      type: "url",
      group: "identity",
      readOnly: true,
      validation: (Rule) =>
        Rule.uri({
          allowRelative: false,
          scheme: ["https"],
        }).custom((value) => validateUrlLength(value)),
    }),
    defineField({
      name: "role",
      title: "Portal role",
      type: "string",
      group: "access",
      readOnly: true,
      description:
        "Managed by trusted server actions. Bootstrap allowlists remain authoritative.",
      options: {list: contributorRoleOptions, layout: "radio"},
      initialValue: "contributor",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            contributorRoleOptions,
            value,
            "portal role",
          ),
        ),
    }),
    defineField({
      name: "accessStatus",
      title: "Portal access status",
      type: "string",
      group: "access",
      readOnly: true,
      description:
        "Managed by trusted server actions. Suspended and archived profiles cannot mutate portal data.",
      options: {list: contributorAccessStatusOptions, layout: "radio"},
      initialValue: "pending",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            contributorAccessStatusOptions,
            value,
            "access status",
          ),
        ),
    }),
    defineField({
      name: "linkedAuthor",
      title: "Linked public author",
      type: "reference",
      group: "relationships",
      to: [{type: "author"}],
      description:
        "Optional editorial link. A contributor profile is not published automatically.",
    }),
    defineField({
      name: "linkedAthlete",
      title: "Linked public athlete",
      type: "reference",
      group: "relationships",
      to: [{type: "athlete"}],
      description:
        "Optional editorial link. Signing in never creates an athlete profile.",
    }),
    defineField({
      name: "internalNotes",
      title: "Private internal notes",
      type: "text",
      rows: 6,
      group: "internal",
      readOnly: true,
      description:
        "Visible only in trusted editorial operations. Never return this field to contributor views.",
      validation: (Rule) => Rule.max(6_000),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Prototype record status",
      type: "string",
      group: "internal",
      readOnly: true,
      description:
        "Optional marker for non-authentic review fixtures. It never grants portal access.",
      options: {list: prototypeStatusOptions},
    }),
    defineField({
      name: "contributorSince",
      title: "Contributor since",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lastSignedInAt",
      title: "Last signed in at",
      type: "datetime",
      group: "system",
      readOnly: true,
    }),
    defineField({
      name: "termsAcceptedAt",
      title: "Portal acknowledgement accepted at",
      type: "datetime",
      group: "system",
      readOnly: true,
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      group: "system",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Display name, A–Z",
      name: "displayNameAsc",
      by: [{field: "displayName", direction: "asc"}],
    },
    {
      title: "Most recent sign-in",
      name: "lastSignedInDesc",
      by: [{field: "lastSignedInAt", direction: "desc"}],
    },
    {
      title: "Newest contributors",
      name: "contributorSinceDesc",
      by: [{field: "contributorSince", direction: "desc"}],
    },
  ],
  preview: {
    select: {
      title: "displayName",
      email: "normalizedEmail",
      role: "role",
      accessStatus: "accessStatus",
    },
    prepare({title, email, role, accessStatus}) {
      const roleTitle = optionTitle(contributorRoleOptions, role)
      const statusTitle = optionTitle(
        contributorAccessStatusOptions,
        accessStatus,
      )

      return {
        title: title || "Unnamed contributor",
        subtitle: [roleTitle, statusTitle, email].filter(Boolean).join(" · "),
      }
    },
  },
})
