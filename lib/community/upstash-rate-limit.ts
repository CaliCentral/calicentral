import "server-only";

import { Redis } from "@upstash/redis";

import {
  createCommunityRateLimiter,
  type CommunityRateLimiter,
} from "@/lib/community/rate-limit";
import { siteStage } from "@/lib/site/config";

const LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
return current
`;

type Policy = { readonly name: string; readonly limit: number; readonly windowSeconds: number };

// Namespaced by site stage so preview and production traffic can never share
// a counter even if both environments were ever pointed at the same Upstash
// database (they aren't today, but the key format shouldn't rely on that
// staying true). Exported so the namespacing itself is unit-testable without
// a live Redis connection.
export function buildRateLimitKey(policyName: string, memberKey: string, stage: string | undefined): string {
  return `calicentral:rate:${stage ?? "unknown"}:${policyName}:${memberKey}`;
}

function rateLimitKey(policyName: string, memberKey: string): string {
  return buildRateLimitKey(policyName, memberKey, siteStage);
}

class UpstashPolicyLimiter implements CommunityRateLimiter {
  constructor(private readonly redis: Redis, private readonly policy: Policy) {}

  async limit(input: { readonly key: string }): Promise<{ readonly success: boolean }> {
    try {
      const count = await this.redis.eval<[string], number>(
        LIMIT_SCRIPT,
        [rateLimitKey(this.policy.name, input.key)],
        [String(this.policy.windowSeconds)],
      );
      return { success: count <= this.policy.limit };
    } catch {
      // A configured production limiter fails closed. An absent limiter remains
      // inactive through the existing optional provider boundary.
      return { success: false };
    }
  }
}

export function createConfiguredUpstashRateLimiter(): CommunityRateLimiter | undefined {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return undefined;

  const redis = new Redis({ url, token });
  const policy = (name: string, limit: number) => new UpstashPolicyLimiter(redis, { name, limit, windowSeconds: 60 });
  return createCommunityRateLimiter({
    strict: policy("strict", 5),
    write: policy("write", 30),
    interaction: policy("interaction", 60),
    upload: policy("upload", 5),
  });
}
