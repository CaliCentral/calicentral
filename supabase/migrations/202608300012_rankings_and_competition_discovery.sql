begin;

-- A provider-native system key is the ranking identity. Titles remain display
-- text and may change without creating a second real-world system.
alter table public.ranking_systems
  add column external_system_key text,
  add column source_url text,
  add column lift_format text,
  add column equipment text,
  add column methodology_category text,
  add column system_authority text not null default 'external-provider'
    check (system_authority in ('external-provider', 'cali-central'));

create unique index ranking_systems_provider_external_key_unique
  on public.ranking_systems (provider_id, external_system_key)
  where external_system_key is not null;

alter table public.ranking_snapshots
  add column source_url text,
  add column source_content_hash text check (source_content_hash is null or source_content_hash ~ '^[0-9a-f]{64}$'),
  add column observed_at timestamptz,
  add column source_verification_state text not null default 'unverified'
    check (source_verification_state in ('unverified', 'source-confirmed', 'official', 'disputed', 'withdrawn'));

create unique index ranking_snapshots_system_content_unique
  on public.ranking_snapshots (ranking_system_id, source_content_hash)
  where source_content_hash is not null;

drop policy public_ranking_snapshots_select on public.ranking_snapshots;
create policy public_ranking_snapshots_select on public.ranking_snapshots
  for select to anon, authenticated using (
    (publication_status = 'published'
      and source_verification_state in ('source-confirmed', 'official')
      and source_url ~ '^https?://')
    or private.has_capability('ranking.write')
  );

drop policy public_ranking_entries_select on public.ranking_entries;
create policy public_ranking_entries_select on public.ranking_entries
  for select to anon, authenticated using (exists (
    select 1 from public.ranking_snapshots s
    where s.id = ranking_entries.ranking_snapshot_id
      and ((s.publication_status = 'published'
        and s.source_verification_state in ('source-confirmed', 'official')
        and s.source_url ~ '^https?://')
        or private.has_capability('ranking.write'))
  ));

-- Unresolved external rows are evidence, not disposable parser failures.
-- They remain unlinked until an exact external identity mapping is reviewed.
alter table public.ranking_entries
  alter column athlete_id drop not null,
  add column provider_entry_id text,
  add column provider_athlete_id text,
  add column source_display_name text,
  add constraint ranking_entries_identity_present
    check (athlete_id is not null or provider_athlete_id is not null);

alter table public.ranking_entries
  drop constraint ranking_entries_ranking_snapshot_id_athlete_id_key;

create unique index ranking_entries_snapshot_external_entry_unique
  on public.ranking_entries (ranking_snapshot_id, provider_entry_id)
  where provider_entry_id is not null;

create table public.ranking_system_match_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.ranking_providers(id) on delete restrict,
  external_system_key text not null,
  source_url text not null,
  source_dimensions jsonb not null,
  candidate_system_ids uuid[] not null default '{}',
  match_outcome text not null check (match_outcome in (
    'EXACT_MATCH', 'EXTERNAL_ONLY_NEW_SYSTEM', 'AMBIGUOUS_REVIEW', 'UNSUPPORTED', 'UNKNOWN'
  )),
  review_state text not null default 'pending' check (review_state in ('pending', 'resolved', 'rejected', 'superseded')),
  resolution_note text,
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_id, external_system_key, match_outcome, review_state)
);

alter table public.source_adapters
  add column base_url text,
  add column allowed_domains text[] not null default '{}',
  add column trust_level text not null default 'review-required'
    check (trust_level in ('official', 'authoritative', 'review-required', 'untrusted')),
  add column parser_version text,
  add column cadence_minutes integer check (cadence_minutes is null or cadence_minutes >= 60),
  add column capabilities text[] not null default '{}',
  add column identity_strategy text,
  add column fetch_limits jsonb not null default '{}'::jsonb,
  add column last_error text;

update public.source_adapters
set base_url = 'https://rankings.officialstreetlifting.com/',
    allowed_domains = array['rankings.officialstreetlifting.com'],
    trust_level = 'official',
    parser_version = 'osl-html-v2',
    cadence_minutes = 60,
    capabilities = array['competitions', 'athletes', 'results', 'rankings'],
    identity_strategy = 'provider + URL path identifier',
    fetch_limits = '{"maxPagesPerSurface":250,"maxResponseBytes":5000000,"timeoutMs":20000,"conditionalRequests":true}'::jsonb
where slug = 'official-streetlifting';

create table public.source_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid not null references public.source_adapters(id) on delete restrict,
  run_key text not null unique,
  started_at timestamptz not null,
  completed_at timestamptz,
  mode text not null check (mode in ('local-rehearsal', 'preview-read-only', 'scheduled')),
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed')),
  coverage jsonb not null default '{}'::jsonb,
  error_summary text,
  created_at timestamptz not null default now()
);

create table public.competition_source_observations (
  id uuid primary key default gen_random_uuid(),
  source_discovery_run_id uuid not null references public.source_discovery_runs(id) on delete restrict,
  raw_snapshot_id uuid not null references public.raw_source_snapshots(id) on delete restrict,
  provider text not null,
  external_competition_id text not null,
  canonical_competition_id uuid references public.competitions(id) on delete restrict,
  source_url text not null,
  observed_at timestamptz not null,
  source_values jsonb not null,
  normalized_values jsonb not null,
  diff jsonb not null default '{}'::jsonb,
  decision text not null check (decision in ('new-candidate', 'matched', 'updated-candidate', 'unchanged', 'ambiguous', 'review-missing')),
  created_at timestamptz not null default now(),
  unique (source_discovery_run_id, provider, external_competition_id)
);

create table public.competition_roster_observations (
  id uuid primary key default gen_random_uuid(),
  competition_source_observation_id uuid not null references public.competition_source_observations(id) on delete restrict,
  provider_athlete_id text not null,
  athlete_id uuid references public.athletes(id) on delete restrict,
  source_display_name text not null,
  roster_state text not null check (roster_state in ('registered', 'confirmed', 'result-participant', 'withdrawn', 'unknown')),
  source_evidence jsonb not null default '{}'::jsonb,
  unique (competition_source_observation_id, provider_athlete_id)
);

create trigger competition_source_observations_immutable
  before update or delete on public.competition_source_observations
  for each row execute function private.reject_audit_mutation();
create trigger competition_roster_observations_immutable
  before update or delete on public.competition_roster_observations
  for each row execute function private.reject_audit_mutation();

alter table public.ranking_system_match_reviews enable row level security;
alter table public.ranking_system_match_reviews force row level security;
alter table public.source_discovery_runs enable row level security;
alter table public.source_discovery_runs force row level security;
alter table public.competition_source_observations enable row level security;
alter table public.competition_source_observations force row level security;
alter table public.competition_roster_observations enable row level security;
alter table public.competition_roster_observations force row level security;

grant select, insert, update, delete on public.ranking_system_match_reviews to authenticated;
grant select on public.source_discovery_runs, public.competition_source_observations,
  public.competition_roster_observations to authenticated;

create policy ranking_match_review_authority on public.ranking_system_match_reviews
  for all to authenticated using (private.has_capability('ranking.write'))
  with check (private.has_capability('ranking.write'));
create policy source_discovery_runs_admin_read on public.source_discovery_runs
  for select to authenticated using (private.has_role('admin'));
create policy competition_observations_admin_read on public.competition_source_observations
  for select to authenticated using (private.has_role('admin'));
create policy competition_rosters_admin_read on public.competition_roster_observations
  for select to authenticated using (private.has_role('admin'));

commit;
