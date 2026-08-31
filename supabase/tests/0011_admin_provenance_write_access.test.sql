begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

-- Regression coverage for who can actually write provenance_status through
-- the Supabase-native admin (lib/supabase/admin-repository.ts): the RLS
-- write policy on athletes (sport_authority_all_athletes) gates on the
-- sport.write_source_truth CAPABILITY, not the 'editor' ROLE alone -- the
-- admin-actions.ts app-layer check only requires role >= editor, so it's
-- the database, not the app layer, that is the real gate here.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001101', 'contributor-1101@example.test', '{"name":"Plain Contributor"}'),
  ('00000000-0000-0000-0000-000000001102', 'editor-1102@example.test', '{"name":"Editor No Capability"}'),
  ('00000000-0000-0000-0000-000000001103', 'sportauth-1103@example.test', '{"name":"Sport Authority Editor"}'),
  ('00000000-0000-0000-0000-000000001104', 'admin-1104@example.test', '{"name":"Admin"}'),
  ('00000000-0000-0000-0000-000000001105', 'suspended-1105@example.test', '{"name":"Suspended Sport Authority"}');
update public.members set access_status = 'active'
  where auth_user_id in (
    '00000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000001102',
    '00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000001104',
    '00000000-0000-0000-0000-000000001105'
  );
insert into public.member_roles (member_id, role_name)
  select id, 'editor' from public.members
  where auth_user_id in ('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000001105');
insert into public.member_roles (member_id, role_name)
  select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000001104';
insert into public.member_capabilities (member_id, capability_name)
  select id, 'sport.write_source_truth' from public.members
  where auth_user_id in ('00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000001105');
update public.members set access_status = 'suspended' where auth_user_id = '00000000-0000-0000-0000-000000001105';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001101', true);
select throws_ok(
  $$insert into public.athletes (permanent_id, slug, name, provenance_status) values ('athlete.rls.contrib', 'rls-contrib', 'RLS Contributor Test', 'unknown')$$,
  '42501', null, 'a plain contributor cannot create an athlete record at all'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001102', true);
select throws_ok(
  $$insert into public.athletes (permanent_id, slug, name, provenance_status) values ('athlete.rls.editor', 'rls-editor', 'RLS Editor Test', 'unknown')$$,
  '42501', null, 'an editor without sport.write_source_truth cannot create an athlete record'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001103', true);
select lives_ok(
  $$insert into public.athletes (permanent_id, slug, name, provenance_status) values ('athlete.rls.sportauth', 'rls-sportauth', 'RLS Sport Authority Test', 'fictional_sample')$$,
  'an editor holding sport.write_source_truth can create an athlete with an explicit provenance_status'
);
select is(
  (select provenance_status::text from public.athletes where permanent_id = 'athlete.rls.sportauth'),
  'fictional_sample',
  'the created row actually persisted the requested provenance_status'
);
select lives_ok(
  $$update public.athletes set provenance_status = 'real_verified' where permanent_id = 'athlete.rls.sportauth'$$,
  'the same capability holder can update provenance_status on an existing athlete'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001104', true);
select lives_ok(
  $$insert into public.athletes (permanent_id, slug, name, provenance_status) values ('athlete.rls.admin', 'rls-admin', 'RLS Admin Test', 'real_unverified')$$,
  'an admin can create an athlete with an explicit provenance_status'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001105', true);
select throws_ok(
  $$insert into public.athletes (permanent_id, slug, name, provenance_status) values ('athlete.rls.suspended', 'rls-suspended', 'RLS Suspended Test', 'unknown')$$,
  '42501', null, 'a suspended member cannot create an athlete even while still holding sport.write_source_truth'
);
reset role;

select * from finish();
rollback;
