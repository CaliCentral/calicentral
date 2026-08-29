import { z } from "zod";

import {
  COMMUNITY_CANONICAL_TARGET_TYPES,
  COMMUNITY_COMMENT_TARGET_TYPES,
  COMMUNITY_FOLLOW_TARGET_TYPES,
  COMMUNITY_MEDIA_KINDS,
  COMMUNITY_POST_TYPES,
  COMMUNITY_REPOST_TARGET_TYPES,
  COMMUNITY_SAVE_TARGET_TYPES,
  COMMUNITY_TARGET_TYPES,
} from "@/lib/community/types";

const RESERVED_HANDLES = new Set([
  "account",
  "admin",
  "api",
  "athlete",
  "athletes",
  "auth",
  "community",
  "competitions",
  "help",
  "join",
  "member",
  "members",
  "moderator",
  "rankings",
  "root",
  "settings",
  "sign-in",
  "standings",
  "stories",
  "studio",
  "support",
  "team",
  "teams",
  "video",
  "videos",
]);

export const communityIdSchema = z.string().trim().min(1).max(200);

export const communityHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(
    /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/,
    "Use 3–32 lowercase letters, numbers, hyphens, or underscores.",
  )
  .refine((value) => !RESERVED_HANDLES.has(value), {
    message: "That handle is reserved.",
  });

export const communityTargetTypeSchema = z.enum(COMMUNITY_TARGET_TYPES);
export const communityCanonicalTargetTypeSchema = z.enum(
  COMMUNITY_CANONICAL_TARGET_TYPES,
);
export const communitySaveTargetTypeSchema = z.enum(
  COMMUNITY_SAVE_TARGET_TYPES,
);
export const communityCommentTargetTypeSchema = z.enum(
  COMMUNITY_COMMENT_TARGET_TYPES,
);
export const communityRepostTargetTypeSchema = z.enum(
  COMMUNITY_REPOST_TARGET_TYPES,
);
export const communityFollowTargetTypeSchema = z.enum(
  COMMUNITY_FOLLOW_TARGET_TYPES,
);
export const communityMediaKindSchema = z.enum(COMMUNITY_MEDIA_KINDS);
export const communityPostTypeSchema = z.enum(COMMUNITY_POST_TYPES);

function isUnsafeHostname(hostname: string): boolean {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIpv6 = value.includes(":");

  if (
    value === "localhost" ||
    value.endsWith(".localhost") ||
    value.endsWith(".local") ||
    value === "0.0.0.0" ||
    value === "::" ||
    value === "::1" ||
    value === "169.254.169.254" ||
    value.startsWith("127.") ||
    value.startsWith("10.") ||
    value.startsWith("192.168.") ||
    value.startsWith("169.254.") ||
    (isIpv6 && value.startsWith("fc")) ||
    (isIpv6 && value.startsWith("fd")) ||
    (isIpv6 && value.startsWith("fe80:"))
  ) {
    return true;
  }

  const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return false;

  const first = Number(match[1]);
  const second = Number(match[2]);
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  );
}

export const communityExternalUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_000)
  .transform((value, context) => {
    try {
      const url = new URL(value);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        isUnsafeHostname(url.hostname)
      ) {
        context.addIssue({
          code: "custom",
          message: "Use a public HTTP(S) URL without credentials.",
        });
        return z.NEVER;
      }

      url.hash = "";
      return url.toString();
    } catch {
      context.addIssue({ code: "custom", message: "Enter a valid URL." });
      return z.NEVER;
    }
  });

export const optionalCommunityExternalUrlSchema = z
  .union([z.literal("").transform(() => undefined), communityExternalUrlSchema])
  .optional();

const TRUSTED_PROFILE_IMAGE_HOSTS = new Set([
  "avatars.githubusercontent.com",
  "cdn.sanity.io",
  "lh3.googleusercontent.com",
]);

export const communityProfileImageUrlSchema = communityExternalUrlSchema.refine(
  (value) => TRUSTED_PROFILE_IMAGE_HOSTS.has(new URL(value).hostname),
  { message: "Use an approved Cali Central, GitHub, or Google image host." },
);

export const optionalCommunityProfileImageUrlSchema = z
  .union([
    z.literal("").transform(() => undefined),
    communityProfileImageUrlSchema,
  ])
  .optional();

export function commaSeparatedList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
