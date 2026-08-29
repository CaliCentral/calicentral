import { z } from "zod";

import { storeCommunityMedia, type CommunityMediaPurpose, type CommunityMediaStore } from "@/lib/community/media";
import type { D1DatabaseLike } from "@/lib/community/repository";
import { CommunityAuthorizationError, CommunityUnavailableError } from "@/lib/community/repository";
import { communityIdSchema } from "@/lib/community/validation";

export type CommunityMediaAsset = {
  readonly id: string;
  readonly ownerMemberId: string;
  readonly purpose: CommunityMediaPurpose;
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly uploadStatus: "pending" | "uploaded" | "failed" | "deleted";
  readonly moderationStatus: "pending" | "approved" | "rejected" | "removed";
  readonly visibility: "private" | "public";
  readonly moderationNote: string;
  readonly createdAt: string;
};

type MediaRow = {
  id: string; owner_member_id: string; purpose: CommunityMediaPurpose; storage_key: string;
  original_filename: string; mime_type: string; byte_size: number; upload_status: CommunityMediaAsset["uploadStatus"];
  moderation_status: CommunityMediaAsset["moderationStatus"]; visibility: CommunityMediaAsset["visibility"];
  moderation_note: string; created_at: string;
};

function fromRow(row: MediaRow): CommunityMediaAsset {
  return { id: row.id, ownerMemberId: row.owner_member_id, purpose: row.purpose, storageKey: row.storage_key,
    originalFilename: row.original_filename, mimeType: row.mime_type, byteSize: Number(row.byte_size),
    uploadStatus: row.upload_status, moderationStatus: row.moderation_status, visibility: row.visibility,
    moderationNote: row.moderation_note, createdAt: row.created_at };
}

const purposeSchema = z.enum(["profile-avatar", "profile-cover", "post-image", "post-video", "athlete-avatar", "athlete-cover", "skill-proof"]);

export class CommunityMediaRepository {
  constructor(private readonly db?: D1DatabaseLike, private readonly store?: CommunityMediaStore, private readonly enabled = false) {}

  get available(): boolean { return Boolean(this.db && this.store && this.enabled); }

  private requireDb(): D1DatabaseLike { if (!this.db) throw new CommunityUnavailableError(); return this.db; }

  async upload(input: { readonly memberId: string; readonly purpose: CommunityMediaPurpose; readonly filename: string; readonly contentType: string; readonly bytes: ArrayBuffer }): Promise<string> {
    if (!this.available) throw new CommunityUnavailableError();
    const memberId = communityIdSchema.parse(input.memberId);
    const purpose = purposeSchema.parse(input.purpose);
    const filename = z.string().trim().min(1).max(240).parse(input.filename);
    const assetId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const placeholderKey = `pending/${assetId}`;
    const db = this.requireDb();
    await db.prepare(`INSERT INTO community_media_assets (id, owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size, upload_status, moderation_status, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 'pending', 'pending', 'private', ?, ?)`).bind(assetId, memberId, purpose, placeholderKey, filename, input.contentType, timestamp, timestamp).run();
    try {
      const stored = await storeCommunityMedia({ store: this.store, memberId, purpose, contentType: input.contentType, bytes: input.bytes, assetId });
      await db.prepare(`UPDATE community_media_assets SET storage_key = ?, mime_type = ?, byte_size = ?, upload_status = 'uploaded', updated_at = ? WHERE id = ? AND owner_member_id = ? AND upload_status = 'pending'`).bind(stored.storageKey, stored.contentType, stored.byteSize, new Date().toISOString(), assetId, memberId).run();
      return assetId;
    } catch (error) {
      await db.prepare(`UPDATE community_media_assets SET upload_status = 'failed', updated_at = ? WHERE id = ? AND upload_status = 'pending'`).bind(new Date().toISOString(), assetId).run();
      throw error;
    }
  }

  async listForOwner(memberId: string): Promise<readonly CommunityMediaAsset[]> {
    if (!this.db) return [];
    const result = await this.db.prepare(`SELECT id, owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size, upload_status, moderation_status, visibility, moderation_note, created_at FROM community_media_assets WHERE owner_member_id = ? AND upload_status != 'deleted' ORDER BY created_at DESC LIMIT 100`).bind(communityIdSchema.parse(memberId)).all<MediaRow>();
    return result.results.map(fromRow);
  }

  async listModerationQueue(limit = 100): Promise<readonly CommunityMediaAsset[]> {
    if (!this.db) return [];
    const result = await this.db.prepare(`SELECT id, owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size, upload_status, moderation_status, visibility, moderation_note, created_at FROM community_media_assets WHERE upload_status = 'uploaded' AND moderation_status = 'pending' ORDER BY created_at LIMIT ?`).bind(z.number().int().min(1).max(100).parse(limit)).all<MediaRow>();
    return result.results.map(fromRow);
  }

  async listForModeration(limit = 100): Promise<readonly CommunityMediaAsset[]> {
    if (!this.db) return [];
    const result = await this.db.prepare(`SELECT id, owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size, upload_status, moderation_status, visibility, moderation_note, created_at FROM community_media_assets WHERE upload_status = 'uploaded' AND moderation_status != 'removed' ORDER BY created_at DESC LIMIT ?`).bind(z.number().int().min(1).max(100).parse(limit)).all<MediaRow>();
    return result.results.map(fromRow);
  }

