import "server-only";

export type WclRulesetSetting = "2.0" | "3.0-proposed";

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function ruleset(value: string | undefined): WclRulesetSetting {
  return value === "3.0-proposed" ? value : "2.0";
}

/**
 * Server-owned feature switches. All unfinished or persistence-backed features
 * fail closed when configuration is absent or malformed.
 */
export const featureConfig = Object.freeze({
  community: enabled(process.env.COMMUNITY_FEATURES_ENABLED),
  communityMediaUploads: enabled(
    process.env.COMMUNITY_MEDIA_UPLOADS_ENABLED,
  ),
  teamApplications: enabled(process.env.TEAM_APPLICATIONS_ENABLED),
  organizationClaims: enabled(process.env.ORGANIZATION_CLAIMS_ENABLED),
  videoSubmissions: enabled(process.env.VIDEO_SUBMISSIONS_ENABLED),
  mediaSubmissions: enabled(process.env.MEDIA_SUBMISSIONS_ENABLED),
  shop: enabled(process.env.SHOP_FEATURES_ENABLED),
  productSubmissions: enabled(process.env.PRODUCT_SUBMISSIONS_ENABLED),
  publicProspectiveTeams: enabled(
    process.env.PUBLIC_PROSPECTIVE_TEAMS_ENABLED,
  ),
  wcl: enabled(process.env.WCL_FEATURES_ENABLED),
  externalRankings: enabled(process.env.EXTERNAL_RANKINGS_ENABLED),
  activeWclRuleset: ruleset(process.env.WCL_ACTIVE_RULESET),
});
