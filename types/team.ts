import type { EditorialImage, SeoData } from "@/types/content";

export type TeamType =
  | "wcl-franchise"
  | "prospective-wcl-team"
  | "competitive-team"
  | "crew"
  | "club"
  | "gym-team"
  | "national-team"
  | "other";

export type TeamPublicStatus =
  | "approved-prospective"
  | "official"
  | "active"
  | "inactive"
  | "archived";

export type TeamLeagueAdmissionStatus =
  | "not-applicable"
  | "prospective"
  | "candidate"
  | "official-franchise"
  | "active-season-franchise";

export type TeamBranding = {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor?: string;
  readonly crest?: EditorialImage;
  readonly wordmark?: EditorialImage;
  readonly uniformNotes?: string;
  readonly approvalStatus: "not-reviewed" | "in-review" | "approved";
};

export type TeamSocialLink = {
  readonly label: string;
  readonly url: string;
};

export type PublicTeamRosterMember = {
  readonly canonicalId: string;
  readonly athleteSlug: string;
  readonly athleteName: string;
  readonly role: string;
  readonly specialty?: string;
  readonly athleteNumber?: string;
  readonly captain: boolean;
};

export type Team = {
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly code: string;
  readonly teamType: TeamType;
  readonly publicStatus: TeamPublicStatus;
  readonly leagueAdmissionStatus: TeamLeagueAdmissionStatus;
  readonly country: string;
  readonly administrativeArea: string;
  readonly city: string;
  readonly trainingBase: string;
  readonly foundingYear?: number;
  readonly description: string;
  readonly disciplines: readonly string[];
  readonly branding: TeamBranding;
  readonly socialLinks: readonly TeamSocialLink[];
  readonly roster: readonly PublicTeamRosterMember[];
  readonly featured: boolean;
  readonly seasonLabel?: string;
  readonly prototypeStatus?: "fictional-prototype" | "sample-record";
  readonly seo?: SeoData;
};

