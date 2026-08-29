"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  communityActionFailure,
  communityReturnPath,
  revalidationPath,
  requireCommunityActor,
  assertVisibleCommunityTarget,
} from "@/lib/community/actions/shared";
import {
  communityCanonicalTargetTypeSchema,
  communityMediaKindSchema,
  communityPostTypeSchema,
  optionalCommunityExternalUrlSchema,
} from "@/lib/community/validation";
import type { ActionResult } from "@/lib/operations/action-result";

const optionalCanonicalType = z.union([
  z.literal("").transform(() => undefined),
  communityCanonicalTargetTypeSchema,
]);

export async function createCommunityPostAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const input = z
      .object({
        body: z.string().trim().max(4000),
        postType: communityPostTypeSchema,
        visibility: z.enum(["public", "followers", "private"]),
        externalMediaUrl: optionalCommunityExternalUrlSchema,
        mediaAssetId: z.union([z.literal("").transform(() => undefined), z.string().trim().min(1).max(200)]).optional(),
        externalMediaCredit: z.string().trim().max(120).optional(),
        externalMediaKind: communityMediaKindSchema,
        externalMediaAltText: z.string().trim().max(300).optional(),
        canonicalTargetType: optionalCanonicalType,
        canonicalTargetId: z
          .union([
            z.literal("").transform(() => undefined),
            z.string().trim().min(1).max(200),
          ])
          .optional(),
        rightsConfirmed: z.boolean(),
      })
      .superRefine((value, context) => {
        if (
          Boolean(value.canonicalTargetType) !==
          Boolean(value.canonicalTargetId)
        ) {
          context.addIssue({
            code: "custom",
            message: "Choose both a Cali Central record type and stable ID.",
          });
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
      .parse({
        body: formData.get("body") ?? "",
        postType: formData.get("postType") ?? "general",
        visibility: formData.get("visibility") ?? "public",
        externalMediaUrl: formData.get("externalMediaUrl") ?? "",
        mediaAssetId: formData.get("mediaAssetId") ?? "",
        externalMediaCredit:
          (formData.get("externalMediaCredit") as string | null) || undefined,
        externalMediaKind:
          formData.get("externalMediaKind") ?? "external-embed",
        externalMediaAltText:
          (formData.get("externalMediaAltText") as string | null) || undefined,
        canonicalTargetType: formData.get("canonicalTargetType") ?? "",
        canonicalTargetId: formData.get("canonicalTargetId") ?? "",
        rightsConfirmed: formData.get("rightsConfirmed") === "on",
      });
    const { member, repository } = await requireCommunityActor(
      "post",
      returnTo,
    );
    const canonicalTargetId =
      input.canonicalTargetType && input.canonicalTargetId
        ? await assertVisibleCommunityTarget(
            repository,
            input.canonicalTargetType,
            input.canonicalTargetId,
            member.id,
          )
        : input.canonicalTargetId;
    const postId = await repository.createPost({
      authorMemberId: member.id,
      ...input,
      canonicalTargetId,
    });
    revalidatePath("/community");
    revalidatePath(`/members/${member.handle}`);
    return {
      success: true,
      message: "Post published.",
      recordId: postId,
      redirectTo: `/community/posts/${postId}`,
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function updateCommunityPostAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const parsed = z
      .object({
        postId: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(4000),
      })
      .parse({ postId: formData.get("postId"), body: formData.get("body") });
    const { member, repository } = await requireCommunityActor(
      "post",
      returnTo,
    );
    if (
      !(await repository.updatePost({ actorMemberId: member.id, ...parsed }))
    ) {
      throw new Error("Post ownership check failed.");
    }
    revalidatePath(revalidationPath(returnTo));
    revalidatePath("/community");
    revalidatePath(`/members/${member.handle}`);
    return { success: true, message: "Post updated." };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function deleteCommunityPostAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData);
  try {
    const postId = z
      .string()
      .trim()
      .min(1)
      .max(200)
      .parse(formData.get("postId"));
    const { member, repository } = await requireCommunityActor(
      "post",
      returnTo,
    );
    if (!(await repository.deleteOwnPost(member.id, postId))) {
      throw new Error("Post ownership check failed.");
    }
    revalidatePath("/community");
    revalidatePath(`/members/${member.handle}`);
    return {
      success: true,
      message: "Post deleted.",
      redirectTo: "/community",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}
