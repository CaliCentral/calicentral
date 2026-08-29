begin;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  slug extensions.citext not null unique,
  name text not null,
  organization_type text,
  website text,
  country text,
  description text not null default '',
  review_state text not null default 'draft'
    check (review_state in ('draft', 'in-review', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  permanent_id text not null unique,
  legacy_sanity_id text unique,
  slug extensions.citext not null unique,
  name text not null,
  display_name text,
  biography text not null default '',
  country text,
  administrative_area text,
  city text,
  disciplines text[] not null default '{}',
  specialties text[] not null default '{}',
  identity_state text not null default 'unconfirmed'
    check (identity_state in ('unconfirmed', 'identity-confirmed', 'disputed', 'retired')),
  editorial_state text not null default 'draft'
    check (editorial_state in ('draft', 'in-review', 'approved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.external_athlete_identities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  provider text not null,
  external_id text not null,
  external_url text,
  verification_state text not null default 'unverified'
    check (verification_state in ('unverified', 'source-confirmed', 'identity-confirmed', 'revoked', 'disputed')),
  source_record_id uuid references public.source_records(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (provider, external_id),
  unique (athlete_id, provider)
);

create table public.athlete_claims (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  claimant_member_id uuid not null references public.members(id) on delete restrict,
  submission_id text,
  claim_state text not null default 'submitted'
    check (claim_state in ('draft', 'submitted', 'in-review', 'approved', 'rejected', 'revoked')),
  evidence jsonb not null default '[]'::jsonb,
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, claimant_member_id)
);

create table public.athlete_profile_controls (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null unique references public.athletes(id) on delete restrict,
  member_id uuid not null unique references public.members(id) on delete restrict,
  athlete_claim_id uuid not null unique references public.athlete_claims(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'revoked')),
  reviewed_by uuid references public.members(id) on delete restrict,
  reviewed_by_principal text,
  reviewed_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reviewed_by is not null or reviewed_by_principal is not null),
  check (status <> 'revoked' or revoked_at is not null)
);

create table public.claimed_athlete_presentations (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  controlling_member_id uuid not null unique references public.members(id) on delete restrict,
  preferred_display_name text,
  biography text not null default '' check (char_length(biography) <= 1200),
  website text,
  training_location text not null default '' check (char_length(training_location) <= 160),
  social_links jsonb not null default '[]'::jsonb,
  specialties text[] not null default '{}',
  profile_media_id uuid,
  cover_media_id uuid,
  status text not null default 'active' check (status in ('active', 'hidden', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  organization_id uuid references public.organizations(id) on delete set null,
  slug extensions.citext not null unique,
  name text not null,
  short_name text,
  country text,
  city text,
  branding jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'prospective', 'active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_seasons (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  team_id uuid not null references public.teams(id) on delete cascade,
  season_label text not null,
  starts_on date,
  ends_on date,
  roster jsonb not null default '[]'::jsonb,
  source_record_id uuid references public.source_records(id) on delete restrict,
  unique (team_id, season_label)
);

create table public.team_affiliations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete restrict,
  member_id uuid references public.members(id) on delete restrict,
  role text not null,
  status text not null check (status in ('invited', 'active', 'declined', 'revoked', 'left')),
  public_visible boolean not null default false,
  starts_on date,
  ends_on date,
  check ((athlete_id is not null)::int + (member_id is not null)::int = 1)
);

create table public.rulesets (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  version text not null,
  status text not null check (status in ('draft', 'proposed', 'official', 'retired')),
  effective_on date,
  rules jsonb not null default '{}'::jsonb,
  unique (name, version)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  permanent_id text not null unique,
  organization_id uuid references public.organizations(id) on delete set null,
  ruleset_id uuid references public.rulesets(id) on delete set null,
  slug extensions.citext not null unique,
  name text not null,
  short_name text,
  status text not null,
  start_date date,
  end_date date,
  country text,
  administrative_area text,
  city text,
  venue_name text,
  summary text not null default '',
  disciplines text[] not null default '{}',
  operations jsonb not null default '{}'::jsonb,
  public_state text not null default 'draft'
    check (public_state in ('draft', 'in-review', 'published', 'cancelled', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.external_competition_identities (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete restrict,
  provider text not null,
  external_id text not null,
  external_url text,
  source_record_id uuid references public.source_records(id) on delete restrict,
  unique (provider, external_id),
  unique (competition_id, provider)
);

create table public.sporting_results (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  competition_id uuid not null references public.competitions(id) on delete restrict,
  athlete_id uuid references public.athletes(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict,
  ruleset_id uuid references public.rulesets(id) on delete set null,
  division text not null,
  event text not null,
  placement integer check (placement > 0),
  penalties numeric,
  result_status text not null check (result_status in (
    'imported', 'submitted', 'provisional', 'source-confirmed', 'official',
    'corrected', 'disputed', 'disqualified', 'withdrawn', 'superseded'
  )),
  source_record_id uuid not null references public.source_records(id) on delete restrict,
  supersedes_id uuid references public.sporting_results(id) on delete restrict,
  equipment_compliance jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((athlete_id is not null)::int + (team_id is not null)::int = 1)
);

create table public.sporting_result_performances (
  id uuid primary key default gen_random_uuid(),
  sporting_result_id uuid not null references public.sporting_results(id) on delete cascade,
  performance_order integer not null check (performance_order >= 0),
  movement text not null,
  value numeric,
  unit text,
  status text,
  detail jsonb not null default '{}'::jsonb,
  unique (sporting_result_id, performance_order),
  check ((value is null) = (unit is null))
);

create table public.ranking_providers (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  organization_id uuid references public.organizations(id) on delete set null,
  slug extensions.citext not null unique,
  name text not null,
  website text,
  status text not null default 'under-review' check (status in ('active', 'inactive', 'under-review')),
  integration_method text not null,
  attribution_requirement text not null,
  source_policy_notes text not null default '',
  last_reviewed_at timestamptz
);

create table public.ranking_systems (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  provider_id uuid not null references public.ranking_providers(id) on delete restrict,
  slug extensions.citext not null unique,
  name text not null,
  ranking_kind text not null,
  discipline text not null,
  movement text,
  category text,
  division text,
  weight_class text,
  sex_division text,
  age_group text,
  geographic_scope text not null,
  methodology_version text,
  methodology_notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive'))
);

create table public.ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  ranking_system_id uuid not null references public.ranking_systems(id) on delete restrict,
  ranking_date date not null,
  source_published_at timestamptz,
  checked_at timestamptz not null,
  season text,
  methodology_version text,
  source_record_id uuid not null references public.source_records(id) on delete restrict,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'in-review', 'published', 'withdrawn', 'superseded')),
  created_at timestamptz not null default now(),
  unique (ranking_system_id, ranking_date, source_record_id)
);

create table public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  ranking_snapshot_id uuid not null references public.ranking_snapshots(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  rank integer check (rank > 0),
  points numeric,
  rating numeric,
  source_value jsonb not null default '{}'::jsonb,
  entry_status text not null default 'ranked'
    check (entry_status in ('ranked', 'provisional', 'disqualified', 'withdrawn')),
  unique (ranking_snapshot_id, athlete_id),
  unique nulls not distinct (ranking_snapshot_id, rank)
);

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  member_id uuid references public.members(id) on delete set null,
  name text not null,
  slug extensions.citext unique,
  biography text not null default ''
);

create table public.video_series (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  slug extensions.citext not null unique,
  title text not null,
  description text not null default ''
);

create table public.editorial_content (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  content_type text not null check (content_type in ('story', 'video', 'page')),
  slug extensions.citext not null,
  title text not null,
  excerpt text not null default '',
  body jsonb not null default '[]'::jsonb,
  author_id uuid references public.authors(id) on delete set null,
  seo jsonb not null default '{}'::jsonb,
  prototype_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug)
);

create table public.stories (
  editorial_content_id uuid primary key references public.editorial_content(id) on delete cascade,
  category text,
  eyebrow text,
  published_at timestamptz,
  read_time_minutes integer check (read_time_minutes is null or read_time_minutes > 0),
  location text,
  featured boolean not null default false,
  issue_number integer,
  hero_media_id uuid,
  related_story_ids uuid[] not null default '{}'
);

create table public.videos (
  editorial_content_id uuid primary key references public.editorial_content(id) on delete cascade,
  video_series_id uuid references public.video_series(id) on delete set null,
  ownership_status text not null check (ownership_status in (
    'cali-central-original', 'third-party-attributed', 'source-unavailable'
  )),
  source_platform text,
  source_account text,
  original_post_url text,
  duration_seconds integer,
  poster_media_id uuid,
  chapters jsonb not null default '[]'::jsonb,
  credits jsonb not null default '[]'::jsonb,
  platform_metrics jsonb not null default '[]'::jsonb
);

create table public.editorial_revisions (
  id uuid primary key default gen_random_uuid(),
  editorial_content_id uuid not null references public.editorial_content(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  snapshot jsonb not null,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (editorial_content_id, revision_number)
);

create table public.editorial_publication_state (
  id uuid primary key default gen_random_uuid(),
  editorial_content_id uuid not null references public.editorial_content(id) on delete cascade,
  state text not null check (state in ('draft', 'in-review', 'approved', 'published', 'unpublished', 'archived')),
  changed_by uuid references public.members(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text,
  is_current boolean not null default true
);

create unique index editorial_publication_one_current_idx
  on public.editorial_publication_state (editorial_content_id) where is_current;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  owner_member_id uuid not null references public.members(id) on delete restrict,
  submission_type text not null check (submission_type in (
    'storyPitch', 'athleteNomination', 'competitionListing', 'mediaPitch',
    'correctionRequest', 'organizationClaim', 'videoSubmission',
    'productSubmission', 'teamApplication'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'inReview', 'revisionRequested', 'approved',
    'rejected', 'withdrawn', 'archived'
  )),
  payload jsonb not null default '{}'::jsonb,
  contributor_feedback text not null default '',
  private_editorial_notes jsonb not null default '[]'::jsonb,
  assigned_to uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operational_locks (
  purpose text primary key,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id boolean primary key default true check (id),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  organization_id uuid references public.organizations(id) on delete set null,
  slug extensions.citext not null unique,
  name text not null,
  description text not null default '',
  affiliate_url text,
  disclosure text,
  publication_state text not null default 'draft'
    check (publication_state in ('draft', 'in-review', 'published', 'archived'))
);

create index sporting_results_competition_idx on public.sporting_results (competition_id, result_status);
create index ranking_snapshots_system_date_idx on public.ranking_snapshots (ranking_system_id, ranking_date desc);
create index ranking_entries_snapshot_rank_idx on public.ranking_entries (ranking_snapshot_id, rank);
create index submissions_owner_idx on public.submissions (owner_member_id, updated_at desc);
create index submissions_queue_idx on public.submissions (status, updated_at desc);

commit;
