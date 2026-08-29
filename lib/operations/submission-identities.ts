import "server-only";

import { getCommunityApplicationRepository } from "@/lib/community/runtime";

/**
 * Returns only active organization grants carrying the product-submission
 * capability. D1 is the private authorization boundary; callers fail closed.
 */
export async function getAuthorizedProductOrganizationIds(
  principalId: string,
): Promise<readonly string[]> {
  try {
    const repository = await getCommunityApplicationRepository();
    if (!repository.availability.writable) return [];
    const member = await repository.getMemberProfileByPrincipalId(principalId);
    if (!member || member.status !== "active") return [];
    const memberships = await repository.listOrganizationMemberships(member.id);
    return memberships
      .filter((membership) =>
        membership.capabilities.includes("submit-products"),
      )
      .map((membership) => membership.organizationId);
  } catch {
    return [];
  }
}

export async function getAuthorizedMediaOrganizationIds(
  principalId: string,
): Promise<readonly string[]> {
  try {
    const repository = await getCommunityApplicationRepository();
    if (!repository.availability.writable) return [];
    const member = await repository.getMemberProfileByPrincipalId(principalId);
    if (!member || member.status !== "active") return [];
    const memberships = await repository.listOrganizationMemberships(member.id);
    return memberships
      .filter((membership) => membership.capabilities.includes("submit-media"))
      .map((membership) => membership.organizationId);
  } catch {
    return [];
  }
}
