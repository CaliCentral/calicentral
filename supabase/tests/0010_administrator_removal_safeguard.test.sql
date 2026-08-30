begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001001', 'sole-admin-1001@example.test', '{"name":"Sole Admin"}'),
  ('00000000-0000-0000-0000-000000001002', 'second-admin-1002@example.test', '{"name":"Second Admin"}');
update public.members set access_status = 'active'
  where auth_user_id in (
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000001002'
  );
insert into public.member_roles (member_id, role_name)
select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000001001';

-- 1. The sole administrator's role cannot be revoked.
select throws_ok(
  $$update public.member_roles set revoked_at = now()
      where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001001')
      and role_name = 'admin'$$,
  'P0001',
  'At least one active administrator must remain.',
  'the sole administrator''s admin role cannot be revoked'
);

-- 2. The sole administrator's member_roles row cannot be deleted either.
select throws_ok(
  $$delete from public.member_roles
      where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001001')
      and role_name = 'admin'$$,
  'P0001',
  'At least one active administrator must remain.',
  'the sole administrator''s member_roles row cannot be deleted'
);

-- 3. The sole administrator cannot be suspended (access_status change away
-- from active), the same invariant approached from the members side.
select throws_ok(
  $$update public.members set access_status = 'suspended'
      where auth_user_id = '00000000-0000-0000-0000-000000001001'$$,
  'P0001',
  'At least one active administrator must remain.',
  'the sole administrator cannot be suspended'
);

-- 4. Suspending a non-administrator member is unaffected by the guard.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001003', 'plain-member-1003@example.test', '{"name":"Plain Member"}');
update public.members set access_status = 'active' where auth_user_id = '00000000-0000-0000-0000-000000001003';
select lives_ok(
  $$update public.members set access_status = 'suspended' where auth_user_id = '00000000-0000-0000-0000-000000001003'$$,
  'suspending a member who is not an administrator is unaffected by the safeguard'
);

-- 5 & 6. With a second active administrator present, either administrator's
-- role can be revoked -- the guard only blocks removing the *last* one.
insert into public.member_roles (member_id, role_name)
select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000001002';
select lives_ok(
  $$update public.member_roles set revoked_at = now()
      where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001001')
      and role_name = 'admin'$$,
  'an administrator''s role can be revoked when another active administrator remains'
);
select throws_ok(
  $$update public.member_roles set revoked_at = now()
      where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001002')
      and role_name = 'admin'$$,
  'P0001',
  'At least one active administrator must remain.',
  'the now-only remaining administrator is protected once the other was removed'
);

select * from finish();
rollback;
