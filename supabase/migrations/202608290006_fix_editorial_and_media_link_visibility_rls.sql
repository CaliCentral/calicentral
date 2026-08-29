begin;

-- `public_stories_select` / `public_videos_select` only checked that a matching
-- `editorial_content` row exists (always true given the FK), not that it is
-- actually published. That let anon/authenticated readers select full
-- `stories`/`videos` rows (including draft content) directly, bypassing the
-- publication gate enforced on `editorial_content`/`editorial_publication_state`.
drop policy if exists public_stories_select on public.stories;
create policy public_stories_select on public.stories for select to anon, authenticated
  using (
    exists (
      select 1
      from public.editorial_publication_state s
      where s.editorial_content_id = stories.editorial_content_id
        and s.is_current
        and s.state = 'published'
    )
    or private.has_any_role(array['editor', 'admin'])
  );

drop policy if exists public_videos_select on public.videos;
create policy public_videos_select on public.videos for select to anon, authenticated
  using (
    exists (
      select 1
      from public.editorial_publication_state s
      where s.editorial_content_id = videos.editorial_content_id
        and s.is_current
        and s.state = 'published'
    )
    or private.has_any_role(array['editor', 'admin'])
  );

-- `media_links_visible_select` only checked that the linked `post`/`media_asset`
-- row exists, not that it is actually visible to the viewer. That let anon
-- readers select media-link metadata for private/unpublished posts and
-- pending/non-public media assets, even though the linked rows themselves
-- remain correctly protected by their own RLS policies.
drop policy if exists media_links_visible_select on public.media_links;
create policy media_links_visible_select on public.media_links for select to anon, authenticated
  using (
    (
      post_id is not null
      and exists (
        select 1 from public.posts p
        where p.id = media_links.post_id
          and (
            (
              p.status = 'published'
              and not private.members_block_each_other(private.current_member_id(), p.author_member_id)
              and (
                p.visibility = 'public'
                or p.author_member_id = private.current_member_id()
                or (p.visibility = 'followers' and private.follows_member(private.current_member_id(), p.author_member_id))
              )
            )
            or p.author_member_id = private.current_member_id()
            or private.has_any_role(array['moderator', 'admin'])
          )
      )
    )
    or (
      post_id is null
      and media_asset_id is not null
      and exists (
        select 1 from public.media_assets a
        where a.id = media_links.media_asset_id
          and (
            (a.upload_status = 'uploaded' and a.moderation_state = 'approved' and a.removal_state = 'active' and a.visibility = 'public')
            or a.owner_member_id = private.current_member_id()
            or private.has_capability('media.moderate')
          )
      )
    )
  );

commit;
