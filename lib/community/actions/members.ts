"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import {
  communityActionFailure,
  CommunityActionError,
  communityReturnPath,
  requireCommunityActor,
} from "@/lib/community/actions/shared";
import { enforceCommunityRateLimit } from "@/lib/community/rate-limit";
import { getCommunityRuntime } from "@/lib/community/runtime";
import {
  commaSeparatedList,
  communityHandleSchema,
  optionalCommunityProfileImageUrlSchema,
} from "@/lib/community/validation";
import type { ActionResult } from "@/lib/operations/action-result";
import { COMMUNITY_REPORT_REASONS } from "@/lib/community/reporting";

const publicRoleSchema = z.enum([
  "Fan",
  "Coach",
  "Organizer",
  "Photographer",
  "Videographer",
  "Creator",
  "Contributor",
  "Team manager",
]);
const socialPlatforms = [
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "threads",
  "facebook",
  "website",
  "discord",
] as const;

export async function updatePublicMemberProfileAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData, "/account/profile");
  try {
    const user = await requireAuthenticatedUser(returnTo);
    if (["suspended", "archived"].includes(user.accessStatus)) {
      throw new CommunityActionError(
        "This account cannot currently change its public member profile.",
      );
    }
    const runtime = await getCommunityRuntime();
    if (!runtime.repository.availability.writable) {
      throw new CommunityActionError(
        "Community persistence is temporarily unavailable.",
      );
    }
    const existing = await runtime.repository.getMemberProfileByPrincipalId(user.id);
    await enforceCommunityRateLimit({
      limiter: runtime.rateLimiter,
      operation: "profile",
      memberId: existing?.id ?? user.id,
    });

    const socialAccounts = socialPlatforms.flatMap((platform) => {
      const value = formData.get(`social_${platform}`);
      if (typeof value !== "string" || !value.trim()) return [];
      return [{ platform, url: value.trim() }];
    });
    const parsed = z
      .object({
        handle: communityHandleSchema,
        displayName: z.string().trim().min(1).max(100),
        biography: z.string().trim().max(500),
        avatarUrl: optionalCommunityProfileImageUrlSchema,
        coverImageUrl: optionalCommunityProfileImageUrlSchema,
        country: z.string().trim().max(80).optional(),
        administrativeArea: z.string().trim().max(100).optional(),
        city: z.string().trim().max(100).optional(),
        preferredTimeZone: z
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
          }, "Use a valid IANA timezone such as America/Chicago."),
        interests: z.array(z.string().min(1).max(80)).max(30),
        disciplines: z.array(z.string().min(1).max(80)).max(30),
        publicRoles: z.array(publicRoleSchema).max(8),
        socialAccounts: z.array(
          z.object({ platform: z.enum(socialPlatforms), url: z.string().trim().min(1) }),
        ),
        profilePublic: z.boolean(),
        showLocation: z.boolean(),
        showSocialAccounts: z.boolean(),
        showMedia: z.boolean(),
        discoverable: z.boolean(),
      })
      .parse({
        handle: formData.get("handle"),
        displayName: formData.get("displayName"),
        biography: formData.get("biography") ?? "",
        avatarUrl: formData.get("avatarUrl") ?? "",
        coverImageUrl: formData.get("coverImageUrl") ?? "",
        country: (formData.get("country") as string | null)?.trim() || undefined,
        administrativeArea:
          (formData.get("administrativeArea") as string | null)?.trim() || undefined,
        city: (formData.get("city") as string | null)?.trim() || undefined,
        preferredTimeZone:
          (formData.get("preferredTimeZone") as string | null)?.trim() || undefined,
        interests: commaSeparatedList(formData.get("interests")),
        disciplines: commaSeparatedList(formData.get("disciplines")),
        publicRoles: formData.getAll("publicRoles"),
        socialAccounts,
        profilePublic: formData.get("profilePublic") === "on",
        showLocation: formData.get("showLocation") === "on",
        showSocialAccounts: formData.get("showSocialAccounts") === "on",
        showMedia: formData.get("showMedia") === "on",
        discoverable: formData.get("discoverable") === "on",
      });
    await runtime.repository.upsertMemberProfile({
      id: existing?.id ?? crypto.randomUUID(),
      principalId: user.id,
      ...parsed,
    });
    revalidatePath("/account/profile");
    revalidatePath(`/members/${parsed.handle}`);
    if (existing?.handle && existing.handle !== parsed.handle) {
      revalidatePath(`/members/${existing.handle}`);
    }
    return {
      success: true,
      message: parsed.profilePublic
        ? "Public member profile saved."
        : "Member profile saved privately.",
      redirectTo: parsed.profilePublic
        ? `/members/${parsed.handle}`
        : "/account/profile",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function reportMemberAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        memberId: z.string().trim().min(1).max(200),
        reason: z.enum(COMMUNITY_REPORT_REASONS),
        details: z.string().trim().max(2000).default(""),
      })
      .parse({
        memberId: formData.get("memberId"),
        reason: formData.get("reason"),
        details: formData.get("details") ?? "",
      });
    const { member, repository } = await requireCommunityActor("report", returnTo);
    if (!(await repository.getPublicMemberProfileById(parsed.memberId))) {
      throw new CommunityActionError("That member is unavailable.");
    }
    await repository.createReport({
      reporterMemberId: member.id,
      targetType: "member",
      targetId: parsed.memberId,
      reason: parsed.reason,
      details: parsed.details,
    });
    return { success: true, message: "Report submitted for private review." };
  } catch (error) {
    return communityActionFailure(error);
  }
}
