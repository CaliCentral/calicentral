import {defineArrayMember, defineField, defineType} from "sanity"
import {validateUniqueReferences} from "../validation"

export const rankingSnapshot = defineType({
  name: "rankingSnapshot",
  title: "Athlete ranking snapshot",
  type: "document",
  fields: [
    defineField({name: "rankingSystem", title: "Ranking system", type: "reference", to: [{type: "rankingSystem"}], validation: (Rule) => Rule.required()}),
    defineField({
      name: "sourceCompetitions",
      title: "Source competitions",
      type: "array",
      description:
        "Optional source-event relationships. Add only when the ranking provider explicitly ties this snapshot to the referenced competitions.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{type: "competition"}],
        }),
      ],
      validation: (Rule) =>
        Rule.max(20).custom((value) => validateUniqueReferences(value)),
    }),
    defineField({name: "rankingDate", title: "Ranking effective date", type: "date", validation: (Rule) => Rule.required()}),
    defineField({name: "sourcePublishedAt", title: "Source published at", type: "datetime"}),
    defineField({name: "checkedAt", title: "Checked at", type: "datetime", validation: (Rule) => Rule.required()}),
    defineField({name: "season", title: "Season", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "methodologyVersion", title: "Methodology version at snapshot", type: "string", validation: (Rule) => Rule.max(80)}),
    defineField({name: "entries", title: "Entries", type: "array", of: [defineArrayMember({type: "rankingSnapshotEntry"})], validation: (Rule) => Rule.required().max(1000).custom((value) => validateUniqueReferences(value, "athlete"))}),
    defineField({name: "source", title: "Source provenance", type: "provenanceSource", validation: (Rule) => Rule.required()}),
    defineField({name: "notes", title: "Editorial notes", type: "text", rows: 4, validation: (Rule) => Rule.max(1500)}),
    defineField({
      name: "publicationStatus",
      title: "Publication status",
      type: "string",
      options: {list: ["draft", "published", "superseded", "archived"]},
      initialValue: "draft",
      validation: (Rule) => Rule.required().custom((value, context) => {
        if (value !== "published") return true
        const source = context.document?.source
        if (!source || typeof source !== "object") return "Published snapshots require source provenance."
        const record = source as Record<string, unknown>
        return typeof record.url === "string" && /^https?:\/\//i.test(record.url) &&
          ["source-confirmed", "official"].includes(String(record.verificationStatus))
          ? true
          : "Published snapshots require a public HTTP(S) source with source-confirmed or official status."
      }),
    }),
  ],
  orderings: [{title: "Ranking date, newest", name: "rankingDateDesc", by: [{field: "rankingDate", direction: "desc"}]}],
  preview: {select: {system: "rankingSystem.name", provider: "rankingSystem.provider.name", date: "rankingDate", status: "publicationStatus"}, prepare({system, provider, date, status}) {return {title: system || "Ranking snapshot", subtitle: [provider, date, status].filter(Boolean).join(" · ")}}},
})
