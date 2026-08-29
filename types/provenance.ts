export type ProvenanceVerificationStatus =
  | "unverified"
  | "submitted"
  | "source-confirmed"
  | "official"
  | "disputed"
  | "superseded";

export type ProvenanceSourceType =
  | "official-results-page"
  | "organization-ranking-page"
  | "official-result-sheet"
  | "organizer-source"
  | "athlete-submitted"
  | "editor-confirmed"
  | "other";

export type ProvenanceSource = {
  readonly providerId?: string;
  readonly providerName?: string;
  readonly url?: string;
  readonly title: string;
  readonly type: ProvenanceSourceType;
  readonly externalRecordId?: string;
  readonly publishedAt?: string;
  readonly checkedAt?: string;
  readonly verificationStatus: ProvenanceVerificationStatus;
};

