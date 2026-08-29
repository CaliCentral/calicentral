import "server-only";

import { getCurrentUser } from "@/lib/auth";
import type { PortalUser } from "@/lib/auth/types";
import type { OwnMemberProfile } from "@/lib/community/types";
import { getCommunityRepository } from "@/lib/community/runtime";

export type CommunityViewer = {
  readonly user: PortalUser | null;
  readonly member: OwnMemberProfile | null;
  readonly canMutate: boolean;
};

export async function getCommunityViewer(): Promise<CommunityViewer> {
  const user = await getCurrentUser();
  if (!user) return { user: null, member: null, canMutate: false };

  const repository = await getCommunityRepository();
  const member = repository.availability.writable
    ? await repository.getMemberProfileByPrincipalId(user.id)
    : null;
  const accountAvailable = !["suspended", "archived"].includes(
    user.accessStatus,
  );
  const memberAvailable =
    member?.status === "active" && member.profilePublic;

  return {
    user,
    member,
    canMutate: accountAvailable && memberAvailable,
  };
}
