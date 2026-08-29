begin;

create table public.profile_social_accounts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  platform text not null,
  url text not null,
  handle text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'confirmed', 'revoked')),
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, platform, url)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  author_member_id uuid not null references public.members(id) on delete restrict,
  body text not null default '',
  post_type text not null default 'general'
    check (post_type in ('general', 'training', 'pr', 'skill', 'competition', 'photo', 'video')),
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  status text not null default 'published'
    check (status in ('draft', 'published', 'hidden', 'archived', 'deleted')),
  canonical_target_type text
    check (canonical_target_type in ('story', 'athlete', 'team', 'competition', 'organization', 'video')),
  canonical_target_id text,
  repost_of_post_id uuid references public.posts(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((canonical_target_type is null) = (canonical_target_id is null)),
  check (char_length(body) > 0 or canonical_target_id is not null or repost_of_post_id is not null)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  owner_member_id uuid not null references public.members(id) on delete restrict,
  storage_provider text not null default 'r2' check (storage_provider in ('r2')),
  purpose text not null check (purpose in (
    'profile-avatar', 'profile-cover', 'post-image', 'post-video',
    'athlete-avatar', 'athlete-cover', 'skill-proof', 'editorial-image', 'video-poster'
  )),
  storage_key text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  checksum_sha256 text,
  upload_status text not null default 'pending'
    check (upload_status in ('pending', 'uploaded', 'failed', 'deleted')),
  moderation_state text not null default 'pending'
    check (moderation_state in ('pending', 'approved', 'rejected', 'removed')),
  removal_state text not null default 'active'
    check (removal_state in ('active', 'owner-removed', 'moderator-removed', 'purge-pending', 'purged', 'legal-hold')),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  moderation_note text not null default '',
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_by_principal text,
  reviewed_at timestamptz,
  removed_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (moderation_state <> 'approved' or upload_status = 'uploaded'),
  check (removal_state = 'active' or removed_at is not null),
  check (upload_status <> 'deleted' or removal_state in ('purged', 'legal-hold'))
);

alter table public.claimed_athlete_presentations
  add constraint claimed_athlete_profile_media_fk foreign key (profile_media_id)
    references public.media_assets(id) on delete set null,
  add constraint claimed_athlete_cover_media_fk foreign key (cover_media_id)
    references public.media_assets(id) on delete set null;

alter table public.stories
  add constraint story_hero_media_fk foreign key (hero_media_id)
    references public.media_assets(id) on delete set null;
alter table public.videos
  add constraint video_poster_media_fk foreign key (poster_media_id)
    references public.media_assets(id) on delete set null;

create table public.media_links (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid references public.media_assets(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  target_type text,
  target_id uuid,
  external_url text,
  media_kind text not null check (media_kind in ('image', 'video', 'external-embed')),
  alt_text text,
  creator_member_id uuid references public.members(id) on delete set null,
  creator_name text,
  rights_status text not null default 'unconfirmed'
    check (rights_status in ('unconfirmed', 'member-owned', 'permission-confirmed', 'editorial-owned')),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  check (media_asset_id is not null or external_url is not null),
  check (post_id is not null or (target_type is not null and target_id is not null))
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  target_type text not null check (target_type in ('post', 'story', 'video')),
  target_id text not null,
  parent_comment_id uuid references public.comments(id) on delete restrict,
  author_member_id uuid not null references public.members(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published'
    check (status in ('published', 'hidden', 'archived', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.likes (
  member_id uuid not null references public.members(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'story', 'athlete', 'team', 'competition', 'video')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (member_id, target_type, target_id)
);

create table public.reposts (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  member_id uuid not null references public.members(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'story', 'video')),
  target_id text not null,
  activity_post_id uuid not null unique references public.posts(id) on delete cascade,
  quote_body text not null default '' check (char_length(quote_body) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, target_type, target_id)
);

create table public.saves (
  member_id uuid not null references public.members(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'story', 'athlete', 'team', 'competition', 'video', 'product')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (member_id, target_type, target_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  owner_member_id uuid not null references public.members(id) on delete restrict,
  name text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_member_id, name)
);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'story', 'athlete', 'team', 'competition', 'video', 'product')),
  target_id text not null,
  display_order integer not null default 0 check (display_order >= 0),
  added_at timestamptz not null default now(),
  primary key (collection_id, target_type, target_id)
);

create table public.follows (
  follower_member_id uuid not null references public.members(id) on delete cascade,
  target_type text not null check (target_type in ('member', 'athlete', 'team', 'competition', 'organization')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_member_id, target_type, target_id),
  check (target_type <> 'member' or follower_member_id::text <> target_id)
);

create table public.blocks (
  blocker_member_id uuid not null references public.members(id) on delete cascade,
  blocked_member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_member_id, blocked_member_id),
  check (blocker_member_id <> blocked_member_id)
);

