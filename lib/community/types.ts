export const COMMUNITY_TARGET_TYPES = [
  "post",
  "comment",
  "story",
  "athlete",
  "team",
  "competition",
  "video",
] as const;

export type CommunityTargetType = (typeof COMMUNITY_TARGET_TYPES)[number];

export const COMMUNITY_CANONICAL_TARGET_TYPES = [
  "story",
  "athlete",
  "team",
  "competition",
  "organization",
  "video",
] as const;

export type CommunityCanonicalTargetType =
  (typeof COMMUNITY_CANONICAL_TARGET_TYPES)[number];

/**
 * Records that can be resolved into a public Cali Central URL. Products remain
 * save-only: they are deliberately not valid like, comment, repost, or post
 * attachment targets.
 */
export type CommunityResolvableTargetType =
  CommunityCanonicalTargetType | "product";

export const COMMUNITY_SAVE_TARGET_TYPES = [
  "post",
  "story",
  "athlete",
  "team",
  "competition",
  "video",
  "product",
] as const;

export type CommunitySaveTargetType =
  (typeof COMMUNITY_SAVE_TARGET_TYPES)[number];

export const ORGANIZATION_MEMBERSHIP_ROLES = [
  "owner",
  "administrator",
  "editor",
  "commerce-manager",
  "media-manager",
  "representative",
] as const;

export type OrganizationMembershipRole =
  (typeof ORGANIZATION_MEMBERSHIP_ROLES)[number];

export const ORGANIZATION_CAPABILITIES = [
  "manage-profile",
  "submit-content",
  "submit-products",
  "submit-media",
  "manage-members",
] as const;

export type OrganizationCapability = (typeof ORGANIZATION_CAPABILITIES)[number];

export const ORGANIZATION_MEMBERSHIP_STATUSES = [
  "pending",
  "active",
  "suspended",
  "revoked",
  "expired",
] as const;

export type OrganizationMembershipStatus =
  (typeof ORGANIZATION_MEMBERSHIP_STATUSES)[number];

