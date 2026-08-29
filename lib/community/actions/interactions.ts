"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  actionBooleanSchema,
  assertVisibleCommunityTarget,
  communityActionFailure,
  communityReturnPath,
  revalidationPath,
  requireCommunityActor,
} from "@/lib/community/actions/shared";
import {
  communityFollowTargetTypeSchema,
  communityRepostTargetTypeSchema,
  communitySaveTargetTypeSchema,
  communityTargetTypeSchema,
} from "@/lib/community/validation";
import type { ActionResult } from "@/lib/operations/action-result";
import { COMMUNITY_REPORT_REASONS } from "@/lib/community/reporting";

function refresh(returnTo: string) {
  revalidatePath(revalidationPath(returnTo));
  revalidatePath("/community");
}

export async function toggleCommunityLikeAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: communityTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "like",
      returnTo,
    );
    let targetId = parsed.targetId;
    if (parsed.active) {
      if (parsed.targetType === "comment") {
        if (!(await repository.commentExists(parsed.targetId))) {
          throw new Error("Comment target unavailable.");
        }
      } else {
        targetId = await assertVisibleCommunityTarget(
          repository,
          parsed.targetType,
          parsed.targetId,
          member.id,
        );
      }
    }
    await repository.setLike(
      member.id,
      parsed.targetType,
      targetId,
      parsed.active,
    );
    refresh(returnTo);
    return {
      success: true,
      message: parsed.active ? "Liked." : "Like removed.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunitySaveAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: communitySaveTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "save",
      returnTo,
    );
    const targetId = parsed.active
      ? await assertVisibleCommunityTarget(
          repository,
          parsed.targetType,
          parsed.targetId,
          member.id,
        )
      : parsed.targetId;
    await repository.setSaved(
      member.id,
      parsed.targetType,
      targetId,
      parsed.active,
    );
    refresh(returnTo);
    revalidatePath("/account/saved");
    return {
      success: true,
      message: parsed.active ? "Saved." : "Removed from saved.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunityRepostAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: communityRepostTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
        quoteBody: z.string().trim().max(4000).default(""),
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        active: formData.get("active"),
        quoteBody: formData.get("quoteBody") ?? "",
      });
    const { member, repository } = await requireCommunityActor(
      "repost",
      returnTo,
    );
    const targetId = parsed.active
      ? await assertVisibleCommunityTarget(
          repository,
          parsed.targetType,
          parsed.targetId,
          member.id,
        )
      : parsed.targetId;
    if (parsed.active) {
      await repository.createRepost({
        memberId: member.id,
        ...parsed,
        targetId,
      });
    } else {
      await repository.removeRepost(member.id, parsed.targetType, targetId);
    }
    refresh(returnTo);
    revalidatePath(`/members/${member.handle}`);
    return {
      success: true,
      message: parsed.active ? "Reposted to the community." : "Repost removed.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunityFollowAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: communityFollowTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "follow",
      returnTo,
    );
    let targetId = parsed.targetId;
    if (parsed.active) {
      if (parsed.targetType === "member") {
        if (!(await repository.getPublicMemberProfileById(parsed.targetId))) {
          throw new Error("Member target unavailable.");
        }
      } else {
        targetId = await assertVisibleCommunityTarget(
          repository,
          parsed.targetType,
          parsed.targetId,
          member.id,
        );
      }
    }
    await repository.setFollow(
      member.id,
      parsed.targetType,
      targetId,
      parsed.active,
    );
    refresh(returnTo);
    return {
      success: true,
      message: parsed.active ? "Following." : "Follow removed.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunityBlockAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetMemberId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
      })
      .parse({
        targetMemberId: formData.get("targetMemberId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "follow",
      returnTo,
    );
    await repository.setBlock(member.id, parsed.targetMemberId, parsed.active);
    refresh(returnTo);
    return {
      success: true,
      message: parsed.active ? "Member blocked." : "Member unblocked.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunityMuteAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetMemberId: z.string().trim().min(1).max(200),
        active: actionBooleanSchema,
      })
      .parse({
        targetMemberId: formData.get("targetMemberId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "follow",
      returnTo,
    );
    await repository.setMute(member.id, parsed.targetMemberId, parsed.active);
    refresh(returnTo);
    return {
      success: true,
      message: parsed.active ? "Member muted." : "Member unmuted.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function reportCommunityContentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: z.enum(["member", "post", "comment", "media"]),
        targetId: z.string().trim().min(1).max(200),
        reason: z.enum(COMMUNITY_REPORT_REASONS),
        details: z.string().trim().max(2000).default(""),
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        reason: formData.get("reason"),
        details: formData.get("details") ?? "",
      });
    const { member, repository } = await requireCommunityActor(
      "report",
      returnTo,
    );
    const exists =
      parsed.targetType === "member"
        ? Boolean(await repository.getPublicMemberProfileById(parsed.targetId))
        : parsed.targetType === "post"
          ? Boolean(await repository.getPost(parsed.targetId))
          : parsed.targetType === "comment"
            ? await repository.commentExists(parsed.targetId)
            : await repository.mediaExists(parsed.targetId);
    if (!exists) throw new Error("Report target unavailable.");
    await repository.createReport({ reporterMemberId: member.id, ...parsed });
    return { success: true, message: "Report submitted for private review." };
  } catch (error) {
    return communityActionFailure(error);
  }
}
