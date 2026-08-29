import type { EditorialImage, SeoData } from "@/types/content";
import type { OrganizationSummary } from "@/types/organization";

export const PRODUCT_CATEGORIES = [
  "equipment",
  "apparel",
  "training-content-accessories",
  "nutrition-recovery",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductPrice = {
  readonly display: string;
  readonly currency?: string;
  readonly checkedAt?: string;
};

export type Product = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly brand: OrganizationSummary;
  readonly retailer?: OrganizationSummary;
  readonly category: ProductCategory;
  readonly subcategory: string;
  readonly images: readonly EditorialImage[];
  readonly shortDescription: string;
  readonly editorialSummary: string;
  readonly useCases: readonly string[];
  readonly disciplines: readonly string[];
  readonly trainingLevel: readonly string[];
  readonly environments: readonly ("indoor" | "outdoor")[];
  readonly portable: boolean;
  readonly price?: ProductPrice;
  readonly standardProductUrl?: string;
  readonly affiliateUrl?: string;
  readonly affiliateNetwork?: string;
  readonly affiliateStatus: "none" | "pending" | "active" | "paused" | "ended";
  readonly countryAvailability: readonly string[];
  readonly featured: boolean;
  readonly editorPick: boolean;
  readonly sponsored: boolean;
  readonly commercialRelationship: "none" | "affiliate" | "sponsored" | "advertising";
  readonly lastCheckedAt?: string;
  readonly availabilityNote: string;
  readonly disclosure?: string;
  readonly prototypeStatus?: "fictional-prototype" | "sample-record";
  readonly seo?: SeoData;
};

export type ProductDestination = {
  readonly url: string;
  readonly kind: "standard" | "affiliate";
  readonly label: string;
  readonly disclosure?: string;
};

/**
 * Affiliate destinations are usable only when the relationship is explicitly
 * active and publicly disclosed. A normal public product URL remains the safe
 * fallback; no destination is preferable to an invented or ambiguous link.
 */
export function resolveProductDestination(
  product: Product,
): ProductDestination | null {
  if (
    product.affiliateStatus === "active" &&
    product.commercialRelationship === "affiliate" &&
    product.affiliateUrl &&
    product.disclosure
  ) {
    return {
      url: product.affiliateUrl,
      kind: "affiliate",
      label: "Shop at retailer",
      disclosure: product.disclosure,
    };
  }

  return product.standardProductUrl
    ? {
        url: product.standardProductUrl,
        kind: "standard",
        label: "View external product page",
      }
    : null;
}