/** Private authorization record. Never expose this object on public routes. */
export type OrganizationMembership = {
  readonly id: string;
  readonly memberId: string;
  readonly organizationId: string;
  readonly role: OrganizationMembershipRole;
  readonly capabilities: readonly OrganizationCapability[];
  readonly status: OrganizationMembershipStatus;
  readonly reviewedByPrincipalId?: string;
  readonly reviewedAt?: string;
  readonly grantedAt?: string;
  readonly revokedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const COMMUNITY_COMMENT_TARGET_TYPES = [
  "post",
  "story",
  "video",
] as const;

export type CommunityCommentTargetType =
  (typeof COMMUNITY_COMMENT_TARGET_TYPES)[number];

export const COMMUNITY_REPOST_TARGET_TYPES = [
  "post",
  "story",
  "video",
] as const;

export type CommunityRepostTargetType =
  (typeof COMMUNITY_REPOST_TARGET_TYPES)[number];

export const COMMUNITY_FOLLOW_TARGET_TYPES = [
  "member",
  "athlete",
  "team",
  "competition",
  "organization",
] as const;

export type CommunityFollowTargetType =
  (typeof COMMUNITY_FOLLOW_TARGET_TYPES)[number];

export type PublicMemberSocialAccount = {
  readonly platform: string;
  readonly url: string;
  readonly handle?: string;
};

export type PublicMemberSummary = {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly publicRoles: readonly string[];
};

export type PublicMemberSearchResult = PublicMemberSummary & {
  readonly biography: string;
  readonly location: string;
};

export type PublicMemberProfile = PublicMemberSummary & {
  readonly coverImageUrl?: string;
  readonly biography: string;
  readonly country?: string;
  readonly administrativeArea?: string;
  readonly city?: string;
  readonly interests: readonly string[];
  readonly disciplines: readonly string[];
  readonly socialAccounts: readonly PublicMemberSocialAccount[];
  readonly discoverable: boolean;
  readonly showMedia: boolean;
  readonly linkedAthleteId?: string;
  readonly followerCount: number;
  readonly followingCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Private server-only projection. It must never be passed to public pages. */
export type OwnMemberProfile = PublicMemberProfile & {
  readonly principalId: string;
  readonly profilePublic: boolean;
  readonly showLocation: boolean;
  readonly showSocialAccounts: boolean;
  readonly preferredTimeZone?: string;
  readonly status: "active" | "hidden" | "suspended" | "archived";
};

export type CommunityInteractionState = {
  readonly likeCount: number;
  readonly commentCount: number;
  readonly repostCount: number;
  readonly liked: boolean;
  readonly saved: boolean;
  readonly reposted: boolean;
  readonly collectionIds: readonly string[];
};

export const COMMUNITY_MEDIA_KINDS = [
  "image",
  "video",
  "external-embed",
] as const;

export type CommunityMediaKind = (typeof COMMUNITY_MEDIA_KINDS)[number];

export const COMMUNITY_POST_TYPES = [
  "general",
  "training",
  "pr",
  "skill",
  "competition",
  "photo",
  "video",
] as const;

export type CommunityPostType = (typeof COMMUNITY_POST_TYPES)[number];

export type CommunityPostVisibility = "public" | "followers" | "private";

export type CommunityPostPreview = {
  readonly id: string;
  readonly body: string;
  readonly author?: PublicMemberSummary;
  readonly available: boolean;
};

export type CommunityPost = {
  readonly id: string;
  readonly authorMemberId: string;
  readonly author: PublicMemberSummary;
  readonly body: string;
  readonly postType: CommunityPostType;
  readonly visibility: CommunityPostVisibility;
  readonly canonicalTargetType?: CommunityCanonicalTargetType;
  readonly canonicalTargetId?: string;
  readonly externalMediaId?: string;
  readonly externalMediaUrl?: string;
  readonly externalMediaCredit?: string;
  readonly externalMediaKind?: CommunityMediaKind;
  readonly externalMediaAltText?: string;
  readonly repost?: {
    readonly targetType: CommunityRepostTargetType;
    readonly targetId: string;
    readonly originalPost?: CommunityPostPreview;
  };
  readonly interactions: CommunityInteractionState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly edited: boolean;
  readonly viewerCanEdit: boolean;
};

export type CommunityPostPage = {
  readonly items: readonly CommunityPost[];
  readonly nextCursor?: string;
};

export type CommunityComment = {
  readonly id: string;
  readonly targetType: CommunityCommentTargetType;
  readonly targetId: string;
  readonly parentCommentId?: string;
  readonly author: PublicMemberSummary;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly edited: boolean;
  readonly viewerCanEdit: boolean;
  readonly replyCount: number;
  readonly replies: readonly CommunityComment[];
};

export type CommunityCommentPage = {
  readonly items: readonly CommunityComment[];
  readonly hasMore: boolean;
  readonly nextOffset?: number;
};

export type CommunityCollectionSummary = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly itemCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CommunityLibraryItem = {
  readonly targetType: CommunitySaveTargetType;
  readonly targetId: string;
  readonly addedAt: string;
  readonly collectionIds: readonly string[];
  readonly post?: CommunityPostPreview;
};

export type CommunityCollection = CommunityCollectionSummary & {
  readonly items: readonly CommunityLibraryItem[];
};

export type CommunityReport = {
  readonly id: string;
  readonly reporter: PublicMemberSummary;
  readonly targetType: "member" | "post" | "comment" | "media";
  readonly targetId: string;
  readonly targetHidden?: boolean;
  readonly targetPublic?: boolean;
  readonly reason: string;
  readonly details: string;
  readonly status:
    "submitted" | "in-review" | "resolved" | "dismissed" | "archived";
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CommunityAuditEvent = {
  readonly id: string;
  readonly eventType:
    | "communityPostHidden"
    | "communityPostRestored"
    | "communityCommentHidden"
    | "communityCommentRestored"
    | "communityReportResolved"
    | "communityReportDismissed";
  readonly targetType: "post" | "comment" | "report";
  readonly targetId: string;
  readonly summary: string;
  readonly createdAt: string;
};

export type CommunityNotification = {
  readonly id: string;
  readonly notificationType:
    | "follow"
    | "like"
    | "comment"
    | "reply"
    | "repost"
    | "athlete-claim"
    | "submission"
    | "competition-update"
    | "athlete-update"
    | "team-update"
    | "team-invite";
  readonly actor?: PublicMemberSummary;
  readonly targetType?:
    | "member"
    | "post"
    | "comment"
    | "story"
    | "video"
    | "athlete"
    | "competition"
    | "team"
    | "submission"
    | "organization";
  readonly targetId?: string;
  readonly readAt?: string;
  readonly createdAt: string;
};

export type CommunityNotificationPreferences = {
  readonly social: boolean;
  readonly competitions: boolean;
  readonly claimsAndSubmissions: boolean;
  readonly email: boolean;
};

export type CommunityFollowRecord = {
  readonly targetType: CommunityFollowTargetType;
  readonly targetId: string;
  readonly createdAt: string;
  readonly member?: PublicMemberSummary;
};

export type CommunityTeamAffiliation = {
  readonly id: string;
  readonly teamId: string;
  readonly role: "captain" | "athlete" | "reserve" | "coach" | "manager" | "administrator" | "media-manager";
  readonly publicVisible: boolean;
  readonly grantedAt?: string;
};

export type CommunityRepositoryAvailability = {
  readonly enabled: boolean;
  readonly configured: boolean;
  readonly writable: boolean;
  readonly reason?: string;
};

export type CommunitySaveState = {
  readonly saved: boolean;
  readonly collectionIds: readonly string[];
};

export type ResolvedCommunityTarget = {
  readonly type: CommunityResolvableTargetType;
  readonly id: string;
  readonly href: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly meta?: string;
};
