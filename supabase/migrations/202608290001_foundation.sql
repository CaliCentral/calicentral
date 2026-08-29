begin;

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete restrict,
  legacy_principal_id text unique,
  email_normalized extensions.citext,
  access_status text not null default 'pending'
    check (access_status in ('active', 'pending', 'suspended', 'archived')),
  last_signed_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.profiles (
  member_id uuid primary key references public.members(id) on delete cascade,
  handle extensions.citext unique,
  display_name text not null check (char_length(display_name) between 1 and 160),
  avatar_url text,
  cover_image_url text,
  biography text not null default '' check (char_length(biography) <= 2000),
  country text,
  administrative_area text,
  city text,
  preferred_timezone text,
  interests text[] not null default '{}',
  disciplines text[] not null default '{}',
  public_roles text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'hidden', 'suspended', 'archived')),
  profile_configured boolean not null default false,
  profile_public boolean not null default false,
  show_location boolean not null default false,
  show_social_accounts boolean not null default false,
  show_media boolean not null default false,
  discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  name text primary key check (name in ('contributor', 'editor', 'admin', 'moderator')),
  description text not null
);

insert into public.roles (name, description) values
  ('contributor', 'Contributes and manages owned records'),
  ('editor', 'Reviews and publishes editorial records'),
  ('admin', 'Administers access and protected platform state'),
  ('moderator', 'Moderates community and media records');

create table public.capabilities (
  name text primary key,
  description text not null
);

insert into public.capabilities (name, description) values
  ('editorial.review', 'Review editorial records'),
  ('editorial.publish', 'Publish or unpublish editorial records'),
  ('sport.write_source_truth', 'Write source-derived sporting facts'),
  ('ranking.write', 'Write attributed ranking history'),
  ('community.moderate', 'Moderate community records'),
  ('media.moderate', 'Moderate uploaded media'),
  ('access.manage', 'Manage member roles and access');

create table public.member_roles (
  member_id uuid not null references public.members(id) on delete cascade,
  role_name text not null references public.roles(name) on delete restrict,
  granted_by uuid references public.members(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (member_id, role_name)
);

create table public.member_capabilities (
  member_id uuid not null references public.members(id) on delete cascade,
  capability_name text not null references public.capabilities(name) on delete restrict,
  granted_by uuid references public.members(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (member_id, capability_name)
);

create or replace function private.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select id from public.members where auth_user_id = auth.uid() limit 1
$$;

create or replace function private.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.member_roles
    where member_id = private.current_member_id()
      and role_name = required_role
      and revoked_at is null
  )
$$;

create or replace function private.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.member_roles
    where member_id = private.current_member_id()
      and role_name = any(required_roles)
      and revoked_at is null
  )
$$;

create or replace function private.has_capability(required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.has_role('admin') or exists (
    select 1 from public.member_capabilities
    where member_id = private.current_member_id()
      and capability_name = required_capability
      and revoked_at is null
  )
$$;

create or replace function private.provision_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  new_member_id uuid;
  candidate_name text;
begin
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Member'
  );

  insert into public.members (auth_user_id, email_normalized, last_signed_in_at)
  values (new.id, lower(new.email), now())
  returning id into new_member_id;

  insert into public.profiles (member_id, display_name)
  values (new_member_id, left(candidate_name, 160));

  insert into public.member_roles (member_id, role_name)
  values (new_member_id, 'contributor');
  return new;
end;
$$;

create trigger provision_auth_user_after_insert
  after insert on auth.users
  for each row execute function private.provision_auth_user();

create table public.source_records (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  source_type text not null,
  public_url text,
  title text,
  external_record_id text,
  publication_date date,
  checked_at timestamptz,
  verification_state text not null default 'unverified'
    check (verification_state in (
      'unverified', 'submitted', 'provisional', 'source-confirmed', 'official',
      'corrected', 'disputed', 'disqualified', 'withdrawn', 'superseded',
      'identity-confirmed', 'editorial-reviewed', 'editorially-verified'
    )),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (provider, source_type, external_record_id)
);

create table public.provenance (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  field_path text,
  source_record_id uuid not null references public.source_records(id) on delete restrict,
  trust_class text not null check (trust_class in (
    'source-confirmed', 'identity-confirmed', 'editorial-reviewed',
    'official-result', 'external-ranking', 'cali-central-ranking',
    'self-reported', 'sample'
  )),
  assertion_status text not null default 'active'
    check (assertion_status in ('active', 'disputed', 'superseded', 'withdrawn')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (target_type, target_id, field_path, source_record_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_member_id uuid references public.members(id) on delete set null,
  actor_principal text,
  target_type text not null,
  target_id text not null,
  summary text not null check (char_length(summary) between 1 and 500),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (actor_member_id is not null or actor_principal is not null)
);

create or replace function private.reject_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit events are immutable';
end;
$$;

create trigger audit_events_immutable
  before update or delete on public.audit_events
  for each row execute function private.reject_audit_mutation();

create index profiles_public_directory_idx
  on public.profiles (profile_public, discoverable, updated_at desc);
create index member_roles_active_idx
  on public.member_roles (member_id, role_name) where revoked_at is null;
create index provenance_target_idx on public.provenance (target_type, target_id);
create index audit_events_target_idx on public.audit_events (target_type, target_id, created_at desc);

commit;
