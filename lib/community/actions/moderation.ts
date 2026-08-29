"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireEditor } from "@/lib/auth";
import { communityActionFailure, CommunityActionError } from "@/lib/community/actions/shared";
import { getCommunityRepository } from "@/lib/community/runtime";
import type { ActionResult } from "@/lib/operations/action-result";

export async function moderateCommunityContentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = z
      .object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.string().trim().min(1).max(200),
        hidden: z.enum(["true", "false"]).transform((value) => value === "true"),
      })
      .parse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        hidden: formData.get("hidden"),
      });
    const user = await requireEditor("/admin/community");
    const repository = await getCommunityRepository();
    if (!repository.availability.writable) {
      throw new CommunityActionError("Community persistence is unavailable.");
    }
    if (!(await repository.moderateContent({ actorPrincipalId: user.id, ...parsed }))) {
      throw new CommunityActionError("The moderation target was not found.");
    }
    revalidatePath("/admin/community");
    revalidatePath("/community");
    if (parsed.targetType === "post") {
      revalidatePath(`/community/posts/${parsed.targetId}`);
    }
    return {
      success: true,
      message: parsed.hidden ? "Community content hidden." : "Community content restored.",
    };
  } catch (error) {
    return communityActionFailure(error);
  }
}

export async function updateCommunityReportAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = z
      .object({
        reportId: z.string().trim().min(1).max(200),
        status: z.enum(["resolved", "dismissed"]),
      })
      .parse({ reportId: formData.get("reportId"), status: formData.get("status") });
    const user = await requireEditor("/admin/community");
    const repository = await getCommunityRepository();
    if (!repository.availability.writable) {
      throw new CommunityActionError("Community persistence is unavailable.");
    }
    if (!(await repository.updateReportStatus({ actorPrincipalId: user.id, ...parsed }))) {
      throw new CommunityActionError("The report is no longer pending.");
    }
    revalidatePath("/admin/community");
    return { success: true, message: `Community report ${parsed.status}.` };
  } catch (error) {
    return communityActionFailure(error);
  }
}
