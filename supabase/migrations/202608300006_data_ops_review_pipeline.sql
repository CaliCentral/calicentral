begin;

create table public.source_adapters (
  id uuid primary key default gen_random_uuid(),
  slug extensions.citext not null unique,
  name text not null,
  adapter_kind text not null check (adapter_kind in ('official-site', 'pdf', 'api', 'permitted-social')),
  target_domain text not null,
  parser_strategy text not null default 'deterministic' check (parser_strategy in ('deterministic', 'ai-extraction')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'retired')),
  schedule_cron text,
  last_run_at timestamptz,
  last_success_at timestamptz,
  consecutive_failure_count integer not null default 0 check (consecutive_failure_count >= 0),
  health_state text not null default 'unknown' check (health_state in ('unknown', 'healthy', 'degraded', 'failing')),
  access_rules_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or nullif(access_rules_note, '') is not null)
);

create table public.raw_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid not null references public.source_adapters(id) on delete restrict,
  source_url text not null,
  source_entity_type text not null,
  source_entity_identifier text,
  fetched_at timestamptz not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  content_type text not null,
  raw_payload_ref text not null,
  http_status integer check (http_status between 100 and 599),
  parser_version text not null,
  source_revision_marker text,
  fetch_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_adapter_id, source_url, content_hash)
);

create table public.source_extractions (
  id uuid primary key default gen_random_uuid(),
  raw_snapshot_id uuid not null references public.raw_source_snapshots(id) on delete restrict,
  extraction_method text not null check (extraction_method in ('deterministic-parser', 'ai-extraction')),
  parser_version text,
  ai_model_id text,
  ai_router_provider text,
  extracted_at timestamptz not null default now(),
  extracted_payload jsonb not null,
  extraction_confidence numeric check (extraction_confidence between 0 and 1),
  extraction_status text not null default 'succeeded' check (extraction_status in ('succeeded', 'partial', 'failed')),
  failure_reason text,
  unique (raw_snapshot_id, extraction_method, parser_version)
);

create table public.identity_resolution_attempts (
  id uuid primary key default gen_random_uuid(),
  source_extraction_id uuid not null references public.source_extractions(id) on delete restrict,
  candidate_entity_type text not null check (candidate_entity_type in ('athlete', 'organization', 'competition', 'team')),
  external_provider text not null,
  external_id text not null,
  candidate_entity_id uuid,
  match_basis jsonb not null default '{}'::jsonb,
  match_confidence numeric not null check (match_confidence between 0 and 1),
  resolution_state text not null default 'proposed' check (resolution_state in ('proposed', 'confirmed', 'rejected', 'ambiguous')),
  created_at timestamptz not null default now(),
  check (not (match_basis ? 'name_only'))
);

create table public.change_proposals (
  id uuid primary key default gen_random_uuid(),
  source_extraction_id uuid not null references public.source_extractions(id) on delete restrict,
  identity_resolution_attempt_id uuid references public.identity_resolution_attempts(id) on delete set null,
  target_table text not null,
  target_id uuid,
  proposed_change jsonb not null,
  change_kind text not null check (change_kind in ('create', 'update', 'flag-stale', 'flag-duplicate', 'flag-conflict')),
  confidence numeric not null check (confidence between 0 and 1),
  risk_tier text not null check (risk_tier in ('low', 'medium', 'high')),
  review_state text not null default 'pending' check (review_state in ('pending', 'auto-applied', 'approved', 'rejected', 'superseded')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  applied_source_record_id uuid references public.source_records(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((review_state in ('pending', 'auto-applied')) or reviewed_at is not null)
);

create table public.auto_apply_policies (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  field_path text not null,
  max_risk_tier text not null check (max_risk_tier = 'low'),
  min_confidence numeric not null check (min_confidence between 0.9 and 1),
  requires_second_model_verification boolean not null default true,
  enabled boolean not null default false,
  created_by uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (target_table, field_path)
);

create trigger raw_source_snapshots_immutable
  before update or delete on public.raw_source_snapshots
  for each row execute function private.reject_audit_mutation();
create trigger source_extractions_immutable
  before update or delete on public.source_extractions
  for each row execute function private.reject_audit_mutation();

alter table public.source_adapters enable row level security;
alter table public.source_adapters force row level security;
alter table public.raw_source_snapshots enable row level security;
alter table public.raw_source_snapshots force row level security;
alter table public.source_extractions enable row level security;
alter table public.source_extractions force row level security;
alter table public.identity_resolution_attempts enable row level security;
alter table public.identity_resolution_attempts force row level security;
alter table public.change_proposals enable row level security;
alter table public.change_proposals force row level security;
alter table public.auto_apply_policies enable row level security;
alter table public.auto_apply_policies force row level security;

grant select on public.source_adapters, public.raw_source_snapshots, public.source_extractions,
  public.identity_resolution_attempts, public.change_proposals, public.auto_apply_policies to authenticated;
grant insert, update, delete on public.source_adapters, public.identity_resolution_attempts,
  public.change_proposals, public.auto_apply_policies to authenticated;

create policy data_ops_admin_all_adapters on public.source_adapters for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy data_ops_admin_read_snapshots on public.raw_source_snapshots for select to authenticated
  using (private.has_role('admin'));
create policy data_ops_admin_read_extractions on public.source_extractions for select to authenticated
  using (private.has_role('admin'));
create policy data_ops_admin_all_resolutions on public.identity_resolution_attempts for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy data_ops_admin_all_proposals on public.change_proposals for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy data_ops_admin_all_auto_apply on public.auto_apply_policies for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));

insert into public.source_adapters (
  slug, name, adapter_kind, target_domain, parser_strategy, status, access_rules_note
) values (
  'official-streetlifting',
  'Official Streetlifting',
  'official-site',
  'rankings.officialstreetlifting.com',
  'deterministic',
  'paused',
  'Public server-rendered pages reviewed 2026-08-30; no documented API or machine-use agreement found. Source authorization required before scheduled fetching or hosted import.'
);

commit;
