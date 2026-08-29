import {defineArrayMember, defineField, defineType} from "sanity"
import {countryOptions} from "../constants"

export const teamApplicationRosterEntry = defineType({
  name: "teamApplicationRosterEntry",
  title: "Private proposed roster entry",
  type: "object",
  fields: [
    defineField({name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required().max(120)}),
    defineField({name: "privateEmail", title: "Private invitation email", type: "string", description: "Editorial/team review only. Never project publicly.", validation: (Rule) => Rule.email().max(320)}),
    defineField({name: "privatePhone", title: "Private phone", type: "string", description: "Optional review data. Never project publicly.", validation: (Rule) => Rule.max(40)}),
    defineField({name: "existingProfileSlug", title: "Existing public profile slug", type: "string", validation: (Rule) => Rule.max(120)}),
    defineField({name: "relationshipToTeam", title: "Relationship to team", type: "string", validation: (Rule) => Rule.max(160)}),
    defineField({name: "role", title: "Proposed role", type: "string", options: {list: ["captain", "athlete", "reserve", "coach", "manager", "administrator", "media-manager"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "rosterStatus", title: "Roster status", type: "string", options: {list: ["proposed", "invited", "accepted", "declined"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "specialty", title: "Proposed specialty", type: "string", options: {list: ["strength", "control", "endurance", "freestyle"]}}),
    defineField({name: "consentStatus", title: "Consent status", type: "string", options: {list: ["not-contacted", "pending", "accepted", "declined"]}, initialValue: "not-contacted", validation: (Rule) => Rule.required()}),
  ],
})

export const teamApplicationDetails = defineType({
  name: "teamApplicationDetails",
  title: "Team application details",
  type: "object",
  fields: [
    defineField({name: "proposedTeamName", title: "Proposed team name", type: "string", validation: (Rule) => Rule.required().max(140)}),
    defineField({name: "shortName", title: "Short name", type: "string", validation: (Rule) => Rule.required().max(80)}),
    defineField({name: "code", title: "Code", type: "string", validation: (Rule) => Rule.required().max(8)}),
    defineField({name: "teamType", title: "Team type", type: "string", options: {list: ["prospective-wcl-team", "competitive-team", "crew", "club", "gym-team", "national-team", "other"]}, validation: (Rule) => Rule.required()}),
    defineField({name: "representedIdentity", title: "Represented city or brand", type: "string", validation: (Rule) => Rule.required().max(160)}),
    defineField({name: "country", title: "Country", type: "string", options: {list: countryOptions}, validation: (Rule) => Rule.required()}),
    defineField({name: "administrativeArea", title: "Administrative area", type: "string", validation: (Rule) => Rule.max(100)}),
    defineField({name: "city", title: "City", type: "string", validation: (Rule) => Rule.max(100)}),
    defineField({name: "trainingBase", title: "Training base", type: "string", validation: (Rule) => Rule.max(120)}),
    defineField({name: "foundingYear", title: "Founding year", type: "string", validation: (Rule) => Rule.max(4)}),
    defineField({name: "description", title: "Proposed public description", type: "text", rows: 5, validation: (Rule) => Rule.required().max(2000)}),
    defineField({name: "disciplines", title: "Disciplines", type: "array", of: [defineArrayMember({type: "string"})], validation: (Rule) => Rule.unique().max(12)}),
    defineField({name: "competitionIntentions", title: "Competition intentions", type: "text", rows: 4, validation: (Rule) => Rule.required().max(2000)}),
    defineField({name: "website", title: "Website", type: "url", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "socialLinks", title: "Public social links", type: "array", of: [defineArrayMember({type: "supportingLink"})], validation: (Rule) => Rule.max(8)}),
    defineField({name: "primaryColor", title: "Primary color", type: "string", validation: (Rule) => Rule.required().regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "secondaryColor", title: "Secondary color", type: "string", validation: (Rule) => Rule.required().regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "accentColor", title: "Accent color", type: "string", validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, {name: "six-digit hex color"})}),
    defineField({name: "crestReferenceUrl", title: "Crest/logo reference URL", type: "url", description: "Private review reference. An editor creates approved canonical media separately.", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "wordmarkReferenceUrl", title: "Wordmark reference URL", type: "url", description: "Private review reference. An editor creates approved canonical media separately.", validation: (Rule) => Rule.uri({scheme: ["http", "https"]})}),
    defineField({name: "brandingPermissionAcknowledged", title: "Branding authority acknowledged", type: "boolean", validation: (Rule) => Rule.required()}),
    defineField({name: "proposedUniformDesign", title: "Proposed uniform design", type: "text", rows: 4, validation: (Rule) => Rule.max(2000)}),
    defineField({name: "proposedRoster", title: "Private proposed roster", type: "array", description: "Private intake only. A public roster is created separately from consented public profiles.", of: [defineArrayMember({type: "teamApplicationRosterEntry"})], validation: (Rule) => Rule.max(8)}),
  ],
})
