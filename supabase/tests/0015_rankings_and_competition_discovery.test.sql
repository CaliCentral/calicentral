begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select has_column('public', 'ranking_systems', 'external_system_key', 'ranking systems have provider-native identity');
select has_column('public', 'ranking_systems', 'lift_format', 'ranking systems retain lift format');
select has_column('public', 'ranking_snapshots', 'source_content_hash', 'ranking snapshots retain content identity');
select has_column('public', 'ranking_entries', 'provider_entry_id', 'ranking entries retain provider-native row identity');
select has_table('public', 'ranking_system_match_reviews', 'ambiguous system mappings have a review queue');
select has_table('public', 'source_discovery_runs', 'source discovery runs are auditable');
select has_table('public', 'competition_source_observations', 'competition source history is retained');
select has_table('public', 'competition_roster_observations', 'source-backed roster states are representable');

select is(
  (select status from public.source_adapters where slug = 'official-streetlifting'),
  'paused',
  'hourly fetching remains disabled'
);
select is(
  (select parser_version from public.source_adapters where slug = 'official-streetlifting'),
  'osl-html-v2',
  'registry pins the deterministic parser version'
);

insert into public.ranking_providers (id, slug, name, integration_method, attribution_requirement)
values ('00000000-0000-0000-0000-000000001501', 'rank-identity-fixture', 'Fixture', 'structured-import', 'Fixture');
insert into public.ranking_systems (
  id, provider_id, slug, name, ranking_kind, discipline, geographic_scope, external_system_key
) values (
  '00000000-0000-0000-0000-000000001502', '00000000-0000-0000-0000-000000001501',
  'rank-system-one', 'System One', 'ordinal-position', 'streetlifting', 'world', '/rankings?gender=male'
);
select throws_ok(
  $$insert into public.ranking_systems (
      provider_id, slug, name, ranking_kind, discipline, geographic_scope, external_system_key
    ) values (
      '00000000-0000-0000-0000-000000001501', 'rank-system-two', 'Renamed System',
      'ordinal-position', 'streetlifting', 'world', '/rankings?gender=male'
    )$$,
  '23505', null, 'a cosmetic title change cannot duplicate a provider-native ranking system'
);

insert into public.source_records (id, provider, source_type, external_record_id)
values ('00000000-0000-0000-0000-000000001503', 'rank-identity-fixture', 'ranking-table', 'fixture');
insert into public.ranking_snapshots (
  id, ranking_system_id, ranking_date, checked_at, source_record_id, source_content_hash
) values (
  '00000000-0000-0000-0000-000000001504', '00000000-0000-0000-0000-000000001502',
  current_date, now(), '00000000-0000-0000-0000-000000001503', repeat('a', 64)
);
insert into public.ranking_entries (
  ranking_snapshot_id, athlete_id, provider_entry_id, provider_athlete_id, source_display_name, rank
) values (
  '00000000-0000-0000-0000-000000001504', null, 'external-entry-1', 'external-athlete-1', 'Unresolved Athlete', 1
);
select is(
  (select count(*)::int from public.ranking_entries where provider_athlete_id = 'external-athlete-1' and athlete_id is null),
  1,
  'unresolved external entries remain as evidence without a name-only athlete merge'
);

select * from finish();
rollback;
