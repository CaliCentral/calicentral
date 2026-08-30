-- Extend the existing bootstrap self-service boundary from access activation
-- to the durable role grant represented by bootstrap_role_emails. The caller
-- can still affect only their own member row, and only a database-controlled
-- email mapping can authorize the role. Existing contributor membership is
-- deliberately retained: roles are additive and the application resolves the
-- highest active portal role.
create or replace function public.bootstrap_activate_self()
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  caller_email text;
  caller_member_id uuid;
  caller_access_status text;
  matched_role text;
  access_changed boolean := false;
  role_changed boolean := false;
begin
  select email into caller_email from auth.users where id = auth.uid();
  if caller_email is null then
    return false;
  end if;

  select role into matched_role from public.bootstrap_role_emails
    where email_normalized = lower(caller_email);
  if matched_role is null then
    return false;
  end if;

  select id, access_status into caller_member_id, caller_access_status
    from public.members where auth_user_id = auth.uid();
  if caller_member_id is null or caller_access_status not in ('pending', 'active') then
    return false;
  end if;

  update public.members
    set access_status = 'active'
    where id = caller_member_id and access_status = 'pending'
    returning true into access_changed;

  insert into public.member_roles (
    member_id,
    role_name,
    granted_by,
    granted_at,
    revoked_at
  ) values (
    caller_member_id,
    matched_role,
    caller_member_id,
    now(),
    null
  )
  on conflict (member_id, role_name) do update
    set granted_by = excluded.granted_by,
        granted_at = excluded.granted_at,
        revoked_at = null
    where public.member_roles.revoked_at is not null
  returning true into role_changed;

  if access_changed then
    insert into public.audit_events (
      event_type,
      actor_member_id,
      target_type,
      target_id,
      summary,
      metadata
    ) values (
      'contributorReactivated',
      caller_member_id,
      'member',
      caller_member_id::text,
      'Bootstrap access activated the member on sign-in.',
      jsonb_build_object(
        'previous_access_status', 'pending',
        'next_access_status', 'active',
        'matched_bootstrap_role', matched_role
      )
    );
  end if;

  if role_changed then
    insert into public.audit_events (
      event_type,
      actor_member_id,
      target_type,
      target_id,
      summary,
      metadata
    ) values (
      'memberRoleGranted',
      caller_member_id,
      'member',
      caller_member_id::text,
      'Verified bootstrap parity granted a durable member role.',
      jsonb_build_object(
        'role', matched_role,
        'source', 'verified-bootstrap-admin-parity'
      )
    );
  end if;

  return coalesce(access_changed, false) or coalesce(role_changed, false);
end;
$$;

-- Functions are executable by PUBLIC unless explicitly revoked. Anonymous
-- callers already fail closed because auth.uid() is null, but the grant
-- surface should still express the intended authenticated-only contract.
revoke execute on function public.bootstrap_activate_self() from public, anon;
grant execute on function public.bootstrap_activate_self() to authenticated;
