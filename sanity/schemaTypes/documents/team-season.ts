import {defineArrayMember, defineField, defineType} from "sanity"
import {validateUniqueReferences} from "../validation"

export const teamSeason = defineType({
  name: "teamSeason",
  title: "Team season roster",
  type: "document",
  fields: [
    defineField({name: "team", title: "Team", type: "reference", to: [{type: "team"}], validation: (Rule) => Rule.required()}),
    defineField({name: "seasonLabel", title: "Season label", type: "string", validation: (Rule) => Rule.required().max(80)}),
    defineField({name: "ruleset", title: "Ruleset", type: "reference", to: [{type: "ruleset"}]}),
    defineField({name: "status", title: "Season status", type: "string", options: {list: ["draft", "prospective", "active", "completed", "archived"]}, initialValue: "draft", validation: (Rule) => Rule.required()}),
    defineField({name: "members", title: "Historical roster memberships", type: "array", of: [defineArrayMember({type: "teamSeasonMember"})], validation: (Rule) => Rule.max(100).custom((value) => validateUniqueReferences(value, "athlete"))}),
    defineField({name: "uniformApprovalStatus", title: "Uniform approval status", type: "string", options: {list: ["not-submitted", "in-review", "approved", "changes-required"]}, initialValue: "not-submitted", validation: (Rule) => Rule.required()}),
    defineField({name: "registrationStatus", title: "Season registration status", type: "string", options: {list: ["not-registered", "pending", "registered", "withdrawn"]}, initialValue: "not-registered", validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {team: "team.name", season: "seasonLabel", status: "status"}, prepare({team, season, status}) {return {title: `${team || "Team"} · ${season || "Season"}`, subtitle: status}}},
})

