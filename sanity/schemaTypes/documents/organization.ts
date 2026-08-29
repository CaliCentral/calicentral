import {defineArrayMember, defineField, defineType} from "sanity"
import {prototypeStatusOptions} from "../constants"
import {validateSlugLength} from "../validation"

export const organization = defineType({
  name: "organization",
  title: "Organization",
  type: "document",
  groups: [
    {name: "identity", title: "Identity", default: true},
    {name: "location", title: "Location & scope"},
    {name: "links", title: "Public links"},
    {name: "publication", title: "Publication"},
  ],
  fields: [
    defineField({name: "name", title: "Name", type: "string", group: "identity", validation: (Rule) => Rule.required().max(140)}),
    defineField({name: "slug", title: "Slug", type: "slug", group: "identity", options: {source: "name", maxLength: 96}, validation: (Rule) => Rule.required().custom(validateSlugLength)}),
    defineField({
      name: "organizationType",
      title: "Organization type",
      type: "string",
      group: "identity",
      options: {list: [
        {title: "Federation", value: "federation"},
        {title: "League", value: "league"},
        {title: "Competition organizer", value: "competition-organizer"},
        {title: "Gym", value: "gym"},
        {title: "Training facility", value: "training-facility"},
        {title: "Team operator", value: "team-operator"},
        {title: "Brand", value: "brand"},
        {title: "Retailer", value: "retailer"},
        {title: "Media company", value: "media-company"},
        {title: "Community organization", value: "community-organization"},
        {title: "Other", value: "other"},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: "logo", title: "Logo", type: "accessibleImage", group: "identity"}),
    defineField({name: "description", title: "Description", type: "text", group: "identity", rows: 5, validation: (Rule) => Rule.required().max(2000)}),
    defineField({name: "country", title: "Country", type: "string", group: "location", validation: (Rule) => Rule.max(120)}),
    defineField({name: "administrativeArea", title: "State, province, or region", type: "string", group: "location", validation: (Rule) => Rule.max(120)}),
    defineField({name: "city", title: "City or base", type: "string", group: "location", validation: (Rule) => Rule.max(120)}),
    defineField({name: "geographicScope", title: "Geographic scope", type: "string", group: "location", validation: (Rule) => Rule.max(120)}),
    defineField({name: "disciplines", title: "Disciplines", type: "array", group: "location", of: [defineArrayMember({type: "string"})], validation: (Rule) => Rule.unique().max(20)}),
    defineField({name: "website", title: "Website", type: "url", group: "links", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({
      name: "source",
      title: "Source provenance",
      type: "provenanceSource",
      group: "publication",
      description: "Primary reviewed source for imported organization identity facts.",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      group: "links",
      of: [defineArrayMember({
        type: "object",
        name: "organizationSocialLink",
        fields: [
          defineField({name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required().max(80)}),
          defineField({name: "url", title: "URL", type: "url", validation: (Rule) => Rule.required().uri({scheme: ["http", "https"]})}),
        ],
      })],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({name: "status", title: "Lifecycle status", type: "string", group: "publication", options: {list: ["active", "inactive", "historical"]}, initialValue: "active", validation: (Rule) => Rule.required()}),
    defineField({name: "publicStatus", title: "Public status", type: "string", group: "publication", options: {list: ["draft", "published", "archived"]}, initialValue: "draft", validation: (Rule) => Rule.required()}),
    defineField({name: "prototypeStatus", title: "Prototype record status", type: "string", group: "publication", options: {list: prototypeStatusOptions}}),
    defineField({name: "seo", title: "Search and social", type: "seo", group: "publication"}),
  ],
  preview: {select: {title: "name", type: "organizationType", scope: "geographicScope", media: "logo"}, prepare({title, type, scope, media}) {return {title, subtitle: [type, scope].filter(Boolean).join(" · "), media}}},
})
