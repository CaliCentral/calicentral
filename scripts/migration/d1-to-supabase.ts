import { readFile } from "node:fs/promises";

import {
  applyLocalPlan,
  countBy,
  emitReport,
  getArgument,
  isRecord,
  stableUuid,
  text,
  type MigrationReport,
  type PlannedRow,
} from "./common";

type D1Export = Record<string, Record<string, unknown>[]>;
const id = (table: string, value: unknown) => stableUuid(`calicentral:d1:${table}`, text(value) ?? "missing");
const canonicalId = (value: unknown) => stableUuid("calicentral:sanity", text(value) ?? "missing");
const memberId = (value: unknown) => id("member_profiles", value);
const bool = (value: unknown) => value === true || value === 1 || value === "1";
const json = (value: unknown, fallback: unknown) => {
  if (typeof value !== "string") return value ?? fallback;
  try { return JSON.parse(value) as unknown; } catch { return fallback; }
};
const renamed = (row: Record<string, unknown>, excluded: readonly string[]) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !excluded.includes(key)));

function parseExport(value: unknown): D1Export {
  if (!isRecord(value)) throw new Error("D1 export must be a JSON object keyed by table name.");
  const result: D1Export = {};
  for (const [table, rows] of Object.entries(value)) {
    if (!Array.isArray(rows) || !rows.every(isRecord)) throw new Error(`D1 export table ${table} must be an array of row objects.`);
    result[table] = rows;
  }
  return result;
}

function operation(table: string, sourceTable: string, row: Record<string, unknown>, targetRow: Record<string, unknown>): PlannedRow {
  return { sourceKey: `${sourceTable}:${text(row.id) ?? "composite"}`, table, row: targetRow };
}

