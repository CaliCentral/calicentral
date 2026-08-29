import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CommunityMediaRepository,
} from "../lib/community/media-repository";
import type {
  CommunityMediaObject,
  CommunityMediaPurpose,
  CommunityMediaStore,
} from "../lib/community/media";
import {
  CommunityAuthorizationError,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  type D1RunResultLike,
} from "../lib/community/repository";

type BoundValue = string | number | null;

type MediaAssetRow = {
  id: string;
  owner_member_id: string;
  purpose: CommunityMediaPurpose;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  upload_status: "pending" | "uploaded" | "failed" | "deleted";
  moderation_status: "pending" | "approved" | "rejected" | "removed";
  visibility: "private" | "public";
  moderation_note: string;
  reviewed_by_principal_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MediaAuditEvent = {
  id: string;
  eventType: "mediaApproved" | "mediaRejected" | "mediaRemoved";
  actorPrincipalId: string;
  targetId: string;
  memberId: string;
  metadataJson: string;
  createdAt: string;
};

class RemovalStatement implements D1PreparedStatementLike {
  private values: BoundValue[] = [];

  constructor(
    private readonly database: RemovalDatabase,
    private readonly query: string,
  ) {}

  bind(...values: BoundValue[]) {
    this.values = values;
    return this;
  }

  async first<T>() {
    return this.database.first(this.query, this.values) as T | null;
  }

  async all<T>() {
    return {
      results: this.database.all(this.query, this.values) as T[],
      success: true,
    };
  }

  async run() {
    return this.database.run(this.query, this.values);
  }
}

class RemovalDatabase implements D1DatabaseLike {
  readonly assets = new Map<string, MediaAssetRow>();
  readonly auditEvents: MediaAuditEvent[];

  constructor(
    assets: readonly MediaAssetRow[],
    auditEvents: readonly MediaAuditEvent[] = [],
  ) {
    for (const asset of assets) this.assets.set(asset.id, { ...asset });
    this.auditEvents = auditEvents.map((event) => ({ ...event }));
  }

  prepare(query: string) {
    return new RemovalStatement(this, query);
  }

  async batch(statements: D1PreparedStatementLike[]) {
    const assetSnapshot = new Map(
      [...this.assets].map(([id, asset]) => [id, { ...asset }]),
    );
    const auditSnapshot = this.auditEvents.map((event) => ({ ...event }));
    try {
      const results: D1RunResultLike[] = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    } catch (error) {
      this.assets.clear();
      for (const [id, asset] of assetSnapshot) this.assets.set(id, asset);
      this.auditEvents.splice(0, this.auditEvents.length, ...auditSnapshot);
      throw error;
    }
  }

  first(query: string, values: readonly BoundValue[]) {
    if (query.includes("FROM community_media_assets WHERE id = ? LIMIT 1")) {
      const asset = this.assets.get(String(values[0]));
      return asset ? { ...asset } : null;
    }
    throw new Error(`Unexpected D1 first query: ${query}`);
  }

  all(query: string, values: readonly BoundValue[]) {
    if (
      query.includes("FROM community_media_assets")
      && query.includes("moderation_status != 'removed'")
    ) {
      const limit = Number(values[0]);
      return [...this.assets.values()]
        .filter((asset) => (
          asset.upload_status === "uploaded"
          && asset.moderation_status !== "removed"
        ))
        .slice(0, limit)
        .map((asset) => ({ ...asset }));
    }
    throw new Error(`Unexpected D1 all query: ${query}`);
  }

  run(query: string, values: readonly BoundValue[]): D1RunResultLike {
    if (query.startsWith("UPDATE community_media_assets SET moderation_status = 'removed'")) {
      const [note, actor, reviewedAt, updatedAt, assetId, ownerMemberId] = values;
      const asset = this.assets.get(String(assetId));
      const ownerRequired = query.includes("AND owner_member_id = ?");
      const canRemove = asset
        && asset.upload_status === "uploaded"
        && asset.moderation_status !== "removed"
        && (!ownerRequired || asset.owner_member_id === ownerMemberId);
      if (!canRemove || !asset) return { success: true, meta: { changes: 0 } };
      asset.moderation_status = "removed";
      asset.visibility = "private";
      asset.moderation_note = String(note);
      asset.reviewed_by_principal_id = String(actor);
      asset.reviewed_at = String(reviewedAt);
      asset.updated_at = String(updatedAt);
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT OR IGNORE INTO application_audit_events")) {
      const [id, actor, metadataJson, createdAt, assetId, reviewedActor, reviewedAt] = values;
      const asset = this.assets.get(String(assetId));
      const eligible = asset
        && asset.moderation_status === "removed"
        && asset.visibility === "private"
        && asset.reviewed_by_principal_id === reviewedActor
        && asset.reviewed_at === reviewedAt;
      if (
        !eligible
        || !asset
        || this.auditEvents.some((event) => event.id === id)
      ) {
        return { success: true, meta: { changes: 0 } };
      }
      this.auditEvents.push({
        id: String(id),
        eventType: "mediaRemoved",
        actorPrincipalId: String(actor),
        targetId: asset.id,
        memberId: asset.owner_member_id,
        metadataJson: String(metadataJson),
        createdAt: String(createdAt),
      });
      return { success: true, meta: { changes: 1 } };
    }

    throw new Error(`Unexpected D1 run query: ${query}`);
  }
}

class RemovalMediaStore implements CommunityMediaStore {
  readonly getCalls: string[] = [];
  readonly deleteCalls: string[] = [];

  async put() {
    throw new Error("Unexpected media upload during removal validation.");
  }

  async get(key: string): Promise<CommunityMediaObject | null> {
    this.getCalls.push(key);
    return {
      body: new ReadableStream(),
      httpMetadata: { contentType: "image/jpeg" },
      size: 12,
    };
  }

  async delete(key: string) {
    this.deleteCalls.push(key);
  }
}

const timestamp = "2026-08-24T12:00:00.000Z";

function mediaAsset(
  id: string,
  ownerMemberId: string,
  moderationStatus: MediaAssetRow["moderation_status"] = "approved",
): MediaAssetRow {
  return {
    id,
    owner_member_id: ownerMemberId,
    purpose: "post-image",
    storage_key: `members/${ownerMemberId}/post-image/${id}.jpg`,
    original_filename: `${id}.jpg`,
    mime_type: "image/jpeg",
    byte_size: 12,
    upload_status: "uploaded",
    moderation_status: moderationStatus,
    visibility: moderationStatus === "approved" ? "public" : "private",
    moderation_note: "Initial review retained.",
    reviewed_by_principal_id: "principal-original-reviewer",
    reviewed_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function priorAudit(
  asset: MediaAssetRow,
  eventType: "mediaApproved" | "mediaRejected",
): MediaAuditEvent {
  return {
    id: `media-audit:${eventType}:${asset.id}`,
    eventType,
    actorPrincipalId: "principal-original-reviewer",
    targetId: asset.id,
    memberId: asset.owner_member_id,
    metadataJson: JSON.stringify({ note: asset.moderation_note }),
    createdAt: timestamp,
  };
}

async function validateOwnerRemoval() {
  const asset = mediaAsset("media-owner-removal", "member-owner");
  const existingAudit = priorAudit(asset, "mediaApproved");
  const database = new RemovalDatabase([asset], [existingAudit]);
  const store = new RemovalMediaStore();
  const repository = new CommunityMediaRepository(database, store, true);

  await repository.removeOwned({
    assetId: asset.id,
    ownerMemberId: asset.owner_member_id,
    actorPrincipalId: "principal-owner",
  });

  const removed = database.assets.get(asset.id);
  assert.equal(removed?.moderation_status, "removed");
  assert.equal(removed?.visibility, "private");
  assert.equal(removed?.reviewed_by_principal_id, "principal-owner");
  assert.deepEqual(
    database.auditEvents.map((event) => event.eventType),
    ["mediaApproved", "mediaRemoved"],
    "Removal replaced an earlier moderation audit event.",
  );
  assert.equal(
    JSON.parse(database.auditEvents[1]?.metadataJson ?? "{}").source,
    "owner",
  );

  assert.equal(await repository.objectForViewer(asset.id), null);
  assert.equal(
    await repository.objectForViewer(asset.id, asset.owner_member_id),
    null,
  );
  assert.equal(await repository.objectForViewer(asset.id, undefined, true), null);
  assert.deepEqual(store.getCalls, [], "Removed media reached the R2 get boundary.");
  assert.deepEqual(store.deleteCalls, [], "Application removal deleted an R2 object.");

  await assert.rejects(
    () => repository.removeOwned({
      assetId: asset.id,
      ownerMemberId: asset.owner_member_id,
      actorPrincipalId: "principal-owner",
    }),
    CommunityAuthorizationError,
    "A repeated removal did not fail closed.",
  );
  assert.equal(database.auditEvents.length, 2);
}

async function validateCrossOwnerDenial() {
  const asset = mediaAsset("media-cross-owner", "member-owner");
  const database = new RemovalDatabase([asset], [priorAudit(asset, "mediaApproved")]);
  const store = new RemovalMediaStore();
  const repository = new CommunityMediaRepository(database, store, true);

  await assert.rejects(
    () => repository.removeOwned({
      assetId: asset.id,
      ownerMemberId: "member-other",
      actorPrincipalId: "principal-other",
    }),
    CommunityAuthorizationError,
    "A cross-owner media removal was accepted.",
  );
  assert.equal(database.assets.get(asset.id)?.moderation_status, "approved");
  assert.equal(database.assets.get(asset.id)?.visibility, "public");
  assert.equal(database.auditEvents.length, 1);
  assert.deepEqual(store.deleteCalls, []);
}

async function validateModeratorRemoval() {
  const asset = mediaAsset(
    "media-moderator-removal",
    "member-owner",
    "rejected",
  );
  const database = new RemovalDatabase([asset], [priorAudit(asset, "mediaRejected")]);
  const store = new RemovalMediaStore();
  const repository = new CommunityMediaRepository(database, store, true);

  assert.deepEqual(
    (await repository.listForModeration()).map((candidate) => candidate.id),
    [asset.id],
  );
  await repository.removeAsModerator({
    assetId: asset.id,
    actorPrincipalId: "principal-moderator",
  });
  assert.equal(database.assets.get(asset.id)?.moderation_status, "removed");
  assert.equal(database.assets.get(asset.id)?.visibility, "private");
  assert.deepEqual(
    database.auditEvents.map((event) => event.eventType),
    ["mediaRejected", "mediaRemoved"],
  );
  assert.equal(
    JSON.parse(database.auditEvents[1]?.metadataJson ?? "{}").source,
    "moderator",
  );
  assert.deepEqual(await repository.listForModeration(), []);
  assert.deepEqual(store.deleteCalls, []);
}

async function validateStaleRemovalDenial() {
  const asset = {
    ...mediaAsset("media-stale-removal", "member-owner", "pending"),
    upload_status: "failed" as const,
  };
  const database = new RemovalDatabase([asset]);
  const repository = new CommunityMediaRepository(
    database,
    new RemovalMediaStore(),
    true,
  );
  await assert.rejects(
    () => repository.removeAsModerator({
      assetId: asset.id,
      actorPrincipalId: "principal-moderator",
    }),
    CommunityAuthorizationError,
    "A failed/non-uploaded media row was removable.",
  );
  assert.equal(database.assets.get(asset.id)?.moderation_status, "pending");
  assert.deepEqual(database.auditEvents, []);
}

async function main() {
  await validateOwnerRemoval();
  await validateCrossOwnerDenial();
  await validateModeratorRemoval();
  await validateStaleRemovalDenial();

  const deliveryRoute = readFileSync(
    resolve(process.cwd(), "app/api/community/media/[id]/route.ts"),
    "utf8",
  );
  assert.match(deliveryRoute, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(deliveryRoute, /max-age=/);

  console.log(
    "Community media removal validation passed: owner/moderator authorization, cross-owner and stale denial, immutable audit history, fail-closed delivery, no-store responses, and no application R2 deletion.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
