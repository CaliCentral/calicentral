begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000601', 'bootstrap-admin@example.test', '{"name":"Bootstrap Admin"}'),
  ('00000000-0000-0000-0000-000000000602', 'plain-contributor@example.test', '{"name":"Plain Contributor"}'),
  ('00000000-0000-0000-0000-000000000603', 'already-active@example.test', '{"name":"Already Active"}');

insert into public.bootstrap_role_emails (email_normalized, role) values
  ('bootstrap-admin@example.test', 'admin');

-- 1. A bootstrap-eligible member, still pending, is activated by calling the
-- function as themselves.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select is(
  (select public.bootstrap_activate_self()),
  true,
  'a bootstrap-eligible pending member is activated and the function reports true'
);
reset role;

select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601'),
  'active',
  'the bootstrap-eligible member''s access_status is now active'
);

select is(
  (select count(*)::int from public.audit_events where target_id = (select id::text from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and event_type = 'contributorReactivated'),
  1,
  'activating a bootstrap member records exactly one audit event'
);

-- 2. A plain, non-bootstrap member calling the same function is a no-op --
-- it must never activate someone just because they called it.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000602', true);
select is(
  (select public.bootstrap_activate_self()),
  false,
  'a non-bootstrap member calling the function gets false, not activation'
);
reset role;

select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000602'),
  'pending',
  'the non-bootstrap member remains pending'
);

-- 3. A bootstrap-eligible member who is already active (e.g. previously
-- activated, or manually approved through the normal admin workflow) is
-- left alone -- this only ever transitions pending -> active, never
-- re-fires or re-logs on every sign-in.
insert into public.bootstrap_role_emails (email_normalized, role) values ('already-active@example.test', 'admin');
update public.members set access_status = 'active' where auth_user_id = '00000000-0000-0000-0000-000000000603';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000603', true);
select is(
  (select public.bootstrap_activate_self()),
  false,
  'an already-active bootstrap member gets false -- no duplicate activation or audit spam on every sign-in'
);
reset role;

select * from finish();
rollback;