function normalizeRow(sourceTable: string, row: Record<string, unknown>, warnings: string[]): PlannedRow[] {
  const sourceId = row.id;
  switch (sourceTable) {
    case "member_profiles": {
      const targetMemberId = memberId(sourceId);
      return [
        operation("members", sourceTable, row, {
          id: targetMemberId, legacy_principal_id: row.principal_id,
          access_status: row.status === "suspended" || row.status === "archived" ? row.status : "active",
          created_at: row.created_at, updated_at: row.updated_at, archived_at: row.deleted_at,
        }),
        operation("profiles", sourceTable, row, {
          member_id: targetMemberId, handle: row.handle, display_name: row.display_name,
          avatar_url: row.avatar_url, cover_image_url: row.cover_image_url, biography: row.biography ?? "",
          country: row.country, administrative_area: row.administrative_area, city: row.city,
          preferred_timezone: row.preferred_timezone, interests: json(row.interests_json, []),
          disciplines: json(row.disciplines_json, []), public_roles: json(row.public_roles_json, []),
          profile_configured: true, profile_public: bool(row.profile_public), show_location: bool(row.show_location),
          show_social_accounts: bool(row.show_social_accounts), show_media: bool(row.show_media),
          discoverable: bool(row.discoverable), status: row.status ?? "active",
          created_at: row.created_at, updated_at: row.updated_at,
        }),
      ];
    }
    case "member_social_accounts": return [operation("profile_social_accounts", sourceTable, row, {
      id: id(sourceTable, sourceId), member_id: memberId(row.member_id), platform: row.platform, url: row.url,
      handle: row.handle, verification_status: row.verification_status, visible: bool(row.visible),
      created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "athlete_profile_controls": {
      const claimId = id("athlete_claims", row.submission_id);
      return [
        operation("athlete_claims", sourceTable, row, {
          id: claimId, athlete_id: canonicalId(row.canonical_athlete_id), claimant_member_id: memberId(row.member_id),
          submission_id: row.submission_id, claim_state: row.status === "active" ? "approved" : "revoked",
          reviewed_at: row.reviewed_at, created_at: row.created_at, updated_at: row.updated_at,
        }),
        operation("athlete_profile_controls", sourceTable, row, {
          id: id(sourceTable, sourceId), athlete_id: canonicalId(row.canonical_athlete_id), member_id: memberId(row.member_id),
          athlete_claim_id: claimId, status: row.status, reviewed_by_principal: row.reviewed_by_principal_id,
          reviewed_at: row.reviewed_at, revoked_at: row.revoked_at, created_at: row.created_at, updated_at: row.updated_at,
        }),
      ];
    }
    case "community_posts": return [operation("posts", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, author_member_id: memberId(row.author_member_id),
      ...renamed(row, ["id", "author_member_id", "repost_of_post_id"]),
      repost_of_post_id: row.repost_of_post_id ? id(sourceTable, row.repost_of_post_id) : null,
    })];
    case "community_comments": return [operation("comments", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, author_member_id: memberId(row.author_member_id),
      parent_comment_id: row.parent_comment_id ? id(sourceTable, row.parent_comment_id) : null,
      ...renamed(row, ["id", "author_member_id", "parent_comment_id"]),
    })];
    case "community_likes": return [operation("likes", sourceTable, row, {
      member_id: memberId(row.member_id), target_type: row.target_type, target_id: row.target_id, created_at: row.created_at,
    })];
    case "community_reposts": return [operation("reposts", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, member_id: memberId(row.member_id),
      target_type: row.target_type, target_id: row.target_id,
      activity_post_id: id("community_posts", row.activity_post_id), quote_body: row.quote_body,
      created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "saved_items": return [operation("saves", sourceTable, row, {
      member_id: memberId(row.member_id), target_type: row.target_type, target_id: row.target_id, created_at: row.created_at,
    })];
    case "collections": return [operation("collections", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, owner_member_id: memberId(row.owner_member_id),
      ...renamed(row, ["id", "owner_member_id"]),
    })];
    case "collection_items": return [operation("collection_items", sourceTable, row, {
      collection_id: id("collections", row.collection_id), target_type: row.target_type, target_id: row.target_id,
      display_order: row.display_order, added_at: row.added_at,
    })];
    case "follows": return [operation("follows", sourceTable, row, {
      follower_member_id: memberId(row.follower_member_id), target_type: row.target_type,
      target_id: row.target_type === "member" ? memberId(row.target_id) : row.target_id, created_at: row.created_at,
    })];
    case "blocks": return [operation("blocks", sourceTable, row, {
      blocker_member_id: memberId(row.blocker_member_id), blocked_member_id: memberId(row.blocked_member_id), created_at: row.created_at,
    })];
    case "mutes": return [operation("mutes", sourceTable, row, {
      muter_member_id: memberId(row.muter_member_id), muted_member_id: memberId(row.muted_member_id), created_at: row.created_at,
    })];
    case "reports": return [operation("reports", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, reporter_member_id: memberId(row.reporter_member_id),
      ...renamed(row, ["id", "reporter_member_id"]),
    })];
    case "community_audit_events": return [operation("moderation_events", sourceTable, row, {
      id: id(sourceTable, sourceId), event_type: row.event_type, actor_principal: row.actor_principal_id,
      target_type: row.target_type, target_id: row.target_id, summary: row.summary, created_at: row.created_at,
    })];
    case "application_audit_events": return [operation("audit_events", sourceTable, row, {
      id: id(sourceTable, sourceId), event_type: row.event_type, actor_principal: row.actor_principal_id,
      target_type: row.target_type, target_id: row.target_id, summary: text(row.event_type) ?? "Migrated application audit event",
      metadata: json(row.metadata_json, {}), created_at: row.created_at,
    })];
    case "notifications": return [operation("notifications", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, member_id: memberId(row.member_id),
      actor_member_id: row.actor_member_id ? memberId(row.actor_member_id) : null,
      ...renamed(row, ["id", "member_id", "actor_member_id"]),
    })];
    case "notification_preferences": return [operation("notification_preferences", sourceTable, row, {
      member_id: memberId(row.member_id), social_enabled: bool(row.social_enabled), competition_enabled: bool(row.competition_enabled),
      claim_submission_enabled: bool(row.claim_submission_enabled), email_enabled: bool(row.email_enabled), updated_at: row.updated_at,
    })];
    case "team_memberships": return [operation("team_memberships", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, team_id: canonicalId(row.canonical_team_id),
      member_id: memberId(row.member_id), role: row.role, status: row.status, public_visible: bool(row.public_visible),
      granted_at: row.granted_at, revoked_at: row.revoked_at, created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "team_invitations": return [operation("team_invitations", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, team_id: canonicalId(row.canonical_team_id),
      invited_by_member_id: memberId(row.invited_by_member_id),
      invited_member_id: row.invited_member_id ? memberId(row.invited_member_id) : null,
      private_invitation_email: row.private_invitation_email, proposed_role: row.proposed_role,
      status: row.status, expires_at: row.expires_at, created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "organization_memberships": return [operation("organization_memberships", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, member_id: memberId(row.member_id),
      organization_id: canonicalId(row.organization_id), role: row.role, capabilities: json(row.capabilities_json, []),
      status: row.status, reviewed_by_principal: row.reviewed_by_principal_id,
      reviewed_at: row.reviewed_at, granted_at: row.granted_at, revoked_at: row.revoked_at,
      created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "community_media_assets": return [operation("media_assets", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, owner_member_id: memberId(row.owner_member_id), storage_provider: "r2",
      purpose: row.purpose, storage_key: row.storage_key, original_filename: row.original_filename, mime_type: row.mime_type,
      byte_size: row.byte_size, upload_status: row.upload_status, moderation_state: row.moderation_status,
      removal_state: row.moderation_status === "removed" ? "moderator-removed" : "active", visibility: row.visibility,
      moderation_note: row.moderation_note, reviewed_by_principal: row.reviewed_by_principal_id,
      reviewed_at: row.reviewed_at,
      removed_at: row.moderation_status === "removed" ? row.updated_at : null, created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "community_post_media": return [operation("media_links", sourceTable, row, {
      id: id(sourceTable, sourceId), post_id: id("community_posts", row.post_id),
      media_asset_id: row.media_asset_id ? id("community_media_assets", row.media_asset_id) : null,
      external_url: row.external_url, media_kind: row.media_kind, alt_text: row.alt_text,
      creator_member_id: row.creator_member_id ? memberId(row.creator_member_id) : null,
      creator_name: row.creator_name, rights_status: row.rights_status, display_order: row.display_order, created_at: row.created_at,
    })];
    case "claimed_athlete_presentations": return [operation("claimed_athlete_presentations", sourceTable, row, {
      athlete_id: canonicalId(row.canonical_athlete_id), controlling_member_id: memberId(row.controlling_member_id),
      preferred_display_name: row.preferred_display_name, biography: row.biography, website: row.website,
      training_location: row.training_location, social_links: json(row.social_links_json, []),
      specialties: json(row.specialties_json, []),
      profile_media_id: row.profile_media_id ? id("community_media_assets", row.profile_media_id) : null,
      cover_media_id: row.cover_media_id ? id("community_media_assets", row.cover_media_id) : null,
      status: row.status, created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "movement_definitions": return [operation("movements", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, slug: row.slug, name: row.name, category: row.category,
      measurement_types: json(row.measurement_types_json, []), status: row.status, created_at: row.created_at, updated_at: row.updated_at,
    })];
    case "training_sessions": return [operation("training_sessions", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, owner_member_id: memberId(row.owner_member_id),
      ...renamed(row, ["id", "owner_member_id"]),
    })];
    case "training_session_movements": return [operation("training_session_movements", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, session_id: id("training_sessions", row.session_id),
      movement_id: row.movement_id ? id("movement_definitions", row.movement_id) : null,
      ...renamed(row, ["id", "session_id", "movement_id"]),
    })];
    case "training_sets": return [operation("training_sets", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId,
      session_movement_id: id("training_session_movements", row.session_movement_id),
      ...renamed(row, ["id", "session_movement_id"]),
    })];
    case "personal_records": {
      const sourceRecordId = row.source_url ? id("personal_record_sources", sourceId) : null;
      const record = operation("personal_records", sourceTable, row, {
        id: id(sourceTable, sourceId), legacy_d1_id: sourceId, member_id: memberId(row.member_id),
        movement_id: row.movement_id ? id("movement_definitions", row.movement_id) : null,
        training_set_id: row.training_set_id ? id("training_sets", row.training_set_id) : null,
        competition_id: row.canonical_competition_id ? canonicalId(row.canonical_competition_id) : null,
        source_record_id: sourceRecordId, public_visible: bool(row.public_visible),
        ...renamed(row, ["id", "member_id", "movement_id", "training_set_id", "canonical_competition_id", "source_url", "public_visible"]),
      });
      return sourceRecordId ? [
        operation("source_records", sourceTable, row, {
          id: sourceRecordId, provider: "d1-personal-record", source_type: "personal-record",
          public_url: row.source_url, external_record_id: text(sourceId), verification_state: row.verification_status ?? "unverified",
        }),
        record,
      ] : [record];
    }
    case "skill_progress": return [operation("skill_progress", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, member_id: memberId(row.member_id),
      movement_id: id("movement_definitions", row.movement_id),
      proof_media_id: row.proof_media_id ? id("community_media_assets", row.proof_media_id) : null,
      public_visible: bool(row.public_visible), ...renamed(row, ["id", "member_id", "movement_id", "proof_media_id", "public_visible"]),
    })];
    case "canonical_update_events": return [operation("canonical_update_events", sourceTable, row, {
      id: id(sourceTable, sourceId), legacy_d1_id: sourceId, ...renamed(row, ["id", "metadata_json"]), metadata: json(row.metadata_json, {}),
    })];
    default:
      warnings.push(`No write transformer yet for D1 table ${sourceTable}; ${text(sourceId) ?? "composite row"} remains in the dry-run inventory.`);
      return [];
  }
}

function validateRelationships(input: D1Export): string[] {
  const errors: string[] = [];
  const ids = (table: string) => new Set((input[table] ?? []).map((row) => text(row.id)).filter(Boolean));
  const relationships = [
    ["member_social_accounts", "member_id", "member_profiles", false],
    ["athlete_profile_controls", "member_id", "member_profiles", false],
    ["community_posts", "author_member_id", "member_profiles", false],
    ["community_posts", "repost_of_post_id", "community_posts", true],
    ["community_post_media", "post_id", "community_posts", false],
    ["community_post_media", "creator_member_id", "member_profiles", true],
    ["community_post_media", "media_asset_id", "community_media_assets", true],
    ["community_comments", "author_member_id", "member_profiles", false],
    ["community_comments", "parent_comment_id", "community_comments", true],
    ["community_likes", "member_id", "member_profiles", false],
    ["community_reposts", "member_id", "member_profiles", false],
    ["community_reposts", "activity_post_id", "community_posts", false],
    ["collections", "owner_member_id", "member_profiles", false],
    ["saved_items", "member_id", "member_profiles", false],
    ["collection_items", "collection_id", "collections", false],
    ["follows", "follower_member_id", "member_profiles", false],
    ["blocks", "blocker_member_id", "member_profiles", false],
    ["blocks", "blocked_member_id", "member_profiles", false],
    ["mutes", "muter_member_id", "member_profiles", false],
    ["mutes", "muted_member_id", "member_profiles", false],
    ["reports", "reporter_member_id", "member_profiles", false],
    ["notifications", "member_id", "member_profiles", false],
    ["notifications", "actor_member_id", "member_profiles", true],
    ["notification_preferences", "member_id", "member_profiles", false],
    ["team_memberships", "member_id", "member_profiles", false],
    ["team_invitations", "invited_by_member_id", "member_profiles", false],
    ["team_invitations", "invited_member_id", "member_profiles", true],
    ["organization_memberships", "member_id", "member_profiles", false],
    ["community_media_assets", "owner_member_id", "member_profiles", false],
    ["claimed_athlete_presentations", "controlling_member_id", "member_profiles", false],
    ["training_sessions", "owner_member_id", "member_profiles", false],
    ["training_session_movements", "session_id", "training_sessions", false],
    ["training_session_movements", "movement_id", "movement_definitions", true],
    ["training_sets", "session_movement_id", "training_session_movements", false],
    ["personal_records", "member_id", "member_profiles", false],
    ["personal_records", "movement_id", "movement_definitions", true],
    ["personal_records", "training_set_id", "training_sets", true],
    ["skill_progress", "member_id", "member_profiles", false],
    ["skill_progress", "movement_id", "movement_definitions", false],
    ["skill_progress", "proof_media_id", "community_media_assets", true],
  ] as const;
  for (const [table, column, targetTable, nullable] of relationships) {
    const targetIds = ids(targetTable);
    for (const row of input[table] ?? []) {
      const value = text(row[column]);
      if (!value && nullable) continue;
      if (!value) errors.push(`${table}.${column} is required.`);
      else if (!targetIds.has(value)) errors.push(`${table}.${column} references missing ${targetTable} row ${value}.`);
    }
  }
  return errors;
}

async function main() {
  const inputPath = getArgument("input");
  if (!inputPath) throw new Error("Usage: npm run migrate:d1 -- --input=/path/to/d1-export.json [--report=.tmp/d1-report.json]");
  const input = parseExport(JSON.parse(await readFile(inputPath, "utf8")) as unknown);
  const warnings: string[] = [];
  const operations = Object.entries(input).flatMap(([table, rows]) => rows.flatMap((row) => normalizeRow(table, row, warnings)));
  const inputCounts = Object.fromEntries(
    Object.entries(input)
      .map(([table, rows]) => [table, rows.length] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  const report: MigrationReport = {
    source: "d1", mode: process.argv.includes("--write") ? "local-write" : "dry-run", generatedAt: new Date().toISOString(),
    inputCounts, outputCounts: countBy(operations, (item) => item.table), operations, warnings, errors: validateRelationships(input),
  };
  await applyLocalPlan(report);
  await emitReport(report);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Unknown migration error"}\n`); process.exitCode = 1; });
