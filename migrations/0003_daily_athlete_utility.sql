PRAGMA foreign_keys = ON;

-- P4 is strictly additive. Canonical sport/editorial records remain in Sanity;
-- these tables hold private/high-volume application state and stable references.

ALTER TABLE team_memberships
  ADD COLUMN public_visible INTEGER NOT NULL DEFAULT 0
  CHECK (public_visible IN (0, 1));

CREATE INDEX IF NOT EXISTS team_memberships_member_public_idx
  ON team_memberships(member_id, status, public_visible, updated_at DESC);

CREATE TABLE IF NOT EXISTS application_audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'athleteClaimSubmitted',
    'athleteClaimApproved',
    'athleteClaimRejected',
    'athleteControlGranted',
    'athleteControlRevoked',
    'athleteControllerChanged',
    'mediaApproved',
    'mediaRejected',
    'mediaRemoved'
  )),
  actor_principal_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('submission', 'athlete-control', 'media')),
  target_id TEXT NOT NULL,
  member_id TEXT,
  canonical_athlete_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS application_audit_event_intent_idx
  ON application_audit_events(event_type, target_type, target_id, actor_principal_id);
CREATE INDEX IF NOT EXISTS application_audit_event_target_idx
  ON application_audit_events(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  owner_member_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN (
    'profile-avatar', 'profile-cover', 'post-image', 'post-video',
    'athlete-avatar', 'athlete-cover', 'skill-proof'
  )),
  storage_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'failed', 'deleted')),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'removed')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  moderation_note TEXT NOT NULL DEFAULT '',
  reviewed_by_principal_id TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (owner_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (moderation_status != 'approved' OR upload_status = 'uploaded'),
  CHECK (upload_status != 'deleted' OR deleted_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS community_media_moderation_idx
  ON community_media_assets(moderation_status, upload_status, created_at);
CREATE INDEX IF NOT EXISTS community_media_owner_idx
  ON community_media_assets(owner_member_id, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS community_media_public_idx
  ON community_media_assets(visibility, moderation_status, id);

ALTER TABLE community_post_media
  ADD COLUMN media_asset_id TEXT REFERENCES community_media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS community_post_media_asset_idx
  ON community_post_media(media_asset_id);

CREATE TABLE IF NOT EXISTS claimed_athlete_presentations (
  canonical_athlete_id TEXT PRIMARY KEY NOT NULL,
  controlling_member_id TEXT NOT NULL UNIQUE,
  preferred_display_name TEXT,
  biography TEXT NOT NULL DEFAULT '' CHECK (length(biography) <= 1200),
  website TEXT,
  training_location TEXT NOT NULL DEFAULT '' CHECK (length(training_location) <= 160),
  social_links_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(social_links_json)),
  specialties_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(specialties_json)),
  profile_media_id TEXT,
  cover_media_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'revoked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (controlling_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_media_id) REFERENCES community_media_assets(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES community_media_assets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movement_definitions (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'skill', 'hold', 'conditioning', 'mobility', 'freestyle', 'other')),
  measurement_types_json TEXT NOT NULL CHECK (json_valid(measurement_types_json)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO movement_definitions
  (id, slug, name, category, measurement_types_json, created_at, updated_at)
VALUES
  ('movement.pull-up', 'pull-up', 'Pull-Up', 'strength', '["reps","weight-reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.weighted-pull-up', 'weighted-pull-up', 'Weighted Pull-Up', 'strength', '["weight-reps","total-weight","reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.chin-up', 'chin-up', 'Chin-Up', 'strength', '["reps","weight-reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.dip', 'dip', 'Dip', 'strength', '["reps","weight-reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.weighted-dip', 'weighted-dip', 'Weighted Dip', 'strength', '["weight-reps","total-weight","reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.muscle-up', 'muscle-up', 'Muscle-Up', 'skill', '["completion","reps","weight-reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.weighted-muscle-up', 'weighted-muscle-up', 'Weighted Muscle-Up', 'strength', '["weight-reps","total-weight","reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.push-up', 'push-up', 'Push-Up', 'strength', '["reps","weight-reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.handstand', 'handstand', 'Handstand', 'hold', '["hold-duration","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.handstand-push-up', 'handstand-push-up', 'Handstand Push-Up', 'skill', '["reps","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.front-lever', 'front-lever', 'Front Lever', 'hold', '["hold-duration","progression","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.back-lever', 'back-lever', 'Back Lever', 'hold', '["hold-duration","progression","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.planche', 'planche', 'Planche', 'hold', '["hold-duration","progression","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.l-sit', 'l-sit', 'L-Sit', 'hold', '["hold-duration","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.human-flag', 'human-flag', 'Human Flag', 'hold', '["hold-duration","progression","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.one-arm-pull-up', 'one-arm-pull-up', 'One-Arm Pull-Up', 'skill', '["completion","reps","progression"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.pistol-squat', 'pistol-squat', 'Pistol Squat', 'strength', '["reps","weight-reps","completion"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.squat', 'squat', 'Squat', 'strength', '["weight-reps","total-weight","reps"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('movement.freestyle', 'freestyle', 'Freestyle Skills', 'freestyle', '["completion","score","duration"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_member_id TEXT NOT NULL,
  session_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '' CHECK (length(title) <= 120),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 4000),
  bodyweight_kg REAL CHECK (bodyweight_kg IS NULL OR bodyweight_kg BETWEEN 20 AND 350),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 86400),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'followers', 'public')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (owner_member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  CHECK (status != 'deleted' OR deleted_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS training_sessions_owner_date_idx
  ON training_sessions(owner_member_id, status, session_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS training_sessions_public_idx
  ON training_sessions(visibility, status, session_date DESC);

CREATE TABLE IF NOT EXISTS training_session_movements (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  movement_id TEXT,
  custom_movement_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (movement_id) REFERENCES movement_definitions(id),
  CHECK (movement_id IS NOT NULL OR length(custom_movement_name) BETWEEN 1 AND 120),
  UNIQUE (session_id, display_order)
);

CREATE INDEX IF NOT EXISTS training_movement_session_idx
  ON training_session_movements(session_id, display_order);

CREATE TABLE IF NOT EXISTS training_sets (
  id TEXT PRIMARY KEY NOT NULL,
  session_movement_id TEXT NOT NULL,
  set_order INTEGER NOT NULL CHECK (set_order >= 1),
  reps INTEGER CHECK (reps IS NULL OR reps BETWEEN 0 AND 10000),
  added_load_kg REAL CHECK (added_load_kg IS NULL OR added_load_kg BETWEEN -100 AND 1000),
  total_weight_kg REAL CHECK (total_weight_kg IS NULL OR total_weight_kg BETWEEN 0 AND 1500),
  duration_seconds REAL CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 86400),
  distance_meters REAL CHECK (distance_meters IS NULL OR distance_meters BETWEEN 0 AND 1000000),
  rpe REAL CHECK (rpe IS NULL OR rpe BETWEEN 0 AND 10),
  rir REAL CHECK (rir IS NULL OR rir BETWEEN 0 AND 20),
  completion TEXT CHECK (completion IN ('attempted', 'completed', 'failed')),
  progression TEXT CHECK (progression IS NULL OR length(progression) <= 120),
  score REAL,
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_movement_id) REFERENCES training_session_movements(id) ON DELETE CASCADE,
  UNIQUE (session_movement_id, set_order),
  CHECK (
    reps IS NOT NULL OR added_load_kg IS NOT NULL OR total_weight_kg IS NOT NULL OR
    duration_seconds IS NOT NULL OR distance_meters IS NOT NULL OR completion IS NOT NULL OR
    progression IS NOT NULL OR score IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS personal_records (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  movement_id TEXT,
  custom_movement_name TEXT,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'maximum-added-weight', 'total-system-weight', 'repetition-maximum',
    'max-repetitions', 'hold-duration', 'skill-achievement',
    'competition-total', 'competition-score'
  )),
  value REAL NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'lb', 'reps', 'seconds', 'points', 'completion')),
  repetitions INTEGER CHECK (repetitions IS NULL OR repetitions BETWEEN 1 AND 10000),
  achieved_on TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'self-reported', 'training-recorded', 'competition-linked',
    'source-confirmed', 'editorially-verified'
  )),
  training_set_id TEXT,
  canonical_competition_id TEXT,
  source_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'linked', 'source-confirmed', 'editorially-verified', 'disputed')),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  public_visible INTEGER NOT NULL DEFAULT 0 CHECK (public_visible IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'removed')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (movement_id) REFERENCES movement_definitions(id),
  FOREIGN KEY (training_set_id) REFERENCES training_sets(id) ON DELETE SET NULL,
  CHECK (movement_id IS NOT NULL OR length(custom_movement_name) BETWEEN 1 AND 120),
  CHECK (source_type != 'training-recorded' OR training_set_id IS NOT NULL),
  CHECK (source_type != 'competition-linked' OR canonical_competition_id IS NOT NULL),
  CHECK (source_type NOT IN ('source-confirmed', 'editorially-verified') OR source_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS personal_records_member_history_idx
  ON personal_records(member_id, movement_id, record_type, achieved_on DESC, id DESC);
CREATE INDEX IF NOT EXISTS personal_records_public_idx
  ON personal_records(member_id, public_visible, status, achieved_on DESC);

CREATE TABLE IF NOT EXISTS skill_progress (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  movement_id TEXT NOT NULL,
  progress_status TEXT NOT NULL CHECK (progress_status IN ('not-started', 'working-on', 'achieved')),
  achieved_on TEXT,
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  proof_media_id TEXT,
  public_visible INTEGER NOT NULL DEFAULT 0 CHECK (public_visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (movement_id) REFERENCES movement_definitions(id),
  FOREIGN KEY (proof_media_id) REFERENCES community_media_assets(id) ON DELETE SET NULL,
  UNIQUE (member_id, movement_id),
  CHECK (progress_status != 'achieved' OR achieved_on IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS skill_progress_member_idx
  ON skill_progress(member_id, progress_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS skill_progress_public_idx
  ON skill_progress(member_id, public_visible, progress_status);

CREATE TABLE IF NOT EXISTS canonical_update_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'competition-date-status', 'competition-registration',
    'athlete-ranking', 'athlete-result', 'submission-status', 'team-event'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('competition', 'athlete', 'submission', 'team')),
  target_id TEXT NOT NULL,
  source_status TEXT NOT NULL CHECK (source_status IN ('approved-public', 'internal-review', 'sample', 'blocked')),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 240),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  occurred_at TEXT NOT NULL,
  produced_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS canonical_update_pending_idx
  ON canonical_update_events(produced_at, source_status, occurred_at);
