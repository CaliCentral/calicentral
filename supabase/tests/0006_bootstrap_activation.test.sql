begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000601', 'bootstrap-admin@example.test', '{"name":"Bootstrap Admin"}'),
  ('00000000-0000-0000-0000-000000000602', 'plain-contributor@example.test', '{"name":"Plain Contributor"}'),
  ('00000000-0000-0000-0000-000000000603', 'already-active@example.test', '{"name":"Already Active"}'),
  ('00000000-0000-0000-0000-000000000604', 'suspended-bootstrap@example.test', '{"name":"Suspended Bootstrap"}'),
  ('00000000-0000-0000-0000-000000000605', 'cross-user-target@example.test', '{"name":"Cross-user Target"}');

insert into public.bootstrap_role_emails (email_normalized, role) values
  ('bootstrap-admin@example.test', 'admin'),
  ('already-active@example.test', 'admin'),
  ('suspended-bootstrap@example.test', 'admin');

update public.members set access_status = 'active'
  where auth_user_id = '00000000-0000-0000-0000-000000000603';
update public.members set access_status = 'suspended'
  where auth_user_id = '00000000-0000-0000-0000-000000000604';

set local role anon;
select throws_ok(
  $$select public.bootstrap_activate_self()$$,
  '42501',
  null,
  'an anonymous caller has no permission to bootstrap'
);
reset role;

-- A mapped pending owner activates and receives an additive durable admin
-- role. The contributor role and profile provisioned by auth.users remain.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select is(
  (select public.bootstrap_activate_self()),
  true,
  'a mapped pending owner activates and receives the bootstrap role'
);
reset role;

select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601'),
  'active',
  'bootstrap changes only the pending owner access state to active'
);
select is(
  (select count(*)::int from public.profiles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601')),
  1,
  'the existing owner profile remains intact'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and role_name = 'contributor' and revoked_at is null),
  1,
  'the existing contributor role is preserved'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and role_name = 'admin' and revoked_at is null),
  1,
  'the mapped administrator role is granted exactly once'
);
select is(
  (select count(*)::int from public.audit_events where target_id = (select id::text from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and event_type = 'memberRoleGranted'),
  1,
  'the administrator grant creates exactly one audit event'
);
select is(
  (select count(*)::int from public.audit_events where target_id = (select id::text from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and event_type = 'memberRoleGranted' and metadata ->> 'source' = 'verified-bootstrap-admin-parity'),
  1,
  'the role audit identifies the controlled parity source without PII'
);

-- Admin inherits capability-gated writes through private.has_capability();
-- the positive write also proves RLS remains enabled rather than bypassed.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select lives_ok(
  $$insert into public.organizations (slug, name, review_state)
      values ('bootstrap-admin-capability', 'Bootstrap Admin Capability', 'approved')$$,
  'a bootstrap administrator resolves administrator capability checks through RLS'
);
select is(
  (select public.bootstrap_activate_self()),
  false,
  'repeated bootstrap is an idempotent no-op'
);
reset role;

select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and role_name = 'admin'),
  1,
  'repeated bootstrap cannot duplicate the administrator role'
);
select is(
  (select count(*)::int from public.audit_events where target_id = (select id::text from public.members where auth_user_id = '00000000-0000-0000-0000-000000000601') and event_type = 'memberRoleGranted'),
  1,
  'repeated bootstrap does not duplicate the role audit event'
);

-- An ordinary contributor is neither activated nor promoted, and direct
-- self/cross-user role-table writes remain denied by existing RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000602', true);
select is(
  (select public.bootstrap_activate_self()),
  false,
  'an unmapped contributor cannot bootstrap'
);
reset role;
select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000602'),
  'pending',
  'an unmapped contributor remains pending'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000602') and role_name = 'contributor' and revoked_at is null),
  1,
  'the ordinary contributor role remains unchanged'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000602') and role_name = 'admin' and revoked_at is null),
  0,
  'the ordinary contributor receives no administrator role'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000602', true);
select throws_ok(
  $$insert into public.member_roles (member_id, role_name)
      select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000602'$$,
  '42501',
  null,
  'an ordinary contributor cannot directly self-promote'
);
select results_eq(
  $$with attempted as (
      insert into public.member_roles (member_id, role_name)
      select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000605'
      returning 1
    ) select count(*) from attempted$$,
  array[0::bigint],
  'an ordinary contributor cannot grant a cross-user administrator role'
);
reset role;

-- Existing active owners can repair a missing durable role without an access
-- status transition, which is the exact preview parity scenario.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000603', true);
select is(
  (select public.bootstrap_activate_self()),
  true,
  'an already-active mapped owner can acquire the missing durable role'
);
reset role;
select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000603'),
  'active',
  'role repair does not alter an already-active owner access state'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000603') and role_name = 'admin' and revoked_at is null),
  1,
  'the already-active owner receives exactly one administrator role'
);

-- Suspended/archived identities cannot use bootstrap to regain role authority.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000604', true);
select is(
  (select public.bootstrap_activate_self()),
  false,
  'a suspended mapped member cannot exploit bootstrap'
);
reset role;
select is(
  (select access_status from public.members where auth_user_id = '00000000-0000-0000-0000-000000000604'),
  'suspended',
  'bootstrap does not change suspended access state'
);
select is(
  (select count(*)::int from public.member_roles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000604') and role_name = 'admin' and revoked_at is null),
  0,
  'a suspended mapped member receives no administrator role'
);

select * from finish();
rollback;
