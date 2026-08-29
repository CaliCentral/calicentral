import { z } from "zod";

import {
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_MEMBERSHIP_ROLES,
  ORGANIZATION_MEMBERSHIP_STATUSES,
  type OrganizationCapability,
  type OrganizationMembership,
  type CommunityCanonicalTargetType,
  type CommunityAuditEvent,
  type CommunityCollection,
  type CommunityCollectionSummary,
  type CommunityComment,
  type CommunityCommentPage,
  type CommunityCommentTargetType,
  type CommunityFollowRecord,
  type CommunityTeamAffiliation,
  type CommunityFollowTargetType,
  type CommunityInteractionState,
  type CommunityLibraryItem,
  type CommunityNotification,
  type CommunityNotificationPreferences,
  type CommunityPost,
  type CommunityPostPage,
  type CommunityPostType,
  type CommunityPostVisibility,
  type CommunityReport,
  type CommunityRepositoryAvailability,
  type CommunityRepostTargetType,
  type CommunitySaveState,
  type CommunitySaveTargetType,
  type CommunityTargetType,
  type OwnMemberProfile,
  type PublicMemberProfile,
  type PublicMemberSearchResult,
  type PublicMemberSocialAccount,
  type PublicMemberSummary,
} from "@/lib/community/types";
import {
  communityCanonicalTargetTypeSchema,
  communityCommentTargetTypeSchema,
  communityExternalUrlSchema,
  communityFollowTargetTypeSchema,
  communityHandleSchema,
  communityIdSchema,
  communityMediaKindSchema,
  communityPostTypeSchema,
  communityRepostTargetTypeSchema,
  communitySaveTargetTypeSchema,
  communityTargetTypeSchema,
  optionalCommunityExternalUrlSchema,
  optionalCommunityProfileImageUrlSchema,
} from "@/lib/community/validation";

type SqlValue = string | number | null;

export interface D1RunResultLike {
  readonly success?: boolean;
  readonly meta?: {
    readonly changes?: number;
  };
}

