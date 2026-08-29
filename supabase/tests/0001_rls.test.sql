begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000101', 'member-a@example.test', '{"name":"Member A"}'),
  ('00000000-0000-0000-0000-000000000102', 'member-b@example.test', '{"name":"Member B"}'),
  ('00000000-0000-0000-0000-000000000103', 'admin@example.test', '{"name":"Admin"}'),
  ('00000000-0000-0000-0000-000000000104', 'editor@example.test', '{"name":"Editor"}');

update public.members set access_status = 'active';
update public.profiles set
  handle = case
    when display_name = 'Member A' then 'member-a'
    when display_name = 'Member B' then 'member-b'
    when display_name = 'Admin' then 'admin'
    else 'editor'
  end,
  profile_configured = true;

insert into public.member_roles (member_id, role_name)
select id, 'admin' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000103';
insert into public.member_roles (member_id, role_name)
select id, 'editor' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000104';
insert into public.member_capabilities (member_id, capability_name)
select id, capability from public.members
cross join unnest(array['editorial.review','editorial.publish','sport.write_source_truth','ranking.write','community.moderate','media.moderate']) capability
where auth_user_id = '00000000-0000-0000-0000-000000000104';

update public.profiles set profile_public = true, discoverable = true
where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101');

insert into public.athletes (id, permanent_id, slug, name, editorial_state) values
  ('10000000-0000-0000-0000-000000000001', 'athlete.permanent.1', 'published-athlete', 'Published Athlete', 'approved'),
  ('10000000-0000-0000-0000-000000000002', 'athlete.permanent.2', 'draft-athlete', 'Draft Athlete', 'draft');

insert into public.source_records (id, provider, source_type, external_record_id, verification_state) values
  ('20000000-0000-0000-0000-000000000001', 'test-provider', 'result', 'result-1', 'source-confirmed');
insert into public.competitions (id, permanent_id, slug, name, status, public_state) values
  ('30000000-0000-0000-0000-000000000001', 'competition.permanent.1', 'test-competition', 'Test Competition', 'complete', 'published');

insert into public.training_sessions (id, owner_member_id, session_date, title, visibility) values
  ('40000000-0000-0000-0000-000000000001', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), current_date, 'Private A', 'private'),
  ('40000000-0000-0000-0000-000000000002', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), current_date, 'Public A', 'public');

insert into public.athlete_claims (id, athlete_id, claimant_member_id, claim_state) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), 'submitted');

insert into public.media_assets (
  id, owner_member_id, purpose, storage_key, original_filename, mime_type,
  byte_size, upload_status, moderation_state, visibility
) values
  ('60000000-0000-0000-0000-000000000001', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), 'post-image', 'private/test.jpg', 'test.jpg', 'image/jpeg', 10, 'uploaded', 'pending', 'private'),
  ('60000000-0000-0000-0000-000000000002', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), 'post-image', 'public/test.jpg', 'test.jpg', 'image/jpeg', 10, 'uploaded', 'approved', 'public');

insert into public.posts (id, author_member_id, body) values
  ('70000000-0000-0000-0000-000000000001', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), 'Member A post');

insert into public.reports (id, reporter_member_id, target_type, target_id, reason) values
  ('80000000-0000-0000-0000-000000000001', (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000101'), 'post', '70000000-0000-0000-0000-000000000001', 'test');

set local role anon;
select results_eq('select count(*) from public.athletes', array[1::bigint], 'anonymous sees only approved athletes');
select results_eq($$select count(*) from public.athletes where slug = 'draft-athlete'$$, array[0::bigint], 'anonymous cannot see draft athletes');
select results_eq($$select count(*) from public.training_sessions where visibility = 'public'$$, array[1::bigint], 'anonymous sees public training only');
select results_eq('select count(*) from public.media_assets', array[1::bigint], 'anonymous sees only approved public media');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select results_eq('select count(*) from public.profiles', array[1::bigint], 'member sees own/public profile projection');
select results_eq('select count(*) from public.training_sessions', array[2::bigint], 'owner sees private and public training');
select results_eq('select count(*) from public.athlete_claims', array[1::bigint], 'claimant sees own athlete claim');
select results_eq('select count(*) from public.media_assets', array[2::bigint], 'media owner sees pending and public assets');
select lives_ok($$insert into public.likes (member_id, target_type, target_id) values ((select id from public.members limit 1), 'post', '70000000-0000-0000-0000-000000000001')$$, 'member may create an owned interaction');
select throws_ok($$insert into public.likes (member_id, target_type, target_id) values ((select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000102'), 'post', '70000000-0000-0000-0000-000000000001')$$, '42501');
select throws_ok($$insert into public.media_assets (owner_member_id, purpose, storage_key, original_filename, mime_type, byte_size) values ((select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000102'), 'post-image', 'forbidden.jpg', 'forbidden.jpg', 'image/jpeg', 10)$$, '42501');
select throws_ok($$insert into public.sporting_results (competition_id, athlete_id, division, event, result_status, source_record_id) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'open', 'strength', 'official', '20000000-0000-0000-0000-000000000001')$$, '42501');
select results_eq('select count(*) from public.reports', array[1::bigint], 'reporter sees own report');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select results_eq($$select count(*) from public.training_sessions where visibility = 'private'$$, array[0::bigint], 'cross-user private training is denied');
select results_eq('select count(*) from public.athlete_claims', array[0::bigint], 'cross-user athlete claim is denied');
select results_eq($$select count(*) from public.media_assets where moderation_state = 'pending'$$, array[0::bigint], 'cross-user pending media is denied');
select results_eq('select count(*) from public.reports', array[0::bigint], 'cross-user report is denied');
select lives_ok($$insert into public.blocks (blocker_member_id, blocked_member_id) values ((select id from public.members limit 1), (select member_id from public.profiles where handle = 'member-a'))$$, 'member can block another member');
select results_eq('select count(*) from public.posts', array[0::bigint], 'block relationship hides public posts both ways');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select lives_ok($$insert into public.sporting_results (competition_id, athlete_id, division, event, result_status, source_record_id) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'open', 'strength', 'official', '20000000-0000-0000-0000-000000000001')$$, 'sport authority can write attributed official results');
select results_eq('select count(*) from public.reports', array[1::bigint], 'moderator authority sees report queue');
reset role;

select * from finish();
rollback;
