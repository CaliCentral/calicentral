begin;

create or replace function private.members_block_each_other(first_member uuid, second_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_member_id = first_member and blocked_member_id = second_member)
       or (blocker_member_id = second_member and blocked_member_id = first_member)
  )
$$;

create or replace function private.follows_member(viewer uuid, author uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.follows
    where follower_member_id = viewer
      and target_type = 'member'
      and target_id = author::text
  )
$$;

do $$
declare table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;

create policy members_self_select on public.members
  for select to authenticated
  using (id = private.current_member_id() or private.has_any_role(array['admin','moderator','editor']));
create policy members_admin_update on public.members
  for update to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));

create policy profiles_public_select on public.profiles
  for select to anon, authenticated
  using (
    (profile_public and discoverable and status = 'active' and not private.members_block_each_other(private.current_member_id(), member_id))
    or member_id = private.current_member_id()
    or private.has_any_role(array['admin','moderator'])
  );
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (member_id = private.current_member_id())
  with check (member_id = private.current_member_id());

create policy profile_social_public_select on public.profile_social_accounts
  for select to anon, authenticated
  using (
    (visible and exists (
      select 1 from public.profiles p
      where p.member_id = profile_social_accounts.member_id
        and p.profile_public and p.show_social_accounts
    ) and not private.members_block_each_other(private.current_member_id(), member_id))
    or member_id = private.current_member_id()
    or private.has_any_role(array['admin','moderator'])
  );
create policy profile_social_owner_all on public.profile_social_accounts
  for all to authenticated
  using (member_id = private.current_member_id())
  with check (member_id = private.current_member_id());

create policy member_roles_self_select on public.member_roles
  for select to authenticated
  using (member_id = private.current_member_id() or private.has_role('admin'));
create policy member_roles_admin_all on public.member_roles
  for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy member_capabilities_self_select on public.member_capabilities
  for select to authenticated
  using (member_id = private.current_member_id() or private.has_role('admin'));
create policy member_capabilities_admin_all on public.member_capabilities
  for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));

create policy public_organizations_select on public.organizations
  for select to anon, authenticated using (review_state = 'approved' or private.has_any_role(array['editor','admin']));
create policy public_athletes_select on public.athletes
  for select to anon, authenticated using (editorial_state = 'approved' or private.has_any_role(array['editor','admin']));
create policy public_teams_select on public.teams
  for select to anon, authenticated using (status = 'active' or private.has_any_role(array['editor','admin']));
create policy public_competitions_select on public.competitions
  for select to anon, authenticated using (public_state = 'published' or private.has_any_role(array['editor','admin']));
create policy public_sport_results_select on public.sporting_results
  for select to anon, authenticated using (
    result_status in ('source-confirmed','official','corrected')
    or private.has_capability('sport.write_source_truth')
  );
create policy public_result_performance_select on public.sporting_result_performances
  for select to anon, authenticated using (exists (
    select 1 from public.sporting_results r
    where r.id = sporting_result_performances.sporting_result_id
      and (r.result_status in ('source-confirmed','official','corrected') or private.has_capability('sport.write_source_truth'))
  ));
create policy public_ranking_providers_select on public.ranking_providers
  for select to anon, authenticated using (status = 'active' or private.has_capability('ranking.write'));
create policy public_ranking_systems_select on public.ranking_systems
  for select to anon, authenticated using (status = 'active' or private.has_capability('ranking.write'));
create policy public_ranking_snapshots_select on public.ranking_snapshots
  for select to anon, authenticated using (publication_status = 'published' or private.has_capability('ranking.write'));
create policy public_ranking_entries_select on public.ranking_entries
  for select to anon, authenticated using (exists (
    select 1 from public.ranking_snapshots s
    where s.id = ranking_entries.ranking_snapshot_id
      and (s.publication_status = 'published' or private.has_capability('ranking.write'))
  ));

create policy sport_authority_all_athletes on public.athletes for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_competitions on public.competitions for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_results on public.sporting_results for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_performances on public.sporting_result_performances for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy ranking_authority_all_providers on public.ranking_providers for all to authenticated
  using (private.has_capability('ranking.write')) with check (private.has_capability('ranking.write'));
create policy ranking_authority_all_systems on public.ranking_systems for all to authenticated
  using (private.has_capability('ranking.write')) with check (private.has_capability('ranking.write'));
create policy ranking_authority_all_snapshots on public.ranking_snapshots for all to authenticated
  using (private.has_capability('ranking.write')) with check (private.has_capability('ranking.write'));
create policy ranking_authority_all_entries on public.ranking_entries for all to authenticated
  using (private.has_capability('ranking.write')) with check (private.has_capability('ranking.write'));

create policy source_authority_all on public.source_records for all to authenticated
  using (private.has_capability('sport.write_source_truth') or private.has_capability('editorial.review'))
  with check (private.has_capability('sport.write_source_truth') or private.has_capability('editorial.review'));
create policy provenance_authority_all on public.provenance for all to authenticated
  using (private.has_capability('sport.write_source_truth') or private.has_capability('editorial.review'))
  with check (private.has_capability('sport.write_source_truth') or private.has_capability('editorial.review'));

