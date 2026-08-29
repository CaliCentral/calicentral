import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";

import type { D1DatabaseLike } from "@/lib/community/repository";
import { TrainingRepository } from "@/lib/training/repository";

function isD1DatabaseLike(value: unknown): value is D1DatabaseLike {
  return Boolean(
    value && typeof value === "object" &&
    "prepare" in value && typeof value.prepare === "function" &&
    "batch" in value && typeof value.batch === "function",
  );
}

export async function getTrainingRepository(): Promise<TrainingRepository> {
  await connection();
  try {
    const { env } = await getCloudflareContext({ async: true });
    const database = (env as unknown as Record<string, unknown>).COMMUNITY_DB;
    return new TrainingRepository(isD1DatabaseLike(database) ? database : undefined);
  } catch {
    return new TrainingRepository(undefined);
  }
}
