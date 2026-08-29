import { organizations } from "@/data/organizations";
import type { Product } from "@/types/product";

const northstar = organizations[0];
const atlasYard = organizations[1];

/**
 * Fictional local samples. They intentionally contain no retailer URL,
 * affiliate URL, price, rating, or claimed commercial relationship.
 */
export const products = [
  {
    canonicalId: "product.fictional.northstar-weight-belt",
    slug: "northstar-weight-belt",
    name: "Northstar Weight Belt",
    brand: northstar,
    category: "equipment",
    subcategory: "Weighted dip belts",
    images: [],
    shortDescription:
      "A fictional weighted-training belt used to demonstrate a curated equipment card.",
    editorialSummary:
      "Prototype catalog copy only. Cali Central has not tested, reviewed, stocked, or endorsed a real product under this name.",
    useCases: ["Weighted pull-ups", "Weighted dips"],
    disciplines: ["Strength"],
    trainingLevel: ["Intermediate", "Advanced"],
    environments: ["indoor", "outdoor"],
    portable: true,
    affiliateStatus: "none",
    countryAvailability: [],
    featured: true,
    editorPick: false,
    sponsored: false,
    commercialRelationship: "none",
    availabilityNote:
      "Fictional catalog sample. No retailer destination or availability claim is configured.",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
  {
    canonicalId: "product.fictional.atlas-yard-parallettes",
    slug: "atlas-yard-parallettes",
    name: "Atlas Yard Parallettes",
    brand: atlasYard,
    category: "equipment",
    subcategory: "Parallettes",
    images: [],
    shortDescription:
      "Fictional low parallettes for demonstrating indoor and outdoor training discovery.",
    editorialSummary:
      "A neutral sample listing with no review score, price guarantee, retailer link, or affiliate relationship.",
    useCases: ["Handstands", "Planche progressions", "Push strength"],
    disciplines: ["Statics", "General training"],
    trainingLevel: ["Beginner", "Intermediate", "Advanced"],
    environments: ["indoor", "outdoor"],
    portable: true,
    affiliateStatus: "none",
    countryAvailability: [],
    featured: false,
    editorPick: false,
    sponsored: false,
    commercialRelationship: "none",
    availabilityNote:
      "Fictional catalog sample. No retailer destination or availability claim is configured.",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
  {
    canonicalId: "product.fictional.northstar-training-timer",
    slug: "northstar-training-timer",
    name: "Northstar Training Timer",
    brand: northstar,
    category: "training-content-accessories",
    subcategory: "Training timers",
    images: [],
    shortDescription:
      "A fictional interval timer used to test a non-equipment Shop category.",
    editorialSummary:
      "This record demonstrates category breadth without presenting a real product or purchase destination.",
    useCases: ["Intervals", "Competition simulation"],
    disciplines: ["Endurance", "General training"],
    trainingLevel: ["Beginner", "Intermediate", "Advanced"],
    environments: ["indoor", "outdoor"],
    portable: true,
    affiliateStatus: "none",
    countryAvailability: [],
    featured: false,
    editorPick: false,
    sponsored: false,
    commercialRelationship: "none",
    availabilityNote:
      "Fictional catalog sample. No retailer destination or availability claim is configured.",
    prototypeStatus: "fictional-prototype",
    seo: { noIndex: true },
  },
] as const satisfies readonly Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

