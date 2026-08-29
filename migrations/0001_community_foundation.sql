PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  principal_id TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  cover_image_url TEXT,
  biography TEXT NOT NULL DEFAULT '',
  country TEXT,
  administrative_area TEXT,
  city TEXT,
  preferred_timezone TEXT,
  interests_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(interests_json)),
  disciplines_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(disciplines_json)),
  public_roles_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(public_roles_json)),
  profile_public INTEGER NOT NULL DEFAULT 0 CHECK (profile_public IN (0, 1)),
  show_location INTEGER NOT NULL DEFAULT 0 CHECK (show_location IN (0, 1)),
  show_social_accounts INTEGER NOT NULL DEFAULT 0 CHECK (show_social_accounts IN (0, 1)),
  show_media INTEGER NOT NULL DEFAULT 0 CHECK (show_media IN (0, 1)),
  discoverable INTEGER NOT NULL DEFAULT 0 CHECK (discoverable IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'suspended', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS member_profiles_public_directory_idx
  ON member_profiles(profile_public, discoverable, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS member_social_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  handle TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'confirmed', 'revoked')),
  visible INTEGER NOT NULL DEFAULT 0 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  UNIQUE (member_id, platform, url)
);

CREATE INDEX IF NOT EXISTS member_social_accounts_member_idx ON member_social_accounts(member_id, visible);