create table public.mutes (
  muter_member_id uuid not null references public.members(id) on delete cascade,
  muted_member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_member_id, muted_member_id),
  check (muter_member_id <> muted_member_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  reporter_member_id uuid not null references public.members(id) on delete restrict,
  target_type text not null check (target_type in ('member', 'post', 'comment', 'media')),
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'submitted'
    check (status in ('submitted', 'in-review', 'resolved', 'dismissed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_member_id uuid references public.members(id) on delete restrict,
  actor_principal text,
  target_type text not null,
  target_id text not null,
  summary text not null check (char_length(summary) between 1 and 500),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (actor_member_id is not null or actor_principal is not null)
);

create trigger moderation_events_immutable
  before update or delete on public.moderation_events
  for each row execute function private.reject_audit_mutation();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  member_id uuid not null references public.members(id) on delete cascade,
  notification_type text not null,
  actor_member_id uuid references public.members(id) on delete set null,
  target_type text,
  target_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  member_id uuid primary key references public.members(id) on delete cascade,
  social_enabled boolean not null default true,
  competition_enabled boolean not null default true,
  claim_submission_enabled boolean not null default true,
  email_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  team_id uuid not null references public.teams(id) on delete restrict,
  member_id uuid not null references public.members(id) on delete restrict,
  role text not null check (role in ('captain', 'athlete', 'reserve', 'coach', 'manager', 'administrator', 'media-manager')),
  status text not null check (status in ('invited', 'active', 'declined', 'revoked', 'left')),
  public_visible boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, member_id, role)
);

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  team_id uuid not null references public.teams(id) on delete restrict,
  invited_by_member_id uuid not null references public.members(id) on delete restrict,
  invited_member_id uuid references public.members(id) on delete restrict,
  private_invitation_email extensions.citext,
  proposed_role text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (invited_member_id is not null or private_invitation_email is not null)
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  member_id uuid not null references public.members(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role text not null check (role in ('owner', 'administrator', 'editor', 'commerce-manager', 'media-manager', 'representative')),
  capabilities text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'revoked', 'expired')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_by_principal text,
  reviewed_at timestamptz,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, member_id),
  check (status <> 'active' or ((reviewed_by is not null or reviewed_by_principal is not null) and reviewed_at is not null and granted_at is not null)),
  check (status not in ('revoked', 'expired') or revoked_at is not null)
);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  slug extensions.citext not null unique,
  name text not null,
  category text not null check (category in ('strength', 'skill', 'hold', 'conditioning', 'mobility', 'freestyle', 'other')),
  measurement_types text[] not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  owner_member_id uuid not null references public.members(id) on delete cascade,
  session_date date not null,
  title text not null default '' check (char_length(title) <= 120),
  notes text not null default '' check (char_length(notes) <= 4000),
  bodyweight_kg numeric check (bodyweight_kg between 20 and 350),
  duration_seconds integer check (duration_seconds between 1 and 86400),
  visibility text not null default 'private' check (visibility in ('private', 'followers', 'public')),
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'deleted' or deleted_at is not null)
);

create table public.training_session_movements (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  movement_id uuid references public.movements(id) on delete restrict,
  custom_movement_name text,
  display_order integer not null default 0 check (display_order >= 0),
  notes text not null default '' check (char_length(notes) <= 1000),
  check (movement_id is not null or char_length(custom_movement_name) between 1 and 120),
  unique (session_id, display_order)
);

create table public.training_sets (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  session_movement_id uuid not null references public.training_session_movements(id) on delete cascade,
  set_order integer not null check (set_order >= 1),
  reps integer check (reps between 0 and 10000),
  added_load_kg numeric check (added_load_kg between -100 and 1000),
  total_weight_kg numeric check (total_weight_kg between 0 and 1500),
  duration_seconds numeric check (duration_seconds between 0 and 86400),
  distance_meters numeric check (distance_meters between 0 and 1000000),
  rpe numeric check (rpe between 0 and 10),
  rir numeric check (rir between 0 and 20),
  completion text check (completion in ('attempted', 'completed', 'failed')),
  progression text check (progression is null or char_length(progression) <= 120),
  score numeric,
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (session_movement_id, set_order),
  check (num_nonnulls(reps, added_load_kg, total_weight_kg, duration_seconds, distance_meters, completion, progression, score) > 0)
);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  member_id uuid not null references public.members(id) on delete cascade,
  movement_id uuid references public.movements(id) on delete restrict,
  custom_movement_name text,
  record_type text not null check (record_type in (
    'maximum-added-weight', 'total-system-weight', 'repetition-maximum',
    'max-repetitions', 'hold-duration', 'skill-achievement',
    'competition-total', 'competition-score'
  )),
  value numeric not null,
  unit text not null check (unit in ('kg', 'lb', 'reps', 'seconds', 'points', 'completion')),
  repetitions integer check (repetitions between 1 and 10000),
  achieved_on date not null,
  source_type text not null check (source_type in (
    'self-reported', 'training-recorded', 'competition-linked',
    'source-confirmed', 'editorially-verified'
  )),
  training_set_id uuid references public.training_sets(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete restrict,
  source_record_id uuid references public.source_records(id) on delete restrict,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'linked', 'source-confirmed', 'editorially-verified', 'disputed')),
  notes text not null default '' check (char_length(notes) <= 1000),
  public_visible boolean not null default false,
  status text not null default 'active' check (status in ('active', 'superseded', 'removed')),
  created_at timestamptz not null default now(),
  check (movement_id is not null or char_length(custom_movement_name) between 1 and 120),
  check (source_type <> 'training-recorded' or training_set_id is not null),
  check (source_type <> 'competition-linked' or competition_id is not null),
  check (source_type not in ('source-confirmed', 'editorially-verified') or source_record_id is not null)
);

