begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

-- A member holding the admin role, later suspended without the role ever
-- being revoked -- exactly the scenario the has_role/has_capability
-- hardening in 202608300003 targets: suspension must block role/capability
-- -gated access even while the member_roles row still exists.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000501', 'suspended-admin@example.test', '{"name":"Suspended Admin"}');
update public.members set access_status = 'active'
  where auth_user_id = '00000000-0000-0000-0000-000000000501';
insert into public.member_roles (member_id, role_name)
select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000501';

-- 1. While active, the admin role actually works (positive control -- a
-- meaningless suspension test if admin access was already broken).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select lives_ok(
  $$insert into public.organizations (slug, name, review_state)
      values ('suspension-test-org-active', 'Suspension Test Org (active)', 'approved')$$,
  'an active admin can perform an admin-gated write'
);
reset role;

-- 2. Suspend the member without touching their role row.
update public.members set access_status = 'suspended'
  where auth_user_id = '00000000-0000-0000-0000-000000000501';

-- 3. The same admin role, now suspended, must lose the admin-gated write --
-- proving has_role() checks access_status, not just role membership.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select throws_ok(
  $$insert into public.organizations (slug, name, review_state)
      values ('suspension-test-org-suspended', 'Suspension Test Org (suspended)', 'approved')$$,
  '42501',
  null,
  'a suspended member cannot use an admin-gated write even though their member_roles row is untouched'
);
reset role;

-- 3. Read access through a role-gated policy is blocked too (has_any_role),
-- not just writes -- public_organizations_select lets editor/admin see
-- non-approved organizations; a suspended admin must fall back to only
-- seeing approved ones, same as an ordinary member.
insert into public.organizations (slug, name, review_state) values
  ('suspension-test-draft-org', 'Suspension Test Draft Org', 'draft');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select results_eq(
  $$select count(*) from public.organizations where slug = 'suspension-test-draft-org'$$,
  array[0::bigint],
  'a suspended admin loses the role-gated visibility into non-approved organizations'
);
reset role;

-- 4. Self-visibility is deliberately untouched: a suspended member can still
-- see their own member row (private.current_member_id() itself isn't
-- hardened, matching the "remain signed in to see status" design).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select results_eq(
  $$select count(*) from public.members where auth_user_id = '00000000-0000-0000-0000-000000000501'$$,
  array[1::bigint],
  'a suspended member can still see their own member row'
);
reset role;

select * from finish();
rollback;
