import type { Organization } from "@/types/organization";

/**
 * Fictional development records. These names, locations, and descriptions do
 * not represent real organizations or commercial relationships.
 */
export const organizations = [
  {
    canonicalId: "organization.fictional.northstar-movement-works",
    slug: "northstar-movement-works",
    name: "Northstar Movement Works",
    organizationType: "brand",
    description:
      "A fictional product-design studio used to demonstrate a brand relationship without implying a real retailer, partnership, or endorsement.",
    country: "Canada",
    administrativeArea: "Ontario",
    city: "Toronto",
    geographicScope: "Fictional prototype / Global",
    disciplines: ["Strength", "General training"],
    socialLinks: [],
    lifecycleStatus: "active",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
  {
    canonicalId: "organization.fictional.atlas-yard-equipment",
    slug: "atlas-yard-equipment",
    name: "Atlas Yard Equipment",
    organizationType: "brand",
    description:
      "A fictional equipment label reserved for safe local catalog and relationship testing.",
    country: "United Kingdom",
    administrativeArea: "England",
    city: "Manchester",
    geographicScope: "Fictional prototype / Global",
    disciplines: ["Freestyle", "General training"],
    socialLinks: [],
    lifecycleStatus: "active",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
  {
    canonicalId: "organization.fictional.common-ground-training-lab",
    slug: "common-ground-training-lab",
    name: "Common Ground Training Lab",
    organizationType: "training-facility",
    description:
      "A fictional training facility used to demonstrate a non-commercial public organization profile.",
    country: "Australia",
    administrativeArea: "Victoria",
    city: "Melbourne",
    geographicScope: "Fictional prototype / Local",
    disciplines: ["Statics", "Strength", "Freestyle"],
    socialLinks: [],
    lifecycleStatus: "active",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
] as const satisfies readonly Organization[];

export function getOrganizationBySlug(slug: string): Organization | undefined {
  return organizations.find((organization) => organization.slug === slug);
}

