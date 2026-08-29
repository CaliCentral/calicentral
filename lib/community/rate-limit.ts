export type CommunityRateLimitOperation =
  | "post"
  | "comment"
  | "like"
  | "save"
  | "repost"
  | "follow"
  | "profile"
  | "collection"
  | "notification"
  | "report"
  | "claim"
  | "upload"
  | "training"
  | "record"
  | "skill";

export interface CommunityRateLimiter {
  limit(input: {
    readonly key: string;
    readonly operation?: CommunityRateLimitOperation;
  }): Promise<{ readonly success: boolean }>;
}

export type CommunityRateLimitBindingSet = {
  readonly strict?: CommunityRateLimiter;
  readonly write?: CommunityRateLimiter;
  readonly interaction?: CommunityRateLimiter;
  readonly upload?: CommunityRateLimiter;
  readonly legacy?: CommunityRateLimiter;
};

const STRICT_OPERATIONS = new Set<CommunityRateLimitOperation>([
  "claim", "report", "profile",
]);
const INTERACTION_OPERATIONS = new Set<CommunityRateLimitOperation>([
  "like", "save", "notification",
]);

export function createCommunityRateLimiter(
  bindings: CommunityRateLimitBindingSet,
): CommunityRateLimiter | undefined {
  if (!Object.values(bindings).some(Boolean)) return undefined;
  return {
    async limit(input) {
      const operation = input.operation;
      const binding = operation === "upload"
        ? bindings.upload
        : operation && STRICT_OPERATIONS.has(operation)
          ? bindings.strict
          : operation && INTERACTION_OPERATIONS.has(operation)
            ? bindings.interaction
            : bindings.write;
      const selected = binding ?? bindings.legacy;
      return selected
        ? selected.limit({ key: input.key })
        : { success: false };
    },
  };
}

export class CommunityRateLimitError extends Error {
  constructor() {
    super("Please wait before trying that community action again.");
    this.name = "CommunityRateLimitError";
  }
}

/**
 * Production hook for a distributed Cloudflare rate-limit binding. When no
 * binding is configured this boundary is intentionally inactive; it never
 * pretends an in-memory Worker counter is durable or globally authoritative.
 */
export async function enforceCommunityRateLimit(input: {
  readonly limiter?: CommunityRateLimiter;
  readonly operation: CommunityRateLimitOperation;
  readonly memberId: string;
}): Promise<void> {
  if (!input.limiter) return;

  const result = await input.limiter.limit({
    key: `${input.operation}:${input.memberId}`,
    operation: input.operation,
  });
  if (!result.success) throw new CommunityRateLimitError();
}
