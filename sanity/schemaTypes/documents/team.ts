import {defineArrayMember, defineField, defineType} from "sanity"
import {countryOptions, prototypeStatusOptions} from "../constants"
import {validateSlugLength} from "../validation"

export const team = defineType({
  name: "team",
  title: "Team",
  type: "document",
  groups: [
    {name: "identity", title: "Identity", default: true},
    {name: "branding", title: "Branding"},
    {name: "relationships", title: "Season & relationships"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({name: "name", title: "Name", type: "string", group: "identity", validation: (Rule) => Rule.required().max(140)}),
    defineField({name: "slug", title: "Slug", type: "slug", group: "identity", options: {source: "name", maxLength: 96}, validation: (Rule) => Rule.required().custom(validateSlugLength)}),
    defineField({name: "shortName", title: "Short name", type: "string", group: "identity", validation: (Rule) => Rule.required().max(80)}),
    defineField({name: "code", title: "Team code", type: "string", group: "identity", validation: (Rule) => Rule.required().uppercase().max(8).regex(/^[A-Z0-9-]+$/, {name: "uppercase team code"})}),
    defineField({name: "teamType", title: "Team type", type: "string", group: "identity", options: {list: ["wcl-franchise", "prospective-wcl-team", "competitive-team", "crew", "club", "gym-team", "national-team", "other"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "publicStatus", title: "Public status", type: "string", group: "identity", options: {list: ["approved-prospective", "official", "active", "inactive", "archived"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "leagueAdmissionStatus", title: "League admission status", type: "string", group: "identity", options: {list: ["not-applicable", "prospective", "candidate", "official-franchise", "active-season-franchise"]}, initialValue: "not-applicable", validation: (Rule) => Rule.required()}),
    defineField({name: "country", title: "Country", type: "string", group: "identity", options: {list: countryOptions}, validation: (Rule) => Rule.required()}),
    defineField({name: "administrativeArea", title: "Administrative area", type: "string", group: "identity", validation: (Rule) => Rule.max(100)}),
    defineField({name: "city", title: "City", type: "string", group: "identity", validation: (Rule) => Rule.max(100)}),
    defineField({name: "trainingBase", title: "Training base", type: "string", group: "identity", validation: (Rule) => Rule.max(140)}),
    defineField({name: "foundingYear", title: "Founding year", type: "number", group: "identity", validation: (Rule) => Rule.integer().min(1800).max(new Date().getUTCFullYear())}),
    defineField({name: "description", title: "Public description", type: "text", rows: 5, group: "identity", validation: (Rule) => Rule.required().max(1500)}),
    defineField({name: "disciplines", title: "Disciplines", type: "array", group: "identity", of: [defineArrayMember({type: "string"})], validation: (Rule) => Rule.unique().max(20)}),
    defineField({name: "branding", title: "Branding", type: "teamBranding", group: "branding", validation: (Rule) => Rule.required()}),
    defineField({name: "socialLinks", title: "Public social links", type: "array", group: "identity", of: [defineArrayMember({type: "teamSocialLink"})], validation: (Rule) => Rule.max(10)}),
    defineField({name: "featured", title: "Featured", type: "boolean", group: "identity", initialValue: false}),
    defineField({name: "currentSeason", title: "Current season", type: "reference", group: "relationships", to: [{type: "teamSeason"}]}),
    defineField({name: "prototypeStatus", title: "Content status", type: "string", group: "metadata", options: {list: prototypeStatusOptions}}),
    defineField({name: "seo", title: "SEO", type: "seo", group: "metadata"}),
  ],
  orderings: [{title: "Name, A–Z", name: "nameAsc", by: [{field: "name", direction: "asc"}]}],
  preview: {select: {title: "name", code: "code", city: "city", status: "publicStatus", media: "branding.crest"}, prepare({title, code, city, status, media}) {return {title: title || "Unnamed team", subtitle: [code, city, status].filter(Boolean).join(" · "), media}}},
})