create policy athlete_claim_owner_select on public.athlete_claims
  for select to authenticated
  using (claimant_member_id = private.current_member_id() or private.has_any_role(array['editor','admin']));
create policy athlete_claim_owner_insert on public.athlete_claims
  for insert to authenticated
  with check (claimant_member_id = private.current_member_id() and claim_state in ('draft','submitted'));
create policy athlete_claim_owner_update on public.athlete_claims
  for update to authenticated
  using (claimant_member_id = private.current_member_id() and claim_state in ('draft','submitted'))
  with check (claimant_member_id = private.current_member_id() and claim_state in ('draft','submitted'));
create policy athlete_claim_admin_update on public.athlete_claims
  for update to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy athlete_controls_owner_select on public.athlete_profile_controls
  for select to authenticated
  using (member_id = private.current_member_id() or private.has_role('admin'));
create policy athlete_controls_admin_all on public.athlete_profile_controls
  for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));
create policy athlete_presentations_public_select on public.claimed_athlete_presentations
  for select to anon, authenticated
  using (status = 'active' or controlling_member_id = private.current_member_id() or private.has_any_role(array['editor','admin']));
create policy athlete_presentations_owner_all on public.claimed_athlete_presentations
  for all to authenticated
  using (
    controlling_member_id = private.current_member_id()
    and exists (select 1 from public.athlete_profile_controls c where c.athlete_id = claimed_athlete_presentations.athlete_id and c.member_id = private.current_member_id() and c.status = 'active')
  )
  with check (
    controlling_member_id = private.current_member_id()
    and exists (select 1 from public.athlete_profile_controls c where c.athlete_id = claimed_athlete_presentations.athlete_id and c.member_id = private.current_member_id() and c.status = 'active')
  );

create policy editorial_public_select on public.editorial_content
  for select to anon, authenticated using (
    exists (select 1 from public.editorial_publication_state s where s.editorial_content_id = editorial_content.id and s.is_current and s.state = 'published')
    or private.has_any_role(array['editor','admin'])
  );
create policy editorial_authority_all on public.editorial_content for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_revisions_authority on public.editorial_revisions for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_states_public_select on public.editorial_publication_state
  for select to anon, authenticated using (state = 'published' or private.has_capability('editorial.review'));
create policy editorial_states_publish_authority on public.editorial_publication_state for all to authenticated
  using (private.has_capability('editorial.publish')) with check (private.has_capability('editorial.publish'));

create policy submissions_owner_select on public.submissions for select to authenticated
  using (owner_member_id = private.current_member_id() or private.has_any_role(array['editor','admin']));
create policy submissions_owner_insert on public.submissions for insert to authenticated
  with check (owner_member_id = private.current_member_id() and status in ('draft','submitted'));
create policy submissions_owner_update on public.submissions for update to authenticated
  using (owner_member_id = private.current_member_id() and status in ('draft','revisionRequested','submitted'))
  with check (owner_member_id = private.current_member_id() and status in ('draft','revisionRequested','submitted','withdrawn'));
create policy submissions_editor_update on public.submissions for update to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));

create policy posts_visible_select on public.posts for select to anon, authenticated
  using (
    status = 'published'
    and not private.members_block_each_other(private.current_member_id(), author_member_id)
    and (
      visibility = 'public'
      or author_member_id = private.current_member_id()
      or (visibility = 'followers' and private.follows_member(private.current_member_id(), author_member_id))
    )
    or private.has_any_role(array['moderator','admin'])
  );
create policy posts_owner_insert on public.posts for insert to authenticated
  with check (author_member_id = private.current_member_id());
create policy posts_owner_update on public.posts for update to authenticated
  using (author_member_id = private.current_member_id()) with check (author_member_id = private.current_member_id());
create policy posts_moderator_update on public.posts for update to authenticated
  using (private.has_capability('community.moderate')) with check (private.has_capability('community.moderate'));

create policy comments_visible_select on public.comments for select to anon, authenticated
  using (status = 'published' and not private.members_block_each_other(private.current_member_id(), author_member_id) or private.has_any_role(array['moderator','admin']));
create policy comments_owner_insert on public.comments for insert to authenticated
  with check (author_member_id = private.current_member_id());
create policy comments_owner_update on public.comments for update to authenticated
  using (author_member_id = private.current_member_id()) with check (author_member_id = private.current_member_id());
create policy comments_moderator_update on public.comments for update to authenticated
  using (private.has_capability('community.moderate')) with check (private.has_capability('community.moderate'));

create policy owned_likes on public.likes for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy owned_reposts on public.reposts for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy owned_saves on public.saves for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy owned_collections on public.collections for all to authenticated
  using (owner_member_id = private.current_member_id()) with check (owner_member_id = private.current_member_id());
create policy owned_collection_items on public.collection_items for all to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.owner_member_id = private.current_member_id()))
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.owner_member_id = private.current_member_id()));
create policy owned_follows on public.follows for all to authenticated
  using (follower_member_id = private.current_member_id()) with check (follower_member_id = private.current_member_id());
