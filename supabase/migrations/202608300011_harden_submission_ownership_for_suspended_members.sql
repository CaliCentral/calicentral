begin;

-- The same class of gap 202608300003 closed for has_role/has_any_role/
-- has_capability exists here too, found while functionally verifying the
-- newly-ported Supabase-mode submission writes against real RLS identities:
-- submissions_owner_insert/submissions_owner_update authorize purely on
-- `owner_member_id = current_member_id()`, with no access_status check at
-- all. A suspended contributor is only actually stopped from creating or
-- editing a submission today because the app layer's
-- assertContributorMutationAccess (which requires 'active', not just
-- 'pending' the way profile edits allow) happens to run first -- confirmed
-- by directly inserting as a suspended member under real RLS with no
-- app-layer code path involved at all, which succeeded before this
-- migration. Any future write path that reaches these tables without going
-- through that specific check would silently bypass a suspension.
create or replace function private.current_member_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.members
    where id = private.current_member_id() and access_status = 'active'
  )
$$;

drop policy submissions_owner_insert on public.submissions;
create policy submissions_owner_insert on public.submissions for insert to authenticated
  with check (owner_member_id = private.current_member_id() and private.current_member_is_active() and status in ('draft','submitted'));

drop policy submissions_owner_update on public.submissions;
create policy submissions_owner_update on public.submissions for update to authenticated
  using (owner_member_id = private.current_member_id() and private.current_member_is_active() and status in ('draft','revisionRequested','submitted'))
  with check (owner_member_id = private.current_member_id() and private.current_member_is_active() and status in ('draft','revisionRequested','submitted','withdrawn'));

commit;
