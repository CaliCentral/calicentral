import {defineField, defineType} from "sanity"

import {
  auditEventTypeOptions,
  contributorRoleOptions,
  optionTitle,
  submissionStatusOptions,
  validateOptionValue,
} from "../operations-constants"

const targetReferenceRequired = (
  value: unknown,
  targetType: unknown,
  expectedType: string,
  label: string,
) =>
  targetType === expectedType && !value
    ? `${label} is required for ${expectedType} audit events.`
    : true

export const auditEvent = defineType({
  name: "auditEvent",
  title: "Audit event",
  type: "document",
  readOnly: true,
  description:
    "Immutable, server-authored record of a meaningful portal or moderation action.",
  fields: [
    defineField({
      name: "eventType",
      title: "Event type",
      type: "string",
      readOnly: true,
      options: {list: auditEventTypeOptions},
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            auditEventTypeOptions,
            value,
            "audit event type",
          ),
        ),
    }),
    defineField({
      name: "actor",
      title: "Actor",
      type: "reference",
      readOnly: true,
      to: [{type: "contributorProfile"}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "actorRole",
      title: "Actor role",
      type: "string",
      readOnly: true,
      description:
        "Effective server-resolved role at the time of the action.",
      options: {list: contributorRoleOptions},
      validation: (Rule) =>
        Rule.required().custom((value) =>
          validateOptionValue(
            contributorRoleOptions,
            value,
            "actor role",
          ),
        ),
    }),
    defineField({
      name: "targetType",
      title: "Target type",
      type: "string",
      readOnly: true,
      options: {
        list: [
          {title: "Submission", value: "submission"},
          {title: "Contributor", value: "contributor"},
        ],
      },
      validation: (Rule) =>
        Rule.required().custom((value) =>
          ["submission", "contributor"].includes(value || "")
            ? true
            : "Choose a supported audit target type.",
        ),
    }),
    defineField({
      name: "targetDocumentId",
      title: "Target document ID",
      type: "string",
      readOnly: true,
      description:
        "Validated internal identifier only; never use an email address or other private value.",
      validation: (Rule) =>
        Rule.required()
          .max(200)
          .regex(/^[A-Za-z0-9_.-]+$/, {
            name: "Sanity document identifier",
          }),
    }),
    defineField({
      name: "submission",
      title: "Submission",
      type: "reference",
      readOnly: true,
      to: [{type: "submission"}],
      validation: (Rule) =>
        Rule.custom((value, context) =>
          targetReferenceRequired(
            value,
            context.document?.targetType,
            "submission",
            "A submission reference",
          ),
        ),
    }),
    defineField({
      name: "contributor",
      title: "Contributor",
      type: "reference",
      readOnly: true,
      to: [{type: "contributorProfile"}],
      validation: (Rule) =>
        Rule.custom((value, context) =>
          targetReferenceRequired(
            value,
            context.document?.targetType,
            "contributor",
            "A contributor reference",
          ),
        ),
    }),
    defineField({
      name: "previousStatus",
      title: "Previous submission status",
      type: "string",
      readOnly: true,
      options: {list: submissionStatusOptions},
      validation: (Rule) =>
        Rule.custom((value) =>
          validateOptionValue(
            submissionStatusOptions,
            value,
            "previous submission status",
          ),
        ),
    }),
    defineField({
      name: "nextStatus",
      title: "Next submission status",
      type: "string",
      readOnly: true,
      options: {list: submissionStatusOptions},
      validation: (Rule) =>
        Rule.custom((value) =>
          validateOptionValue(
            submissionStatusOptions,
            value,
            "next submission status",
          ),
        ),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "string",
      readOnly: true,
      description:
        "Concise, non-sensitive action summary. Do not copy private notes or complete submission content.",
      validation: (Rule) => Rule.required().min(5).max(500),
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metadata",
      title: "Constrained metadata",
      type: "auditMetadata",
      readOnly: true,
      description:
        "Optional known scalar changes only. Secrets and full content copies are prohibited.",
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "createdAtDesc",
      by: [{field: "createdAt", direction: "desc"}],
    },
    {
      title: "Event type, newest first",
      name: "eventTypeAscCreatedAtDesc",
      by: [
        {field: "eventType", direction: "asc"},
        {field: "createdAt", direction: "desc"},
      ],
    },
  ],
  preview: {
    select: {
      summary: "summary",
      eventType: "eventType",
      actor: "actor.displayName",
      createdAt: "createdAt",
    },
    prepare({summary, eventType, actor, createdAt}) {
      const eventTitle = optionTitle(auditEventTypeOptions, eventType)
      const date =
        typeof createdAt === "string"
          ? new Date(createdAt).toLocaleString()
          : undefined

      return {
        title: summary || eventTitle || "Audit event",
        subtitle: [eventTitle, actor, date].filter(Boolean).join(" · "),
      }
    },
  },
})
