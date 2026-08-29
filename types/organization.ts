import type { EditorialImage, SeoData } from "@/types/content";

export const ORGANIZATION_TYPES = [
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
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export type OrganizationSocialLink = {
  readonly label: string;
  readonly url: string;
};

export type OrganizationSummary = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly organizationType: OrganizationType;
  readonly logo?: EditorialImage;
};

export type Organization = OrganizationSummary & {
  readonly description: string;
  readonly website?: string;
  readonly country: string;
  readonly administrativeArea: string;
  readonly city: string;
  readonly geographicScope: string;
  readonly disciplines: readonly string[];
  readonly socialLinks: readonly OrganizationSocialLink[];
  readonly lifecycleStatus: "active" | "inactive" | "historical";
  readonly prototypeStatus?: "fictional-prototype" | "sample-record";
  readonly seo?: SeoData;
};