export interface D1PreparedStatementLike {
  bind(...values: SqlValue[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{
    results: T[];
    success?: boolean;
  }>;
  run(): Promise<D1RunResultLike>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(
    statements: D1PreparedStatementLike[],
  ): Promise<readonly D1RunResultLike[]>;
}

export class CommunityUnavailableError extends Error {
  constructor() {
    super("Community persistence is unavailable.");
    this.name = "CommunityUnavailableError";
  }
}

export class CommunityAuthorizationError extends Error {
  constructor(message = "You do not have permission to make this change.") {
    super(message);
    this.name = "CommunityAuthorizationError";
  }
}

const profileStatusSchema = z.enum([
  "active",
  "hidden",
  "suspended",
  "archived",
]);
const reportStatusSchema = z.enum([
  "submitted",
  "in-review",
  "resolved",
  "dismissed",
  "archived",
]);
const communityAuditEventTypeSchema = z.enum([
  "communityPostHidden",
  "communityPostRestored",
  "communityCommentHidden",
  "communityCommentRestored",
  "communityReportResolved",
  "communityReportDismissed",
]);
const publicRoleSchema = z.string().trim().min(1).max(80);
const socialPlatformSchema = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "facebook",
  "website",
  "discord",
]);
const organizationMembershipRoleSchema = z.enum(ORGANIZATION_MEMBERSHIP_ROLES);
const organizationCapabilitySchema = z.enum(ORGANIZATION_CAPABILITIES);
const organizationMembershipStatusSchema = z.enum(
  ORGANIZATION_MEMBERSHIP_STATUSES,
);
const optionalTimeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .optional()
  .refine((value) => {
    if (!value) return true;
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Use a valid IANA timezone such as America/Chicago.");
const cursorSchema = z
  .string()
  .max(260)
  .transform((value, context) => {
    const separator = value.indexOf("|");
    if (separator < 1) {
      context.addIssue({ code: "custom", message: "Invalid feed cursor." });
      return z.NEVER;
    }
    const createdAt = value.slice(0, separator);
    const id = value.slice(separator + 1);
    if (!z.iso.datetime().safeParse(createdAt).success || !id) {
      context.addIssue({ code: "custom", message: "Invalid feed cursor." });
      return z.NEVER;
    }
    return { createdAt, id: communityIdSchema.parse(id) };
  });

function now(): string {
  return new Date().toISOString();
}

function jsonList(value: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function safeOptional(value: string | null | undefined): string | undefined {
  return value || undefined;
}

function inferExternalMediaKind(
  value: string,
): "image" | "video" | "external-embed" {
  const pathname = new URL(value).pathname.toLowerCase();
  if (/\.(?:avif|gif|jpe?g|png|webp)$/.test(pathname)) return "image";
  if (/\.(?:m4v|mov|mp4|webm)$/.test(pathname)) return "video";
  const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  if (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com")
  ) {
    return "video";
  }
  return "external-embed";
}

function changed(result: D1RunResultLike): boolean {
  if (result.success === false) return false;
  return result.meta?.changes === undefined || result.meta.changes > 0;
}

type PublicProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  biography: string;
  country: string | null;
  administrative_area: string | null;
  city: string | null;
  interests_json: string;
  disciplines_json: string;
  public_roles_json: string;
  discoverable: number;
  show_media: number;
  created_at: string;
  updated_at: string;
};

type OwnProfileRow = PublicProfileRow & {
  principal_id: string;
  profile_public: number;
  show_location: number;
  show_social_accounts: number;
  preferred_timezone: string | null;
  status: string;
};

type SocialAccountRow = {
  platform: string;
  url: string;
  handle: string | null;
};

type OrganizationMembershipRow = {
  id: string;
  member_id: string;
  organization_id: string;
  role: string;
  capabilities_json: string;
  status: string;
  reviewed_by_principal_id: string | null;
  reviewed_at: string | null;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: string;
  notification_type: string;
  target_type: string | null;
  target_id: string | null;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
  actor_handle: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  actor_public_roles_json: string | null;
};

function organizationMembershipFromRow(
  row: OrganizationMembershipRow,
): OrganizationMembership {
  return {
    id: row.id,
    memberId: row.member_id,
    organizationId: row.organization_id,
    role: organizationMembershipRoleSchema.parse(row.role),
    capabilities: jsonList(row.capabilities_json).flatMap((value) => {
      const parsed = organizationCapabilitySchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    }),
    status: organizationMembershipStatusSchema.parse(row.status),
    reviewedByPrincipalId: safeOptional(row.reviewed_by_principal_id),
    reviewedAt: safeOptional(row.reviewed_at),
    grantedAt: safeOptional(row.granted_at),
    revokedAt: safeOptional(row.revoked_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function memberSummary(row: {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  public_roles_json: string;
}): PublicMemberSummary {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: safeOptional(row.avatar_url),
    publicRoles: jsonList(row.public_roles_json),
  };
}

function publicProfile(
  row: PublicProfileRow,
  socialAccounts: readonly PublicMemberSocialAccount[],
  details: {
    readonly linkedAthleteId?: string;
    readonly followerCount: number;
    readonly followingCount: number;
  },
): PublicMemberProfile {
  return {
    ...memberSummary(row),
    coverImageUrl: safeOptional(row.cover_image_url),
    biography: row.biography,
    country: safeOptional(row.country),
    administrativeArea: safeOptional(row.administrative_area),
    city: safeOptional(row.city),
    interests: jsonList(row.interests_json),
    disciplines: jsonList(row.disciplines_json),
    socialAccounts,
    discoverable: row.discoverable === 1,
    showMedia: row.show_media === 1,
    ...details,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function socialAccounts(rows: readonly SocialAccountRow[]) {
  return rows.map((row) => ({
    platform: row.platform,
    url: row.url,
    handle: safeOptional(row.handle),
  }));
}

const PUBLIC_PROFILE_SELECT = `SELECT id, handle, display_name, avatar_url,
  cover_image_url, biography,
  CASE WHEN show_location = 1 THEN country ELSE NULL END AS country,
  CASE WHEN show_location = 1 THEN administrative_area ELSE NULL END AS administrative_area,
  CASE WHEN show_location = 1 THEN city ELSE NULL END AS city,
  interests_json, disciplines_json, public_roles_json, discoverable, show_media,
  created_at, updated_at
  FROM member_profiles`;

type PostRow = {
  id: string;
  author_member_id: string;
  body: string;
  post_type: string;
  visibility: string;
  canonical_target_type: string | null;
  canonical_target_id: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_public_roles_json: string;
  reply_count?: number;
  external_media_id: string | null;
  external_media_url: string | null;
  external_media_credit: string | null;
  external_media_kind: string | null;
  external_media_alt_text: string | null;
  repost_id: string | null;
  repost_target_type: string | null;
  repost_target_id: string | null;
  original_post_id: string | null;
  original_post_body: string | null;
  original_author_id: string | null;
  original_author_handle: string | null;
  original_author_display_name: string | null;
  original_author_avatar_url: string | null;
  original_author_public_roles_json: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  viewer_liked: number;
  viewer_saved: number;
  viewer_reposted: number;
  viewer_collection_ids_json: string;
};

function postFromRow(row: PostRow, viewerMemberId?: string): CommunityPost {
  const author = memberSummary({
    id: row.author_id,
    handle: row.author_handle,
    display_name: row.author_display_name,
    avatar_url: row.author_avatar_url,
    public_roles_json: row.author_public_roles_json,
  });
  const repostTargetType = row.repost_target_type
    ? communityRepostTargetTypeSchema.parse(row.repost_target_type)
    : undefined;
  const originalAuthor =
    row.original_author_id &&
    row.original_author_handle &&
    row.original_author_display_name
      ? memberSummary({
          id: row.original_author_id,
          handle: row.original_author_handle,
          display_name: row.original_author_display_name,
          avatar_url: row.original_author_avatar_url,
          public_roles_json: row.original_author_public_roles_json ?? "[]",
        })
      : undefined;

  return {
    id: row.id,
    authorMemberId: row.author_member_id,
    author,
    body: row.body,
    postType: communityPostTypeSchema.parse(row.post_type),
    visibility: z
      .enum(["public", "followers", "private"])
      .parse(row.visibility),
    canonicalTargetType: row.canonical_target_type
      ? communityCanonicalTargetTypeSchema.parse(row.canonical_target_type)
      : undefined,
    canonicalTargetId: safeOptional(row.canonical_target_id),
    externalMediaId: safeOptional(row.external_media_id),
    externalMediaUrl: safeOptional(row.external_media_url),
    externalMediaCredit: safeOptional(row.external_media_credit),
    externalMediaKind: row.external_media_kind
      ? communityMediaKindSchema.parse(row.external_media_kind)
      : undefined,
    externalMediaAltText: safeOptional(row.external_media_alt_text),
    repost:
      repostTargetType && row.repost_target_id
        ? {
            targetType: repostTargetType,
            targetId: row.repost_target_id,
            ...(repostTargetType === "post"
              ? {
                  originalPost: {
                    id: row.repost_target_id,
                    body: originalAuthor ? (row.original_post_body ?? "") : "",
                    author: originalAuthor,
                    available: Boolean(row.original_post_id && originalAuthor),
                  },
                }
              : {}),
          }
        : undefined,
    interactions: {
      likeCount: Number(row.like_count) || 0,
      commentCount: Number(row.comment_count) || 0,
      repostCount: Number(row.repost_count) || 0,
      liked: row.viewer_liked === 1,
      saved: row.viewer_saved === 1,
      reposted: row.viewer_reposted === 1,
      collectionIds: jsonList(row.viewer_collection_ids_json),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    edited: row.updated_at !== row.created_at,
    viewerCanEdit: viewerMemberId === row.author_member_id,
  };
}

type CommentRow = {
  id: string;
  target_type: string;
  target_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_public_roles_json: string;
  reply_count?: number;
};

function commentFromRow(
  row: CommentRow,
  viewerMemberId?: string,
  replies: readonly CommunityComment[] = [],
): CommunityComment {
  return {
    id: row.id,
    targetType: communityCommentTargetTypeSchema.parse(row.target_type),
    targetId: row.target_id,
    parentCommentId: safeOptional(row.parent_comment_id),
    author: memberSummary({
      id: row.author_id,
      handle: row.author_handle,
      display_name: row.author_display_name,
      avatar_url: row.author_avatar_url,
      public_roles_json: row.author_public_roles_json,
    }),
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    edited: row.updated_at !== row.created_at,
    viewerCanEdit: viewerMemberId === row.author_id,
    replyCount: Number(row.reply_count) || replies.length,
    replies,
  };
}

type LibraryRow = {
  target_type: string;
  target_id: string;
  added_at: string;
  collection_ids_json?: string;
  post_id: string | null;
  post_body: string | null;
  post_author_id: string | null;
  post_author_handle: string | null;
  post_author_display_name: string | null;
  post_author_avatar_url: string | null;
  post_author_public_roles_json: string | null;
};

function libraryItem(row: LibraryRow): CommunityLibraryItem {
  const author =
    row.post_author_id && row.post_author_handle && row.post_author_display_name
      ? memberSummary({
          id: row.post_author_id,
          handle: row.post_author_handle,
          display_name: row.post_author_display_name,
          avatar_url: row.post_author_avatar_url,
          public_roles_json: row.post_author_public_roles_json ?? "[]",
        })
      : undefined;

  return {
    targetType: communitySaveTargetTypeSchema.parse(row.target_type),
    targetId: row.target_id,
    addedAt: row.added_at,
    collectionIds: jsonList(row.collection_ids_json),
    ...(row.target_type === "post"
      ? {
          post: {
            id: row.target_id,
            body: row.post_body ?? "",
            author,
            available: Boolean(row.post_id),
          },
        }
      : {}),
  };
}

export class CommunityRepository {
  readonly availability: CommunityRepositoryAvailability;

  constructor(
    private readonly db: D1DatabaseLike | undefined,
    enabled: boolean,
  ) {
    this.availability =
      db && enabled
        ? { enabled: true, configured: true, writable: true }
        : {
            enabled,
            configured: Boolean(db),
            writable: false,
            reason: !enabled ? "Feature flag disabled." : "D1 binding missing.",
          };
  }

  private requireDb(): D1DatabaseLike {
    if (!this.availability.writable || !this.db) {
      throw new CommunityUnavailableError();
    }
    return this.db;
  }

  private async getSocialAccounts(
    memberId: string,
    own = false,
  ): Promise<readonly PublicMemberSocialAccount[]> {
    const db = this.requireDb();
    const visibleCondition = own
      ? ""
      : "AND visible = 1 AND EXISTS (SELECT 1 FROM member_profiles profile WHERE profile.id = member_social_accounts.member_id AND profile.show_social_accounts = 1)";
    const result = await db
      .prepare(
        `SELECT platform, url, handle FROM member_social_accounts
         WHERE member_id = ? ${visibleCondition}
         ORDER BY platform, created_at`,
      )
      .bind(memberId)
      .all<SocialAccountRow>();
    return socialAccounts(result.results);
  }

  private async getPublicProfileDetails(memberId: string): Promise<{
    readonly linkedAthleteId?: string;
    readonly followerCount: number;
    readonly followingCount: number;
  }> {
    const row = await this.requireDb()
      .prepare(
        `SELECT
          (SELECT canonical_athlete_id FROM athlete_profile_controls
            WHERE member_id = ? AND status = 'active' LIMIT 1) AS linked_athlete_id,
          (SELECT COUNT(*) FROM follows
            WHERE target_type = 'member' AND target_id = ?) AS follower_count,
          (SELECT COUNT(*) FROM follows
            WHERE follower_member_id = ?) AS following_count`,
      )
      .bind(memberId, memberId, memberId)
      .first<{
        linked_athlete_id: string | null;
        follower_count: number;
        following_count: number;
      }>();
    return {
      linkedAthleteId: safeOptional(row?.linked_athlete_id),
      followerCount: Number(row?.follower_count) || 0,
      followingCount: Number(row?.following_count) || 0,
    };
  }

  async getPublicMemberProfile(
    handle: string,
  ): Promise<PublicMemberProfile | null> {
    if (!this.availability.writable || !this.db) return null;
    const normalized = communityHandleSchema.parse(handle);
    const row = await this.db
      .prepare(
        `${PUBLIC_PROFILE_SELECT}
         WHERE handle = ? COLLATE NOCASE AND profile_public = 1
           AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      )
      .bind(normalized)
      .first<PublicProfileRow>();
    if (!row) return null;
    return publicProfile(
      row,
      await this.getSocialAccounts(row.id),
      await this.getPublicProfileDetails(row.id),
    );
  }

  async getPublicMemberProfileById(
    memberId: string,
  ): Promise<PublicMemberProfile | null> {
    if (!this.availability.writable || !this.db) return null;
    const id = communityIdSchema.parse(memberId);
    const row = await this.db
      .prepare(
        `${PUBLIC_PROFILE_SELECT}
         WHERE id = ? AND profile_public = 1 AND status = 'active'
           AND deleted_at IS NULL LIMIT 1`,
      )
      .bind(id)
      .first<PublicProfileRow>();
    if (!row) return null;
    return publicProfile(
      row,
      await this.getSocialAccounts(row.id),
      await this.getPublicProfileDetails(row.id),
    );
  }

  async getPublicMemberProfileByAthleteId(
    athleteId: string,
  ): Promise<PublicMemberProfile | null> {
    if (!this.availability.writable || !this.db) return null;
    const id = communityIdSchema.parse(athleteId);
    const row = await this.db
      .prepare(
        `${PUBLIC_PROFILE_SELECT}
         WHERE id = (SELECT member_id FROM athlete_profile_controls
             WHERE canonical_athlete_id = ? AND status = 'active' LIMIT 1)
           AND profile_public = 1 AND status = 'active'
           AND deleted_at IS NULL LIMIT 1`,
      )
      .bind(id)
      .first<PublicProfileRow>();
    if (!row) return null;
    return publicProfile(
      row,
      await this.getSocialAccounts(row.id),
      await this.getPublicProfileDetails(row.id),
    );
  }

  async getMemberProfileByPrincipalId(
    principalId: string,
  ): Promise<OwnMemberProfile | null> {
    if (!this.availability.writable || !this.db) return null;
    const principal = communityIdSchema.parse(principalId);
    const row = await this.db
      .prepare(
        `SELECT id, principal_id, handle, display_name, avatar_url,
          cover_image_url, biography, country, administrative_area, city,
          preferred_timezone,
          interests_json, disciplines_json, public_roles_json, profile_public,
          show_location, show_social_accounts, show_media, discoverable, status,
          created_at, updated_at
         FROM member_profiles
         WHERE principal_id = ? AND deleted_at IS NULL LIMIT 1`,
      )
      .bind(principal)
      .first<OwnProfileRow>();
    if (!row) return null;

    return {
      ...publicProfile(
        row,
        await this.getSocialAccounts(row.id, true),
        await this.getPublicProfileDetails(row.id),
      ),
      principalId: row.principal_id,
      profilePublic: row.profile_public === 1,
      showLocation: row.show_location === 1,
      showSocialAccounts: row.show_social_accounts === 1,
      preferredTimeZone: safeOptional(row.preferred_timezone),
      status: profileStatusSchema.parse(row.status),
    };
  }

  async getOrganizationMembership(
    memberId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    if (!this.availability.writable || !this.db) return null;
    const member = communityIdSchema.parse(memberId);
    const organization = communityIdSchema.parse(organizationId);
    const row = await this.db
      .prepare(
        `SELECT id, member_id, organization_id, role, capabilities_json, status,
          reviewed_by_principal_id, reviewed_at, granted_at, revoked_at,
          created_at, updated_at
         FROM organization_memberships
         WHERE member_id = ? AND organization_id = ? LIMIT 1`,
      )
      .bind(member, organization)
      .first<OrganizationMembershipRow>();
    if (!row) return null;

    return organizationMembershipFromRow(row);
  }

  async listOrganizationMemberships(
    memberId: string,
  ): Promise<readonly OrganizationMembership[]> {
    if (!this.availability.writable || !this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const result = await this.db
      .prepare(
        `SELECT id, member_id, organization_id, role, capabilities_json, status,
          reviewed_by_principal_id, reviewed_at, granted_at, revoked_at,
          created_at, updated_at
         FROM organization_memberships
         WHERE member_id = ? AND status = 'active'
         ORDER BY updated_at DESC, organization_id
         LIMIT 50`,
      )
      .bind(member)
      .all<OrganizationMembershipRow>();
    return result.results.map(organizationMembershipFromRow);
  }

  async hasOrganizationCapability(
    memberId: string,
    organizationId: string,
    capability: OrganizationCapability,
  ): Promise<boolean> {
    const required = organizationCapabilitySchema.parse(capability);
    const membership = await this.getOrganizationMembership(
      memberId,
      organizationId,
    );
    return (
      membership?.status === "active" &&
      membership.capabilities.includes(required)
    );
  }

  async grantOrganizationMembership(input: {
    readonly memberPrincipalId: string;
    readonly organizationId: string;
    readonly capabilities: readonly OrganizationCapability[];
    readonly reviewedByPrincipalId: string;
  }): Promise<boolean> {
    const parsed = z
      .object({
        memberPrincipalId: communityIdSchema,
        organizationId: communityIdSchema,
        capabilities: z
          .array(organizationCapabilitySchema)
          .min(1)
          .max(ORGANIZATION_CAPABILITIES.length),
        reviewedByPrincipalId: communityIdSchema,
      })
      .strict()
      .parse(input);
    const member = await this.getMemberProfileByPrincipalId(
      parsed.memberPrincipalId,
    );
    if (!member || member.status !== "active") {
      throw new CommunityAuthorizationError(
        "An active member profile is required before organization access can be granted.",
      );
    }
    const timestamp = now();
    const capabilities = JSON.stringify([...new Set(parsed.capabilities)]);
    const result = await this.requireDb()
      .prepare(
        `INSERT INTO organization_memberships (
          id, member_id, organization_id, role, capabilities_json, status,
          reviewed_by_principal_id, reviewed_at, granted_at, revoked_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'representative', ?, 'active', ?, ?, ?, NULL, ?, ?)
        ON CONFLICT (organization_id, member_id) DO UPDATE SET
          role = 'representative',
          capabilities_json = excluded.capabilities_json,
          status = 'active',
          reviewed_by_principal_id = excluded.reviewed_by_principal_id,
          reviewed_at = excluded.reviewed_at,
          granted_at = excluded.granted_at,
          revoked_at = NULL,
          updated_at = excluded.updated_at`,
      )
      .bind(
        crypto.randomUUID(),
        member.id,
        parsed.organizationId,
        capabilities,
        parsed.reviewedByPrincipalId,
        timestamp,
        timestamp,
        timestamp,
        timestamp,
      )
      .run();
    return changed(result);
  }

  async grantAthleteProfileControl(input: {
    readonly memberPrincipalId: string;
    readonly athleteId: string;
    readonly submissionId: string;
    readonly reviewedByPrincipalId: string;
  }): Promise<boolean> {
    const parsed = z
      .object({
        memberPrincipalId: communityIdSchema,
        athleteId: communityIdSchema,
        submissionId: communityIdSchema,
        reviewedByPrincipalId: communityIdSchema,
      })
      .strict()
      .parse(input);
    const member = await this.getMemberProfileByPrincipalId(
      parsed.memberPrincipalId,
    );
    if (!member || member.status !== "active") {
      throw new CommunityAuthorizationError(
        "An active member profile is required before athlete access can be granted.",
      );
    }
    const db = this.requireDb();
    const conflict = await db
      .prepare(
        `SELECT id, member_id, canonical_athlete_id, submission_id
         FROM athlete_profile_controls
         WHERE member_id = ? OR canonical_athlete_id = ? OR submission_id = ?
         LIMIT 1`,
      )
      .bind(member.id, parsed.athleteId, parsed.submissionId)
      .first<{
        id: string;
        member_id: string;
        canonical_athlete_id: string;
        submission_id: string;
      }>();
    if (
      conflict &&
      (conflict.member_id !== member.id ||
        conflict.canonical_athlete_id !== parsed.athleteId ||
        conflict.submission_id !== parsed.submissionId)
    ) {
      throw new CommunityAuthorizationError(
        "This member, athlete, or claim already has a different control record.",
      );
    }
    const timestamp = now();
    const controlId = conflict?.id ?? crypto.randomUUID();
    const results = await db.batch([
      db.prepare(
        `INSERT INTO athlete_profile_controls (
          id, member_id, canonical_athlete_id, submission_id, status,
          reviewed_by_principal_id, reviewed_at, revoked_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, ?, ?)
        ON CONFLICT (member_id) DO UPDATE SET
          status = 'active', reviewed_by_principal_id = excluded.reviewed_by_principal_id,
          reviewed_at = excluded.reviewed_at, revoked_at = NULL,
          updated_at = excluded.updated_at`,
      ).bind(
        controlId,
        member.id,
        parsed.athleteId,
        parsed.submissionId,
        parsed.reviewedByPrincipalId,
        timestamp,
        timestamp,
        timestamp,
      ),
      db.prepare(
        `INSERT OR IGNORE INTO notifications (
          id, member_id, notification_type, actor_member_id,
          target_type, target_id, read_at, created_at
        ) VALUES (?, ?, 'athlete-claim', NULL, 'athlete', ?, NULL, ?)`,
      ).bind(
        `athlete-claim:${parsed.submissionId}`,
        member.id,
        parsed.athleteId,
        timestamp,
      ),
      db.prepare(
        `INSERT OR IGNORE INTO application_audit_events (
          id, event_type, actor_principal_id, target_type, target_id,
          member_id, canonical_athlete_id, metadata_json, created_at
        ) VALUES (?, 'athleteControlGranted', ?, 'athlete-control', ?, ?, ?, ?, ?)`,
      ).bind(
        `athlete-control-granted:${parsed.submissionId}`,
        parsed.reviewedByPrincipalId,
        controlId,
        member.id,
        parsed.athleteId,
        JSON.stringify({ submissionId: parsed.submissionId }),
        timestamp,
      ),
    ]);
    return changed(results[0] ?? { success: false });
  }

  async recordAthleteClaimAudit(input: {
    readonly eventType: "athleteClaimSubmitted" | "athleteClaimApproved" | "athleteClaimRejected";
    readonly actorPrincipalId: string;
    readonly claimantPrincipalId: string;
    readonly submissionId: string;
    readonly canonicalAthleteId?: string;
  }): Promise<void> {
    const parsed = z.object({
      eventType: z.enum(["athleteClaimSubmitted", "athleteClaimApproved", "athleteClaimRejected"]),
      actorPrincipalId: communityIdSchema,
      claimantPrincipalId: communityIdSchema,
      submissionId: communityIdSchema,
      canonicalAthleteId: communityIdSchema.optional(),
    }).strict().parse(input);
    const claimant = await this.getMemberProfileByPrincipalId(parsed.claimantPrincipalId);
    await this.requireDb().prepare(
      `INSERT OR IGNORE INTO application_audit_events (
        id, event_type, actor_principal_id, target_type, target_id,
        member_id, canonical_athlete_id, metadata_json, created_at
      ) VALUES (?, ?, ?, 'submission', ?, ?, ?, ?, ?)`,
    ).bind(
      `athlete-claim-audit:${parsed.eventType}:${parsed.submissionId}`,
      parsed.eventType,
      parsed.actorPrincipalId,
      parsed.submissionId,
      claimant?.id ?? null,
      parsed.canonicalAthleteId ?? null,
      JSON.stringify({ claimantPrincipalId: parsed.claimantPrincipalId }),
      now(),
    ).run();
  }

  async notifySubmissionStatus(input: {
    readonly contributorPrincipalId: string;
    readonly submissionId: string;
    readonly status: string;
    readonly operationKey: string;
  }): Promise<void> {
    const parsed = z.object({ contributorPrincipalId: communityIdSchema, submissionId: communityIdSchema, status: z.string().trim().min(1).max(80), operationKey: z.string().trim().min(1).max(260) }).strict().parse(input);
    const member = await this.getMemberProfileByPrincipalId(parsed.contributorPrincipalId);
    if (!member) return;
    await this.requireDb().prepare(`INSERT OR IGNORE INTO notifications (id, member_id, notification_type, target_type, target_id, created_at) VALUES (?, ?, 'submission', 'submission', ?, ?)`).bind(`submission-status:${parsed.operationKey}:${parsed.status}`, member.id, parsed.submissionId, now()).run();
  }

  async revokeAthleteProfileControl(input: {
    readonly athleteId: string;
    readonly reviewedByPrincipalId: string;
    readonly operationKey: string;
  }): Promise<void> {
    const parsed = z.object({ athleteId: communityIdSchema, reviewedByPrincipalId: communityIdSchema, operationKey: communityIdSchema }).strict().parse(input);
    const db = this.requireDb();
    const control = await db.prepare(`SELECT id, member_id FROM athlete_profile_controls WHERE canonical_athlete_id = ? AND status = 'active' LIMIT 1`).bind(parsed.athleteId).first<{ id: string; member_id: string }>();
    if (!control) throw new CommunityAuthorizationError("No active athlete control is available to revoke.");
    const timestamp = now();
    const results = await db.batch([
      db.prepare(`UPDATE athlete_profile_controls SET status = 'revoked', reviewed_by_principal_id = ?, reviewed_at = ?, revoked_at = ?, updated_at = ? WHERE id = ? AND status = 'active'`).bind(parsed.reviewedByPrincipalId, timestamp, timestamp, timestamp, control.id),
      db.prepare(`UPDATE claimed_athlete_presentations SET status = 'revoked', updated_at = ? WHERE canonical_athlete_id = ? AND controlling_member_id = ?`).bind(timestamp, parsed.athleteId, control.member_id),
      db.prepare(`INSERT OR IGNORE INTO application_audit_events (id, event_type, actor_principal_id, target_type, target_id, member_id, canonical_athlete_id, metadata_json, created_at) VALUES (?, 'athleteControlRevoked', ?, 'athlete-control', ?, ?, ?, '{}', ?)`).bind(`athlete-control-revoked:${parsed.operationKey}`, parsed.reviewedByPrincipalId, control.id, control.member_id, parsed.athleteId, timestamp),
    ]);
    if (!changed(results[0] ?? { success: false })) throw new CommunityAuthorizationError("Athlete control changed during review.");
  }

  async transferAthleteProfileControl(input: {
    readonly athleteId: string;
    readonly newMemberPrincipalId: string;
    readonly submissionId: string;
    readonly reviewedByPrincipalId: string;
    readonly operationKey: string;
  }): Promise<void> {
    const parsed = z.object({ athleteId: communityIdSchema, newMemberPrincipalId: communityIdSchema, submissionId: communityIdSchema, reviewedByPrincipalId: communityIdSchema, operationKey: communityIdSchema }).strict().parse(input);
    const newMember = await this.getMemberProfileByPrincipalId(parsed.newMemberPrincipalId);
    if (!newMember || newMember.status !== "active") throw new CommunityAuthorizationError("The new controller needs an active member profile.");
    const db = this.requireDb();
    const control = await db.prepare(`SELECT id, member_id FROM athlete_profile_controls WHERE canonical_athlete_id = ? AND status = 'active' LIMIT 1`).bind(parsed.athleteId).first<{ id: string; member_id: string }>();
    if (!control) throw new CommunityAuthorizationError("No active athlete control is available to transfer.");
    if (control.member_id === newMember.id) return;
    const conflict = await db.prepare(`SELECT id FROM athlete_profile_controls WHERE member_id = ? AND id != ? LIMIT 1`).bind(newMember.id, control.id).first<{ id: string }>();
    if (conflict) throw new CommunityAuthorizationError("The new member already has a different athlete control record.");
    const timestamp = now();
    const results = await db.batch([
      db.prepare(`UPDATE athlete_profile_controls SET member_id = ?, submission_id = ?, reviewed_by_principal_id = ?, reviewed_at = ?, revoked_at = NULL, updated_at = ? WHERE id = ? AND member_id = ? AND status = 'active'`).bind(newMember.id, parsed.submissionId, parsed.reviewedByPrincipalId, timestamp, timestamp, control.id, control.member_id),
      db.prepare(`UPDATE claimed_athlete_presentations SET controlling_member_id = ?, status = 'revoked', updated_at = ? WHERE canonical_athlete_id = ? AND controlling_member_id = ?`).bind(newMember.id, timestamp, parsed.athleteId, control.member_id),
      db.prepare(`INSERT OR IGNORE INTO application_audit_events (id, event_type, actor_principal_id, target_type, target_id, member_id, canonical_athlete_id, metadata_json, created_at) VALUES (?, 'athleteControllerChanged', ?, 'athlete-control', ?, ?, ?, ?, ?)`).bind(`athlete-control-transfer:${parsed.operationKey}`, parsed.reviewedByPrincipalId, control.id, newMember.id, parsed.athleteId, JSON.stringify({ previousMemberId: control.member_id, newMemberId: newMember.id, submissionId: parsed.submissionId }), timestamp),
      db.prepare(`INSERT OR IGNORE INTO notifications (id, member_id, notification_type, target_type, target_id, created_at) VALUES (?, ?, 'athlete-claim', 'athlete', ?, ?)`).bind(`athlete-control-transfer:${parsed.operationKey}`, newMember.id, parsed.athleteId, timestamp),
    ]);
    if (!changed(results[0] ?? { success: false })) throw new CommunityAuthorizationError("Athlete control changed during review.");
  }

  async upsertMemberProfile(input: {
    readonly id: string;
    readonly principalId: string;
    readonly handle: string;
    readonly displayName: string;
    readonly biography?: string;
    readonly avatarUrl?: string;
    readonly coverImageUrl?: string;
    readonly country?: string;
    readonly administrativeArea?: string;
    readonly city?: string;
    readonly preferredTimeZone?: string;
    readonly interests?: readonly string[];
    readonly disciplines?: readonly string[];
    readonly publicRoles?: readonly string[];
    readonly socialAccounts?: readonly {
      readonly platform: string;
      readonly url: string;
      readonly handle?: string;
    }[];
    readonly profilePublic: boolean;
    readonly showLocation: boolean;
    readonly showSocialAccounts: boolean;
    readonly showMedia: boolean;
    readonly discoverable: boolean;
  }): Promise<void> {
    const parsed = z
      .object({
        id: communityIdSchema,
        principalId: communityIdSchema,
        handle: communityHandleSchema,
        displayName: z.string().trim().min(1).max(100),
        biography: z.string().trim().max(500).default(""),
        avatarUrl: optionalCommunityProfileImageUrlSchema,
        coverImageUrl: optionalCommunityProfileImageUrlSchema,
        country: z.string().trim().max(80).optional(),
        administrativeArea: z.string().trim().max(100).optional(),
        city: z.string().trim().max(100).optional(),
        preferredTimeZone: optionalTimeZoneSchema,
        interests: z
          .array(z.string().trim().min(1).max(80))
          .max(30)
          .default([]),
        disciplines: z
          .array(z.string().trim().min(1).max(80))
          .max(30)
          .default([]),
        publicRoles: z.array(publicRoleSchema).max(20).default([]),
        socialAccounts: z
          .array(
            z.object({
              platform: socialPlatformSchema,
              url: communityExternalUrlSchema,
              handle: z.string().trim().max(100).optional(),
            }),
          )
          .max(10)
          .default([]),
        profilePublic: z.boolean(),
        showLocation: z.boolean(),
        showSocialAccounts: z.boolean(),
        showMedia: z.boolean(),
        discoverable: z.boolean(),
      })
      .strict()
      .parse(input);
    const db = this.requireDb();
    const timestamp = now();
    const statements = [
      db
        .prepare(
          `INSERT INTO member_profiles (
            id, principal_id, handle, display_name, avatar_url, cover_image_url,
            biography, country, administrative_area, city, preferred_timezone,
            interests_json,
            disciplines_json, public_roles_json, profile_public, show_location,
            show_social_accounts, show_media, discoverable, status, created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
          ON CONFLICT(principal_id) DO UPDATE SET
            handle = excluded.handle,
            display_name = excluded.display_name,
            avatar_url = excluded.avatar_url,
            cover_image_url = excluded.cover_image_url,
            biography = excluded.biography,
            country = excluded.country,
            administrative_area = excluded.administrative_area,
            city = excluded.city,
            preferred_timezone = excluded.preferred_timezone,
            interests_json = excluded.interests_json,
            disciplines_json = excluded.disciplines_json,
            public_roles_json = excluded.public_roles_json,
            profile_public = excluded.profile_public,
            show_location = excluded.show_location,
            show_social_accounts = excluded.show_social_accounts,
            show_media = excluded.show_media,
            discoverable = excluded.discoverable,
            updated_at = excluded.updated_at`,
        )
        .bind(
          parsed.id,
          parsed.principalId,
          parsed.handle,
          parsed.displayName,
          parsed.avatarUrl ?? null,
          parsed.coverImageUrl ?? null,
          parsed.biography,
          parsed.country ?? null,
          parsed.administrativeArea ?? null,
          parsed.city ?? null,
          parsed.preferredTimeZone ?? null,
          JSON.stringify(parsed.interests),
          JSON.stringify(parsed.disciplines),
          JSON.stringify(parsed.publicRoles),
          Number(parsed.profilePublic),
          Number(parsed.showLocation),
          Number(parsed.showSocialAccounts),
          Number(parsed.showMedia),
          Number(parsed.discoverable),
          timestamp,
          timestamp,
        ),
      db
        .prepare("DELETE FROM member_social_accounts WHERE member_id = ?")
        .bind(parsed.id),
      ...parsed.socialAccounts.map((account) =>
        db
          .prepare(
            `INSERT INTO member_social_accounts (
              id, member_id, platform, url, handle, verification_status,
              visible, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'unverified', 1, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            parsed.id,
            account.platform,
            account.url,
            account.handle ?? null,
            timestamp,
            timestamp,
          ),
      ),
    ];
    await db.batch(statements);
  }

  async searchPublicMembers(
    query: string,
    limit = 12,
  ): Promise<readonly PublicMemberSearchResult[]> {
    if (!this.availability.writable || !this.db) return [];
    const parsed = z
      .object({
        query: z.string().trim().min(2).max(80),
        limit: z.number().int().min(1).max(20),
      })
      .strict()
      .parse({ query, limit });
    const pattern = `%${parsed.query
      .toLocaleLowerCase()
      .replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
    const result = await this.db
      .prepare(
        `SELECT id, handle, display_name, avatar_url, public_roles_json,
          biography,
          CASE WHEN show_location = 1 THEN country ELSE NULL END AS country,
          CASE WHEN show_location = 1 THEN administrative_area ELSE NULL END AS administrative_area,
          CASE WHEN show_location = 1 THEN city ELSE NULL END AS city
         FROM member_profiles
         WHERE profile_public = 1 AND discoverable = 1 AND status = 'active'
           AND deleted_at IS NULL
           AND lower(display_name || ' ' || handle || ' ' || biography || ' ' ||
             coalesce(country, '') || ' ' || coalesce(city, '')) LIKE ? ESCAPE '\\'
         ORDER BY display_name COLLATE NOCASE, handle COLLATE NOCASE
         LIMIT ?`,
      )
      .bind(pattern, parsed.limit)
      .all<{
        id: string;
        handle: string;
        display_name: string;
        avatar_url: string | null;
        public_roles_json: string;
        biography: string;
        country: string | null;
        administrative_area: string | null;
        city: string | null;
      }>();

    return result.results.map((row) => ({
      id: row.id,
      handle: row.handle,
      displayName: row.display_name,
      avatarUrl: row.avatar_url ?? undefined,
      publicRoles: jsonList(row.public_roles_json),
      biography: row.biography,
      location: [row.city, row.administrative_area, row.country]
        .filter(Boolean)
        .join(" · "),
    }));
  }

  async listPosts(
    input: {
      readonly mode?: "for-you" | "latest" | "following" | "editorial";
      readonly viewerMemberId?: string;
      readonly authorMemberId?: string;
      readonly activity?:
        "all" | "posts" | "media" | "videos" | "photos" | "stories" | "reposts";
      readonly postId?: string;
      readonly cursor?: string;
      readonly limit?: number;
    } = {},
  ): Promise<CommunityPostPage> {
    if (!this.availability.writable || !this.db) return { items: [] };
    const parsed = z
      .object({
        mode: z
          .enum(["for-you", "latest", "following", "editorial"])
          .default("for-you"),
        viewerMemberId: communityIdSchema.optional(),
        authorMemberId: communityIdSchema.optional(),
        activity: z
          .enum([
            "all",
            "posts",
            "media",
            "videos",
            "photos",
            "stories",
            "reposts",
          ])
          .default("all"),
        postId: communityIdSchema.optional(),
        cursor: z.string().max(260).optional(),
        limit: z.number().int().min(1).max(30).default(25),
      })
      .strict()
      .parse(input);
    if (parsed.mode === "following" && !parsed.viewerMemberId) {
      return { items: [] };
    }

    const where = [
      "post.status = 'published'",
      "post.deleted_at IS NULL",
      "author.profile_public = 1",
      "author.status = 'active'",
      "author.deleted_at IS NULL",
    ];
    const whereValues: SqlValue[] = [];

    if (parsed.viewerMemberId) {
      where.push(`(
        post.visibility = 'public'
        OR post.author_member_id = ?
        OR (post.visibility = 'followers' AND EXISTS (
          SELECT 1 FROM follows audience_follow
          WHERE audience_follow.follower_member_id = ?
            AND audience_follow.target_type = 'member'
            AND audience_follow.target_id = post.author_member_id
        ))
      )`);
      whereValues.push(parsed.viewerMemberId, parsed.viewerMemberId);
    } else {
      where.push("post.visibility = 'public'");
    }

    if (parsed.mode === "following") {
      where.push(`(
        EXISTS (
          SELECT 1 FROM follows following_member
          WHERE following_member.follower_member_id = ?
            AND following_member.target_type = 'member'
            AND following_member.target_id = post.author_member_id
        )
        OR EXISTS (
          SELECT 1 FROM follows following_entity
          WHERE following_entity.follower_member_id = ?
            AND following_entity.target_type = post.canonical_target_type
            AND following_entity.target_id = post.canonical_target_id
        )
      )`);
      whereValues.push(
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
      );
    }
    if (parsed.mode === "editorial") {
      where.push(
        "post.canonical_target_type IN ('story', 'video', 'competition')",
      );
    }
    if (parsed.authorMemberId) {
      where.push("post.author_member_id = ?");
      whereValues.push(parsed.authorMemberId);
    }
    if (parsed.postId) {
      where.push("post.id = ?");
      whereValues.push(parsed.postId);
    }
    if (parsed.activity === "posts") {
      where.push("repost.id IS NULL");
    }
    if (parsed.activity === "reposts") where.push("repost.id IS NOT NULL");
    if (parsed.activity === "media") {
      where.push(`(
        post.canonical_target_type = 'video'
        OR EXISTS (
          SELECT 1 FROM community_post_media media_filter
          WHERE media_filter.post_id = post.id
        )
      )`);
    }
    if (parsed.activity === "videos") {
      where.push(`(
        post.canonical_target_type = 'video'
        OR EXISTS (
          SELECT 1 FROM community_post_media media_filter
          WHERE media_filter.post_id = post.id
            AND media_filter.media_kind = 'video'
        )
      )`);
    }
    if (parsed.activity === "photos") {
      where.push(`EXISTS (
        SELECT 1 FROM community_post_media media_filter
        WHERE media_filter.post_id = post.id AND media_filter.media_kind = 'image'
      )`);
    }
    if (parsed.activity === "stories") {
      where.push("post.canonical_target_type = 'story'");
    }
    if (parsed.cursor) {
      const cursor = cursorSchema.parse(parsed.cursor);
      where.push(
        "(post.created_at < ? OR (post.created_at = ? AND post.id < ?))",
      );
      whereValues.push(cursor.createdAt, cursor.createdAt, cursor.id);
    }
    if (parsed.viewerMemberId) {
      where.push(`NOT EXISTS (
        SELECT 1 FROM blocks blocked
        WHERE (blocked.blocker_member_id = ? AND blocked.blocked_member_id = post.author_member_id)
           OR (blocked.blocker_member_id = post.author_member_id AND blocked.blocked_member_id = ?)
      )`);
      whereValues.push(parsed.viewerMemberId, parsed.viewerMemberId);
      where.push(`NOT EXISTS (
        SELECT 1 FROM mutes muted
        WHERE muted.muter_member_id = ?
          AND muted.muted_member_id = post.author_member_id
      )`);
      whereValues.push(parsed.viewerMemberId);
    }

    const viewer = parsed.viewerMemberId ?? null;
    const result = await this.db
      .prepare(
        `SELECT
          post.id, post.author_member_id, post.body, post.post_type,
          post.visibility,
          post.canonical_target_type, post.canonical_target_id,
          post.created_at, post.updated_at,
          author.id AS author_id, author.handle AS author_handle,
          author.display_name AS author_display_name,
          author.avatar_url AS author_avatar_url,
          author.public_roles_json AS author_public_roles_json,
          (SELECT media.id FROM community_post_media media
            WHERE media.post_id = post.id AND (media.external_url IS NOT NULL OR EXISTS (SELECT 1 FROM community_media_assets asset WHERE asset.id = media.media_asset_id AND asset.upload_status = 'uploaded' AND asset.moderation_status = 'approved' AND asset.visibility = 'public'))
            ORDER BY media.display_order, media.created_at LIMIT 1) AS external_media_id,
          (SELECT coalesce(media.external_url, '/api/community/media/' || media.media_asset_id) FROM community_post_media media
            WHERE media.post_id = post.id AND (media.external_url IS NOT NULL OR EXISTS (SELECT 1 FROM community_media_assets asset WHERE asset.id = media.media_asset_id AND asset.upload_status = 'uploaded' AND asset.moderation_status = 'approved' AND asset.visibility = 'public'))
            ORDER BY media.display_order, media.created_at LIMIT 1) AS external_media_url,
          (SELECT media.creator_name FROM community_post_media media
            WHERE media.post_id = post.id AND (media.external_url IS NOT NULL OR EXISTS (SELECT 1 FROM community_media_assets asset WHERE asset.id = media.media_asset_id AND asset.upload_status = 'uploaded' AND asset.moderation_status = 'approved' AND asset.visibility = 'public'))
            ORDER BY media.display_order, media.created_at LIMIT 1) AS external_media_credit,
          (SELECT media.media_kind FROM community_post_media media
            WHERE media.post_id = post.id AND (media.external_url IS NOT NULL OR EXISTS (SELECT 1 FROM community_media_assets asset WHERE asset.id = media.media_asset_id AND asset.upload_status = 'uploaded' AND asset.moderation_status = 'approved' AND asset.visibility = 'public'))
            ORDER BY media.display_order, media.created_at LIMIT 1) AS external_media_kind,
          (SELECT media.alt_text FROM community_post_media media
            WHERE media.post_id = post.id AND (media.external_url IS NOT NULL OR EXISTS (SELECT 1 FROM community_media_assets asset WHERE asset.id = media.media_asset_id AND asset.upload_status = 'uploaded' AND asset.moderation_status = 'approved' AND asset.visibility = 'public'))
            ORDER BY media.display_order, media.created_at LIMIT 1) AS external_media_alt_text,
          repost.id AS repost_id,
          repost.target_type AS repost_target_type,
          repost.target_id AS repost_target_id,
          original.id AS original_post_id,
          original.body AS original_post_body,
          original_author.id AS original_author_id,
          original_author.handle AS original_author_handle,
          original_author.display_name AS original_author_display_name,
          original_author.avatar_url AS original_author_avatar_url,
          original_author.public_roles_json AS original_author_public_roles_json,
          (SELECT COUNT(*) FROM community_likes likes
            WHERE likes.target_type = 'post' AND likes.target_id = post.id) AS like_count,
          (SELECT COUNT(*) FROM community_comments comments
            WHERE comments.target_type = 'post' AND comments.target_id = post.id
              AND comments.status = 'published') AS comment_count,
          (SELECT COUNT(*) FROM community_reposts repost_count
            WHERE repost_count.target_type = 'post' AND repost_count.target_id = post.id) AS repost_count,
          EXISTS (SELECT 1 FROM community_likes viewer_like
            WHERE viewer_like.member_id = ? AND viewer_like.target_type = 'post'
              AND viewer_like.target_id = post.id) AS viewer_liked,
          EXISTS (SELECT 1 FROM saved_items viewer_save
            WHERE viewer_save.member_id = ? AND viewer_save.target_type = 'post'
              AND viewer_save.target_id = post.id) AS viewer_saved,
          EXISTS (SELECT 1 FROM community_reposts viewer_repost
            WHERE viewer_repost.member_id = ? AND viewer_repost.target_type = 'post'
              AND viewer_repost.target_id = post.id) AS viewer_reposted,
          COALESCE((SELECT json_group_array(collection_item.collection_id)
            FROM collection_items collection_item
            JOIN collections collection ON collection.id = collection_item.collection_id
            WHERE collection.owner_member_id = ? AND collection.status = 'active'
              AND collection_item.target_type = 'post'
              AND collection_item.target_id = post.id), '[]') AS viewer_collection_ids_json
        FROM community_posts post
        JOIN member_profiles author ON author.id = post.author_member_id
        LEFT JOIN community_reposts repost ON repost.activity_post_id = post.id
        LEFT JOIN community_posts original
          ON repost.target_type = 'post' AND original.id = repost.target_id
          AND original.status = 'published' AND original.visibility = 'public'
          AND original.deleted_at IS NULL
          AND (? IS NULL OR NOT EXISTS (
            SELECT 1 FROM blocks original_block
            WHERE (original_block.blocker_member_id = ?
                     AND original_block.blocked_member_id = original.author_member_id)
               OR (original_block.blocker_member_id = original.author_member_id
                     AND original_block.blocked_member_id = ?)
          ))
        LEFT JOIN member_profiles original_author
          ON original_author.id = original.author_member_id
          AND original_author.profile_public = 1
          AND original_author.status = 'active'
          AND original_author.deleted_at IS NULL
        WHERE ${where.join(" AND ")}
        ORDER BY post.created_at DESC, post.id DESC
        LIMIT ?`,
      )
      .bind(
        viewer,
        viewer,
        viewer,
        viewer,
        viewer,
        viewer,
        viewer,
        ...whereValues,
        parsed.limit + 1,
      )
      .all<PostRow>();
    const rows = result.results.slice(0, parsed.limit);
    const last = rows.at(-1);
    return {
      items: rows.map((row) => postFromRow(row, parsed.viewerMemberId)),
      nextCursor:
        result.results.length > parsed.limit && last
          ? `${last.created_at}|${last.id}`
          : undefined,
    };
  }

  async getPost(
    postId: string,
    viewerMemberId?: string,
  ): Promise<CommunityPost | null> {
    const page = await this.listPosts({
      postId: communityIdSchema.parse(postId),
      viewerMemberId,
      limit: 1,
    });
    return page.items[0] ?? null;
  }

  async createPost(input: {
    readonly authorMemberId: string;
    readonly body?: string;
    readonly postType?: CommunityPostType;
    readonly visibility?: CommunityPostVisibility;
    readonly canonicalTargetType?: CommunityCanonicalTargetType;
    readonly canonicalTargetId?: string;
    readonly externalMediaUrl?: string;
    readonly mediaAssetId?: string;
    readonly externalMediaCredit?: string;
    readonly externalMediaKind?: "image" | "video" | "external-embed";
    readonly externalMediaAltText?: string;
    readonly rightsConfirmed?: boolean;
  }): Promise<string> {
    const parsed = z
      .object({
        authorMemberId: communityIdSchema,
        body: z.string().trim().max(4000).default(""),
        postType: communityPostTypeSchema.default("general"),
        visibility: z.enum(["public", "followers", "private"]).default("public"),
        canonicalTargetType: communityCanonicalTargetTypeSchema.optional(),
        canonicalTargetId: communityIdSchema.optional(),
        externalMediaUrl: optionalCommunityExternalUrlSchema,
        mediaAssetId: communityIdSchema.optional(),
        externalMediaCredit: z.string().trim().max(120).optional(),
        externalMediaKind: communityMediaKindSchema.optional(),
        externalMediaAltText: z.string().trim().max(300).optional(),
        rightsConfirmed: z.boolean().default(false),
      })
      .strict()
      .superRefine((value, context) => {
        if (
          Boolean(value.canonicalTargetType) !==
          Boolean(value.canonicalTargetId)
        ) {
          context.addIssue({
            code: "custom",
            message: "Canonical target type and ID must be supplied together.",
          });
        }
        if (
          !value.body &&
          !value.canonicalTargetId &&
          !value.externalMediaUrl
          && !value.mediaAssetId
        ) {
          context.addIssue({
            code: "custom",
            message: "A post needs text, media, or a Cali Central reference.",
          });
        }
        if (value.externalMediaUrl && !value.rightsConfirmed) {
          context.addIssue({
            code: "custom",
            path: ["rightsConfirmed"],
            message: "Confirm your right to share or link this media.",
          });
        }
        if (value.mediaAssetId && !value.rightsConfirmed) {
          context.addIssue({ code: "custom", path: ["rightsConfirmed"], message: "Confirm your right to publish this uploaded media." });
        }
        if (value.externalMediaUrl && value.mediaAssetId) {
          context.addIssue({ code: "custom", message: "Choose an approved upload or an external media URL, not both." });
        }
        if (
          value.externalMediaUrl &&
          value.externalMediaKind === "image" &&
          !value.externalMediaAltText
        ) {
          context.addIssue({
            code: "custom",
            path: ["externalMediaAltText"],
            message: "Photo posts require concise alt text.",
          });
        }
      })
      .parse(input);
    const db = this.requireDb();
    const id = crypto.randomUUID();
    const timestamp = now();
    const insertPost = db
      .prepare(
        `INSERT INTO community_posts (
          id, author_member_id, body, post_type, visibility, status,
          canonical_target_type, canonical_target_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)`,
      )
      .bind(
        id,
        parsed.authorMemberId,
        parsed.body || "Shared media.",
        parsed.postType,
        parsed.visibility,
        parsed.canonicalTargetType ?? null,
        parsed.canonicalTargetId ?? null,
        timestamp,
        timestamp,
      );

    if (!parsed.externalMediaUrl && !parsed.mediaAssetId) {
      await insertPost.run();
      return id;
    }

    if (parsed.mediaAssetId) {
      const asset = await db.prepare(
        `SELECT id, storage_key, purpose FROM community_media_assets
         WHERE id = ? AND owner_member_id = ? AND upload_status = 'uploaded'
           AND moderation_status = 'approved' AND visibility = 'public'
           AND purpose IN ('post-image', 'post-video') LIMIT 1`,
      ).bind(parsed.mediaAssetId, parsed.authorMemberId).first<{ id: string; storage_key: string; purpose: "post-image" | "post-video" }>();
      if (!asset) throw new CommunityAuthorizationError("Choose one of your approved post media uploads.");
      if (asset.purpose === "post-image" && !parsed.externalMediaAltText) throw new CommunityAuthorizationError("Photo posts require concise alt text.");
      await db.batch([
        insertPost,
        db.prepare(`INSERT INTO community_post_media (id, post_id, media_kind, storage_key, alt_text, creator_member_id, rights_status, display_order, created_at, media_asset_id) VALUES (?, ?, ?, ?, ?, ?, 'member-owned', 0, ?, ?)`).bind(crypto.randomUUID(), id, asset.purpose === "post-image" ? "image" : "video", asset.storage_key, parsed.externalMediaAltText ?? null, parsed.authorMemberId, timestamp, asset.id),
      ]);
      return id;
    }

    const externalMediaUrl = parsed.externalMediaUrl;
    if (!externalMediaUrl) throw new CommunityAuthorizationError("Choose valid post media.");
    await db.batch([
      insertPost,
      db
        .prepare(
          `INSERT INTO community_post_media (
            id, post_id, media_kind, external_url, alt_text, creator_member_id,
            creator_name, rights_status, display_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'permission-confirmed', 0, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          id,
          parsed.externalMediaKind ??
            inferExternalMediaKind(externalMediaUrl),
          externalMediaUrl,
          parsed.externalMediaAltText ?? null,
          parsed.authorMemberId,
          parsed.externalMediaCredit ?? null,
          timestamp,
        ),
    ]);
    return id;
  }

  async updatePost(input: {
    readonly actorMemberId: string;
    readonly postId: string;
    readonly body: string;
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorMemberId: communityIdSchema,
        postId: communityIdSchema,
        body: z.string().trim().min(1).max(4000),
      })
      .strict()
      .parse(input);
    const result = await this.requireDb()
      .prepare(
        `UPDATE community_posts SET body = ?, updated_at = ?
         WHERE id = ? AND author_member_id = ? AND status = 'published'
           AND deleted_at IS NULL`,
      )
      .bind(parsed.body, now(), parsed.postId, parsed.actorMemberId)
      .run();
    return changed(result);
  }

  async deleteOwnPost(actorMemberId: string, postId: string): Promise<boolean> {
    const actor = communityIdSchema.parse(actorMemberId);
    const post = communityIdSchema.parse(postId);
    const timestamp = now();
    const db = this.requireDb();
    const results = await db.batch([
      db
        .prepare(
          `UPDATE community_posts
           SET status = 'deleted', deleted_at = ?, updated_at = ?
           WHERE id = ? AND author_member_id = ? AND status = 'published'`,
        )
        .bind(timestamp, timestamp, post, actor),
      db
        .prepare(
          "DELETE FROM community_reposts WHERE activity_post_id = ? AND member_id = ?",
        )
        .bind(post, actor),
    ]);
    return changed(results[0] ?? {});
  }

  async listComments(input: {
    readonly targetType: CommunityCommentTargetType;
    readonly targetId: string;
    readonly viewerMemberId?: string;
    readonly offset?: number;
    readonly limit?: number;
  }): Promise<CommunityCommentPage> {
    if (!this.availability.writable || !this.db) {
      return { items: [], hasMore: false };
    }
    const parsed = z
      .object({
        targetType: communityCommentTargetTypeSchema,
        targetId: communityIdSchema,
        viewerMemberId: communityIdSchema.optional(),
        offset: z.number().int().min(0).max(10_000).default(0),
        limit: z.number().int().min(1).max(20).default(10),
      })
      .strict()
      .parse(input);
    const baseSelect = `SELECT comment.id, comment.target_type, comment.target_id,
      comment.parent_comment_id, comment.body, comment.created_at,
      comment.updated_at, author.id AS author_id,
      author.handle AS author_handle,
      author.display_name AS author_display_name,
      author.avatar_url AS author_avatar_url,
      author.public_roles_json AS author_public_roles_json,
      (SELECT COUNT(*) FROM community_comments child
        JOIN member_profiles child_author
          ON child_author.id = child.author_member_id
        WHERE child.parent_comment_id = comment.id
          AND child.status = 'published'
          AND child_author.profile_public = 1
          AND child_author.status = 'active'
          AND child_author.deleted_at IS NULL
          AND (? IS NULL OR NOT EXISTS (
            SELECT 1 FROM blocks child_blocked
            WHERE (child_blocked.blocker_member_id = ?
                    AND child_blocked.blocked_member_id = child.author_member_id)
               OR (child_blocked.blocker_member_id = child.author_member_id
                    AND child_blocked.blocked_member_id = ?)
          ))) AS reply_count
      FROM community_comments comment
      JOIN member_profiles author ON author.id = comment.author_member_id`;
    const rootsResult = await this.db
      .prepare(
        `${baseSelect}
         WHERE comment.target_type = ? AND comment.target_id = ?
           AND comment.parent_comment_id IS NULL
           AND comment.status = 'published'
           AND author.profile_public = 1 AND author.status = 'active'
           AND author.deleted_at IS NULL
           AND (? IS NULL OR NOT EXISTS (
             SELECT 1 FROM blocks blocked
             WHERE (blocked.blocker_member_id = ?
                      AND blocked.blocked_member_id = comment.author_member_id)
                OR (blocked.blocker_member_id = comment.author_member_id
                      AND blocked.blocked_member_id = ?)
           ))
         ORDER BY comment.created_at DESC, comment.id DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
        parsed.targetType,
        parsed.targetId,
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
        parsed.limit + 1,
        parsed.offset,
      )
      .all<CommentRow>();
    const rootRows = rootsResult.results.slice(0, parsed.limit);
    if (!rootRows.length) {
      return { items: [], hasMore: false };
    }

    const placeholders = rootRows.map(() => "?").join(", ");
    const repliesResult = await this.db
      .prepare(
        `SELECT id, target_type, target_id, parent_comment_id, body, created_at,
          updated_at, author_id, author_handle, author_display_name,
          author_avatar_url, author_public_roles_json
        FROM (
          SELECT comment.id, comment.target_type, comment.target_id,
            comment.parent_comment_id, comment.body, comment.created_at,
            comment.updated_at, author.id AS author_id,
            author.handle AS author_handle,
            author.display_name AS author_display_name,
            author.avatar_url AS author_avatar_url,
            author.public_roles_json AS author_public_roles_json,
            ROW_NUMBER() OVER (
              PARTITION BY comment.parent_comment_id
              ORDER BY comment.created_at ASC, comment.id ASC
            ) AS reply_rank
          FROM community_comments comment
          JOIN member_profiles author ON author.id = comment.author_member_id
          WHERE comment.parent_comment_id IN (${placeholders})
            AND comment.status = 'published'
            AND author.profile_public = 1 AND author.status = 'active'
            AND author.deleted_at IS NULL
            AND (? IS NULL OR NOT EXISTS (
              SELECT 1 FROM blocks blocked
              WHERE (blocked.blocker_member_id = ?
                       AND blocked.blocked_member_id = comment.author_member_id)
                 OR (blocked.blocker_member_id = comment.author_member_id
                       AND blocked.blocked_member_id = ?)
            ))
        ) ranked_replies
            WHERE reply_rank <= 20
        ORDER BY created_at ASC, id ASC`,
      )
      .bind(
        ...rootRows.map((row) => row.id),
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
        parsed.viewerMemberId ?? null,
      )
      .all<CommentRow>();
    const repliesByParent = new Map<string, CommunityComment[]>();
    for (const row of repliesResult.results) {
      if (!row.parent_comment_id) continue;
      const group = repliesByParent.get(row.parent_comment_id) ?? [];
      group.push(commentFromRow(row, parsed.viewerMemberId));
      repliesByParent.set(row.parent_comment_id, group);
    }
    const hasMore = rootsResult.results.length > parsed.limit;
    return {
      items: rootRows.map((row) =>
        commentFromRow(
          row,
          parsed.viewerMemberId,
          repliesByParent.get(row.id) ?? [],
        ),
      ),
      hasMore,
      nextOffset: hasMore ? parsed.offset + parsed.limit : undefined,
    };
  }

  async createComment(input: {
    readonly authorMemberId: string;
    readonly targetType?: CommunityCommentTargetType;
    readonly targetId?: string;
    /** Compatibility alias for the original post-only repository contract. */
    readonly postId?: string;
    readonly parentCommentId?: string;
    readonly body: string;
  }): Promise<string> {
    const parsed = z
      .object({
        authorMemberId: communityIdSchema,
        targetType: communityCommentTargetTypeSchema.optional(),
        targetId: communityIdSchema.optional(),
        postId: communityIdSchema.optional(),
        parentCommentId: communityIdSchema.optional(),
        body: z.string().trim().min(1).max(2000),
      })
      .strict()
      .superRefine((value, context) => {
        if (!value.postId && (!value.targetType || !value.targetId)) {
          context.addIssue({
            code: "custom",
            message: "A comment target is required.",
          });
        }
      })
      .parse(input);
    const targetType = parsed.postId ? "post" : parsed.targetType!;
    const targetId = parsed.postId ?? parsed.targetId!;
    const db = this.requireDb();
    let parentCommentId = parsed.parentCommentId;

    if (parentCommentId) {
      const parent = await db
        .prepare(
          `SELECT id, target_type, target_id, parent_comment_id
           FROM community_comments
           WHERE id = ? AND status = 'published' LIMIT 1`,
        )
        .bind(parentCommentId)
        .first<{
          id: string;
          target_type: string;
          target_id: string;
          parent_comment_id: string | null;
        }>();
      if (
        !parent ||
        parent.target_type !== targetType ||
        parent.target_id !== targetId
      ) {
        throw new CommunityAuthorizationError(
          "The reply target is unavailable.",
        );
      }
      parentCommentId = parent.parent_comment_id ?? parent.id;
    }

    const id = crypto.randomUUID();
    const timestamp = now();
    const commentInsert = db
      .prepare(
        `INSERT INTO community_comments (
          id, target_type, target_id, parent_comment_id, author_member_id,
          body, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
      )
      .bind(
        id,
        targetType,
        targetId,
        parentCommentId ?? null,
        parsed.authorMemberId,
        parsed.body,
        timestamp,
        timestamp,
      );
    const notificationType = parentCommentId ? "reply" : "comment";
    await db.batch([
      commentInsert,
      db
        .prepare(
          `INSERT OR IGNORE INTO notifications (
            id, member_id, notification_type, actor_member_id,
            target_type, target_id, read_at, created_at
          )
          SELECT ?, recipient_id, ?, ?, ?, ?, NULL, ?
          FROM (
            SELECT CASE
              WHEN ? IS NOT NULL THEN (
                SELECT author_member_id FROM community_comments WHERE id = ?
              )
              WHEN ? = 'post' THEN (
                SELECT author_member_id FROM community_posts WHERE id = ?
              )
              ELSE NULL
            END AS recipient_id
          )
          WHERE recipient_id IS NOT NULL AND recipient_id != ?`,
        )
        .bind(
          `comment:${id}`,
          notificationType,
          parsed.authorMemberId,
          targetType,
          targetId,
          timestamp,
          parentCommentId ?? null,
          parentCommentId ?? null,
          targetType,
          targetId,
          parsed.authorMemberId,
        ),
    ]);
    return id;
  }

  async updateComment(input: {
    readonly actorMemberId: string;
    readonly commentId: string;
    readonly body: string;
    readonly moderator: boolean;
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorMemberId: communityIdSchema,
        commentId: communityIdSchema,
        body: z.string().trim().min(1).max(2000),
        moderator: z.boolean(),
      })
      .strict()
      .parse(input);
    const result = await this.requireDb()
      .prepare(
        `UPDATE community_comments SET body = ?, updated_at = ?
         WHERE id = ? AND status = 'published'
           AND (author_member_id = ? OR ? = 1)`,
      )
      .bind(
        parsed.body,
        now(),
        parsed.commentId,
        parsed.actorMemberId,
        Number(parsed.moderator),
      )
      .run();
    return changed(result);
  }

  async deleteOwnComment(
    actorMemberId: string,
    commentId: string,
  ): Promise<boolean> {
    const actor = communityIdSchema.parse(actorMemberId);
    const comment = communityIdSchema.parse(commentId);
    const timestamp = now();
    const result = await this.requireDb()
      .prepare(
        `UPDATE community_comments
         SET status = 'deleted', deleted_at = ?, updated_at = ?
         WHERE id = ? AND author_member_id = ? AND status = 'published'`,
      )
      .bind(timestamp, timestamp, comment, actor)
      .run();
    return changed(result);
  }

  async commentExists(commentId: string): Promise<boolean> {
    if (!this.availability.writable || !this.db) return false;
    const id = communityIdSchema.parse(commentId);
    const row = await this.db
      .prepare(
        `SELECT id FROM community_comments
         WHERE id = ? AND status = 'published' AND deleted_at IS NULL LIMIT 1`,
      )
      .bind(id)
      .first<{ id: string }>();
    return Boolean(row);
  }

  async mediaExists(mediaId: string): Promise<boolean> {
    if (!this.availability.writable || !this.db) return false;
    const id = communityIdSchema.parse(mediaId);
    const row = await this.db
      .prepare(
        `SELECT media.id FROM community_post_media media
         JOIN community_posts post ON post.id = media.post_id
         JOIN member_profiles author ON author.id = post.author_member_id
         WHERE media.id = ? AND post.status = 'published'
           AND post.visibility = 'public' AND post.deleted_at IS NULL
           AND author.profile_public = 1 AND author.status = 'active'
           AND author.deleted_at IS NULL LIMIT 1`,
      )
      .bind(id)
      .first<{ id: string }>();
    return Boolean(row);
  }

  async getInteractionState(
    targetType: CommunityTargetType,
    targetId: string,
    viewerMemberId?: string,
  ): Promise<CommunityInteractionState> {
    if (!this.availability.writable || !this.db) {
      return {
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        liked: false,
        saved: false,
        reposted: false,
        collectionIds: [],
      };
    }
    const type = communityTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const viewer = viewerMemberId
      ? communityIdSchema.parse(viewerMemberId)
      : null;
    const saveType = type === "comment" ? null : type;
    const repostType = ["post", "story", "video"].includes(type) ? type : null;
    const row = await this.db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM community_likes
            WHERE target_type = ? AND target_id = ?) AS like_count,
          (SELECT COUNT(*) FROM community_comments
            WHERE target_type = ? AND target_id = ? AND status = 'published') AS comment_count,
          (SELECT COUNT(*) FROM community_reposts
            WHERE target_type = ? AND target_id = ?) AS repost_count,
          EXISTS (SELECT 1 FROM community_likes
            WHERE member_id = ? AND target_type = ? AND target_id = ?) AS viewer_liked,
          EXISTS (SELECT 1 FROM saved_items
            WHERE member_id = ? AND target_type = ? AND target_id = ?) AS viewer_saved,
          EXISTS (SELECT 1 FROM community_reposts
            WHERE member_id = ? AND target_type = ? AND target_id = ?) AS viewer_reposted,
          COALESCE((SELECT json_group_array(collection_item.collection_id)
            FROM collection_items collection_item
            JOIN collections collection ON collection.id = collection_item.collection_id
            WHERE collection.owner_member_id = ? AND collection.status = 'active'
              AND collection_item.target_type = ?
              AND collection_item.target_id = ?), '[]') AS collection_ids_json`,
      )
      .bind(
        type,
        target,
        type,
        target,
        repostType,
        target,
        viewer,
        type,
        target,
        viewer,
        saveType,
        target,
        viewer,
        repostType,
        target,
        viewer,
        saveType,
        target,
      )
      .first<{
        like_count: number;
        comment_count: number;
        repost_count: number;
        viewer_liked: number;
        viewer_saved: number;
        viewer_reposted: number;
        collection_ids_json: string;
      }>();
    return {
      likeCount: Number(row?.like_count) || 0,
      commentCount: Number(row?.comment_count) || 0,
      repostCount: Number(row?.repost_count) || 0,
      liked: row?.viewer_liked === 1,
      saved: row?.viewer_saved === 1,
      reposted: row?.viewer_reposted === 1,
      collectionIds: jsonList(row?.collection_ids_json),
    };
  }

  async getSaveState(
    memberId: string,
    targetType: CommunitySaveTargetType,
    targetId: string,
  ): Promise<CommunitySaveState> {
    if (!this.availability.writable || !this.db) {
      return { saved: false, collectionIds: [] };
    }
    const member = communityIdSchema.parse(memberId);
    const type = communitySaveTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const row = await this.db
      .prepare(
        `SELECT
          EXISTS (SELECT 1 FROM saved_items
            WHERE member_id = ? AND target_type = ? AND target_id = ?) AS saved,
          COALESCE((SELECT json_group_array(collection_item.collection_id)
            FROM collection_items collection_item
            JOIN collections collection ON collection.id = collection_item.collection_id
            WHERE collection.owner_member_id = ? AND collection.status = 'active'
              AND collection_item.target_type = ?
              AND collection_item.target_id = ?), '[]') AS collection_ids_json`,
      )
      .bind(member, type, target, member, type, target)
      .first<{ saved: number; collection_ids_json: string }>();
    return {
      saved: row?.saved === 1,
      collectionIds: jsonList(row?.collection_ids_json),
    };
  }

  async setLike(
    memberId: string,
    targetType: CommunityTargetType,
    targetId: string,
    liked: boolean,
  ): Promise<void> {
    const member = communityIdSchema.parse(memberId);
    const type = communityTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const db = this.requireDb();
    if (liked) {
      const timestamp = now();
      await db.batch([
        db
          .prepare(
            `INSERT OR IGNORE INTO community_likes
             (member_id, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(member, type, target, timestamp),
        db
          .prepare(
            `INSERT OR IGNORE INTO notifications (
              id, member_id, notification_type, actor_member_id,
              target_type, target_id, read_at, created_at
            ) SELECT ?, post.author_member_id, 'like', ?, 'post', post.id, NULL, ?
              FROM community_posts post
              WHERE ? = 'post' AND post.id = ? AND post.author_member_id != ?
                AND post.status = 'published' AND post.deleted_at IS NULL`,
          )
          .bind(
            `like:${member}:${type}:${target}`,
            member,
            timestamp,
            type,
            target,
            member,
          ),
      ]);
      return;
    }
    await db
      .prepare(
        `DELETE FROM community_likes
         WHERE member_id = ? AND target_type = ? AND target_id = ?`,
      )
      .bind(member, type, target)
      .run();
  }

  async setSaved(
    memberId: string,
    targetType: CommunitySaveTargetType,
    targetId: string,
    saved: boolean,
  ): Promise<void> {
    const member = communityIdSchema.parse(memberId);
    const type = communitySaveTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const db = this.requireDb();
    if (saved) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO saved_items
             (member_id, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?)`,
        )
        .bind(member, type, target, now())
        .run();
      return;
    }
    await db.batch([
      db
        .prepare(
          `DELETE FROM collection_items
           WHERE target_type = ? AND target_id = ?
             AND EXISTS (SELECT 1 FROM collections collection
               WHERE collection.id = collection_items.collection_id
                 AND collection.owner_member_id = ?)`,
        )
        .bind(type, target, member),
      db
        .prepare(
          `DELETE FROM saved_items
           WHERE member_id = ? AND target_type = ? AND target_id = ?`,
        )
        .bind(member, type, target),
    ]);
  }

  async setFollow(
    memberId: string,
    targetType: CommunityFollowTargetType,
    targetId: string,
    followed: boolean,
  ): Promise<void> {
    const member = communityIdSchema.parse(memberId);
    const type = communityFollowTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    if (type === "member" && member === target) {
      throw new CommunityAuthorizationError(
        "A member cannot follow themselves.",
      );
    }
    const db = this.requireDb();
    if (type === "member" && followed) {
      const blocked = await db
        .prepare(
          `SELECT 1 AS blocked FROM blocks
           WHERE (blocker_member_id = ? AND blocked_member_id = ?)
              OR (blocker_member_id = ? AND blocked_member_id = ?)
           LIMIT 1`,
        )
        .bind(member, target, target, member)
        .first<{ blocked: number }>();
      if (blocked) {
        throw new CommunityAuthorizationError(
          "This member relationship is unavailable.",
        );
      }
    }
    if (followed && type === "member") {
      const timestamp = now();
      await db.batch([
        db
          .prepare(
            `INSERT OR IGNORE INTO follows
             (follower_member_id, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(member, type, target, timestamp),
        db
          .prepare(
            `INSERT OR IGNORE INTO notifications (
              id, member_id, notification_type, actor_member_id,
              target_type, target_id, read_at, created_at
            ) VALUES (?, ?, 'follow', ?, 'member', ?, NULL, ?)
            `,
          )
          .bind(
            `follow:${member}:${target}`,
            target,
            member,
            member,
            timestamp,
          ),
      ]);
      return;
    }
    await (
      followed
        ? db
            .prepare(
              `INSERT OR IGNORE INTO follows
             (follower_member_id, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?)`,
            )
            .bind(member, type, target, now())
        : db
            .prepare(
              `DELETE FROM follows
             WHERE follower_member_id = ? AND target_type = ? AND target_id = ?`,
            )
            .bind(member, type, target)
    ).run();
  }

  async listNotifications(
    memberId: string,
    limit = 50,
  ): Promise<readonly CommunityNotification[]> {
    if (!this.availability.writable || !this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const size = z.number().int().min(1).max(100).parse(limit);
    const result = await this.db
      .prepare(
        `SELECT notification.id, notification.notification_type,
          notification.target_type, notification.target_id,
          notification.read_at, notification.created_at,
          actor.id AS actor_id, actor.handle AS actor_handle,
          actor.display_name AS actor_display_name,
          actor.avatar_url AS actor_avatar_url,
          actor.public_roles_json AS actor_public_roles_json
         FROM notifications notification
         LEFT JOIN notification_preferences preference
           ON preference.member_id = notification.member_id
         LEFT JOIN member_profiles actor
           ON actor.id = notification.actor_member_id
           AND actor.profile_public = 1 AND actor.status = 'active'
           AND actor.deleted_at IS NULL
         WHERE notification.member_id = ?
           AND CASE
             WHEN notification.notification_type IN ('follow', 'like', 'comment', 'reply', 'repost')
               THEN coalesce(preference.social_enabled, 1) = 1
             WHEN notification.notification_type = 'competition-update'
               THEN coalesce(preference.competition_enabled, 1) = 1
             WHEN notification.notification_type IN ('athlete-claim', 'submission')
               THEN coalesce(preference.claim_submission_enabled, 1) = 1
             ELSE 1
           END
           AND (notification.actor_member_id IS NULL OR NOT EXISTS (
             SELECT 1 FROM blocks blocked
             WHERE (blocked.blocker_member_id = notification.member_id
                    AND blocked.blocked_member_id = notification.actor_member_id)
                OR (blocked.blocker_member_id = notification.actor_member_id
                    AND blocked.blocked_member_id = notification.member_id)
           ))
           AND (notification.actor_member_id IS NULL OR NOT EXISTS (
             SELECT 1 FROM mutes muted
             WHERE muted.muter_member_id = notification.member_id
               AND muted.muted_member_id = notification.actor_member_id
           ))
         ORDER BY notification.created_at DESC, notification.id DESC
         LIMIT ?`,
      )
      .bind(member, size)
      .all<NotificationRow>();

    return result.results.flatMap((row) => {
      const notificationType = z
        .enum([
          "follow",
          "like",
          "comment",
          "reply",
          "repost",
          "athlete-claim",
          "submission",
          "competition-update",
          "athlete-update",
          "team-update",
          "team-invite",
        ])
        .safeParse(row.notification_type);
      if (!notificationType.success) return [];
      const targetType = z
        .enum([
          "member",
          "post",
          "comment",
          "story",
          "video",
          "athlete",
          "competition",
          "team",
          "submission",
          "organization",
        ])
        .safeParse(row.target_type);
      return [
        {
          id: row.id,
          notificationType: notificationType.data,
          actor:
            row.actor_id && row.actor_handle && row.actor_display_name
              ? {
                  id: row.actor_id,
                  handle: row.actor_handle,
                  displayName: row.actor_display_name,
                  avatarUrl: safeOptional(row.actor_avatar_url),
                  publicRoles: jsonList(row.actor_public_roles_json),
                }
              : undefined,
          targetType: targetType.success ? targetType.data : undefined,
          targetId: safeOptional(row.target_id),
          readAt: safeOptional(row.read_at),
          createdAt: row.created_at,
        },
      ];
    });
  }

  async markNotificationsRead(
    memberId: string,
    notificationId?: string,
  ): Promise<void> {
    const member = communityIdSchema.parse(memberId);
    const notification = notificationId
      ? communityIdSchema.parse(notificationId)
      : undefined;
    const statement = notification
      ? this.requireDb()
          .prepare(
            `UPDATE notifications SET read_at = coalesce(read_at, ?)
             WHERE member_id = ? AND id = ?`,
          )
          .bind(now(), member, notification)
      : this.requireDb()
          .prepare(
            `UPDATE notifications SET read_at = coalesce(read_at, ?)
             WHERE member_id = ? AND read_at IS NULL`,
          )
          .bind(now(), member);
    await statement.run();
  }

  async getNotificationPreferences(
    memberId: string,
  ): Promise<CommunityNotificationPreferences> {
    if (!this.availability.writable || !this.db) {
      return {
        social: true,
        competitions: true,
        claimsAndSubmissions: true,
        email: false,
      };
    }
    const member = communityIdSchema.parse(memberId);
    const row = await this.db
      .prepare(
        `SELECT social_enabled, competition_enabled, claim_submission_enabled,
          email_enabled FROM notification_preferences WHERE member_id = ?`,
      )
      .bind(member)
      .first<{
        social_enabled: number;
        competition_enabled: number;
        claim_submission_enabled: number;
        email_enabled: number;
      }>();
    return {
      social: row?.social_enabled !== 0,
      competitions: row?.competition_enabled !== 0,
      claimsAndSubmissions: row?.claim_submission_enabled !== 0,
      email: row?.email_enabled === 1,
    };
  }

  async setNotificationPreferences(
    memberId: string,
    preferences: CommunityNotificationPreferences,
  ): Promise<void> {
    const member = communityIdSchema.parse(memberId);
    const parsed = z
      .object({
        social: z.boolean(),
        competitions: z.boolean(),
        claimsAndSubmissions: z.boolean(),
        email: z.boolean(),
      })
      .strict()
      .parse(preferences);
    await this.requireDb()
      .prepare(
        `INSERT INTO notification_preferences (
          member_id, social_enabled, competition_enabled,
          claim_submission_enabled, email_enabled, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(member_id) DO UPDATE SET
          social_enabled = excluded.social_enabled,
          competition_enabled = excluded.competition_enabled,
          claim_submission_enabled = excluded.claim_submission_enabled,
          email_enabled = excluded.email_enabled,
          updated_at = excluded.updated_at`,
      )
      .bind(
        member,
        Number(parsed.social),
        Number(parsed.competitions),
        Number(parsed.claimsAndSubmissions),
        Number(parsed.email),
        now(),
      )
      .run();
  }

  async listMemberTeamAffiliations(
    memberId: string,
    publicOnly = false,
  ): Promise<readonly CommunityTeamAffiliation[]> {
    if (!this.availability.writable || !this.db) return [];
    const result = await this.db.prepare(
      `SELECT id, canonical_team_id, role, public_visible, granted_at
       FROM team_memberships
       WHERE member_id = ? AND status = 'active'
         ${publicOnly ? "AND public_visible = 1" : ""}
       ORDER BY granted_at DESC, canonical_team_id, role LIMIT 100`,
    ).bind(communityIdSchema.parse(memberId)).all<{
      id: string; canonical_team_id: string; role: CommunityTeamAffiliation["role"];
      public_visible: number; granted_at: string | null;
    }>();
    return result.results.map((row) => ({ id: row.id, teamId: row.canonical_team_id,
      role: row.role, publicVisible: row.public_visible === 1,
      grantedAt: row.granted_at ?? undefined }));
  }

  async setTeamAffiliationVisibility(
    memberId: string,
    membershipId: string,
    publicVisible: boolean,
  ): Promise<void> {
    const result = await this.requireDb().prepare(
      `UPDATE team_memberships SET public_visible = ?, updated_at = ?
       WHERE id = ? AND member_id = ? AND status = 'active'`,
    ).bind(Number(publicVisible), now(), communityIdSchema.parse(membershipId), communityIdSchema.parse(memberId)).run();
    if (!changed(result)) throw new CommunityAuthorizationError("That active team affiliation is unavailable.");
  }

  async listFollowing(
    memberId: string,
    limit = 50,
    offset = 0,
  ): Promise<readonly CommunityFollowRecord[]> {
    if (!this.availability.writable || !this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const size = z.number().int().min(1).max(100).parse(limit);
    const start = z.number().int().min(0).max(10_000).parse(offset);
    const result = await this.db
      .prepare(
        `SELECT follow.target_type, follow.target_id, follow.created_at,
          target.id AS member_id, target.handle AS member_handle,
          target.display_name AS member_display_name,
          target.avatar_url AS member_avatar_url,
          target.public_roles_json AS member_public_roles_json
         FROM follows follow
         LEFT JOIN member_profiles target
           ON follow.target_type = 'member' AND target.id = follow.target_id
           AND target.profile_public = 1 AND target.status = 'active'
           AND target.deleted_at IS NULL
         WHERE follow.follower_member_id = ?
           AND (follow.target_type != 'member' OR target.id IS NOT NULL)
         ORDER BY follow.created_at DESC, follow.target_type, follow.target_id
         LIMIT ? OFFSET ?`,
      )
      .bind(member, size, start)
      .all<{
        target_type: string;
        target_id: string;
        created_at: string;
        member_id: string | null;
        member_handle: string | null;
        member_display_name: string | null;
        member_avatar_url: string | null;
        member_public_roles_json: string | null;
      }>();
    return result.results.map((row) => ({
      targetType: communityFollowTargetTypeSchema.parse(row.target_type),
      targetId: row.target_id,
      createdAt: row.created_at,
      member:
        row.member_id && row.member_handle && row.member_display_name
          ? memberSummary({
              id: row.member_id,
              handle: row.member_handle,
              display_name: row.member_display_name,
              avatar_url: row.member_avatar_url,
              public_roles_json: row.member_public_roles_json ?? "[]",
            })
          : undefined,
    }));
  }

  async listFollowers(
    memberId: string,
    limit = 50,
    offset = 0,
  ): Promise<readonly PublicMemberSummary[]> {
    if (!this.availability.writable || !this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const size = z.number().int().min(1).max(100).parse(limit);
    const start = z.number().int().min(0).max(10_000).parse(offset);
    const result = await this.db
      .prepare(
        `SELECT follower.id, follower.handle, follower.display_name,
          follower.avatar_url, follower.public_roles_json
         FROM follows follow
         JOIN member_profiles follower ON follower.id = follow.follower_member_id
         WHERE follow.target_type = 'member' AND follow.target_id = ?
           AND follower.profile_public = 1 AND follower.status = 'active'
           AND follower.deleted_at IS NULL
         ORDER BY follow.created_at DESC, follower.id
         LIMIT ? OFFSET ?`,
      )
      .bind(member, size, start)
      .all<{
        id: string;
        handle: string;
        display_name: string;
        avatar_url: string | null;
        public_roles_json: string;
      }>();
    return result.results.map(memberSummary);
  }

  async getMemberRelationshipState(
    viewerMemberId: string,
    targetMemberId: string,
  ): Promise<{
    readonly followed: boolean;
    readonly blocked: boolean;
    readonly muted: boolean;
  }> {
    if (!this.availability.writable || !this.db) {
      return { followed: false, blocked: false, muted: false };
    }
    const viewer = communityIdSchema.parse(viewerMemberId);
    const target = communityIdSchema.parse(targetMemberId);
    const row = await this.db
      .prepare(
        `SELECT
          EXISTS (SELECT 1 FROM follows WHERE follower_member_id = ?
            AND target_type = 'member' AND target_id = ?) AS followed,
          EXISTS (SELECT 1 FROM blocks WHERE blocker_member_id = ?
            AND blocked_member_id = ?) AS blocked,
          EXISTS (SELECT 1 FROM mutes WHERE muter_member_id = ?
            AND muted_member_id = ?) AS muted`,
      )
      .bind(viewer, target, viewer, target, viewer, target)
      .first<{ followed: number; blocked: number; muted: number }>();
    return {
      followed: row?.followed === 1,
      blocked: row?.blocked === 1,
      muted: row?.muted === 1,
    };
  }

  async getFollowState(
    viewerMemberId: string,
    targetType: CommunityFollowTargetType,
    targetId: string,
  ): Promise<boolean> {
    if (!this.availability.writable || !this.db) return false;
    const viewer = communityIdSchema.parse(viewerMemberId);
    const type = communityFollowTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const row = await this.db
      .prepare(
        `SELECT 1 AS followed FROM follows
         WHERE follower_member_id = ? AND target_type = ? AND target_id = ?
         LIMIT 1`,
      )
      .bind(viewer, type, target)
      .first<{ followed: number }>();
    return Boolean(row);
  }

  async createRepost(input: {
    readonly memberId: string;
    readonly targetType: CommunityRepostTargetType;
    readonly targetId: string;
    readonly quoteBody?: string;
  }): Promise<string> {
    const parsed = z
      .object({
        memberId: communityIdSchema,
        targetType: communityRepostTargetTypeSchema,
        targetId: communityIdSchema,
        quoteBody: z.string().trim().max(4000).default(""),
      })
      .strict()
      .parse(input);
    const db = this.requireDb();
    const existing = await db
      .prepare(
        `SELECT activity_post_id FROM community_reposts
         WHERE member_id = ? AND target_type = ? AND target_id = ? LIMIT 1`,
      )
      .bind(parsed.memberId, parsed.targetType, parsed.targetId)
      .first<{ activity_post_id: string }>();
    if (existing) return existing.activity_post_id;
    if (parsed.targetType === "post") {
      const original = await this.getPost(parsed.targetId, parsed.memberId);
      if (!original) {
        throw new CommunityAuthorizationError(
          "The original post is unavailable.",
        );
      }
    }

    const repostId = crypto.randomUUID();
    const activityPostId = crypto.randomUUID();
    const timestamp = now();
    await db.batch([
      db
        .prepare(
          `INSERT INTO community_posts (
            id, author_member_id, body, visibility, status,
            canonical_target_type, canonical_target_id, repost_of_post_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'public', 'published', ?, ?, ?, ?, ?)`,
        )
        .bind(
          activityPostId,
          parsed.memberId,
          parsed.quoteBody,
          parsed.targetType === "post" ? null : parsed.targetType,
          parsed.targetType === "post" ? null : parsed.targetId,
          parsed.targetType === "post" ? parsed.targetId : null,
          timestamp,
          timestamp,
        ),
      db
        .prepare(
          `INSERT INTO community_reposts (
            id, member_id, target_type, target_id, activity_post_id,
            quote_body, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          repostId,
          parsed.memberId,
          parsed.targetType,
          parsed.targetId,
          activityPostId,
          parsed.quoteBody,
          timestamp,
          timestamp,
        ),
      ...(parsed.targetType === "post"
        ? [
            db
              .prepare(
                `INSERT OR IGNORE INTO notifications (
                  id, member_id, notification_type, actor_member_id,
                  target_type, target_id, read_at, created_at
                )
                SELECT ?, original.author_member_id, 'repost', ?, 'post', ?, NULL, ?
                FROM community_posts original
                WHERE original.id = ? AND original.author_member_id != ?`,
              )
              .bind(
                `repost:${repostId}`,
                parsed.memberId,
                parsed.targetId,
                timestamp,
                parsed.targetId,
                parsed.memberId,
              ),
          ]
        : []),
    ]);
    return activityPostId;
  }

  async removeRepost(
    memberId: string,
    targetType: CommunityRepostTargetType,
    targetId: string,
  ): Promise<boolean> {
    const member = communityIdSchema.parse(memberId);
    const type = communityRepostTargetTypeSchema.parse(targetType);
    const target = communityIdSchema.parse(targetId);
    const db = this.requireDb();
    const existing = await db
      .prepare(
        `SELECT id, activity_post_id FROM community_reposts
         WHERE member_id = ? AND target_type = ? AND target_id = ? LIMIT 1`,
      )
      .bind(member, type, target)
      .first<{ id: string; activity_post_id: string }>();
    if (!existing) return true;
    const timestamp = now();
    await db.batch([
      db
        .prepare(
          `UPDATE community_posts SET status = 'deleted', deleted_at = ?, updated_at = ?
           WHERE id = ? AND author_member_id = ?`,
        )
        .bind(timestamp, timestamp, existing.activity_post_id, member),
      db
        .prepare("DELETE FROM community_reposts WHERE id = ? AND member_id = ?")
        .bind(existing.id, member),
    ]);
    return true;
  }

  async listSaved(
    memberId: string,
    targetType?: CommunitySaveTargetType,
    limit = 100,
  ): Promise<readonly CommunityLibraryItem[]> {
    if (!this.availability.writable || !this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const type = targetType
      ? communitySaveTargetTypeSchema.parse(targetType)
      : undefined;
    const size = z.number().int().min(1).max(100).parse(limit);
    const typeWhere = type ? "AND saved.target_type = ?" : "";
    const values: SqlValue[] = type ? [member, type, size] : [member, size];
    const result = await this.db
      .prepare(
        `SELECT saved.target_type, saved.target_id, saved.created_at AS added_at,
          COALESCE((SELECT json_group_array(item.collection_id)
            FROM collection_items item
            JOIN collections collection ON collection.id = item.collection_id
            WHERE collection.owner_member_id = saved.member_id
              AND collection.status = 'active'
              AND item.target_type = saved.target_type
              AND item.target_id = saved.target_id), '[]') AS collection_ids_json,
          post.id AS post_id, post.body AS post_body,
          author.id AS post_author_id, author.handle AS post_author_handle,
          author.display_name AS post_author_display_name,
          author.avatar_url AS post_author_avatar_url,
          author.public_roles_json AS post_author_public_roles_json
         FROM saved_items saved
         LEFT JOIN community_posts post
           ON saved.target_type = 'post' AND post.id = saved.target_id
           AND post.status = 'published' AND post.visibility = 'public'
           AND post.deleted_at IS NULL
         LEFT JOIN member_profiles author
           ON author.id = post.author_member_id AND author.profile_public = 1
           AND author.status = 'active' AND author.deleted_at IS NULL
         WHERE saved.member_id = ? ${typeWhere}
         ORDER BY saved.created_at DESC LIMIT ?`,
      )
      .bind(...values)
      .all<LibraryRow>();
    return result.results.map(libraryItem);
  }

  async createCollection(
    ownerMemberId: string,
    name: string,
    description = "",
  ): Promise<string> {
    const owner = communityIdSchema.parse(ownerMemberId);
    const title = z.string().trim().min(1).max(100).parse(name);
    const body = z.string().trim().max(500).parse(description);
    const id = crypto.randomUUID();
    const timestamp = now();
    await this.requireDb()
      .prepare(
        `INSERT INTO collections (
          id, owner_member_id, name, description, visibility, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'private', 'active', ?, ?)`,
      )
      .bind(id, owner, title, body, timestamp, timestamp)
      .run();
    return id;
  }

  async listCollections(
    ownerMemberId: string,
  ): Promise<readonly CommunityCollectionSummary[]> {
    if (!this.availability.writable || !this.db) return [];
    const owner = communityIdSchema.parse(ownerMemberId);
    const result = await this.db
      .prepare(
        `SELECT collection.id, collection.name, collection.description,
          collection.created_at, collection.updated_at,
          COUNT(item.target_id) AS item_count
         FROM collections collection
         LEFT JOIN collection_items item ON item.collection_id = collection.id
         WHERE collection.owner_member_id = ? AND collection.status = 'active'
         GROUP BY collection.id
         ORDER BY collection.updated_at DESC, collection.id DESC
         LIMIT 100`,
      )
      .bind(owner)
      .all<{
        id: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        item_count: number;
      }>();
    return result.results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      itemCount: Number(row.item_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getCollection(
    ownerMemberId: string,
    collectionId: string,
  ): Promise<CommunityCollection | null> {
    if (!this.availability.writable || !this.db) return null;
    const owner = communityIdSchema.parse(ownerMemberId);
    const collection = communityIdSchema.parse(collectionId);
    const summary = await this.db
      .prepare(
        `SELECT collection.id, collection.name, collection.description,
          collection.created_at, collection.updated_at,
          COUNT(item.target_id) AS item_count
         FROM collections collection
         LEFT JOIN collection_items item ON item.collection_id = collection.id
         WHERE collection.id = ? AND collection.owner_member_id = ?
           AND collection.status = 'active'
         GROUP BY collection.id LIMIT 1`,
      )
      .bind(collection, owner)
      .first<{
        id: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        item_count: number;
      }>();
    if (!summary) return null;
    const items = await this.db
      .prepare(
        `SELECT item.target_type, item.target_id, item.added_at,
          json_array(item.collection_id) AS collection_ids_json,
          post.id AS post_id, post.body AS post_body,
          author.id AS post_author_id, author.handle AS post_author_handle,
          author.display_name AS post_author_display_name,
          author.avatar_url AS post_author_avatar_url,
          author.public_roles_json AS post_author_public_roles_json
         FROM collection_items item
         LEFT JOIN community_posts post
           ON item.target_type = 'post' AND post.id = item.target_id
           AND post.status = 'published' AND post.visibility = 'public'
           AND post.deleted_at IS NULL
         LEFT JOIN member_profiles author
           ON author.id = post.author_member_id AND author.profile_public = 1
           AND author.status = 'active' AND author.deleted_at IS NULL
         WHERE item.collection_id = ?
         ORDER BY item.display_order, item.added_at DESC LIMIT 100`,
      )
      .bind(collection)
      .all<LibraryRow>();
    return {
      id: summary.id,
      name: summary.name,
      description: summary.description,
      itemCount: Number(summary.item_count) || 0,
      createdAt: summary.created_at,
      updatedAt: summary.updated_at,
      items: items.results.map(libraryItem),
    };
  }

  async updateCollection(input: {
    readonly actorMemberId: string;
    readonly collectionId: string;
    readonly name: string;
    readonly description?: string;
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorMemberId: communityIdSchema,
        collectionId: communityIdSchema,
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).default(""),
      })
      .strict()
      .parse(input);
    const result = await this.requireDb()
      .prepare(
        `UPDATE collections SET name = ?, description = ?, updated_at = ?
         WHERE id = ? AND owner_member_id = ? AND status = 'active'`,
      )
      .bind(
        parsed.name,
        parsed.description,
        now(),
        parsed.collectionId,
        parsed.actorMemberId,
      )
      .run();
    return changed(result);
  }

  async deleteCollection(
    actorMemberId: string,
    collectionId: string,
  ): Promise<boolean> {
    const actor = communityIdSchema.parse(actorMemberId);
    const collection = communityIdSchema.parse(collectionId);
    const result = await this.requireDb()
      .prepare(
        `UPDATE collections SET status = 'deleted', updated_at = ?
         WHERE id = ? AND owner_member_id = ? AND status = 'active'`,
      )
      .bind(now(), collection, actor)
      .run();
    return changed(result);
  }

  async addCollectionItem(input: {
    readonly actorMemberId: string;
    readonly collectionId: string;
    readonly targetType: CommunitySaveTargetType;
    readonly targetId: string;
    readonly displayOrder?: number;
  }): Promise<void> {
    const parsed = z
      .object({
        actorMemberId: communityIdSchema,
        collectionId: communityIdSchema,
        targetType: communitySaveTargetTypeSchema,
        targetId: communityIdSchema,
        displayOrder: z.number().int().min(0).max(1_000_000).default(0),
      })
      .strict()
      .parse(input);
    const db = this.requireDb();
    const [owned, saved] = await Promise.all([
      db
        .prepare(
          `SELECT id FROM collections
           WHERE id = ? AND owner_member_id = ? AND status = 'active' LIMIT 1`,
        )
        .bind(parsed.collectionId, parsed.actorMemberId)
        .first<{ id: string }>(),
      db
        .prepare(
          `SELECT target_id FROM saved_items
           WHERE member_id = ? AND target_type = ? AND target_id = ? LIMIT 1`,
        )
        .bind(parsed.actorMemberId, parsed.targetType, parsed.targetId)
        .first<{ target_id: string }>(),
    ]);
    if (!owned)
      throw new CommunityAuthorizationError(
        "Collection ownership is required.",
      );
    if (!saved)
      throw new CommunityAuthorizationError(
        "Save the item before adding it to a collection.",
      );
    await db
      .prepare(
        `INSERT OR IGNORE INTO collection_items
         (collection_id, target_type, target_id, display_order, added_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        parsed.collectionId,
        parsed.targetType,
        parsed.targetId,
        parsed.displayOrder,
        now(),
      )
      .run();
  }

  async removeCollectionItem(input: {
    readonly actorMemberId: string;
    readonly collectionId: string;
    readonly targetType: CommunitySaveTargetType;
    readonly targetId: string;
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorMemberId: communityIdSchema,
        collectionId: communityIdSchema,
        targetType: communitySaveTargetTypeSchema,
        targetId: communityIdSchema,
      })
      .strict()
      .parse(input);
    const result = await this.requireDb()
      .prepare(
        `DELETE FROM collection_items
         WHERE collection_id = ? AND target_type = ? AND target_id = ?
           AND EXISTS (SELECT 1 FROM collections collection
             WHERE collection.id = collection_items.collection_id
               AND collection.owner_member_id = ? AND collection.status = 'active')`,
      )
      .bind(
        parsed.collectionId,
        parsed.targetType,
        parsed.targetId,
        parsed.actorMemberId,
      )
      .run();
    return changed(result);
  }

  async setBlock(
    blockerMemberId: string,
    blockedMemberId: string,
    blocked: boolean,
  ): Promise<void> {
    const blocker = communityIdSchema.parse(blockerMemberId);
    const target = communityIdSchema.parse(blockedMemberId);
    if (blocker === target) {
      throw new CommunityAuthorizationError(
        "A member cannot block themselves.",
      );
    }
    const db = this.requireDb();
    if (blocked) {
      await db.batch([
        db
          .prepare(
            `INSERT OR IGNORE INTO blocks
             (blocker_member_id, blocked_member_id, created_at)
             VALUES (?, ?, ?)`,
          )
          .bind(blocker, target, now()),
        db
          .prepare(
            `DELETE FROM follows
             WHERE (follower_member_id = ? AND target_type = 'member' AND target_id = ?)
                OR (follower_member_id = ? AND target_type = 'member' AND target_id = ?)`,
          )
          .bind(blocker, target, target, blocker),
      ]);
      return;
    }
    await db
      .prepare(
        "DELETE FROM blocks WHERE blocker_member_id = ? AND blocked_member_id = ?",
      )
      .bind(blocker, target)
      .run();
  }

  async setMute(
    muterMemberId: string,
    mutedMemberId: string,
    muted: boolean,
  ): Promise<void> {
    const muter = communityIdSchema.parse(muterMemberId);
    const target = communityIdSchema.parse(mutedMemberId);
    if (muter === target) {
      throw new CommunityAuthorizationError("A member cannot mute themselves.");
    }
    const statement = muted
      ? this.requireDb()
          .prepare(
            `INSERT OR IGNORE INTO mutes
             (muter_member_id, muted_member_id, created_at) VALUES (?, ?, ?)`,
          )
          .bind(muter, target, now())
      : this.requireDb()
          .prepare(
            `DELETE FROM mutes
             WHERE muter_member_id = ? AND muted_member_id = ?`,
          )
          .bind(muter, target);
    await statement.run();
  }

  async createReport(input: {
    readonly reporterMemberId: string;
    readonly targetType: "member" | "post" | "comment" | "media";
    readonly targetId: string;
    readonly reason: string;
    readonly details?: string;
  }): Promise<string> {
    const parsed = z
      .object({
        reporterMemberId: communityIdSchema,
        targetType: z.enum(["member", "post", "comment", "media"]),
        targetId: communityIdSchema,
        reason: z.string().trim().min(2).max(100),
        details: z.string().trim().max(2000).default(""),
      })
      .strict()
      .parse(input);
    const id = crypto.randomUUID();
    const timestamp = now();
    await this.requireDb()
      .prepare(
        `INSERT INTO reports (
          id, reporter_member_id, target_type, target_id, reason, details,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
      )
      .bind(
        id,
        parsed.reporterMemberId,
        parsed.targetType,
        parsed.targetId,
        parsed.reason,
        parsed.details,
        timestamp,
        timestamp,
      )
      .run();
    return id;
  }

  async listReports(limit = 100): Promise<readonly CommunityReport[]> {
    if (!this.availability.writable || !this.db) return [];
    const size = z.number().int().min(1).max(250).parse(limit);
    const result = await this.db
      .prepare(
        `SELECT report.id, report.target_type, report.target_id, report.reason,
          report.details, report.status, report.created_at, report.updated_at,
          CASE
            WHEN report.target_type = 'post' THEN
              (SELECT CASE status
                WHEN 'hidden' THEN 1 WHEN 'published' THEN 0 ELSE NULL END
               FROM community_posts WHERE id = report.target_id)
            WHEN report.target_type = 'comment' THEN
              (SELECT CASE status
                WHEN 'hidden' THEN 1 WHEN 'published' THEN 0 ELSE NULL END
               FROM community_comments WHERE id = report.target_id)
            ELSE NULL
          END AS target_hidden,
          CASE
            WHEN report.target_type = 'post' THEN
              (SELECT CASE
                WHEN post.status = 'published' AND post.visibility = 'public'
                  AND post.deleted_at IS NULL AND author.profile_public = 1
                  AND author.status = 'active' AND author.deleted_at IS NULL
                THEN 1 ELSE 0 END
               FROM community_posts post
               JOIN member_profiles author ON author.id = post.author_member_id
               WHERE post.id = report.target_id)
            ELSE NULL
          END AS target_public,
          reporter.id AS reporter_id, reporter.handle AS reporter_handle,
          reporter.display_name AS reporter_display_name,
          reporter.avatar_url AS reporter_avatar_url,
          reporter.public_roles_json AS reporter_public_roles_json
         FROM reports report
         JOIN member_profiles reporter ON reporter.id = report.reporter_member_id
         ORDER BY CASE report.status WHEN 'submitted' THEN 0 WHEN 'in-review' THEN 1 ELSE 2 END,
           report.created_at DESC LIMIT ?`,
      )
      .bind(size)
      .all<{
        id: string;
        target_type: "member" | "post" | "comment" | "media";
        target_id: string;
        reason: string;
        details: string;
        status: string;
        created_at: string;
        updated_at: string;
        target_hidden: number | null;
        target_public: number | null;
        reporter_id: string;
        reporter_handle: string;
        reporter_display_name: string;
        reporter_avatar_url: string | null;
        reporter_public_roles_json: string;
      }>();
    return result.results.map((row) => ({
      id: row.id,
      reporter: memberSummary({
        id: row.reporter_id,
        handle: row.reporter_handle,
        display_name: row.reporter_display_name,
        avatar_url: row.reporter_avatar_url,
        public_roles_json: row.reporter_public_roles_json,
      }),
      targetType: row.target_type,
      targetId: row.target_id,
      targetHidden:
        row.target_hidden === null ? undefined : Boolean(row.target_hidden),
      targetPublic:
        row.target_public === null ? undefined : Boolean(row.target_public),
      reason: row.reason,
      details: row.details,
      status: reportStatusSchema.parse(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async listAuditEvents(limit = 100): Promise<readonly CommunityAuditEvent[]> {
    if (!this.availability.writable || !this.db) return [];
    const size = z.number().int().min(1).max(250).parse(limit);
    const result = await this.db
      .prepare(
        `SELECT id, event_type, target_type, target_id, summary, created_at
         FROM community_audit_events
         ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(size)
      .all<{
        id: string;
        event_type: string;
        target_type: "post" | "comment" | "report";
        target_id: string;
        summary: string;
        created_at: string;
      }>();
    return result.results.map((row) => ({
      id: row.id,
      eventType: communityAuditEventTypeSchema.parse(row.event_type),
      targetType: row.target_type,
      targetId: row.target_id,
      summary: row.summary,
      createdAt: row.created_at,
    }));
  }

  async moderateContent(input: {
    readonly actorPrincipalId: string;
    readonly targetType: "post" | "comment";
    readonly targetId: string;
    readonly hidden: boolean;
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorPrincipalId: communityIdSchema,
        targetType: z.enum(["post", "comment"]),
        targetId: communityIdSchema,
        hidden: z.boolean(),
      })
      .strict()
      .parse(input);
    const db = this.requireDb();
    const nextStatus = parsed.hidden ? "hidden" : "published";
    const eventType =
      parsed.targetType === "post"
        ? parsed.hidden
          ? "communityPostHidden"
          : "communityPostRestored"
        : parsed.hidden
          ? "communityCommentHidden"
          : "communityCommentRestored";
    const timestamp = now();
    const currentStatus = parsed.hidden ? "published" : "hidden";
    const updateStatement =
      parsed.targetType === "post"
        ? db
            .prepare(
              "UPDATE community_posts SET status = ?, updated_at = ? WHERE id = ? AND status = ?",
            )
            .bind(nextStatus, timestamp, parsed.targetId, currentStatus)
        : db
            .prepare(
              "UPDATE community_comments SET status = ?, updated_at = ? WHERE id = ? AND status = ?",
            )
            .bind(nextStatus, timestamp, parsed.targetId, currentStatus);
    const auditStatement = (
      parsed.targetType === "post"
        ? db.prepare(
            `INSERT INTO community_audit_events (
            id, event_type, actor_principal_id, target_type, target_id,
            summary, created_at
          ) SELECT ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (
            SELECT 1 FROM community_posts
            WHERE id = ? AND status = ? AND updated_at = ?
          )`,
          )
        : db.prepare(
            `INSERT INTO community_audit_events (
            id, event_type, actor_principal_id, target_type, target_id,
            summary, created_at
          ) SELECT ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (
            SELECT 1 FROM community_comments
            WHERE id = ? AND status = ? AND updated_at = ?
          )`,
          )
    ).bind(
      crypto.randomUUID(),
      eventType,
      parsed.actorPrincipalId,
      parsed.targetType,
      parsed.targetId,
      `${parsed.targetType} ${parsed.hidden ? "hidden" : "restored"} by an authorized editorial operator.`,
      timestamp,
      parsed.targetId,
      nextStatus,
      timestamp,
    );
    const results = await db.batch([updateStatement, auditStatement]);
    return changed(results[0] ?? {});
  }

  async updateReportStatus(input: {
    readonly actorPrincipalId: string;
    readonly reportId: string;
    readonly status: "resolved" | "dismissed";
  }): Promise<boolean> {
    const parsed = z
      .object({
        actorPrincipalId: communityIdSchema,
        reportId: communityIdSchema,
        status: z.enum(["resolved", "dismissed"]),
      })
      .strict()
      .parse(input);
    const db = this.requireDb();
    const timestamp = now();
    const results = await db.batch([
      db
        .prepare(
          `UPDATE reports SET status = ?, updated_at = ?
           WHERE id = ? AND status IN ('submitted', 'in-review')`,
        )
        .bind(parsed.status, timestamp, parsed.reportId),
      db
        .prepare(
          `INSERT INTO community_audit_events (
            id, event_type, actor_principal_id, target_type, target_id,
            summary, created_at
          ) SELECT ?, ?, ?, 'report', ?, ?, ?
          WHERE EXISTS (
            SELECT 1 FROM reports
            WHERE id = ? AND status = ? AND updated_at = ?
          )`,
        )
        .bind(
          crypto.randomUUID(),
          parsed.status === "resolved"
            ? "communityReportResolved"
            : "communityReportDismissed",
          parsed.actorPrincipalId,
          parsed.reportId,
          `Community report ${parsed.status} by an authorized editorial operator.`,
          timestamp,
          parsed.reportId,
          parsed.status,
          timestamp,
        ),
    ]);
    return changed(results[0] ?? {});
  }
}
