begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000201', 'author-c@example.test', '{"name":"Author C"}'),
  ('00000000-0000-0000-0000-000000000202', 'viewer-d@example.test', '{"name":"Viewer D"}');
update public.members set access_status = 'active';

-- an unpublished story: editorial_content exists, but its current publication
-- state is 'draft', so the FK-only policy previously let anon read it anyway.
insert into public.editorial_content (id, content_type, slug, title) values
  ('00000000-0000-0000-0000-000000000210', 'story', 'draft-only-story', 'Draft Only Story');
insert into public.editorial_publication_state (editorial_content_id, state, is_current) values
  ('00000000-0000-0000-0000-000000000210', 'draft', true);
insert into public.stories (editorial_content_id) values
  ('00000000-0000-0000-0000-000000000210');

-- a published story, to confirm the fix doesn't remove legitimate public access.
insert into public.editorial_content (id, content_type, slug, title) values
  ('00000000-0000-0000-0000-000000000211', 'story', 'published-story', 'Published Story');
insert into public.editorial_publication_state (editorial_content_id, state, is_current) values
  ('00000000-0000-0000-0000-000000000211', 'published', true);
insert into public.stories (editorial_content_id) values
  ('00000000-0000-0000-0000-000000000211');

-- a private post with a media link, and a public post with a media link.
insert into public.posts (id, author_member_id, body, visibility, status) values
  ('00000000-0000-0000-0000-000000000220',
   (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000201'),
   'Private post', 'private', 'published'),
  ('00000000-0000-0000-0000-000000000221',
   (select id from public.members where auth_user_id = '00000000-0000-0000-0000-000000000201'),
   'Public post', 'public', 'published');
insert into public.media_links (id, post_id, media_kind, external_url) values
  ('00000000-0000-0000-0000-000000000230', '00000000-0000-0000-0000-000000000220', 'external-embed', 'https://example.test/private.jpg'),
  ('00000000-0000-0000-0000-000000000231', '00000000-0000-0000-0000-000000000221', 'external-embed', 'https://example.test/public.jpg');

set local role anon;
select results_eq(
  $$select count(*) from public.stories where editorial_content_id = '00000000-0000-0000-0000-000000000210'$$,
  array[0::bigint],
  'anonymous cannot read a story whose editorial content is unpublished'
);
select results_eq(
  $$select count(*) from public.stories where editorial_content_id = '00000000-0000-0000-0000-000000000211'$$,
  array[1::bigint],
  'anonymous can still read a published story'
);
select results_eq(
  $$select count(*) from public.media_links where id = '00000000-0000-0000-0000-000000000230'$$,
  array[0::bigint],
  'anonymous cannot read a media link attached to a private post'
);
select results_eq(
  $$select count(*) from public.media_links where id = '00000000-0000-0000-0000-000000000231'$$,
  array[1::bigint],
  'anonymous can still read a media link attached to a public post'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);
select results_eq(
  $$select count(*) from public.media_links where id = '00000000-0000-0000-0000-000000000230'$$,
  array[1::bigint],
  'post author can still read a media link attached to their own private post'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);
select results_eq(
  $$select count(*) from public.media_links where id = '00000000-0000-0000-0000-000000000230'$$,
  array[0::bigint],
  'another member cannot read a media link attached to someone else''s private post'
);
reset role;

select * from finish();
rollback;
