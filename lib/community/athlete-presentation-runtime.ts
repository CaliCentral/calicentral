import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";
import { AthletePresentationRepository } from "@/lib/community/athlete-presentation";
import type { D1DatabaseLike } from "@/lib/community/repository";
function isDatabase(value: unknown): value is D1DatabaseLike { return Boolean(value && typeof value === "object" && "prepare" in value && typeof value.prepare === "function" && "batch" in value && typeof value.batch === "function"); }
export async function getAthletePresentationRepository(): Promise<AthletePresentationRepository> { await connection(); try { const { env } = await getCloudflareContext({ async: true }); const value = (env as unknown as Record<string, unknown>).COMMUNITY_DB; return new AthletePresentationRepository(isDatabase(value) ? value : undefined); } catch { return new AthletePresentationRepository(); } }
