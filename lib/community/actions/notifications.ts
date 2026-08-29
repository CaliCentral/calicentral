"use server";

import { revalidatePath } from "next/cache";

import { requireCommunityActor } from "@/lib/community/actions/shared";
import { communityIdSchema } from "@/lib/community/validation";

export async function markCommunityNotificationsReadAction(
  formData: FormData,
): Promise<void> {
  const value = formData.get("notificationId");
  const notificationId =
    typeof value === "string" && value
      ? communityIdSchema.parse(value)
      : undefined;
  const { member, repository } = await requireCommunityActor(
    "notification",
    "/account/notifications",
  );
  await repository.markNotificationsRead(member.id, notificationId);
  revalidatePath("/account/notifications");
}

export async function updateCommunityNotificationPreferencesAction(
  formData: FormData,
): Promise<void> {
  const { member, repository } = await requireCommunityActor(
    "notification",
    "/account/notifications",
  );
  await repository.setNotificationPreferences(member.id, {
    social: formData.get("social") === "on",
    competitions: formData.get("competitions") === "on",
    claimsAndSubmissions: formData.get("claimsAndSubmissions") === "on",
    email: false,
  });
  revalidatePath("/account/notifications");
}
