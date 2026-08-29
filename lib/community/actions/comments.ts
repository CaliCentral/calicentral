"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertVisibleCommunityTarget,
  communityActionFailure,
  communityReturnPath,
  revalidationPath,
  requireCommunityActor,
} from "@/lib/community/actions/shared";
import { communityCommentTargetTypeSchema } from "@/lib/community/validation";
import type { ActionResult } from "@/lib/operations/action-result";

export async function createCommunityCommentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        targetType: communityCommentTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        parentCommentId: z
          .union([
            z.literal("").transform(() => undefined),
            z.string().trim().min(1).max(200),
          ])
          .optional(),
        body: z.string().trim().min(1).max(2000),
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        parentCommentId: formData.get("parentCommentId") ?? "",
        body: formData.get("body"),
      });
    const { member, repository } = await requireCommunityActor(
      "comment",
      returnTo,
    );
    const targetId = await assertVisibleCommunityTarget(
      repository,
      parsed.targetType,
      parsed.targetId,
      member.id,
    );
    await repository.createComment({
      authorMemberId: member.id,
      ...parsed,
      targetId,
    });
    revalidatePath(revalidationPath(returnTo));
    revalidatePath("/community");
    return {
      success: true,
      message: parsed.parentCommentId ? "Reply added." : "Comment added.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function updateCommunityCommentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        commentId: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(2000),
      })
      .parse({
        commentId: formData.get("commentId"),
        body: formData.get("body"),
      });
    const { member, repository } = await requireCommunityActor(
      "comment",
      returnTo,
    );
    const updated = await repository.updateComment({
      actorMemberId: member.id,
      commentId: parsed.commentId,
      body: parsed.body,
      moderator: false,
    });
    if (!updated) throw new Error("Comment ownership check failed.");
    revalidatePath(revalidationPath(returnTo));
    return { success: true, message: "Comment updated." };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function deleteCommunityCommentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const commentId = z
      .string()
      .trim()
      .min(1)
      .max(200)
      .parse(formData.get("commentId"));
    const { member, repository } = await requireCommunityActor(
      "comment",
      returnTo,
    );
    if (!(await repository.deleteOwnComment(member.id, commentId))) {
      throw new Error("Comment ownership check failed.");
    }
    revalidatePath(revalidationPath(returnTo));
    return { success: true, message: "Comment deleted." };
  } catch (error) {
    return communityActionFailure(error);
  }
}
