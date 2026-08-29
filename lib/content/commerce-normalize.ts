import { stegaClean } from "next-sanity";

import { normalizeSanityImage } from "@/sanity/lib/image";
import type {
  Organization,
  OrganizationSummary,
  OrganizationType,
} from "@/types/organization";
import {
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
} from "@/types/product";

type JsonRecord = Record<string, unknown>;

const organizationTypes: readonly OrganizationType[] = [
  "federation",
  "league",
  "competition-organizer",
  "gym",
  "training-facility",
  "team-operator",
  "brand",
  "retailer",
  "media-company",
  "community-organization",
  "other",
];

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown, fallback = ""): string {
  const candidate = typeof value === "string" ? stegaClean(value).trim() : "";
  return candidate || fallback;
}

function optionalString(value: unknown): string | undefined {
  return string(value) || undefined;
}

function oneOf<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
): T {
  const candidate = string(value);
  return values.includes(candidate as T) ? (candidate as T) : fallback;
}

function safeUrl(value: unknown): string | undefined {
  try {
    const url = new URL(string(value));
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function stringArray(value: unknown): string[] {
  return [
    ...new Set(
      array(value)
        .map((item) => string(item))
        .filter(Boolean),
    ),
  ];
}

function prototypeStatus(value: unknown) {
  const candidate = oneOf(
    value,
    ["fictional-prototype", "sample-record", ""] as const,
    "",
  );
  return candidate || undefined;
}

function normalizeOrganizationSummary(
  value: unknown,
): OrganizationSummary | null {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const slug = string(source.slug);
  const name = string(source.name);
  if (!canonicalId || !slug || !name) return null;

  return {
    canonicalId,
    slug,
    name,
    organizationType: oneOf(
      source.organizationType,
      organizationTypes,
      "other",
    ),
    logo: normalizeSanityImage(source.logo),
  };
}

function normalizeOrganization(value: unknown): Organization | null {
  const source = record(value);
  const summary = normalizeOrganizationSummary(source);
  if (!summary) return null;
  const seo = record(source.seo);

  return {
    ...summary,
    description: string(source.description),
    website: safeUrl(source.website),
    country: string(source.country),
    administrativeArea: string(source.administrativeArea),
    city: string(source.city),
    geographicScope: string(source.geographicScope),
    disciplines: stringArray(source.disciplines),
    socialLinks: array(source.socialLinks).flatMap((item) => {
      const link = record(item);
      const url = safeUrl(link.url);
      return url
        ? [{ label: string(link.label, "Organization link"), url }]
        : [];
    }),
    lifecycleStatus: oneOf(
      source.lifecycleStatus ?? source.status,
      ["active", "inactive", "historical"] as const,
      "inactive",
    ),
    prototypeStatus: prototypeStatus(source.prototypeStatus),
    seo: Object.keys(seo).length
      ? {
          title: optionalString(seo.metaTitle),
          description: optionalString(seo.metaDescription),
          noIndex: seo.noIndex === true,
          image: normalizeSanityImage(seo.socialImage),
        }
      : undefined,
  };
}

function normalizeProduct(value: unknown): Product | null {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const slug = string(source.slug);
  const name = string(source.name);
  const brand = normalizeOrganizationSummary(source.brand);
  if (!canonicalId || !slug || !name || !brand) return null;

  const retailer = normalizeOrganizationSummary(source.retailer) ?? undefined;
  const declaredAffiliateStatus = oneOf(
    source.affiliateStatus,
    ["none", "pending", "active", "paused", "ended"] as const,
    "none",
  );
  const declaredCommercialRelationship = oneOf(
    source.commercialRelationship,
    ["none", "affiliate", "sponsored", "advertising"] as const,
    "none",
  );
  const standardProductUrl = safeUrl(source.standardProductUrl);
  const disclosure = optionalString(source.disclosure);
  const commercialRelationship =
    declaredCommercialRelationship === "none" || disclosure
      ? declaredCommercialRelationship
      : "none";
  const affiliateStatus =
    declaredAffiliateStatus === "none" ||
    (commercialRelationship === "affiliate" &&
      Boolean(standardProductUrl) &&
      Boolean(disclosure))
      ? declaredAffiliateStatus
      : "none";
  const candidateAffiliateUrl = safeUrl(source.affiliateUrl);
  const affiliateUrl =
    affiliateStatus === "active" &&
    commercialRelationship === "affiliate" &&
    standardProductUrl &&
    disclosure
      ? candidateAffiliateUrl
      : undefined;
  const priceDisplay = optionalString(source.priceDisplay);
  const lastCheckedAt = optionalString(source.lastCheckedAt);
  const seo = record(source.seo);

  return {
    canonicalId,
    slug,
    name,
    brand,
    retailer,
    category: oneOf(
      source.category,
      PRODUCT_CATEGORIES as readonly ProductCategory[],
      "equipment",
    ),
    subcategory: string(source.subcategory),
    images: array(source.images).flatMap((image) => {
      const normalized = normalizeSanityImage(image);
      return normalized ? [normalized] : [];
    }),
    shortDescription: string(source.shortDescription),
    editorialSummary: string(source.editorialSummary),
    useCases: stringArray(source.useCases),
    disciplines: stringArray(source.disciplines),
    trainingLevel: stringArray(source.trainingLevel),
    environments: stringArray(source.environments).filter(
      (environment): environment is "indoor" | "outdoor" =>
        environment === "indoor" || environment === "outdoor",
    ),
    portable: source.portable === true,
    price: priceDisplay
      ? {
          display: priceDisplay,
          currency: optionalString(source.currency),
          checkedAt: lastCheckedAt,
        }
      : undefined,
    standardProductUrl,
    affiliateUrl,
    affiliateNetwork: optionalString(source.affiliateNetwork),
    affiliateStatus,
    countryAvailability: stringArray(source.countryAvailability),
    featured: source.featured === true,
    editorPick: source.editorPick === true,
    sponsored:
      source.sponsored === true &&
      commercialRelationship === "sponsored" &&
      Boolean(disclosure),
    commercialRelationship,
    lastCheckedAt,
    availabilityNote: string(source.availabilityNote),
    disclosure,
    prototypeStatus: prototypeStatus(source.prototypeStatus),
    seo: Object.keys(seo).length
      ? {
          title: optionalString(seo.metaTitle),
          description: optionalString(seo.metaDescription),
          noIndex: seo.noIndex === true,
          image: normalizeSanityImage(seo.socialImage),
        }
      : undefined,
  };
}

export function normalizeOrganizations(value: unknown): Organization[] {
  const seen = new Set<string>();
  return array(value).flatMap((item) => {
    const organization = normalizeOrganization(item);
    if (
      !organization ||
      seen.has(organization.canonicalId) ||
      seen.has(organization.slug)
    ) {
      return [];
    }
    seen.add(organization.canonicalId);
    seen.add(organization.slug);
    return [organization];
  });
}

export function normalizeOrganizationPage(value: unknown): Organization | null {
  return normalizeOrganization(value);
}

export function normalizeProducts(value: unknown): Product[] {
  const seen = new Set<string>();
  return array(value).flatMap((item) => {
    const product = normalizeProduct(item);
    if (!product || seen.has(product.canonicalId) || seen.has(product.slug)) {
      return [];
    }
    seen.add(product.canonicalId);
    seen.add(product.slug);
    return [product];
  });
}

export function normalizeProductPage(value: unknown): Product | null {
  return normalizeProduct(value);
}
