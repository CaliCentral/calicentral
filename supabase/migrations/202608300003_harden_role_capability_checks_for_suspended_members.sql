-- access_status ('active'/'pending'/'suspended'/'archived') is enforced
-- against suspension everywhere in the Next.js app layer (requireRole,
-- canMutateContributorContent, requireCommunityActor, etc.) but was never
-- checked inside these RLS gate functions themselves. RLS policies built on
-- has_role/has_any_role/has_capability would still authorize a suspended-but
-- -still-role-holding member's direct database writes -- the suspension is
-- only actually stopped today because every app-layer call site happens to
-- check access_status before reaching the database. Any future write path
-- that doesn't go through one of those specific checks (a new API route, a
-- bug in one of them) would silently bypass a suspension entirely.
--
-- This only narrows what these three functions authorize -- every existing
-- caller already assumes an active member, since access_status defaults to
-- 'active'-equivalent membership in every test fixture and real signup path
-- -- so it cannot newly break a legitimate active member's access. It
-- deliberately does NOT touch private.current_member_id(), which self-select
-- policies rely on so a suspended member can still see their own status.
create or replace function private.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.member_roles mr
    join public.members m on m.id = mr.member_id
    where mr.member_id = private.current_member_id()
      and mr.role_name = required_role
      and mr.revoked_at is null
      and m.access_status = 'active'
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
    select 1 from public.member_roles mr
    join public.members m on m.id = mr.member_id
    where mr.member_id = private.current_member_id()
      and mr.role_name = any(required_roles)
      and mr.revoked_at is null
      and m.access_status = 'active'
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
    select 1 from public.member_capabilities mc
    join public.members m on m.id = mc.member_id
    where mc.member_id = private.current_member_id()
      and mc.capability_name = required_capability
      and mc.revoked_at is null
      and m.access_status = 'active'
  )
$$;
