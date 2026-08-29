import { z } from "zod";

import type { D1DatabaseLike } from "@/lib/community/repository";
import { CommunityAuthorizationError, CommunityUnavailableError } from "@/lib/community/repository";
import { communityIdSchema } from "@/lib/community/validation";

const updateSchema = z.object({
  eventKey: z.string().trim().min(1).max(200),
  eventType: z.enum(["competition-date-status", "competition-registration", "athlete-ranking", "athlete-result", "submission-status", "team-event"]),
  targetType: z.enum(["competition", "athlete", "submission", "team"]),
  targetId: communityIdSchema,
  sourceStatus: z.enum(["approved-public", "internal-review", "sample", "blocked"]),
  summary: z.string().trim().min(1).max(240),
  occurredAt: z.iso.datetime(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
}).strict();

export type CanonicalUpdateInput = z.input<typeof updateSchema>;

function notificationType(type: CanonicalUpdateInput["targetType"]): "competition-update" | "athlete-update" | "team-update" | null {
  return type === "competition" ? "competition-update" : type === "athlete" ? "athlete-update" : type === "team" ? "team-update" : null;
}

/**
 * Idempotent post-write hook. Importers may call this only after the canonical
 * record has successfully become approved public truth. The source-status gate
 * prevents sample, internal, or blocked records from generating notifications.
 */
export class CanonicalUpdateProducer {
  constructor(private readonly db?: D1DatabaseLike) {}
  async produce(input: CanonicalUpdateInput): Promise<number> {
    const parsed = updateSchema.parse(input);
    if (!this.db) throw new CommunityUnavailableError();
    if (parsed.sourceStatus !== "approved-public") throw new CommunityAuthorizationError("Only approved public canonical updates can notify followers.");
    const kind = notificationType(parsed.targetType);
    if (!kind) throw new CommunityAuthorizationError("Submission notifications require an explicit owner workflow, not the follower producer.");
    const timestamp = new Date().toISOString();
    const eventId = `canonical-update:${parsed.eventKey}`;
    const results = await this.db.batch([
      this.db.prepare(`INSERT OR IGNORE INTO canonical_update_events (id, event_key, event_type, target_type, target_id, source_status, summary, metadata_json, occurred_at, created_at) VALUES (?, ?, ?, ?, ?, 'approved-public', ?, ?, ?, ?)`).bind(eventId, parsed.eventKey, parsed.eventType, parsed.targetType, parsed.targetId, parsed.summary, JSON.stringify(parsed.metadata), parsed.occurredAt, timestamp),
      this.db.prepare(`INSERT OR IGNORE INTO notifications (id, member_id, notification_type, actor_member_id, target_type, target_id, read_at, created_at) SELECT ? || ':' || follow.follower_member_id, follow.follower_member_id, ?, NULL, ?, ?, NULL, ? FROM follows follow WHERE follow.target_type = ? AND follow.target_id = ? AND EXISTS (SELECT 1 FROM canonical_update_events event WHERE event.id = ? AND event.source_status = 'approved-public')`).bind(`notification:${parsed.eventKey}`, kind, parsed.targetType, parsed.targetId, timestamp, parsed.targetType, parsed.targetId, eventId),
      this.db.prepare(`UPDATE canonical_update_events SET produced_at = ? WHERE id = ? AND produced_at IS NULL`).bind(timestamp, eventId),
    ]);
    return results[1]?.meta?.changes ?? 0;
  }
}
