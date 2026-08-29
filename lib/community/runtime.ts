import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";

import {
  createCommunityRateLimiter,
  type CommunityRateLimiter,
} from "@/lib/community/rate-limit";
import {
  CommunityRepository,
  type D1DatabaseLike,
} from "@/lib/community/repository";
import { featureConfig } from "@/lib/features/config";
import { createConfiguredUpstashRateLimiter } from "@/lib/community/upstash-rate-limit";

type CommunityRuntime = {
  readonly repository: CommunityRepository;
  readonly rateLimiter?: CommunityRateLimiter;
};

function isD1DatabaseLike(value: unknown): value is D1DatabaseLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    typeof value.prepare === "function" &&
    "batch" in value &&
    typeof value.batch === "function"
  );
}

function isRateLimiter(value: unknown): value is CommunityRateLimiter {
  return (
    typeof value === "object" &&
    value !== null &&
    "limit" in value &&
    typeof value.limit === "function"
  );
}

async function loadCommunityRuntime(
  featureEnabled: boolean,
): Promise<CommunityRuntime> {
  // Community state and viewer personalization are request-bound whenever the
  // feature is active. This prevents a configured feed from being frozen into
  // a static build artifact.
  await connection();
  const standardRateLimiter = createConfiguredUpstashRateLimiter();

  try {
    const { env } = await getCloudflareContext({ async: true });
    const runtimeEnv = env as unknown as Record<string, unknown>;
    const database = runtimeEnv.COMMUNITY_DB;
    const limiter = createCommunityRateLimiter({
      strict: isRateLimiter(runtimeEnv.COMMUNITY_RATE_LIMIT_STRICT)
        ? runtimeEnv.COMMUNITY_RATE_LIMIT_STRICT
        : undefined,
      write: isRateLimiter(runtimeEnv.COMMUNITY_RATE_LIMIT_WRITE)
        ? runtimeEnv.COMMUNITY_RATE_LIMIT_WRITE
        : undefined,
      interaction: isRateLimiter(runtimeEnv.COMMUNITY_RATE_LIMIT_INTERACTION)
        ? runtimeEnv.COMMUNITY_RATE_LIMIT_INTERACTION
        : undefined,
      upload: isRateLimiter(runtimeEnv.COMMUNITY_RATE_LIMIT_UPLOAD)
        ? runtimeEnv.COMMUNITY_RATE_LIMIT_UPLOAD
        : undefined,
      legacy: isRateLimiter(runtimeEnv.COMMUNITY_RATE_LIMITER)
        ? runtimeEnv.COMMUNITY_RATE_LIMITER
        : undefined,
    });

    return {
      repository: new CommunityRepository(
        isD1DatabaseLike(database) ? database : undefined,
        featureEnabled,
      ),
      rateLimiter: standardRateLimiter ?? limiter,
    };
  } catch {
    return {
      repository: new CommunityRepository(undefined, featureEnabled),
      rateLimiter: standardRateLimiter,
    };
  }
}

export async function getCommunityRuntime(): Promise<CommunityRuntime> {
  if (!featureConfig.community) {
    return { repository: new CommunityRepository(undefined, false) };
  }

  return loadCommunityRuntime(true);
}

export async function getCommunityRepository(): Promise<CommunityRepository> {
  return (await getCommunityRuntime()).repository;
}

/**
 * Private application data can support independently flagged operational
 * workflows even when the public Community product is disabled.
 */
export async function getCommunityApplicationRepository(): Promise<CommunityRepository> {
  return (await loadCommunityRuntime(true)).repository;
}
