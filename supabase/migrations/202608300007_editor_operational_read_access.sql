begin;

-- Editors review submissions and moderate contributors under `requireEditor`
-- on /admin, /admin/submissions/[id], and /admin/contributors/[id], but three
-- RLS policies only recognized 'admin'/'moderator' for cross-member reads,
-- silently returning empty contributor references and audit history for any
-- editor who isn't also an admin. This widens those three policies to match
-- the 'editor' + 'admin' pattern already used for equivalent operational
-- reads elsewhere in this file (e.g. submissions_owner_select,
-- public_athletes_select), rather than inventing a new access pattern.

drop policy profiles_public_select on public.profiles;
create policy profiles_public_select on public.profiles
  for select to anon, authenticated
  using (
    (profile_public and discoverable and status = 'active' and not private.members_block_each_other(private.current_member_id(), member_id))
    or member_id = private.current_member_id()
    or private.has_any_role(array['admin','moderator','editor'])
  );

drop policy profile_social_public_select on public.profile_social_accounts;
create policy profile_social_public_select on public.profile_social_accounts
  for select to anon, authenticated
  using (
    (visible and exists (
      select 1 from public.profiles p
      where p.member_id = profile_social_accounts.member_id
        and p.profile_public and p.show_social_accounts
    ) and not private.members_block_each_other(private.current_member_id(), member_id))
    or member_id = private.current_member_id()
    or private.has_any_role(array['admin','moderator','editor'])
  );

drop policy audit_events_admin_select on public.audit_events;
create policy audit_events_admin_select on public.audit_events
  for select to authenticated
  using (private.has_any_role(array['admin','editor']));

commit;
