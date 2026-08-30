begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

-- A plain contributor, an editor with editorial (but not sport-authority or
-- admin) capabilities, and an admin -- covering the three tiers Task 3 asks
-- to adversarially probe: escalation attempts, cross-capability boundaries,
-- and a positive control proving admin really can do what the others can't.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000401', 'contributor-esc@example.test', '{"name":"Plain Contributor"}'),
  ('00000000-0000-0000-0000-000000000402', 'editor-esc@example.test', '{"name":"Editor Only"}'),
  ('00000000-0000-0000-0000-000000000403', 'admin-esc@example.test', '{"name":"Admin"}');
update public.members set access_status = 'active'
  where auth_user_id in (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000403'
  );

insert into public.member_roles (member_id, role_name)
select id, 'editor' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000402';
insert into public.member_capabilities (member_id, capability_name)
select id, 'editorial.review' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000402';
insert into public.member_roles (member_id, role_name)
select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000403';

-- A source record + competition the escalation attempts below would need to
-- reference if a sporting_results write ever succeeded.
insert into public.source_records (id, provider, source_type, external_record_id) values
  ('00000000-0000-0000-0000-000000000410', 'test-suite', 'sporting-result', 'esc-test-1');
insert into public.competitions (id, permanent_id, slug, name, status, public_state) values
  ('00000000-0000-0000-0000-000000000411', 'competition.permanent.esc', 'esc-competition', 'Escalation Test Competition', 'scheduled', 'published');
insert into public.athletes (id, permanent_id, slug, name, editorial_state) values
  ('00000000-0000-0000-0000-000000000420', 'athlete.permanent.esc', 'esc-athlete', 'Escalation Test Athlete', 'approved');

-- 1. A plain contributor cannot grant themselves the admin role directly.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
select throws_ok(
  $$insert into public.member_roles (member_id, role_name)
      select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000401'$$,
  '42501',
  null,
  'a plain contributor cannot self-grant the admin role via a direct member_roles insert'
);
reset role;

-- 2. A plain contributor cannot grant themselves a sport-authority capability.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
select throws_ok(
  $$insert into public.member_capabilities (member_id, capability_name)
      select id, 'sport.write_source_truth' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000401'$$,
  '42501',
  null,
  'a plain contributor cannot self-grant a capability via a direct member_capabilities insert'
);
reset role;

-- 3. An editor (has editorial.review, not the admin role) cannot escalate to
-- admin by inserting into member_roles either -- editorial capability must
-- not imply role-table write access.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
select throws_ok(
  $$insert into public.member_roles (member_id, role_name)
      select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000402'$$,
  '42501',
  null,
  'an editor cannot self-grant the admin role despite already holding editorial capabilities'
);
reset role;

-- 4. That same editor, lacking sport.write_source_truth, cannot write a
-- sporting result -- editorial capability must not imply sport authority.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
select throws_ok(
  $$insert into public.sporting_results
      (competition_id, athlete_id, division, event, result_status, source_record_id)
    values (
      '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000420', 'open', 'strength', 'imported',
      '00000000-0000-0000-0000-000000000410'
    )$$,
  '42501',
  null,
  'an editor without sport.write_source_truth cannot write a sporting result'
);
reset role;

-- 5. Positive control: admin CAN grant a role. If this failed, the negative
-- results above would be meaningless (everything blocked, not just the
-- escalation attempts).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000403', true);
select lives_ok(
  $$insert into public.member_roles (member_id, role_name)
      select id, 'editor' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000401'$$,
  'an admin can grant a role to another member'
);
reset role;

-- 6. Positive control: a member holding sport.write_source_truth CAN write a
-- sporting result (mirrors the existing 0001 coverage, re-asserted here
-- alongside the negative case for a direct before/after contrast).
insert into public.member_capabilities (member_id, capability_name)
select id, 'sport.write_source_truth' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000402';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
select lives_ok(
  $$insert into public.sporting_results
      (competition_id, athlete_id, division, event, result_status, source_record_id)
    values (
      '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000420', 'open', 'strength', 'imported',
      '00000000-0000-0000-0000-000000000410'
    )$$,
  'a member holding sport.write_source_truth can write a sporting result once granted'
);
reset role;

-- 7. Cross-user privacy still holds for the contributor who was just granted
-- editor (task 3's "editor cannot perform admin-only actions"): they still
-- cannot read another member's private training data.
insert into public.training_sessions (id, owner_member_id, session_date, visibility) values
  ('00000000-0000-0000-0000-000000000430',
   (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000403'),
   current_date, 'private');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
select results_eq(
  $$select count(*) from public.training_sessions where id = '00000000-0000-0000-0000-000000000430'$$,
  array[0::bigint],
  'a newly-promoted editor still cannot read another member''s private training session'
);
reset role;

select * from finish();
rollback;