-- Private authorization mirror for an administrator-approved existing-athlete
-- claim. The canonical athlete and sporting truth remain in Sanity.
CREATE TABLE IF NOT EXISTS athlete_profile_controls (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL UNIQUE,
  canonical_athlete_id TEXT NOT NULL UNIQUE,
  submission_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  reviewed_by_principal_id TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (status != 'revoked' OR revoked_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS athlete_profile_controls_athlete_status_idx
  ON athlete_profile_controls(canonical_athlete_id, status);

CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY NOT NULL,
  author_member_id TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'training', 'pr', 'skill', 'competition', 'photo', 'video')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'archived', 'deleted')),
  canonical_target_type TEXT CHECK (canonical_target_type IN ('story', 'athlete', 'team', 'competition', 'organization', 'video')),
  canonical_target_id TEXT,
  repost_of_post_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (author_member_id) REFERENCES member_profiles(id),
  FOREIGN KEY (repost_of_post_id) REFERENCES community_posts(id),
  CHECK ((canonical_target_type IS NULL) = (canonical_target_id IS NULL)),
  CHECK (length(body) > 0 OR canonical_target_id IS NOT NULL OR repost_of_post_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS community_posts_public_feed_idx ON community_posts(status, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_author_idx ON community_posts(author_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_canonical_target_idx ON community_posts(canonical_target_type, canonical_target_id);

CREATE TABLE IF NOT EXISTS community_post_media (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL,
  media_kind TEXT NOT NULL CHECK (media_kind IN ('image', 'video', 'external-embed')),
  storage_key TEXT,
  external_url TEXT,
  alt_text TEXT,
  creator_member_id TEXT,
  creator_name TEXT,
  rights_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (rights_status IN ('unconfirmed', 'member-owned', 'permission-confirmed', 'editorial-owned')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_member_id) REFERENCES member_profiles(id),
  CHECK (storage_key IS NOT NULL OR external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS community_post_media_post_idx ON community_post_media(post_id, display_order);

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'video')),
  target_id TEXT NOT NULL,
  parent_comment_id TEXT,
  author_member_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'archived', 'deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (parent_comment_id) REFERENCES community_comments(id),
  FOREIGN KEY (author_member_id) REFERENCES member_profiles(id)
);

CREATE INDEX IF NOT EXISTS community_comments_target_idx
  ON community_comments(target_type, target_id, status, created_at);
CREATE INDEX IF NOT EXISTS community_comments_parent_idx
  ON community_comments(parent_comment_id, status, created_at);

CREATE TABLE IF NOT EXISTS community_likes (
  member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'story', 'athlete', 'team', 'competition', 'video')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (member_id, target_type, target_id),
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS community_likes_target_idx ON community_likes(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_reposts (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'video')),
  target_id TEXT NOT NULL,
  activity_post_id TEXT NOT NULL UNIQUE,
  quote_body TEXT NOT NULL DEFAULT '' CHECK (length(quote_body) <= 4000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  UNIQUE (member_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS community_reposts_target_idx
  ON community_reposts(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_reposts_member_idx
  ON community_reposts(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_items (
  member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'athlete', 'team', 'competition', 'video')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (member_id, target_type, target_id),
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS saved_items_member_idx ON saved_items(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY NOT NULL,
  owner_member_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_member_id) REFERENCES member_profiles(id),
  UNIQUE (owner_member_id, name)
);

CREATE INDEX IF NOT EXISTS collections_owner_idx ON collections(owner_member_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'athlete', 'team', 'competition', 'video')),
  target_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, target_type, target_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS collection_items_order_idx
  ON collection_items(collection_id, display_order, added_at);

CREATE TABLE IF NOT EXISTS follows (
  follower_member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('member', 'athlete', 'team', 'competition', 'organization')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower_member_id, target_type, target_id),
  FOREIGN KEY (follower_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (target_type != 'member' OR follower_member_id != target_id)
);

CREATE INDEX IF NOT EXISTS follows_target_idx ON follows(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_member_id TEXT NOT NULL,
  blocked_member_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_member_id, blocked_member_id),
  FOREIGN KEY (blocker_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (blocker_member_id != blocked_member_id)
);

CREATE TABLE IF NOT EXISTS mutes (
  muter_member_id TEXT NOT NULL,
  muted_member_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (muter_member_id, muted_member_id),
  FOREIGN KEY (muter_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (muted_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (muter_member_id != muted_member_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY NOT NULL,
  reporter_member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('member', 'post', 'comment', 'media')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in-review', 'resolved', 'dismissed', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reporter_member_id) REFERENCES member_profiles(id)
);

CREATE INDEX IF NOT EXISTS reports_moderation_queue_idx ON reports(status, created_at);

CREATE TABLE IF NOT EXISTS community_audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'communityPostHidden',
    'communityPostRestored',
    'communityCommentHidden',
    'communityCommentRestored',
    'communityReportResolved',
    'communityReportDismissed'
  )),
  actor_principal_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'report')),
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS community_audit_events_created_idx
  ON community_audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  actor_member_id TEXT,
  target_type TEXT,
  target_id TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_member_id) REFERENCES member_profiles(id)
);

CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(member_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  member_id TEXT PRIMARY KEY NOT NULL,
  social_enabled INTEGER NOT NULL DEFAULT 1 CHECK (social_enabled IN (0, 1)),
  competition_enabled INTEGER NOT NULL DEFAULT 1 CHECK (competition_enabled IN (0, 1)),
  claim_submission_enabled INTEGER NOT NULL DEFAULT 1 CHECK (claim_submission_enabled IN (0, 1)),
  email_enabled INTEGER NOT NULL DEFAULT 0 CHECK (email_enabled IN (0, 1)),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_team_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('captain', 'athlete', 'reserve', 'coach', 'manager', 'administrator', 'media-manager')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'declined', 'revoked', 'left')),
  granted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id),
  UNIQUE (canonical_team_id, member_id, role)
);

CREATE INDEX IF NOT EXISTS team_memberships_team_idx ON team_memberships(canonical_team_id, status);

CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_team_id TEXT NOT NULL,
  invited_by_member_id TEXT NOT NULL,
  invited_member_id TEXT,
  private_invitation_email TEXT,
  proposed_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (invited_by_member_id) REFERENCES member_profiles(id),
  FOREIGN KEY (invited_member_id) REFERENCES member_profiles(id),
  CHECK (invited_member_id IS NOT NULL OR private_invitation_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS team_invitations_team_status_idx ON team_invitations(canonical_team_id, status);
