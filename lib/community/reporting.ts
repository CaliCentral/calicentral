export const COMMUNITY_REPORT_REASONS = [
  "Harassment, hate, or threats",
  "Dangerous content",
  "Fraud or scam",
  "Impersonation",
  "Private or personal information",
  "Copyright or media rights",
  "False sporting data",
  "Spam or manipulation",
  "Other",
] as const;

export type CommunityReportReason =
  (typeof COMMUNITY_REPORT_REASONS)[number];
