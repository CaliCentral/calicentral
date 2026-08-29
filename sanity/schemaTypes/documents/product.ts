import { defineArrayMember, defineField, defineType } from "sanity";

import { prototypeStatusOptions } from "../constants";
import { validateSlugLength } from "../validation";

type UnknownRecord = Record<string, unknown>;

function documentRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && Boolean(value.trim());
}

export const product = defineType({
  name: "product",
  title: "Curated product",
  type: "document",
  description:
    "A curated external product-discovery record. It is not inventory and cannot create checkout, partnership, rating, or availability claims.",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "editorial", title: "Editorial fit" },
    { name: "commerce", title: "External commerce" },
    { name: "publication", title: "Publication" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Product name",
      type: "string",
      group: "identity",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "identity",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required().custom(validateSlugLength),
    }),
    defineField({
      name: "brand",
      title: "Brand organization",
      type: "reference",
      group: "identity",
      to: [{ type: "organization" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "retailer",
      title: "Retailer organization",
      type: "reference",
      group: "identity",
      to: [{ type: "organization" }],
      description:
        "Optional canonical retailer. Do not create a relationship that has not been confirmed.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "identity",
      options: {
        list: [
          { title: "Equipment", value: "equipment" },
          { title: "Apparel", value: "apparel" },
          {
            title: "Training & content accessories",
            value: "training-content-accessories",
          },
          { title: "Nutrition & recovery", value: "nutrition-recovery" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subcategory",
      title: "Subcategory",
      type: "string",
      group: "identity",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "images",
      title: "Product images",
      type: "array",
      group: "identity",
      of: [defineArrayMember({ type: "accessibleImage" })],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      group: "editorial",
      rows: 3,
      validation: (Rule) => Rule.required().max(320),
    }),
    defineField({
      name: "editorialSummary",
      title: "Editorial summary",
      type: "text",
      group: "editorial",
      rows: 6,
      validation: (Rule) => Rule.required().max(2000),
    }),
    defineField({
      name: "useCases",
      title: "Use cases",
      type: "array",
      group: "editorial",
      of: [defineArrayMember({ type: "string" })],
      validation: (Rule) => Rule.unique().max(20),
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      group: "editorial",
      of: [defineArrayMember({ type: "string" })],
      validation: (Rule) => Rule.unique().max(20),
    }),
    defineField({
      name: "trainingLevel",
      title: "Training levels",
      type: "array",
      group: "editorial",
      of: [defineArrayMember({ type: "string" })],
      validation: (Rule) => Rule.unique().max(10),
    }),
    defineField({
      name: "environments",
      title: "Environment",
      type: "array",
      group: "editorial",
      of: [
        defineArrayMember({
          type: "string",
          options: { list: ["indoor", "outdoor"] },
        }),
      ],
      validation: (Rule) => Rule.unique().max(2),
    }),
    defineField({
      name: "portable",
      title: "Portable",
      type: "boolean",
      group: "editorial",
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "priceDisplay",
      title: "Price display",
      type: "string",
      group: "commerce",
      description:
        "Optional presentation value. Never imply a stale price is guaranteed.",
      validation: (Rule) =>
        Rule.max(80).custom((value, context) => {
          if (!hasText(value)) return true;
          return hasText(documentRecord(context.document).lastCheckedAt)
            ? true
            : "A displayed price requires a last-checked timestamp.";
        }),
    }),
    defineField({
      name: "currency",
      title: "Currency code",
      type: "string",
      group: "commerce",
      validation: (Rule) =>
        Rule.uppercase().regex(/^[A-Z]{3}$/, {
          name: "ISO-style three-letter currency",
        }),
    }),
    defineField({
      name: "standardProductUrl",
      title: "Normal manufacturer or retailer URL",
      type: "url",
      group: "commerce",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "affiliateUrl",
      title: "Optional affiliate URL",
      type: "url",
      group: "commerce",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).custom((value, context) => {
          if (!hasText(value)) return true;
          const document = documentRecord(context.document);
          return hasText(document.standardProductUrl) &&
            document.affiliateStatus === "active" &&
            document.commercialRelationship === "affiliate" &&
            hasText(document.disclosure)
            ? true
            : "An affiliate URL requires a normal reference URL, active affiliate status, affiliate relationship, and public disclosure.";
        }),
    }),
    defineField({
      name: "affiliateNetwork",
      title: "Affiliate network",
      type: "string",
      group: "commerce",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "affiliateStatus",
      title: "Affiliate status",
      type: "string",
      group: "commerce",
      options: { list: ["none", "pending", "active", "paused", "ended"] },
      initialValue: "none",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          if (value !== "active") return true;
          const document = documentRecord(context.document);
          return document.commercialRelationship === "affiliate" &&
            hasText(document.standardProductUrl) &&
            hasText(document.disclosure)
            ? true
            : "Active affiliate status requires an affiliate relationship, normal product URL, and public disclosure.";
        }),
    }),
    defineField({
      name: "commercialRelationship",
      title: "Commercial relationship",
      type: "string",
      group: "commerce",
      options: { list: ["none", "affiliate", "sponsored", "advertising"] },
      initialValue: "none",
      validation: (Rule) =>
        Rule.required().custom((value, context) =>
          value === "none" ||
          hasText(documentRecord(context.document).disclosure)
            ? true
            : "Every commercial relationship requires a public disclosure.",
        ),
    }),
    defineField({
      name: "sponsored",
      title: "Sponsored product",
      type: "boolean",
      group: "commerce",
      initialValue: false,
      validation: (Rule) =>
        Rule.required().custom((value, context) =>
          !value ||
          (documentRecord(context.document).commercialRelationship ===
            "sponsored" &&
            hasText(documentRecord(context.document).disclosure))
            ? true
            : "Sponsored products require a sponsored relationship and public disclosure.",
        ),
    }),
    defineField({
      name: "disclosure",
      title: "Public commercial disclosure",
      type: "text",
      group: "commerce",
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "countryAvailability",
      title: "Known country availability",
      type: "array",
      group: "commerce",
      of: [defineArrayMember({ type: "string" })],
      validation: (Rule) => Rule.unique().max(80),
    }),
    defineField({
      name: "lastCheckedAt",
      title: "Destination, price, or availability last checked",
      type: "datetime",
      group: "commerce",
    }),
    defineField({
      name: "availabilityNote",
      title: "Availability note",
      type: "text",
      group: "commerce",
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "publication",
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "editorPick",
      title: "Editor's pick",
      type: "boolean",
      group: "publication",
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Publication status",
      type: "string",
      group: "publication",
      options: { list: ["draft", "published", "archived", "discontinued"] },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "prototypeStatus",
      title: "Prototype record status",
      type: "string",
      group: "publication",
      options: { list: prototypeStatusOptions },
    }),
    defineField({
      name: "seo",
      title: "Search and social",
      type: "seo",
      group: "publication",
    }),
  ],
  orderings: [
    {
      title: "Featured, then name",
      name: "featuredName",
      by: [
        { field: "featured", direction: "desc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "name",
      brand: "brand.name",
      category: "category",
      status: "status",
      media: "images.0",
    },
    prepare({ title, brand, category, status, media }) {
      return {
        title,
        subtitle: [brand, category, status].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
