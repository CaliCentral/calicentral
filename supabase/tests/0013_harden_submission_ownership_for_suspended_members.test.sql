begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001301', 'active-1301@example.test', '{"name":"Active Contributor"}'),
  ('00000000-0000-0000-0000-000000001302', 'suspended-1302@example.test', '{"name":"Suspended Contributor"}');
update public.members set access_status = 'active' where auth_user_id = '00000000-0000-0000-0000-000000001301';
update public.members set access_status = 'suspended' where auth_user_id = '00000000-0000-0000-0000-000000001302';

-- 1. An active member can still create a submission (positive control --
-- otherwise the negative tests below would be meaningless).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001301', true);
select lives_ok(
  $$insert into public.submissions (owner_member_id, submission_type, status, payload)
      values ((select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001301'), 'storyPitch', 'draft', '{}'::jsonb)$$,
  'an active member can create their own submission'
);
reset role;

-- 2. A suspended member cannot create a submission at all, even directly
-- against the database with no application layer involved.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001302', true);
select throws_ok(
  $$insert into public.submissions (owner_member_id, submission_type, status, payload)
      values ((select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001302'), 'storyPitch', 'draft', '{}'::jsonb)$$,
  '42501', null, 'a suspended member cannot create a submission via direct RLS-gated insert'
);
reset role;

-- 3. Seed a draft submission for the suspended member outside RLS (as the
-- unrestricted test-runner role) to test the update path independently of
-- the insert path above.
insert into public.submissions (id, owner_member_id, submission_type, status, payload) values
  ('00000000-0000-0000-0000-000000001303',
   (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001302'),
   'storyPitch', 'draft', '{}'::jsonb);

-- 4. The suspended member cannot update their own existing draft either.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001302', true);
select results_eq(
  $$update public.submissions set payload = '{"title":"edited"}'::jsonb where id = '00000000-0000-0000-0000-000000001303' returning 1$$,
  array[]::integer[],
  'a suspended member''s update to their own existing draft matches zero rows'
);
reset role;

-- 5. Once reactivated, the same member can update it again.
update public.members set access_status = 'active' where auth_user_id = '00000000-0000-0000-0000-000000001302';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001302', true);
select lives_ok(
  $$update public.submissions set payload = '{"title":"edited"}'::jsonb where id = '00000000-0000-0000-0000-000000001303'$$,
  'a reactivated member can update their own draft again'
);
reset role;

select * from finish();
rollback;
