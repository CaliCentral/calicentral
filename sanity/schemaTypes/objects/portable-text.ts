import {defineArrayMember, defineField, defineType} from "sanity"

export const externalLink = defineType({
  name: "externalLink",
  title: "External link",
  type: "object",
  fields: [
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({
          scheme: ["http", "https", "mailto"],
          allowRelative: false,
        }),
    }),
    defineField({
      name: "blank",
      title: "Open in a new tab",
      type: "boolean",
      initialValue: false,
    }),
  ],
})

export const internalStoryLink = defineType({
  name: "internalStoryLink",
  title: "Story link",
  type: "object",
  fields: [
    defineField({
      name: "story",
      title: "Story",
      type: "reference",
      to: [{type: "story"}],
      validation: (Rule) => Rule.required(),
    }),
  ],
})

export const pullQuote = defineType({
  name: "pullQuote",
  title: "Pull quote",
  type: "object",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(360),
    }),
    defineField({
      name: "attribution",
      title: "Attribution",
      type: "string",
      validation: (Rule) => Rule.max(100),
    }),
  ],
  preview: {
    select: {title: "quote", subtitle: "attribution"},
  },
})

export const factBox = defineType({
  name: "factBox",
  title: "Fact box",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "items",
      title: "Facts",
      type: "array",
      of: [defineArrayMember({type: "string"})],
      validation: (Rule) => Rule.required().min(1).max(8).unique(),
    }),
  ],
})

export const divider = defineType({
  name: "divider",
  title: "Divider",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Editor label",
      type: "string",
      description: "Optional internal label; it is not rendered publicly.",
      validation: (Rule) => Rule.max(80),
    }),
  ],
  preview: {
    select: {label: "label"},
    prepare({label}) {
      return {title: label ? `Divider — ${label}` : "Divider"}
    },
  },
})

export const portableText = defineType({
  name: "portableText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        {title: "Paragraph", value: "normal"},
        {title: "Heading 2", value: "h2"},
        {title: "Heading 3", value: "h3"},
        {title: "Blockquote", value: "blockquote"},
      ],
      lists: [
        {title: "Bulleted list", value: "bullet"},
        {title: "Numbered list", value: "number"},
      ],
      marks: {
        decorators: [
          {title: "Strong", value: "strong"},
          {title: "Emphasis", value: "em"},
        ],
        annotations: [
          defineArrayMember({type: "externalLink"}),
          defineArrayMember({type: "internalStoryLink"}),
        ],
      },
    }),
    defineArrayMember({type: "pullQuote"}),
    defineArrayMember({type: "factBox"}),
    defineArrayMember({type: "divider"}),
    defineArrayMember({type: "accessibleImage"}),
  ],
})
