begin;

-- The Sanity-mode admin-removal guard (assertAdminRemovalIsSafe) enforces
-- "at least one effective administrator must remain" at the application
-- layer, via an app-level lock document plus a recount immediately before
-- the mutation commits. Supabase mode has no contributor role/access write
-- path yet at all, so rather than reimplement that same app-level pattern
-- (and risk a second, subtly different copy of a security-sensitive
-- invariant), this enforces the invariant once, at the database layer, for
-- every future write path -- Supabase-mode server actions, a future admin
-- console, or a raw SQL session -- via the Supabase role model itself
-- (member_roles + members.access_status), not a fresh ad hoc mechanism.
--
-- This only covers admin roles actually recorded in member_roles; it cannot
-- see the app's bootstrap-email allowlist (an environment-level config, not
-- database state), so an operator relying solely on a bootstrap email with
-- no corresponding admin role row is not protected by this trigger -- that
-- case remains the application layer's responsibility, same as today.

create or replace function private.assert_admin_removal_is_safe()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  remaining_admins integer;
  removed_member_id uuid;
begin
  if TG_TABLE_NAME = 'member_roles' then
    if OLD.role_name <> 'admin' or OLD.revoked_at is not null then
      return coalesce(NEW, OLD);
    end if;
    if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and NEW.revoked_at is not null) then
      select count(*) into remaining_admins
        from public.member_roles mr
        join public.members m on m.id = mr.member_id
        where mr.role_name = 'admin'
          and mr.revoked_at is null
          and mr.member_id <> OLD.member_id
          and m.access_status = 'active';

      if remaining_admins = 0 then
        raise exception 'At least one active administrator must remain.';
      end if;
    end if;
    return coalesce(NEW, OLD);
  end if;

  if TG_TABLE_NAME = 'members' then
    if OLD.access_status <> 'active' or NEW.access_status = 'active' then
      return NEW;
    end if;

    removed_member_id := OLD.id;

    if exists (
      select 1 from public.member_roles
      where member_id = removed_member_id and role_name = 'admin' and revoked_at is null
    ) then
      select count(*) into remaining_admins
        from public.member_roles mr
        join public.members m on m.id = mr.member_id
        where mr.role_name = 'admin'
          and mr.revoked_at is null
          and mr.member_id <> removed_member_id
          and m.access_status = 'active';

      if remaining_admins = 0 then
        raise exception 'At least one active administrator must remain.';
      end if;
    end if;

    return NEW;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create trigger member_roles_admin_removal_guard
  before update or delete on public.member_roles
  for each row execute function private.assert_admin_removal_is_safe();

create trigger members_admin_removal_guard
  before update on public.members
  for each row execute function private.assert_admin_removal_is_safe();

commit;
