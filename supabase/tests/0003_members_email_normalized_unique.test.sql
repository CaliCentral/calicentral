begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

-- provision_auth_user() runs on every auth.users insert and sets
-- email_normalized := lower(new.email); the unique constraint must catch a
-- second auth identity landing on the same email before it becomes a second,
-- unrelated member.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000301', 'dup-email@example.test', '{"name":"First Signup"}');

select is(
  (select count(*)::int from public.members where email_normalized = 'dup-email@example.test'),
  1,
  'first signup for an email provisions exactly one member'
);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
      ('00000000-0000-0000-0000-000000000302', 'DUP-Email@example.test', '{"name":"Second Signup"}')$$,
  '23505',
  null,
  'a second auth identity at the same email (any case) is rejected, not silently duplicated'
);

-- members with no known email (e.g. D1-imported rows the transformer leaves
-- without an email) must not collide with each other under a plain unique
-- constraint, which treats nulls as distinct.
insert into public.members (id, legacy_principal_id) values
  ('00000000-0000-0000-0000-000000000310', 'd1-legacy-member-a'),
  ('00000000-0000-0000-0000-000000000311', 'd1-legacy-member-b');

select is(
  (select count(*)::int from public.members where legacy_principal_id in ('d1-legacy-member-a', 'd1-legacy-member-b')),
  2,
  'members with a null email_normalized do not collide with each other'
);

select * from finish();
rollback;
