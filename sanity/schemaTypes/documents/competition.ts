import {defineArrayMember, defineField, defineType} from "sanity"

import {
  competitionStatusOptions,
  competitionContentStatusOptions,
  disciplineCodeOptions,
  organizerVerificationStatusOptions,
  prototypeStatusOptions,
  registrationStatusOptions,
  resultsStatusOptions,
  scheduleStatusOptions,
} from "../constants"
import {
  validateCompetitionEndDate,
  validateCompetitionResults,
  validateCompetitionResultsStatus,
  validateNoSelfReference,
  validateSlugLength,
  validateUniqueReferences,
  validateUniqueStringFields,
} from "../validation"

function competitionDocument(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function isLegacyPublicSample(documentValue: unknown): boolean {
  const document = competitionDocument(documentValue)
  const marker = String(
    document.contentStatus ?? document.prototypeStatus ?? "",
  )

  return (
    !document.publicStatus &&
    ["fictional-prototype", "sample-record"].includes(marker)
  )
}

function requiresPublicEditorialFields(documentValue: unknown): boolean {
  const document = competitionDocument(documentValue)
  return document.publicStatus === "published" || isLegacyPublicSample(document)
}

function requireForPublic(
  value: unknown,
  documentValue: unknown,
  label: string,
): true | string {
  if (!requiresPublicEditorialFields(documentValue)) {
    return true
  }

  const hasValue = Array.isArray(value)
    ? value.length > 0
    : typeof value === "string"
      ? Boolean(value.trim())
      : value !== undefined && value !== null

  return hasValue ? true : `${label} is required before publication.`
}

export const competition = defineType({
  name: "competition",
  title: "Competition",
  type: "document",
  groups: [
    {name: "overview", title: "Overview", default: true},
    {name: "operations", title: "Operations"},
    {name: "field", title: "Field & results"},
    {name: "source", title: "Source & identity"},
    {name: "media", title: "Media"},
    {name: "relationships", title: "Related content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "shortName",
      title: "Short name",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.max(60).custom((value, context) =>
          requireForPublic(value, context.document, "Short name"),
        ),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "overview",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "eventNumber",
      title: "Event number",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.max(30).custom((value, context) =>
          requireForPublic(value, context.document, "Event number"),
        ),
    }),
    defineField({
      name: "status",
      title: "Event status",
      type: "string",
      group: "overview",
      options: {list: competitionStatusOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireForPublic(value, context.document, "Event status"),
        ),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      group: "overview",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      group: "overview",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          validateCompetitionEndDate(value, context),
        ),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.max(80).custom((value, context) =>
          requireForPublic(value, context.document, "City"),
        ),
    }),
    defineField({
      name: "state",
      title: "State or province",
      type: "string",
      group: "overview",
      description:
        "Legacy field retained for existing records. New records should use Administrative area.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "administrativeArea",
      title: "Administrative area",
      type: "string",
      group: "overview",
      description: "State, province, territory, prefecture, or equivalent.",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.max(80).custom((value, context) =>
          requireForPublic(value, context.document, "Country"),
        ),
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "venueName",
      title: "Venue name",
      type: "string",
      group: "overview",
      validation: (Rule) =>
        Rule.max(120).custom((value, context) =>
          requireForPublic(value, context.document, "Venue name"),
        ),
    }),
    defineField({
      name: "venueType",
      title: "Venue type",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      group: "overview",
      validation: (Rule) =>
        Rule.min(40)
          .max(400)
          .custom((value, context) =>
            requireForPublic(value, context.document, "Summary"),
          ),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "portableText",
      group: "overview",
      validation: (Rule) =>
        Rule.min(1).custom((value, context) =>
          requireForPublic(value, context.document, "Description"),
        ),
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      group: "overview",
      of: [
        defineArrayMember({
          type: "string",
          options: {list: disciplineCodeOptions},
        }),
      ],
      validation: (Rule) =>
        Rule.min(1)
          .max(6)
          .unique()
          .custom((value, context) =>
            requireForPublic(value, context.document, "Disciplines"),
          ),
    }),
    defineField({
      name: "primaryDiscipline",
      title: "Primary discipline",
      type: "string",
      group: "overview",
      options: {list: disciplineCodeOptions},
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const required = requireForPublic(
            value,
            context.document,
            "Primary discipline",
          )

          if (required !== true) {
            return required
          }

          const disciplines = Array.isArray(context.document?.disciplines)
            ? context.document.disciplines
            : []

          return !value || disciplines.includes(value)
            ? true
            : "The primary discipline must also appear in Disciplines."
        }),
    }),
    defineField({
      name: "divisions",
      title: "Divisions",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionDivision"})],
      validation: (Rule) =>
        Rule.min(1)
          .max(50)
          .unique()
          .custom((value, context) =>
            requireForPublic(value, context.document, "Divisions"),
          ),
    }),
    defineField({
      name: "eventSeries",
      title: "Event series",
      type: "string",
      group: "overview",
      description: "Optional source-supported championship, circuit, or event-series name.",
      validation: (Rule) => Rule.max(140),
    }),
    defineField({
      name: "editorialPriority",
      title: "Editorial priority",
      type: "string",
      group: "overview",
      description: "Cali Central editorial intake priority; independent from source verification and publication.",
      options: {list: [
        {title: "World championship", value: "world-championship"},
        {title: "Continental championship", value: "continental-championship"},
        {title: "National championship", value: "national-championship"},
        {title: "Major open", value: "major-open"},
        {title: "Qualifier", value: "qualifier"},
        {title: "Major event", value: "major-event"},
        {title: "Standard", value: "standard"},
      ]},
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "overview",
      initialValue: false,
    }),
    defineField({
      name: "registrationStatus",
      title: "Registration status",
      type: "string",
      group: "operations",
      options: {list: registrationStatusOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireForPublic(value, context.document, "Registration status"),
        ),
    }),
    defineField({
      name: "registrationDeadline",
      title: "Registration deadline",
      type: "datetime",
      group: "operations",
      description: "Optional organizer-published deadline, including timezone.",
    }),
    defineField({
      name: "scheduleStatus",
      title: "Schedule status",
      type: "string",
      group: "operations",
      options: {list: scheduleStatusOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireForPublic(value, context.document, "Schedule status"),
        ),
    }),
    defineField({
      name: "resultsStatus",
      title: "Results status",
      type: "string",
      group: "operations",
      options: {list: resultsStatusOptions, layout: "radio"},
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const required = requireForPublic(
            value,
            context.document,
            "Results status",
          )

          return required === true && value
            ? validateCompetitionResultsStatus(value, context)
            : required
        }),
    }),
    defineField({
      name: "capacityLabel",
      title: "Capacity label",
      type: "string",
      group: "operations",
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "organizerName",
      title: "Organizer name",
      type: "string",
      group: "operations",
      validation: (Rule) =>
        Rule.max(120).custom((value, context) =>
          requireForPublic(value, context.document, "Organizer name"),
        ),
    }),
    defineField({
      name: "organization",
      title: "Organizer organization",
      type: "reference",
      group: "source",
      to: [{type: "organization"}],
      description:
        "Optional canonical organization relationship. Keep Organizer name as the source-supported display value.",
    }),
    defineField({
      name: "source",
      title: "Competition source provenance",
      type: "provenanceSource",
      group: "source",
      description:
        "Provider-neutral public provenance for the competition record. Do not infer a provider or verification state.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (isLegacyPublicSample(context.document)) {
            return true
          }

          const source = competitionDocument(value)
          return value && /^https?:\/\//.test(String(source.url ?? ""))
            ? true
            : "Real and imported competition records require source provenance with a public HTTP(S) URL."
        }),
    }),
    defineField({
      name: "externalProviderId",
      title: "Primary external provider ID",
      type: "string",
      group: "source",
      description:
        "Optional source-supported identifier for the primary imported record. Use External competition identities when more than one provider maps to this competition.",
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: "externalProviderUrl",
      title: "Primary external provider URL",
      type: "url",
      group: "source",
      validation: (Rule) => Rule.uri({scheme: ["http", "https"]}),
    }),
    defineField({
      name: "organizerVerificationStatus",
      title: "Organizer verification status",
      type: "string",
      group: "operations",
      options: {list: organizerVerificationStatusOptions, layout: "radio"},
      initialValue: "unverified",
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireForPublic(
            value,
            context.document,
            "Organizer verification status",
          ),
        ),
    }),
    defineField({
      name: "actionLinks",
      title: "Public action links",
      type: "array",
      group: "operations",
      description:
        "Registration, ticketing, official-site, results, map, and livestream links. Affiliate links require a visible disclosure.",
      of: [defineArrayMember({type: "competitionActionLink"})],
      validation: (Rule) =>
        Rule.max(12).custom((value) =>
          validateUniqueStringFields(value, "url", "Action URLs"),
        ),
    }),
    defineField({
      name: "competitionFormat",
      title: "Competition format",
      type: "string",
      group: "operations",
      validation: (Rule) =>
        Rule.max(240).custom((value, context) =>
          requireForPublic(value, context.document, "Competition format"),
        ),
    }),
    defineField({
      name: "schedule",
      title: "Schedule",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionScheduleItem"})],
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: "participants",
      title: "Participants",
      type: "array",
      group: "field",
      of: [defineArrayMember({type: "competitionParticipant"})],
      validation: (Rule) =>
        Rule.max(500).custom((value) =>
          validateUniqueReferences(value, "athlete"),
        ),
    }),
    defineField({
      name: "results",
      title: "Results",
      type: "array",
      group: "field",
      description:
        "Result entries are limited to completed competitions. Verified public results require source provenance; sample results never enter the verified archive.",
      of: [defineArrayMember({type: "competitionResult"})],
      validation: (Rule) =>
        Rule.max(500).custom((value, context) => {
          const statusValidation = validateCompetitionResults(value, context)

          return statusValidation === true
            ? validateUniqueReferences(value, "athlete")
            : statusValidation
        }),
    }),
    defineField({
      name: "timeline",
      title: "Timeline",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "timelineEntry"})],
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: "notices",
      title: "Notices",
      type: "array",
      group: "operations",
      of: [defineArrayMember({type: "competitionNotice"})],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "accessibleImage",
      group: "media",
    }),
    defineField({
      name: "visualVariant",
      title: "Visual variant",
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
      validation: (Rule) =>
        Rule.custom((value, context) =>
          requireForPublic(value, context.document, "Visual variant"),
        ),
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
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "relatedAthletes",
      title: "Related athletes",
      type: "array",
      group: "relationships",
      of: [defineArrayMember({type: "reference", to: [{type: "athlete"}]})],
      validation: (Rule) =>
        Rule.unique()
          .max(12)
          .custom((value) => validateUniqueReferences(value)),
    }),
    defineField({
      name: "relatedCompetitions",
      title: "Related competitions",
      type: "array",
      group: "relationships",
      of: [
        defineArrayMember({type: "reference", to: [{type: "competition"}]}),
      ],
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
      name: "contentStatus",
      title: "Public record status",
      type: "string",
      group: "metadata",
      options: {list: competitionContentStatusOptions, layout: "radio"},
      initialValue: "sample-record",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publicStatus",
      title: "Publication status",
      type: "string",
      group: "metadata",
      description:
        "New and imported competition records remain internal until an editor explicitly publishes them.",
      options: {
        list: [
          {title: "Internal draft", value: "draft"},
          {title: "Published", value: "published"},
          {title: "Archived", value: "archived"},
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const document = (context.document ?? {}) as Record<string, unknown>
          const marker = String(
            document.contentStatus ?? document.prototypeStatus ?? "",
          )
          const isLegacySample = [
            "fictional-prototype",
            "sample-record",
          ].includes(marker)

          if (!value) {
            return isLegacySample
              ? true
              : "Choose a publication status. New records must default to Internal draft."
          }

          if (value !== "published" || isLegacySample) {
            return true
          }

          const source =
            typeof document.source === "object" && document.source !== null
              ? (document.source as Record<string, unknown>)
              : {}
          const verificationStatus = String(source.verificationStatus ?? "")
          const sourceUrl = String(source.url ?? "")

          return ["source-confirmed", "official"].includes(
            verificationStatus,
          ) && /^https?:\/\//.test(sourceUrl)
            ? true
            : "Publishing a real competition requires a public source URL with source-confirmed or official verification."
        }),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Legacy prototype status",
      type: "string",
      group: "metadata",
      description: "Migration-only field retained for existing records.",
      hidden: true,
      options: {list: prototypeStatusOptions, layout: "radio"},
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
      title: "Start date, soonest",
      name: "startDateAsc",
      by: [{field: "startDate", direction: "asc"}],
    },
    {
      title: "Start date, newest",
      name: "startDateDesc",
      by: [{field: "startDate", direction: "desc"}],
    },
    {
      title: "Name, A–Z",
      name: "nameAsc",
      by: [{field: "name", direction: "asc"}],
    },
  ],
  preview: {
    select: {
      title: "name",
      shortName: "shortName",
      status: "status",
      startDate: "startDate",
      city: "city",
      contentStatus: "contentStatus",
      prototypeStatus: "prototypeStatus",
      publicStatus: "publicStatus",
      media: "heroImage",
    },
    prepare({
      title,
      shortName,
      status,
      startDate,
      city,
      contentStatus,
      prototypeStatus,
      publicStatus,
      media,
    }) {
      return {
        title: title || shortName || "Untitled competition",
        subtitle: [
          startDate,
          city,
          status,
          publicStatus ?? "legacy public",
          contentStatus ?? prototypeStatus,
        ]
          .filter(Boolean)
          .join(" · "),
        media,
      }
    },
  },
})