create table public.skill_progress (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  member_id uuid not null references public.members(id) on delete cascade,
  movement_id uuid not null references public.movements(id) on delete restrict,
  progress_status text not null check (progress_status in ('not-started', 'working-on', 'achieved')),
  achieved_on date,
  notes text not null default '' check (char_length(notes) <= 1000),
  proof_media_id uuid references public.media_assets(id) on delete set null,
  public_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, movement_id),
  check (progress_status <> 'achieved' or achieved_on is not null)
);

create table public.canonical_update_events (
  id uuid primary key default gen_random_uuid(),
  legacy_d1_id text unique,
  event_key text not null unique,
  event_type text not null check (event_type in (
    'competition-date-status', 'competition-registration', 'athlete-ranking',
    'athlete-result', 'submission-status', 'team-event'
  )),
  target_type text not null check (target_type in ('competition', 'athlete', 'submission', 'team')),
  target_id text not null,
  source_status text not null check (source_status in ('approved-public', 'internal-review', 'sample', 'blocked')),
  summary text not null check (char_length(summary) between 1 and 240),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  produced_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.movements (legacy_d1_id, slug, name, category, measurement_types) values
  ('movement.pull-up', 'pull-up', 'Pull-Up', 'strength', array['reps','weight-reps']),
  ('movement.weighted-pull-up', 'weighted-pull-up', 'Weighted Pull-Up', 'strength', array['weight-reps','total-weight','reps']),
  ('movement.chin-up', 'chin-up', 'Chin-Up', 'strength', array['reps','weight-reps']),
  ('movement.dip', 'dip', 'Dip', 'strength', array['reps','weight-reps']),
  ('movement.weighted-dip', 'weighted-dip', 'Weighted Dip', 'strength', array['weight-reps','total-weight','reps']),
  ('movement.muscle-up', 'muscle-up', 'Muscle-Up', 'skill', array['completion','reps','weight-reps']),
  ('movement.weighted-muscle-up', 'weighted-muscle-up', 'Weighted Muscle-Up', 'strength', array['weight-reps','total-weight','reps']),
  ('movement.push-up', 'push-up', 'Push-Up', 'strength', array['reps','weight-reps']),
  ('movement.handstand', 'handstand', 'Handstand', 'hold', array['hold-duration','completion']),
  ('movement.handstand-push-up', 'handstand-push-up', 'Handstand Push-Up', 'skill', array['reps','completion']),
  ('movement.front-lever', 'front-lever', 'Front Lever', 'hold', array['hold-duration','progression','completion']),
  ('movement.back-lever', 'back-lever', 'Back Lever', 'hold', array['hold-duration','progression','completion']),
  ('movement.planche', 'planche', 'Planche', 'hold', array['hold-duration','progression','completion']),
  ('movement.l-sit', 'l-sit', 'L-Sit', 'hold', array['hold-duration','completion']),
  ('movement.human-flag', 'human-flag', 'Human Flag', 'hold', array['hold-duration','progression','completion']),
  ('movement.one-arm-pull-up', 'one-arm-pull-up', 'One-Arm Pull-Up', 'skill', array['completion','reps','progression']),
  ('movement.pistol-squat', 'pistol-squat', 'Pistol Squat', 'strength', array['reps','weight-reps','completion']),
  ('movement.squat', 'squat', 'Squat', 'strength', array['weight-reps','total-weight','reps']),
  ('movement.freestyle', 'freestyle', 'Freestyle Skills', 'freestyle', array['completion','score','duration']);

create index posts_public_feed_idx on public.posts (status, visibility, created_at desc);
create index posts_author_idx on public.posts (author_member_id, created_at desc);
create index comments_target_idx on public.comments (target_type, target_id, status, created_at);
create index reports_queue_idx on public.reports (status, created_at);
create index notifications_unread_idx on public.notifications (member_id, read_at, created_at desc);
create index media_assets_moderation_idx on public.media_assets (moderation_state, upload_status, created_at);
create index media_assets_owner_idx on public.media_assets (owner_member_id, purpose, created_at desc);
create index training_sessions_owner_date_idx on public.training_sessions (owner_member_id, status, session_date desc);
create index personal_records_member_history_idx on public.personal_records (member_id, movement_id, record_type, achieved_on desc);

commit;
