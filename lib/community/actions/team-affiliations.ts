"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionBooleanSchema, communityActionFailure, requireCommunityActor } from "@/lib/community/actions/shared";
import type { ActionResult } from "@/lib/operations/action-result";
export async function updateTeamAffiliationVisibilityAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { member, repository } = await requireCommunityActor("profile", "/account/teams");
    await repository.setTeamAffiliationVisibility(member.id, z.string().trim().min(1).max(200).parse(formData.get("membershipId")), actionBooleanSchema.parse(formData.get("publicVisible")));
    revalidatePath("/account/teams"); revalidatePath(`/members/${member.handle}`);
    return { success: true, message: "Team affiliation visibility updated." };
  } catch (error) { return communityActionFailure(error); }
}
