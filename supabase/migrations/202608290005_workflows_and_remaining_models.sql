begin;

create table public.ranking_categories (
  id uuid primary key default gen_random_uuid(),
  legacy_sanity_id text unique,
  slug extensions.citext not null unique,
  title text not null,
  subtitle text,
  discipline text not null,
  division text,
  region text,
  scope text not null default 'competition' check (scope = 'competition'),
  status text not null default 'draft',
  methodology_status text not null default 'unapproved',
  season_label text,
  season_start date,
  season_end date,
  description text not null default '',
  display_order integer not null default 0,
  entries jsonb not null default '[]'::jsonb,
  methodology_note text not null default '',
  prototype_status text,
  seo jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (status <> 'published' or (methodology_status = 'approved' and season_label is not null))
);

alter table public.ranking_categories enable row level security;
alter table public.ranking_categories force row level security;
grant select on public.ranking_categories to anon, authenticated;
grant insert, update, delete on public.ranking_categories to authenticated;
create policy ranking_categories_public_select on public.ranking_categories
  for select to anon, authenticated
  using (status = 'published' or private.has_capability('ranking.write'));
create policy ranking_categories_authority_all on public.ranking_categories
  for all to authenticated
  using (private.has_capability('ranking.write')) with check (private.has_capability('ranking.write'));

create policy public_rulesets_select on public.rulesets for select to anon, authenticated
  using (status = 'official' or private.has_capability('sport.write_source_truth'));
create policy public_team_seasons_select on public.team_seasons for select to anon, authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.status = 'active') or private.has_capability('sport.write_source_truth'));
create policy public_authors_select on public.authors for select to anon, authenticated using (true);
create policy public_video_series_select on public.video_series for select to anon, authenticated using (true);
create policy public_stories_select on public.stories for select to anon, authenticated
  using (exists (select 1 from public.editorial_content e where e.id = editorial_content_id));
create policy public_videos_select on public.videos for select to anon, authenticated
  using (exists (select 1 from public.editorial_content e where e.id = editorial_content_id));
create policy public_products_select on public.products for select to anon, authenticated
  using (publication_state = 'published' or private.has_capability('editorial.review'));
create policy public_site_settings_select on public.site_settings for select to anon, authenticated using (true);
create policy public_movements_select on public.movements for select to anon, authenticated using (status = 'active');
create policy external_athlete_identities_authority on public.external_athlete_identities for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy external_competition_identities_authority on public.external_competition_identities for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy team_affiliations_visible on public.team_affiliations for select to anon, authenticated
  using (public_visible or member_id = private.current_member_id() or private.has_capability('sport.write_source_truth'));
create policy team_memberships_owner_select on public.team_memberships for select to authenticated
  using (member_id = private.current_member_id() or private.has_role('admin'));
create policy team_invitations_party_select on public.team_invitations for select to authenticated
  using (invited_by_member_id = private.current_member_id() or invited_member_id = private.current_member_id() or private.has_role('admin'));
create policy organization_memberships_owner_select on public.organization_memberships for select to authenticated
  using (member_id = private.current_member_id() or private.has_role('admin'));
create policy canonical_updates_public_select on public.canonical_update_events for select to anon, authenticated
  using (source_status = 'approved-public');
create policy audit_events_admin_select on public.audit_events for select to authenticated
  using (private.has_role('admin'));
create policy roles_authenticated_select on public.roles for select to authenticated using (true);
create policy capabilities_authenticated_select on public.capabilities for select to authenticated using (true);

create policy sport_authority_all_organizations on public.organizations for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_teams on public.teams for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_team_seasons on public.team_seasons for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy sport_authority_all_rulesets on public.rulesets for all to authenticated
  using (private.has_capability('sport.write_source_truth')) with check (private.has_capability('sport.write_source_truth'));
create policy editorial_authority_all_authors on public.authors for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_authority_all_video_series on public.video_series for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_authority_all_stories on public.stories for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_authority_all_videos on public.videos for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_authority_all_products on public.products for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));
create policy editorial_authority_all_site_settings on public.site_settings for all to authenticated
  using (private.has_capability('editorial.review')) with check (private.has_capability('editorial.review'));

grant insert, update, delete on public.organizations, public.teams, public.team_seasons, public.rulesets,
  public.authors, public.video_series, public.stories, public.videos, public.products, public.site_settings to authenticated;
grant insert, update, delete on public.external_athlete_identities, public.external_competition_identities to authenticated;

create or replace function public.transition_editorial_publication(
  content_id uuid,
  next_state text,
  transition_reason text default null
) returns uuid
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare new_state_id uuid;
begin
  if next_state not in ('draft', 'in-review', 'approved', 'published', 'unpublished', 'archived') then
    raise exception 'invalid editorial publication state';
  end if;
  update public.editorial_publication_state
    set is_current = false
    where editorial_content_id = content_id and is_current;
  insert into public.editorial_publication_state (editorial_content_id, state, changed_by, reason, is_current)
  values (content_id, next_state, private.current_member_id(), transition_reason, true)
  returning id into new_state_id;
  return new_state_id;
end;
$$;

grant execute on function public.transition_editorial_publication(uuid, text, text) to authenticated;

create or replace function public.request_owned_media_removal(asset_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare actor uuid := private.current_member_id();
begin
  if actor is null then raise exception 'authentication required'; end if;
  update public.media_assets
    set moderation_state = 'removed', removal_state = 'owner-removed', visibility = 'private',
        moderation_note = 'Removed by the media owner.', removed_at = now(), updated_at = now()
    where id = asset_id and owner_member_id = actor and removal_state = 'active';
  if not found then raise exception 'media asset cannot be removed'; end if;
  insert into public.moderation_events (event_type, actor_member_id, target_type, target_id, summary)
  values ('mediaRemoved', actor, 'media', asset_id::text, 'Removed by the media owner.');
end;
$$;

revoke all on function public.request_owned_media_removal(uuid) from public;
grant execute on function public.request_owned_media_removal(uuid) to authenticated;

commit;
