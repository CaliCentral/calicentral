import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AthletePresentationRepository } from "../lib/community/athlete-presentation";
import { createCommunityRateLimiter } from "../lib/community/rate-limit";
import {
  COMMUNITY_MEDIA_MAX_FILE_BYTES,
  validateCommunityMedia,
  validateCommunityMediaPurpose,
} from "../lib/community/media";
import {
  CommunityAuthorizationError,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "../lib/community/repository";
import { TrainingRepository } from "../lib/training/repository";

type AthleteMediaFixture = {
  readonly id: string;
  readonly ownerMemberId: string;
  readonly purpose: string;
  readonly uploadStatus: string;
  readonly moderationStatus: string;
  readonly visibility: string;
};

function athletePresentationDatabase(assets: readonly AthleteMediaFixture[]) {
  const mediaChecks: Array<{
    readonly assetId: string;
    readonly ownerMemberId: string;
    readonly purpose: string;
  }> = [];
  let presentationWrites = 0;

  const database: D1DatabaseLike = {
    prepare(query: string): D1PreparedStatementLike {
      let values: Array<string | number | null> = [];
      const statement: D1PreparedStatementLike = {
        bind(...bound) {
          values = bound;
          return statement;
        },
        async first<T>() {
          if (query.includes("FROM athlete_profile_controls")) {
            const [memberId, athleteId] = values;
            return (memberId === "member-owner" && athleteId === "athlete-1"
              ? { id: "control-1" }
              : null) as T | null;
          }
          if (query.includes("FROM community_media_assets")) {
            assert.match(query, /owner_member_id = \?/);
            assert.match(query, /purpose = \?/);
            assert.match(query, /upload_status = 'uploaded'/);
            assert.match(query, /moderation_status = 'approved'/);
            assert.match(query, /visibility = 'public'/);
            const [assetId, ownerMemberId, purpose] = values;
            if (
              typeof assetId !== "string"
              || typeof ownerMemberId !== "string"
              || typeof purpose !== "string"
            ) {
              throw new Error("Athlete media validation used invalid bindings.");
            }
            mediaChecks.push({ assetId, ownerMemberId, purpose });
            const asset = assets.find((candidate) => candidate.id === assetId);
            const available = asset
              && asset.ownerMemberId === ownerMemberId
              && asset.purpose === purpose
              && asset.uploadStatus === "uploaded"
              && asset.moderationStatus === "approved"
              && asset.visibility === "public";
            return (available ? { id: asset.id } : null) as T | null;
          }
          throw new Error(`Unexpected D1 read: ${query}`);
        },
        async all<T>() {
          return { results: [] as T[] };
        },
        async run() {
          assert.match(query, /INSERT INTO claimed_athlete_presentations/);
          presentationWrites += 1;
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
    async batch() {
      throw new Error("Unexpected D1 batch.");
    },
  };

  return {
    database,
    mediaChecks,
    get presentationWrites() {
      return presentationWrites;
    },
  };
}

async function validateAthletePresentationMedia() {
  const approvedAvatar: AthleteMediaFixture = {
    id: "media-avatar-approved",
    ownerMemberId: "member-owner",
    purpose: "athlete-avatar",
    uploadStatus: "uploaded",
    moderationStatus: "approved",
    visibility: "public",
  };
  const approvedCover: AthleteMediaFixture = {
    ...approvedAvatar,
    id: "media-cover-approved",
    purpose: "athlete-cover",
  };
  const fixtures: AthleteMediaFixture[] = [approvedAvatar, approvedCover];
  for (const [id, changes] of Object.entries({
    "media-avatar-wrong-purpose": { purpose: "athlete-cover" },
    "media-avatar-not-uploaded": { uploadStatus: "pending" },
    "media-avatar-rejected": { moderationStatus: "rejected" },
    "media-avatar-removed": { moderationStatus: "removed" },
    "media-avatar-private": { visibility: "private" },
    "media-avatar-cross-owner": { ownerMemberId: "member-other" },
  })) {
    fixtures.push({ ...approvedAvatar, id, ...changes });
  }
  for (const [id, changes] of Object.entries({
    "media-cover-wrong-purpose": { purpose: "athlete-avatar" },
    "media-cover-not-uploaded": { uploadStatus: "pending" },
    "media-cover-rejected": { moderationStatus: "rejected" },
    "media-cover-removed": { moderationStatus: "removed" },
    "media-cover-private": { visibility: "private" },
    "media-cover-cross-owner": { ownerMemberId: "member-other" },
  })) {
    fixtures.push({ ...approvedCover, id, ...changes });
  }

  const input = {
    memberId: "member-owner",
    canonicalAthleteId: "athlete-1",
    biography: "",
    trainingLocation: "",
    socialLinks: [],
    specialties: [],
    profileMediaId: approvedAvatar.id,
    coverMediaId: approvedCover.id,
  };
  const approved = athletePresentationDatabase(fixtures);
  await new AthletePresentationRepository(approved.database).upsert(input);
  assert.equal(approved.presentationWrites, 1);
  assert.deepEqual(approved.mediaChecks, [
    {
      assetId: approvedAvatar.id,
      ownerMemberId: input.memberId,
      purpose: "athlete-avatar",
    },
    {
      assetId: approvedCover.id,
      ownerMemberId: input.memberId,
      purpose: "athlete-cover",
    },
  ]);

  for (const fixture of fixtures.slice(2)) {
    const avatarFailure = fixture.id.startsWith("media-avatar-");
    const rejected = athletePresentationDatabase(fixtures);
    await assert.rejects(
      new AthletePresentationRepository(rejected.database).upsert({
        ...input,
        ...(avatarFailure
          ? { profileMediaId: fixture.id }
          : { coverMediaId: fixture.id }),
      }),
      CommunityAuthorizationError,
      `${fixture.id} was accepted for claimed-athlete presentation.`,
    );
    assert.equal(rejected.presentationWrites, 0);
  }
}

type SkillProofMediaFixture = {
  readonly id: string;
  readonly ownerMemberId: string;
  readonly purpose: string;
  readonly uploadStatus: string;
  readonly moderationStatus: string;
  readonly visibility: string;
};

function skillProofDatabase(assets: readonly SkillProofMediaFixture[]) {
  const mediaChecks: Array<{
    readonly assetId: string;
    readonly ownerMemberId: string;
  }> = [];
  let skillWrites = 0;

  const database: D1DatabaseLike = {
    prepare(query: string): D1PreparedStatementLike {
      let values: Array<string | number | null> = [];
      const statement: D1PreparedStatementLike = {
        bind(...bound) {
          values = bound;
          return statement;
        },
        async first<T>() {
          if (query.includes("FROM movement_definitions")) {
            assert.match(query, /status = 'active'/);
            assert.match(query, /category IN \('skill', 'hold', 'freestyle'\)/);
            return (values[0] === "movement.handstand"
              ? { id: "movement.handstand" }
              : null) as T | null;
          }
          if (query.includes("FROM community_media_assets")) {
            assert.match(query, /owner_member_id = \?/);
            assert.match(query, /purpose = 'skill-proof'/);
            assert.match(query, /upload_status = 'uploaded'/);
            assert.match(query, /moderation_status = 'approved'/);
            assert.match(query, /visibility = 'public'/);
            const [assetId, ownerMemberId] = values;
            if (typeof assetId !== "string" || typeof ownerMemberId !== "string") {
              throw new Error("Skill-proof media validation used invalid bindings.");
            }
            mediaChecks.push({ assetId, ownerMemberId });
            const asset = assets.find((candidate) => candidate.id === assetId);
            const available = asset
              && asset.ownerMemberId === ownerMemberId
              && asset.purpose === "skill-proof"
              && asset.uploadStatus === "uploaded"
              && asset.moderationStatus === "approved"
              && asset.visibility === "public";
            return (available ? { id: asset.id } : null) as T | null;
          }
          throw new Error(`Unexpected D1 read: ${query}`);
        },
        async all<T>() {
          return { results: [] as T[] };
        },
        async run() {
          assert.match(query, /INSERT INTO skill_progress/);
          skillWrites += 1;
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
    async batch() {
      throw new Error("Unexpected D1 batch.");
    },
  };

  return {
    database,
    mediaChecks,
    get skillWrites() {
      return skillWrites;
    },
  };
}

async function validateSkillProofMedia() {
  const approvedProof: SkillProofMediaFixture = {
    id: "media-skill-proof-approved",
    ownerMemberId: "member-owner",
    purpose: "skill-proof",
    uploadStatus: "uploaded",
    moderationStatus: "approved",
    visibility: "public",
  };
  const fixtures: SkillProofMediaFixture[] = [approvedProof];
  for (const [id, changes] of Object.entries({
    "media-skill-proof-wrong-purpose": { purpose: "post-video" },
    "media-skill-proof-not-uploaded": { uploadStatus: "pending" },
    "media-skill-proof-moderation-pending": { moderationStatus: "pending" },
    "media-skill-proof-rejected": { moderationStatus: "rejected" },
    "media-skill-proof-removed": { moderationStatus: "removed" },
    "media-skill-proof-private": { visibility: "private" },
    "media-skill-proof-cross-owner": { ownerMemberId: "member-other" },
  })) {
    fixtures.push({ ...approvedProof, id, ...changes });
  }

  const input = {
    memberId: "member-owner",
    movementId: "movement.handstand",
    status: "working-on" as const,
    notes: "Synthetic authorization validation.",
    publicVisible: true,
  };
  const approved = skillProofDatabase(fixtures);
  const id = await new TrainingRepository(approved.database).upsertSkill({
    ...input,
    proofMediaId: approvedProof.id,
  });
  assert.equal(id, "skill:member-owner:movement.handstand");
  assert.equal(approved.skillWrites, 1);
  assert.deepEqual(approved.mediaChecks, [{
    assetId: approvedProof.id,
    ownerMemberId: input.memberId,
  }]);

  const withoutProof = skillProofDatabase(fixtures);
  await new TrainingRepository(withoutProof.database).upsertSkill({
    ...input,
    publicVisible: false,
  });
  assert.equal(withoutProof.skillWrites, 1);
  assert.deepEqual(withoutProof.mediaChecks, []);

  for (const fixture of fixtures.slice(1)) {
    const rejected = skillProofDatabase(fixtures);
    await assert.rejects(
      new TrainingRepository(rejected.database).upsertSkill({
        ...input,
        proofMediaId: fixture.id,
      }),
      CommunityAuthorizationError,
      `${fixture.id} was accepted as skill-proof media.`,
    );
    assert.equal(rejected.skillWrites, 0);
  }
}

async function main() {
  const root = process.cwd();
  const migrations = ["0001_community_foundation.sql", "0002_organization_memberships_and_product_saves.sql", "0003_daily_athlete_utility.sql"].map((name) => readFileSync(resolve(root, "migrations", name), "utf8")).join("\n");
  const migrationOutput = execFileSync("sqlite3", [":memory:"], { input: `${migrations}\nPRAGMA foreign_key_check;\nSELECT count(*) FROM movement_definitions;\n`, encoding: "utf8" });
  assert.equal(migrationOutput.trim(), "19", "movement seed or foreign-key validation failed");

  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer;
  assert.equal(validateCommunityMedia({ contentType: "image/jpeg", bytes: jpeg }).extension, "jpg");
  const mp4 = new Uint8Array([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0]).buffer;
  assert.equal(validateCommunityMedia({ contentType: "video/mp4", bytes: mp4 }).extension, "mp4");
  for (const [contentType, signature] of [
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["video/mp4", [0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70]],
  ] as const) {
    const maximum = new Uint8Array(COMMUNITY_MEDIA_MAX_FILE_BYTES);
    maximum.set(signature);
    assert.equal(
      validateCommunityMedia({ contentType, bytes: maximum.buffer }).byteSize,
      COMMUNITY_MEDIA_MAX_FILE_BYTES,
    );
    assert.throws(
      () => validateCommunityMedia({
        contentType,
        bytes: new Uint8Array(COMMUNITY_MEDIA_MAX_FILE_BYTES + 1).buffer,
      }),
      /outside the allowed range/,
    );
  }
  validateCommunityMediaPurpose("athlete-avatar", "image/jpeg");
  validateCommunityMediaPurpose("athlete-cover", "image/png");
  validateCommunityMediaPurpose("post-video", "video/mp4");
  validateCommunityMediaPurpose("skill-proof", "image/webp");
  validateCommunityMediaPurpose("skill-proof", "video/webm");
  assert.throws(
    () => validateCommunityMediaPurpose("athlete-avatar", "video/mp4"),
    /requires an image/,
  );
  assert.throws(
    () => validateCommunityMediaPurpose("post-video", "image/jpeg"),
    /require a video/,
  );
  assert.throws(() => validateCommunityMedia({ contentType: "image/svg+xml", bytes: jpeg }), /Unsupported/);
  assert.throws(() => validateCommunityMedia({ contentType: "image/png", bytes: jpeg }), /does not match/);

  const calls: string[] = [];
  const limiter = (name: string) => ({ async limit() { calls.push(name); return { success: true }; } });
  const composite = createCommunityRateLimiter({ strict: limiter("strict"), write: limiter("write"), interaction: limiter("interaction"), upload: limiter("upload") });
  await composite?.limit({ key: "member", operation: "claim" });
  await composite?.limit({ key: "member", operation: "training" });
  await composite?.limit({ key: "member", operation: "like" });
  await composite?.limit({ key: "member", operation: "upload" });
  assert.deepEqual(calls, ["strict", "write", "interaction", "upload"]);

  await validateAthletePresentationMedia();
  await validateSkillProofMedia();

  const schema = readFileSync(resolve(root, "migrations/0003_daily_athlete_utility.sql"), "utf8");
  for (const required of ["application_audit_events", "community_media_assets", "claimed_athlete_presentations", "training_sessions", "training_sets", "personal_records", "skill_progress", "canonical_update_events"]) assert.match(schema, new RegExp(required));
  assert.match(readFileSync(resolve(root, "lib/community/canonical-updates.ts"), "utf8"), /sourceStatus !== "approved-public"/);
  assert.match(readFileSync(resolve(root, "components/athletes/athlete-sporting-relations.tsx"), "utf8"), /at least two published snapshots/);

  console.log("P4 daily athlete validation passed: additive D1 schema, 19-movement taxonomy, media signatures, claimed-athlete and skill-proof media authorization, limiter routing, notification gate, and ranking-history empty state.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
