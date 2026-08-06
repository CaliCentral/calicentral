import {defineField, defineType} from "sanity"

import {prototypeStatusOptions} from "../constants"

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    {name: "identity", title: "Identity", default: true},
    {name: "homepage", title: "Homepage"},
    {name: "featured", title: "Featured content"},
    {name: "metadata", title: "Metadata"},
  ],
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site title",
      type: "string",
      group: "identity",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "shortTitle",
      title: "Short title",
      type: "string",
      group: "identity",
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: "siteDescription",
      title: "Site description",
      type: "text",
      rows: 3,
      group: "identity",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "prototypeNotice",
      title: "Prototype notice",
      type: "text",
      rows: 3,
      group: "identity",
      description:
        "Public disclosure that distinguishes fictional or sample material from verified reporting.",
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "footerStatement",
      title: "Footer statement",
      type: "text",
      rows: 3,
      group: "identity",
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "homepageHeroEyebrow",
      title: "Homepage hero eyebrow",
      type: "string",
      group: "homepage",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "homepageHeroTitle",
      title: "Homepage hero title",
      type: "string",
      group: "homepage",
      description:
        "Enter exactly three non-empty parts separated by | characters: lead | emphasis | tail.",
      validation: (Rule) =>
        Rule.required()
          .max(100)
          .custom((value) => {
            if (!value) {
              return true
            }

            const parts = value.split("|").map((part) => part.trim())

            return parts.length === 3 && parts.every(Boolean)
              ? true
              : "Use exactly: lead | emphasis | tail."
          }),
    }),
    defineField({
      name: "homepageHeroBody",
      title: "Homepage hero body",
      type: "text",
      rows: 4,
      group: "homepage",
      validation: (Rule) => Rule.required().max(360),
    }),
    defineField({
      name: "featuredStory",
      title: "Featured story",
      type: "reference",
      to: [{type: "story"}],
      group: "featured",
    }),
    defineField({
      name: "featuredAthlete",
      title: "Featured athlete",
      type: "reference",
      to: [{type: "athlete"}],
      group: "featured",
    }),
    defineField({
      name: "featuredCompetition",
      title: "Featured competition",
      type: "reference",
      to: [{type: "competition"}],
      group: "featured",
    }),
    defineField({
      name: "featuredVideo",
      title: "Featured video",
      type: "reference",
      to: [{type: "video"}],
      group: "featured",
    }),
    defineField({
      name: "featuredRankingCategory",
      title: "Featured ranking category",
      type: "reference",
      to: [{type: "rankingCategory"}],
      group: "featured",
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      group: "metadata",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Content status",
      type: "string",
      group: "metadata",
      options: {list: prototypeStatusOptions, layout: "radio"},
      initialValue: "fictional-prototype",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: "siteTitle", subtitle: "prototypeNotice"},
    prepare({title, subtitle}) {
      return {
        title: title || "Site settings",
        subtitle,
      }
    },
  },
})
