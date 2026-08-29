import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  CommunityRepository,
  CommunityUnavailableError,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "@/lib/community/repository";
import { describeCommunityExternalMedia } from "@/lib/community/media";
import {
  communityExternalUrlSchema,
  communityHandleSchema,
  communityProfileImageUrlSchema,
} from "@/lib/community/validation";

type StatementRecord = {
  readonly query: string;
  values: readonly (string | number | null)[];
};

function recordingDatabase() {
  const records: StatementRecord[] = [];
  const database: D1DatabaseLike = {
    prepare(query) {
      const record: StatementRecord = { query, values: [] };
      records.push(record);
      const statement: D1PreparedStatementLike = {
        bind(...values) {
          record.values = values;
          return statement;
        },
        async first<T>() {
          return null as T | null;
        },
        async all<T>() {
          return { results: [] as T[] };
        },
        async run() {
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
    async batch(statements) {
      return statements.map(() => ({ success: true, meta: { changes: 1 } }));
    },
  };
  return { database, records };
}

async function validateFailClosedBehavior() {
  let calls = 0;
  const inaccessibleDatabase: D1DatabaseLike = {
    prepare() {
      calls += 1;
      throw new Error("Disabled repository touched D1.");
    },
    async batch() {
      calls += 1;
      throw new Error("Disabled repository touched D1.");
    },
  };
  const disabled = new CommunityRepository(inaccessibleDatabase, false);
  assert.deepEqual(disabled.availability, {
    enabled: false,
    configured: true,
    writable: false,
    reason: "Feature flag disabled.",
  });
  await assert.rejects(
    disabled.createPost({ authorMemberId: "member-1", body: "A test post." }),
    CommunityUnavailableError,
  );
  assert.equal(await disabled.getPublicMemberProfile("valid_handle"), null);
  assert.equal(calls, 0, "feature-disabled access must not touch D1");

  const missingBinding = new CommunityRepository(undefined, true);
  assert.deepEqual(missingBinding.availability, {
    enabled: true,
    configured: false,
    writable: false,
    reason: "D1 binding missing.",
  });
  assert.equal(await missingBinding.getPublicMemberProfile("valid_handle"), null);
  await assert.rejects(
    missingBinding.setLike("member-1", "story", "story-1", true),
    CommunityUnavailableError,
  );
}

async function validatePrivacyAndQueries() {
  const { database, records } = recordingDatabase();
  const repository = new CommunityRepository(database, true);

  await repository.getPublicMemberProfile("valid_handle");
  const publicProfileQuery = records.at(-1)?.query ?? "";
  assert.match(publicProfileQuery, /CASE WHEN show_location = 1 THEN country/);
  assert.doesNotMatch(publicProfileQuery, /principal_id/);
  assert.doesNotMatch(publicProfileQuery, /\bemail\b/);
  assert.doesNotMatch(publicProfileQuery, /\bphone\b/);

  await repository.listPosts({ limit: 25, viewerMemberId: "member-1" });
  const feedQuery = records.at(-1)?.query ?? "";
  assert.match(feedQuery, /post\.status = 'published'/);
  assert.match(feedQuery, /post\.visibility = 'public'/);
  assert.match(feedQuery, /post\.visibility = 'followers'/);
  assert.match(feedQuery, /FROM mutes muted/);
  assert.match(feedQuery, /LIMIT \?/);
  assert.doesNotMatch(feedQuery, /principal_id|\bemail\b|\bphone\b/);

  await repository.listPosts({
    mode: "for-you",
    activity: "stories",
    limit: 25,
  });
  assert.match(records.at(-1)?.query ?? "", /canonical_target_type = 'story'/);
  await repository.listPosts({activity: "photos", limit: 25});
  assert.match(records.at(-1)?.query ?? "", /media_filter\.media_kind = 'image'/);
  await repository.listPosts({activity: "videos", limit: 25});
  assert.match(
    records.at(-1)?.query ?? "",
    /canonical_target_type = 'video'[\s\S]*media_filter\.media_kind = 'video'/,
  );
  assert.doesNotMatch(
    records.at(-1)?.query ?? "",
    /media_filter\.media_kind = 'external-embed'/,
  );

  await repository.listComments({
    targetType: "story",
    targetId: "story-1",
    limit: 10,
  });
  const commentQueries = records.slice(-2).map((record) => record.query).join("\n");
  assert.match(commentQueries, /comment\.status = 'published'/);
  assert.match(commentQueries, /comment\.parent_comment_id IS NULL/);
  assert.match(commentQueries, /LIMIT \?/);
}

async function validateIdempotencyAndOwnership() {
  const { database, records } = recordingDatabase();
  const repository = new CommunityRepository(database, true);

  await repository.createPost({
    authorMemberId: "member-1",
    postType: "video",
    visibility: "followers",
    externalMediaUrl: "https://www.youtube.com/watch?v=fictional",
    rightsConfirmed: true,
  });
  const mediaPostInsert = records.find((record) =>
    record.query.includes("INSERT INTO community_posts"),
  );
  assert.equal(
    mediaPostInsert?.values[2],
    "Shared media.",
    "A media-only post must satisfy the existing D1 body constraint.",
  );
  assert.equal(mediaPostInsert?.values[3], "video");
  assert.equal(mediaPostInsert?.values[4], "followers");

  await repository.setLike("member-1", "post", "post-1", true);
  assert.match(
    records.slice(-2).map((record) => record.query).join("\n"),
    /INSERT OR IGNORE INTO community_likes[\s\S]*INSERT OR IGNORE INTO notifications/,
  );
  await repository.setLike("member-1", "post", "post-1", false);
  assert.match(records.at(-1)?.query ?? "", /DELETE FROM community_likes/);

  await repository.setSaved("member-1", "story", "story-1", true);
  assert.match(records.at(-1)?.query ?? "", /INSERT OR IGNORE INTO saved_items/);
  await repository.setSaved("member-1", "story", "story-1", false);
  assert.match(
    records.slice(-2).map((record) => record.query).join("\n"),
    /DELETE FROM collection_items[\s\S]*DELETE FROM saved_items/,
  );

  await repository.setFollow("member-1", "member", "member-2", true);
  assert.match(
    records.slice(-2).map((record) => record.query).join("\n"),
    /INSERT OR IGNORE INTO follows[\s\S]*INSERT OR IGNORE INTO notifications/,
  );
  await repository.setFollow("member-1", "member", "member-2", false);
  assert.match(records.at(-1)?.query ?? "", /DELETE FROM follows/);

  await repository.setMute("member-1", "member-2", true);
  assert.match(records.at(-1)?.query ?? "", /INSERT OR IGNORE INTO mutes/);
  await repository.setMute("member-1", "member-2", false);
  assert.match(records.at(-1)?.query ?? "", /DELETE FROM mutes/);

  await repository.updatePost({
    actorMemberId: "member-1",
    postId: "post-1",
    body: "Updated text",
  });
  assert.match(records.at(-1)?.query ?? "", /author_member_id = \?/);
  await repository.updateComment({
    actorMemberId: "member-1",
    commentId: "comment-1",
    body: "Updated comment",
    moderator: false,
  });
  assert.match(records.at(-1)?.query ?? "", /author_member_id = \?/);
  await repository.deleteCollection("member-1", "collection-1");
  assert.match(records.at(-1)?.query ?? "", /owner_member_id = \?/);

  await repository.moderateContent({
    actorPrincipalId: "principal-1",
    targetType: "post",
    targetId: "post-1",
    hidden: true,
  });
  const moderationQueries = records
    .slice(-2)
    .map((record) => record.query)
    .join("\n");
  assert.match(
    moderationQueries,
    /status = \?, updated_at = \?[\s\S]*status = \?/,
  );
  assert.match(moderationQueries, /INSERT INTO community_audit_events/);
}

async function validateInputSafety() {
  assert.equal(communityHandleSchema.parse("Maya-Calder"), "maya-calder");
  assert.equal(communityHandleSchema.safeParse("admin").success, false);
  assert.equal(communityHandleSchema.safeParse("person@example.com").success, false);

  assert.equal(
    communityExternalUrlSchema.safeParse("https://www.youtube.com/watch?v=abc").success,
    true,
  );
  for (const unsafeUrl of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "http://localhost:3000/private",
    "http://127.0.0.1/private",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.1/private",
    "https://user:password@example.com/private",
  ]) {
    assert.equal(
      communityExternalUrlSchema.safeParse(unsafeUrl).success,
      false,
      `${unsafeUrl} must be rejected`,
    );
  }
  assert.equal(
    communityProfileImageUrlSchema.safeParse(
      "https://avatars.githubusercontent.com/u/1?v=4",
    ).success,
    true,
  );
  assert.equal(
    communityProfileImageUrlSchema.safeParse("https://example.com/avatar.jpg")
      .success,
    false,
  );
  const youtube = describeCommunityExternalMedia("https://youtu.be/dQw4w9WgXcQ");
  assert.equal(youtube?.kind, "youtube");
  assert.equal(
    youtube?.kind === "youtube" ? youtube.videoId : null,
    "dQw4w9WgXcQ",
  );
  assert.equal(
    describeCommunityExternalMedia("https://example.com/media")?.kind,
    "link",
  );

  const communityComponentDirectory = path.join(process.cwd(), "components/community");
  const componentFiles = (await readdir(communityComponentDirectory)).filter((file) =>
    file.endsWith(".tsx"),
  );
  const componentSource = (
    await Promise.all(
      componentFiles.map((file) =>
        readFile(path.join(communityComponentDirectory, file), "utf8"),
      ),
    )
  ).join("\n");
  assert.doesNotMatch(componentSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(componentSource, /<iframe\b/i);

  const actionSource = await Promise.all(
    ["posts", "comments", "interactions", "collections", "members", "moderation"].map(
      (name) => readFile(path.join(process.cwd(), `lib/community/actions/${name}.ts`), "utf8"),
    ),
  );
  assert.doesNotMatch(actionSource.join("\n"), /formData\.get\(["']authorMemberId["']\)/);
}

async function validateMigration() {
  const migration = await readFile(
    path.join(process.cwd(), "migrations/0001_community_foundation.sql"),
    "utf8",
  );
  assert.match(migration, /handle TEXT NOT NULL COLLATE NOCASE UNIQUE/);
  assert.match(migration, /target_type IN \('post', 'story', 'video'\)/);
  assert.match(migration, /UNIQUE \(member_id, target_type, target_id\)/);
  assert.match(migration, /PRIMARY KEY \(follower_member_id, target_type, target_id\)/);
  assert.match(migration, /PRIMARY KEY \(collection_id, target_type, target_id\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS community_audit_events/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS athlete_profile_controls/);
  assert.match(migration, /canonical_athlete_id TEXT NOT NULL UNIQUE/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS mutes/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS notification_preferences/);
  assert.match(migration, /post_type TEXT NOT NULL DEFAULT 'general'/);
  assert.match(migration, /'organization'\)\),/);
  assert.match(migration, /CHECK \(target_type != 'member' OR follower_member_id != target_id\)/);
}

async function main() {
  await validateFailClosedBehavior();
  await validatePrivacyAndQueries();
  await validateIdempotencyAndOwnership();
  await validateInputSafety();
  await validateMigration();
  console.log(
    "Community validation passed: fail-closed behavior, privacy, bounded queries, ownership, idempotency, URL/XSS safety, and schema constraints.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
