"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/operations/action-result";
import { requireAuthenticatedUser, requireEditor } from "@/lib/auth";
import { CommunityActionError, communityActionFailure, requireCommunityActor } from "@/lib/community/actions/shared";
import {
  COMMUNITY_MEDIA_MAX_FILE_BYTES,
  COMMUNITY_MEDIA_MAX_FILE_LABEL,
  type CommunityMediaPurpose,
} from "@/lib/community/media";
import { getCommunityMediaRepository } from "@/lib/community/media-runtime";
import { getCommunityRepository } from "@/lib/community/runtime";

const purposeSchema = z.enum(["profile-avatar", "profile-cover", "post-image", "post-video", "athlete-avatar", "athlete-cover", "skill-proof"]);

export async function uploadCommunityMediaAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { member } = await requireCommunityActor("upload", "/account/media");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new CommunityActionError("Choose a non-empty image or video file.");
    if (file.size > COMMUNITY_MEDIA_MAX_FILE_BYTES) {
      throw new CommunityActionError(`The selected file is larger than the current ${COMMUNITY_MEDIA_MAX_FILE_LABEL} upload limit.`);
    }
    const purpose = purposeSchema.parse(formData.get("purpose")) as CommunityMediaPurpose;
    const repository = await getCommunityMediaRepository();
    if (!repository.available) throw new CommunityActionError("Reviewed community media storage is not configured.");
    const id = await repository.upload({ memberId: member.id, purpose, filename: file.name, contentType: file.type, bytes: await file.arrayBuffer() });
    revalidatePath("/account/media");
    revalidatePath("/admin/community/media");
    return { success: true, message: "Upload received and held for moderation.", recordId: id };
  } catch (error) { return communityActionFailure(error); }
}

export async function moderateCommunityMediaAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const reviewer = await requireEditor("/admin/community/media");
    const repository = await getCommunityMediaRepository();
    await repository.moderate({
      assetId: z.string().trim().min(1).max(200).parse(formData.get("assetId")),
      reviewerPrincipalId: reviewer.id,
      decision: z.enum(["approved", "rejected"]).parse(formData.get("decision")),
      note: z.string().trim().max(500).parse(formData.get("note") ?? ""),
    });
    revalidatePath("/admin/community/media");
    revalidatePath("/account/media");
    return { success: true, message: "Media review decision recorded in the immutable audit stream." };
  } catch (error) { return communityActionFailure(error); }
}

export async function removeOwnedCommunityMediaAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser("/account/media");
    const community = await getCommunityRepository();
    const member = community.availability.writable
      ? await community.getMemberProfileByPrincipalId(user.id)
      : null;
    if (!member) throw new CommunityActionError("A current member profile is required to remove this media.");
    const repository = await getCommunityMediaRepository();
    if (!repository.available) throw new CommunityActionError("Reviewed community media storage is not configured.");
    await repository.removeOwned({
      assetId: z.string().trim().min(1).max(200).parse(formData.get("assetId")),
      ownerMemberId: member.id,
      actorPrincipalId: user.id,
    });
    revalidatePath("/account/media");
    revalidatePath("/admin/community/media");
    revalidatePath("/community");
    return { success: true, message: "Media removed from application delivery. Its audit record was preserved." };
  } catch (error) { return communityActionFailure(error); }
}

export async function removeCommunityMediaAsModeratorAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const reviewer = await requireEditor("/admin/community/media");
    const repository = await getCommunityMediaRepository();
    if (!repository.available) throw new CommunityActionError("Reviewed community media storage is not configured.");
    await repository.removeAsModerator({
      assetId: z.string().trim().min(1).max(200).parse(formData.get("assetId")),
      actorPrincipalId: reviewer.id,
    });
    revalidatePath("/admin/community/media");
    revalidatePath("/account/media");
    revalidatePath("/community");
    return { success: true, message: "Media removed from application delivery. Its audit record was preserved." };
  } catch (error) { return communityActionFailure(error); }
}