create policy owned_blocks on public.blocks for all to authenticated
  using (blocker_member_id = private.current_member_id()) with check (blocker_member_id = private.current_member_id());
create policy owned_mutes on public.mutes for all to authenticated
  using (muter_member_id = private.current_member_id()) with check (muter_member_id = private.current_member_id());

create policy reports_owner_insert on public.reports for insert to authenticated
  with check (reporter_member_id = private.current_member_id());
create policy reports_owner_select on public.reports for select to authenticated
  using (reporter_member_id = private.current_member_id() or private.has_capability('community.moderate'));
create policy reports_moderator_update on public.reports for update to authenticated
  using (private.has_capability('community.moderate')) with check (private.has_capability('community.moderate'));
create policy moderation_events_moderator_select on public.moderation_events for select to authenticated
  using (private.has_capability('community.moderate'));
create policy moderation_events_moderator_insert on public.moderation_events for insert to authenticated
  with check (actor_member_id = private.current_member_id() and private.has_capability('community.moderate'));

create policy notifications_owner_all on public.notifications for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy notification_preferences_owner_all on public.notification_preferences for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());

create policy media_public_or_owner_select on public.media_assets for select to anon, authenticated
  using (
    (upload_status = 'uploaded' and moderation_state = 'approved' and removal_state = 'active' and visibility = 'public')
    or owner_member_id = private.current_member_id()
    or private.has_capability('media.moderate')
  );
create policy media_owner_insert on public.media_assets for insert to authenticated
  with check (
    owner_member_id = private.current_member_id()
    and upload_status = 'pending' and moderation_state = 'pending'
    and removal_state = 'active' and visibility = 'private'
  );
create policy media_moderator_update on public.media_assets for update to authenticated
  using (private.has_capability('media.moderate')) with check (private.has_capability('media.moderate'));
create policy media_links_visible_select on public.media_links for select to anon, authenticated
  using (
    (post_id is not null and exists (select 1 from public.posts p where p.id = post_id))
    or (post_id is null and media_asset_id is not null and exists (select 1 from public.media_assets a where a.id = media_asset_id))
  );
create policy media_links_owner_insert on public.media_links for insert to authenticated
  with check (
    post_id is not null
    and exists (select 1 from public.posts p where p.id = post_id and p.author_member_id = private.current_member_id())
    and (media_asset_id is null or exists (select 1 from public.media_assets a where a.id = media_asset_id and a.owner_member_id = private.current_member_id()))
  );

create policy training_sessions_owner_all on public.training_sessions for all to authenticated
  using (owner_member_id = private.current_member_id()) with check (owner_member_id = private.current_member_id());
create policy training_sessions_public_select on public.training_sessions for select to anon, authenticated
  using (visibility = 'public' and status = 'active');
create policy training_movements_owner_all on public.training_session_movements for all to authenticated
  using (exists (select 1 from public.training_sessions s where s.id = session_id and s.owner_member_id = private.current_member_id()))
  with check (exists (select 1 from public.training_sessions s where s.id = session_id and s.owner_member_id = private.current_member_id()));
create policy training_sets_owner_all on public.training_sets for all to authenticated
  using (exists (
    select 1 from public.training_session_movements sm join public.training_sessions s on s.id = sm.session_id
    where sm.id = session_movement_id and s.owner_member_id = private.current_member_id()
  )) with check (exists (
    select 1 from public.training_session_movements sm join public.training_sessions s on s.id = sm.session_id
    where sm.id = session_movement_id and s.owner_member_id = private.current_member_id()
  ));
create policy personal_records_owner_all on public.personal_records for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy personal_records_public_select on public.personal_records for select to anon, authenticated
  using (public_visible and status = 'active');
create policy skill_progress_owner_all on public.skill_progress for all to authenticated
  using (member_id = private.current_member_id()) with check (member_id = private.current_member_id());
create policy skill_progress_public_select on public.skill_progress for select to anon, authenticated
  using (public_visible);

grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.profile_social_accounts to authenticated;
grant select, insert, update, delete on public.athlete_claims to authenticated;
grant select, insert, update, delete on public.claimed_athlete_presentations to authenticated;
grant select, insert, update, delete on public.posts, public.comments, public.likes, public.reposts,
  public.saves, public.collections, public.collection_items, public.follows, public.blocks, public.mutes to authenticated;
grant select, insert, update on public.reports, public.notifications, public.notification_preferences to authenticated;
grant select, insert on public.moderation_events to authenticated;
grant select, insert, update on public.media_assets, public.media_links to authenticated;
grant select, insert, update, delete on public.training_sessions, public.training_session_movements,
  public.training_sets, public.personal_records, public.skill_progress to authenticated;
grant select, insert, update, delete on public.submissions to authenticated;
grant select, insert, update, delete on public.athletes, public.competitions, public.sporting_results,
  public.sporting_result_performances, public.ranking_providers, public.ranking_systems,
  public.ranking_snapshots, public.ranking_entries, public.source_records, public.provenance,
  public.editorial_content, public.editorial_revisions, public.editorial_publication_state to authenticated;
grant select, insert, update, delete on public.member_roles, public.member_capabilities to authenticated;
grant update on public.members to authenticated;

commit;
