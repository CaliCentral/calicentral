begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

-- Regression coverage for the RLS gap the app-side loader work surfaced:
-- profiles_public_select and audit_events_admin_select only recognized
-- 'admin'/'moderator', so an editor (a real, distinct role that /admin,
-- /admin/submissions/[id], and /admin/contributors/[id] all grant access to
-- via requireEditor) would silently get empty contributor references and
-- audit history rather than an error.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000801', 'editor-read-801@example.test', '{"name":"Read Editor"}'),
  ('00000000-0000-0000-0000-000000000802', 'private-profile-802@example.test', '{"name":"Private Profile Member"}');
update public.members set access_status = 'active'
  where auth_user_id in (
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000802'
  );
insert into public.member_roles (member_id, role_name)
select id, 'editor' from public.members where auth_user_id = '00000000-0000-0000-0000-000000000801';
-- The second member's profile is deliberately private/non-discoverable, the
-- case that previously fell through every clause except the missing 'editor'
-- one.
update public.profiles set profile_public = false, discoverable = false
  where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000802');

insert into public.audit_events (id, event_type, actor_member_id, target_type, target_id, summary) values
  ('00000000-0000-0000-0000-000000000803', 'profileUpdated',
   (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000802'),
   'contributor',
   (select id::text from public.members where auth_user_id = '00000000-0000-0000-0000-000000000802'),
   'Test audit event for editor-read regression coverage');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);
select results_eq(
  $$select count(*) from public.profiles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000802')$$,
  array[1::bigint],
  'an editor can read another member''s private profile row (required for contributor/submission review)'
);
select results_eq(
  $$select count(*) from public.audit_events where id = '00000000-0000-0000-0000-000000000803'$$,
  array[1::bigint],
  'an editor can read audit_events (required for /admin dashboard and contributor moderation history)'
);
reset role;

-- Negative control: a plain contributor (no editor/admin role) still cannot
-- read the same private profile or audit event -- the widening is scoped to
-- editor/admin, not to every authenticated member.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000804', 'plain-contributor-804@example.test', '{"name":"Plain Contributor"}');
update public.members set access_status = 'active' where auth_user_id = '00000000-0000-0000-0000-000000000804';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000804', true);
select results_eq(
  $$select count(*) from public.profiles where member_id = (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000802')$$,
  array[0::bigint],
  'a plain contributor still cannot read another member''s private profile row'
);
select results_eq(
  $$select count(*) from public.audit_events where id = '00000000-0000-0000-0000-000000000803'$$,
  array[0::bigint],
  'a plain contributor still cannot read audit_events'
);
reset role;

select * from finish();
rollback;
