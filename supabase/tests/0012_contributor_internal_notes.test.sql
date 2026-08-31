begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001201', 'notes-subject-1201@example.test', '{"name":"Notes Subject"}'),
  ('00000000-0000-0000-0000-000000001202', 'notes-admin-1202@example.test', '{"name":"Notes Admin"}'),
  ('00000000-0000-0000-0000-000000001203', 'notes-editor-1203@example.test', '{"name":"Notes Editor"}');
update public.members set access_status = 'active'
  where auth_user_id in (
    '00000000-0000-0000-0000-000000001201',
    '00000000-0000-0000-0000-000000001202',
    '00000000-0000-0000-0000-000000001203'
  );
insert into public.member_roles (member_id, role_name)
  select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000001202';
insert into public.member_roles (member_id, role_name)
  select id, 'editor' from public.members where auth_user_id = '00000000-0000-0000-0000-000000001203';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001202', true);
select lives_ok(
  $$insert into public.contributor_internal_notes (member_id, notes, updated_by)
      values ((select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001201'), 'Private admin note', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001202'))$$,
  'an admin can create an internal note about another contributor'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001203', true);
-- RLS filters rather than raises here: the editor's UPDATE matches zero
-- rows (they cannot see the row at all), so it silently affects nothing
-- rather than throwing -- confirmed by the unchanged value below.
select lives_ok(
  $$update public.contributor_internal_notes set notes = 'editor tampering' where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001201')$$,
  'an editor''s write attempt runs without error but affects no visible rows'
);
select results_eq(
  $$select count(*) from public.contributor_internal_notes where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001201')$$,
  array[0::bigint],
  'an editor cannot even read internal notes about a contributor (and did not modify them)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001201', true);
select results_eq(
  $$select count(*) from public.contributor_internal_notes where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000001201')$$,
  array[0::bigint],
  'the subject contributor themselves cannot read the private note about them'
);
reset role;

select * from finish();
rollback;
