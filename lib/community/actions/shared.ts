import "server-only";

import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { safeAuthReturnPath } from "@/lib/auth/redirects";
import {
  CommunityAuthorizationError,
  CommunityUnavailableError,
} from "@/lib/community/repository";
import {
  CommunityRateLimitError,
  enforceCommunityRateLimit,
  type CommunityRateLimitOperation,
} from "@/lib/community/rate-limit";
import { getCommunityRuntime } from "@/lib/community/runtime";
import { resolveCommunityTarget } from "@/lib/community/targets";
import type {
  CommunityResolvableTargetType,
  CommunityFollowTargetType,
  CommunitySaveTargetType,
} from "@/lib/community/types";
import type { ActionResult } from "@/lib/operations/action-result";
import { safeLog } from "@/lib/observability/logger";

export class CommunityActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunityActionError";
  }
}

export function communityReturnPath(
  formData: FormData,
  fallback = "/community",
): string {
  const value = formData.get("returnTo");
  return safeAuthReturnPath(
    typeof value === "string" ? value : undefined,
    fallback,
  );
}

export async function requireCommunityActor(
  operation: CommunityRateLimitOperation,
  returnTo: string,
) {
  const user = await requireAuthenticatedUser(returnTo);
  if (["suspended", "archived"].includes(user.accessStatus)) {
    throw new CommunityActionError(
      "This account cannot currently make community changes.",
    );
  }

  const runtime = await getCommunityRuntime();
  if (!runtime.repository.availability.writable) {
    throw new CommunityUnavailableError();
  }
  const member = await runtime.repository.getMemberProfileByPrincipalId(
    user.id,
  );
  if (!member) {
    throw new CommunityActionError(
      "Create your public member profile before using community actions.",
    );
  }
  if (member.status !== "active" || !member.profilePublic) {
    throw new CommunityActionError(
      "Publish an active public member profile before using community actions.",
    );
  }
  await enforceCommunityRateLimit({
    limiter: runtime.rateLimiter,
    operation,
    memberId: member.id,
  });
  return { user, member, repository: runtime.repository };
}

export function communityActionFailure(error: unknown): ActionResult {
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    let formError: string | undefined;
    for (const issue of error.issues) {
      const field = issue.path.join(".");
      if (!field) {
        formError ??= issue.message;
      } else {
        fieldErrors[field] ??= [];
        fieldErrors[field].push(issue.message);
      }
    }
    return {
      success: false,
      message: "Review the community form and try again.",
      fieldErrors,
      formError,
    };
  }
  if (
    error instanceof CommunityActionError ||
    error instanceof CommunityAuthorizationError ||
    error instanceof CommunityRateLimitError
  ) {
    return { success: false, message: error.message, formError: error.message };
  }
  if (error instanceof CommunityUnavailableError) {
    const message = "Community persistence is temporarily unavailable.";
    return { success: false, message, formError: message };
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("UNIQUE constraint failed")
  ) {
    const message = "That community record already exists or is unavailable.";
    return { success: false, message, formError: message };
  }

  safeLog({
    severity: "error",
    event: "community.mutation_failed",
    routeCategory: "community",
    errorCategory: "community_error",
  });
  const message = "The community change could not be saved. Please try again.";
  return { success: false, message, formError: message };
}

export const actionBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export async function assertVisibleCommunityTarget(
  repository: Awaited<ReturnType<typeof getCommunityRuntime>>["repository"],
  targetType: CommunitySaveTargetType | CommunityFollowTargetType,
  targetId: string,
  viewerMemberId?: string,
): Promise<string> {
  if (targetType === "post") {
    if (!(await repository.getPost(targetId, viewerMemberId))) {
      throw new CommunityActionError("That community post is unavailable.");
    }
    return targetId;
  }

  const resolved = await resolveCommunityTarget(
    targetType as CommunityResolvableTargetType,
    targetId,
  );
  if (!resolved) {
    throw new CommunityActionError("That Cali Central record is unavailable.");
  }

  return resolved.id;
}

export function revalidationPath(returnTo: string): string {
  return returnTo.split(/[?#]/, 1)[0] || "/community";
}
