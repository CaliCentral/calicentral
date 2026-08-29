import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";

import type { CommunityMediaStore } from "@/lib/community/media";
import { CommunityMediaRepository } from "@/lib/community/media-repository";
import type { D1DatabaseLike } from "@/lib/community/repository";
import { featureConfig } from "@/lib/features/config";
import { createConfiguredR2S3MediaStore } from "@/lib/media/r2-s3-store";

function isDatabase(value: unknown): value is D1DatabaseLike { return Boolean(value && typeof value === "object" && "prepare" in value && typeof value.prepare === "function" && "batch" in value && typeof value.batch === "function"); }
function isStore(value: unknown): value is CommunityMediaStore { return Boolean(value && typeof value === "object" && "put" in value && typeof value.put === "function" && "get" in value && typeof value.get === "function"); }

export async function getCommunityMediaRepository(): Promise<CommunityMediaRepository> {
  await connection();
  const standardR2 = createConfiguredR2S3MediaStore();
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bindings = env as unknown as Record<string, unknown>;
    return new CommunityMediaRepository(
      isDatabase(bindings.COMMUNITY_DB) ? bindings.COMMUNITY_DB : undefined,
      standardR2 ?? (isStore(bindings.COMMUNITY_MEDIA) ? bindings.COMMUNITY_MEDIA : undefined),
      featureConfig.community && featureConfig.communityMediaUploads,
    );
  } catch { return new CommunityMediaRepository(undefined, standardR2, false); }
}
