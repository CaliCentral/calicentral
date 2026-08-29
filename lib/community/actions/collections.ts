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
import { communitySaveTargetTypeSchema } from "@/lib/community/validation";
import type { ActionResult } from "@/lib/operations/action-result";

function refreshCollections(returnTo: string) {
  revalidatePath("/account/saved");
  revalidatePath("/account/collections");
  revalidatePath(revalidationPath(returnTo));
}

export async function createCommunityCollectionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData, "/account/collections");
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).default(""),
        targetType: z
          .union([
            z.literal("").transform(() => undefined),
            communitySaveTargetTypeSchema,
          ])
          .optional(),
        targetId: z
          .union([
            z.literal("").transform(() => undefined),
            z.string().trim().min(1).max(200),
          ])
          .optional(),
      })
      .parse({
        name: formData.get("name"),
        description: formData.get("description") ?? "",
        targetType: formData.get("targetType") ?? "",
        targetId: formData.get("targetId") ?? "",
      });
    const { member, repository } = await requireCommunityActor(
      "collection",
      returnTo,
    );
    let canonicalTargetId = parsed.targetId;
    if (parsed.targetType && parsed.targetId) {
      canonicalTargetId = await assertVisibleCommunityTarget(
        repository,
        parsed.targetType,
        parsed.targetId,
        member.id,
      );
    }
    const id = await repository.createCollection(
      member.id,
      parsed.name,
      parsed.description,
    );
    if (parsed.targetType && canonicalTargetId) {
      await repository.setSaved(
        member.id,
        parsed.targetType,
        canonicalTargetId,
        true,
      );
      await repository.addCollectionItem({
        actorMemberId: member.id,
        collectionId: id,
        targetType: parsed.targetType,
        targetId: canonicalTargetId,
      });
    }
    refreshCollections(returnTo);
    return {
      success: true,
      message: "Collection created.",
      recordId: id,
      redirectTo: parsed.targetId ? undefined : `/account/collections/${id}`,
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function updateCommunityCollectionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData, "/account/collections");
  try {
    const parsed = z
      .object({
        collectionId: z.string().trim().min(1).max(200),
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).default(""),
      })
      .parse({
        collectionId: formData.get("collectionId"),
        name: formData.get("name"),
        description: formData.get("description") ?? "",
      });
    const { member, repository } = await requireCommunityActor(
      "collection",
      returnTo,
    );
    if (
      !(await repository.updateCollection({
        actorMemberId: member.id,
        ...parsed,
      }))
    ) {
      throw new Error("Collection ownership check failed.");
    }
    refreshCollections(returnTo);
    return { success: true, message: "Collection updated." };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function deleteCommunityCollectionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData, "/account/collections");
  try {
    const collectionId = z
      .string()
      .trim()
      .min(1)
      .max(200)
      .parse(formData.get("collectionId"));
    const { member, repository } = await requireCommunityActor(
      "collection",
      returnTo,
    );
    if (!(await repository.deleteCollection(member.id, collectionId))) {
      throw new Error("Collection ownership check failed.");
    }
    refreshCollections(returnTo);
    return {
      success: true,
      message: "Collection deleted.",
      redirectTo: "/account/collections",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function toggleCommunityCollectionItemAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const returnTo = communityReturnPath(formData, "/account/saved");
  try {
    const parsed = z
      .object({
        collectionId: z.string().trim().min(1).max(200),
        targetType: communitySaveTargetTypeSchema,
        targetId: z.string().trim().min(1).max(200),
        active: z
          .enum(["true", "false"])
          .transform((value) => value === "true"),
      })
      .parse({
        collectionId: formData.get("collectionId"),
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        active: formData.get("active"),
      });
    const { member, repository } = await requireCommunityActor(
      "collection",
      returnTo,
    );
    if (!(await repository.getCollection(member.id, parsed.collectionId))) {
      throw new Error("Collection ownership check failed.");
    }
    const targetId = parsed.active
      ? await assertVisibleCommunityTarget(
          repository,
          parsed.targetType,
          parsed.targetId,
          member.id,
        )
      : parsed.targetId;
    if (parsed.active) {
      await repository.setSaved(member.id, parsed.targetType, targetId, true);
      await repository.addCollectionItem({
        actorMemberId: member.id,
        collectionId: parsed.collectionId,
        targetType: parsed.targetType,
        targetId,
      });
    } else {
      await repository.removeCollectionItem({
        actorMemberId: member.id,
        collectionId: parsed.collectionId,
        targetType: parsed.targetType,
        targetId,
      });
    }
    refreshCollections(returnTo);
    return {
      success: true,
      message: parsed.active
        ? "Added to collection."
        : "Removed from collection.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}