  async get(assetId: string): Promise<CommunityMediaAsset | null> {
    if (!this.db) return null;
    const parsed = communityIdSchema.safeParse(assetId);
    if (!parsed.success) return null;
    const row = await this.db.prepare(`SELECT id, owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size, upload_status, moderation_status, visibility, moderation_note, created_at FROM community_media_assets WHERE id = ? LIMIT 1`).bind(parsed.data).first<MediaRow>();
    return row ? fromRow(row) : null;
  }

  async moderate(input: { readonly assetId: string; readonly reviewerPrincipalId: string; readonly decision: "approved" | "rejected"; readonly note?: string }): Promise<void> {
    const assetId = communityIdSchema.parse(input.assetId);
    const reviewer = communityIdSchema.parse(input.reviewerPrincipalId);
    const note = z.string().trim().max(500).parse(input.note ?? "");
    const timestamp = new Date().toISOString();
    const results = await this.requireDb().batch([
      this.requireDb().prepare(`UPDATE community_media_assets SET moderation_status = ?, visibility = ?, moderation_note = ?, reviewed_by_principal_id = ?, reviewed_at = ?, updated_at = ? WHERE id = ? AND upload_status = 'uploaded' AND moderation_status = 'pending'`).bind(input.decision, input.decision === "approved" ? "public" : "private", note, reviewer, timestamp, timestamp, assetId),
      this.requireDb().prepare(`INSERT OR IGNORE INTO application_audit_events (id, event_type, actor_principal_id, target_type, target_id, metadata_json, created_at) SELECT ?, ?, ?, 'media', asset.id, ?, ? FROM community_media_assets asset WHERE asset.id = ? AND asset.moderation_status = ? AND asset.reviewed_by_principal_id = ? AND asset.reviewed_at = ?`).bind(`media-audit:${input.decision}:${assetId}`, input.decision === "approved" ? "mediaApproved" : "mediaRejected", reviewer, JSON.stringify({ note }), timestamp, assetId, input.decision, reviewer, timestamp),
    ]);
    if (results[0]?.meta?.changes === 0) throw new CommunityAuthorizationError("This media asset is no longer awaiting review.");
  }

  async removeOwned(input: {
    readonly assetId: string;
    readonly ownerMemberId: string;
    readonly actorPrincipalId: string;
  }): Promise<void> {
    await this.markRemoved({
      assetId: input.assetId,
      actorPrincipalId: input.actorPrincipalId,
      ownerMemberId: input.ownerMemberId,
      source: "owner",
    });
  }

  async removeAsModerator(input: {
    readonly assetId: string;
    readonly actorPrincipalId: string;
  }): Promise<void> {
    await this.markRemoved({
      assetId: input.assetId,
      actorPrincipalId: input.actorPrincipalId,
      source: "moderator",
    });
  }

  private async markRemoved(input: {
    readonly assetId: string;
    readonly actorPrincipalId: string;
    readonly ownerMemberId?: string;
    readonly source: "owner" | "moderator";
  }): Promise<void> {
    if (!this.available) throw new CommunityUnavailableError();
    const assetId = communityIdSchema.parse(input.assetId);
    const actor = communityIdSchema.parse(input.actorPrincipalId);
    const owner = input.ownerMemberId
      ? communityIdSchema.parse(input.ownerMemberId)
      : undefined;
    const timestamp = new Date().toISOString();
    const note = input.source === "owner"
      ? "Removed by the media owner."
      : "Removed by an authorized moderator.";
    const db = this.requireDb();
    const update = db.prepare(`UPDATE community_media_assets SET moderation_status = 'removed', visibility = 'private', moderation_note = ?, reviewed_by_principal_id = ?, reviewed_at = ?, updated_at = ? WHERE id = ? AND upload_status = 'uploaded' AND moderation_status != 'removed'${owner ? " AND owner_member_id = ?" : ""}`).bind(
      note,
      actor,
      timestamp,
      timestamp,
      assetId,
      ...(owner ? [owner] : []),
    );
    const results = await db.batch([
      update,
      db.prepare(`INSERT OR IGNORE INTO application_audit_events (id, event_type, actor_principal_id, target_type, target_id, member_id, metadata_json, created_at) SELECT ?, 'mediaRemoved', ?, 'media', asset.id, asset.owner_member_id, ?, ? FROM community_media_assets asset WHERE asset.id = ? AND asset.moderation_status = 'removed' AND asset.visibility = 'private' AND asset.reviewed_by_principal_id = ? AND asset.reviewed_at = ?`).bind(
        `media-audit:removed:${assetId}`,
        actor,
        JSON.stringify({ note, source: input.source }),
        timestamp,
        assetId,
        actor,
        timestamp,
      ),
    ]);
    if (results[0]?.meta?.changes === 0) {
      throw new CommunityAuthorizationError("This media asset cannot be removed.");
    }
  }

  async objectForViewer(assetId: string, memberId?: string, moderator = false) {
    const asset = await this.get(assetId);
    if (!asset || asset.uploadStatus !== "uploaded" || asset.moderationStatus === "removed") return null;
    const publicAsset = asset.moderationStatus === "approved" && asset.visibility === "public";
    if (!publicAsset && asset.ownerMemberId !== memberId && !moderator) return null;
    const object = await this.store?.get(asset.storageKey);
    return object ? { asset, object } : null;
  }
}
