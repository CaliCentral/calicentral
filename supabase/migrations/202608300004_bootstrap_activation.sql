-- The legacy Sanity/Auth.js contributor-provisioning path
-- (lib/operations/contributors.ts's ensureContributorProfile) auto-activates
-- a bootstrap admin/editor's pending access on sign-in, by checking their
-- email against the CALI_CENTRAL_ADMIN_EMAILS/CALI_CENTRAL_EDITOR_EMAILS
-- application env vars in trusted server code, then writing with an
-- elevated credential. provision_auth_user() (the Supabase-mode equivalent)
-- has no way to replicate this: it's a pure database trigger with no access
-- to Vercel environment variables, so every new Supabase-authenticated
-- member -- bootstrap-eligible or not -- was left permanently 'pending'
-- until someone with existing admin access manually activated them. For the
-- very first bootstrap admin, nobody has that access yet.
--
-- This table is the trust anchor instead: it lives in the database, so a
-- SECURITY DEFINER function can check it without ever needing a live
-- service-role credential in the Vercel runtime. It starts empty --
-- populating it with a real email is a one-time manual step (via the
-- Supabase dashboard), the same way CALI_CENTRAL_ADMIN_EMAILS itself is
-- configured per environment. Real email addresses must never be committed
-- to a migration file.
create table public.bootstrap_role_emails (
  email_normalized extensions.citext primary key,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

revoke all on public.bootstrap_role_emails from anon, authenticated;

-- SECURITY DEFINER so it can read this table (revoked from authenticated
-- above -- a plain client must never enumerate who's bootstrap-eligible)
-- and write to members/audit_events regardless of the calling user's own
-- RLS grants. Deliberately takes no parameters: it only ever reads
-- auth.uid()'s own identity and only ever activates that same caller's own
-- member row. There is no code path here, or anywhere this function is
-- callable from, that can activate or affect any other member's account --
-- a client cannot pass in someone else's id, and the lookup is keyed
-- entirely off the session making the call.
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
  if caller_member_id is null or caller_access_status <> 'pending' then
    return false;
  end if;

  update public.members set access_status = 'active' where id = caller_member_id;

  insert into public.audit_events (event_type, actor_member_id, target_type, target_id, summary, metadata)
  values (
    'contributorReactivated', caller_member_id, 'member', caller_member_id::text,
    'Bootstrap access activated the member on sign-in.',
    jsonb_build_object('previous_access_status', 'pending', 'next_access_status', 'active', 'matched_bootstrap_role', matched_role)
  );

  return true;
end;
$$;

grant execute on function public.bootstrap_activate_self() to authenticated;
