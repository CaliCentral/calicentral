"use server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/operations/action-result";
import { getAthletePresentationRepository } from "@/lib/community/athlete-presentation-runtime";
import { CommunityActionError, communityActionFailure, requireCommunityActor } from "@/lib/community/actions/shared";

function text(formData: FormData, key: string): string { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; }
export async function updateClaimedAthletePresentationAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { member } = await requireCommunityActor("profile", "/account/athlete-profile");
    if (!member.linkedAthleteId) throw new CommunityActionError("An approved athlete claim is required.");
    await (await getAthletePresentationRepository()).upsert({
      memberId: member.id, canonicalAthleteId: member.linkedAthleteId,
      preferredDisplayName: text(formData, "preferredDisplayName") || undefined,
      biography: text(formData, "biography"), website: text(formData, "website") || undefined,
      trainingLocation: text(formData, "trainingLocation"),
      socialLinks: text(formData, "socialLinks").split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      specialties: text(formData, "specialties").split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean),
      profileMediaId: text(formData, "profileMediaId") || undefined,
      coverMediaId: text(formData, "coverMediaId") || undefined,
    });
    revalidatePath("/account/athlete-profile");
    return { success: true, message: "Athlete presentation updated. Official facts, rankings, and results were not changed." };
  } catch (error) { return communityActionFailure(error); }
}
