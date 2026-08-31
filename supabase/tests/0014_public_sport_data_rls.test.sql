begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

-- Regression coverage for the public Supabase-backed sport pages
-- (/athletes, /competitions, /rankings): every table these pages read from
-- must show anon exactly the published subset, and every private/internal
-- table must stay fully inaccessible to anon regardless of publication
-- state anywhere else.
insert into public.athletes (id, permanent_id, slug, name, editorial_state) values
  ('00000000-0000-0000-0000-000000001401', 'athlete.permanent.rls-public', 'rls-public-athlete', 'Public RLS Athlete', 'approved'),
  ('00000000-0000-0000-0000-000000001402', 'athlete.permanent.rls-draft', 'rls-draft-athlete', 'Draft RLS Athlete', 'draft');
insert into public.competitions (id, permanent_id, slug, name, status, public_state) values
  ('00000000-0000-0000-0000-000000001403', 'competition.permanent.rls-public', 'rls-public-competition', 'Public RLS Competition', 'upcoming', 'published'),
  ('00000000-0000-0000-0000-000000001404', 'competition.permanent.rls-draft', 'rls-draft-competition', 'Draft RLS Competition', 'upcoming', 'draft');
insert into public.ranking_providers (id, slug, name, status, integration_method, attribution_requirement) values
  ('00000000-0000-0000-0000-000000001405', 'rls-test-provider', 'RLS Test Provider', 'active', 'structured-import', 'Attribute to RLS Test Provider');
insert into public.ranking_systems (id, provider_id, slug, name, ranking_kind, discipline, geographic_scope, status) values
  ('00000000-0000-0000-0000-000000001406', '00000000-0000-0000-0000-000000001405', 'rls-test-system', 'RLS Test Rankings', 'ordinal-position', 'streetlifting', 'world', 'active');
insert into public.source_records (id, provider, source_type, external_record_id) values
  ('00000000-0000-0000-0000-000000001407', 'rls-test-provider', 'ranking-table', 'rls-test-1');
insert into public.ranking_snapshots (id, ranking_system_id, ranking_date, source_record_id, checked_at, publication_status, source_url, source_verification_state) values
  ('00000000-0000-0000-0000-000000001408', '00000000-0000-0000-0000-000000001406', current_date, '00000000-0000-0000-0000-000000001407', now(), 'published', 'https://provider.example/rankings', 'source-confirmed'),
  ('00000000-0000-0000-0000-000000001409', '00000000-0000-0000-0000-000000001406', current_date - interval '1 day', '00000000-0000-0000-0000-000000001407', now(), 'draft', 'https://provider.example/rankings', 'source-confirmed');
insert into public.ranking_entries (ranking_snapshot_id, athlete_id, rank, entry_status) values
  ('00000000-0000-0000-0000-000000001408', '00000000-0000-0000-0000-000000001401', 1, 'ranked'),
  ('00000000-0000-0000-0000-000000001409', '00000000-0000-0000-0000-000000001401', 1, 'ranked');

set role anon;

select results_eq(
  $$select count(*)::int from public.athletes where id = '00000000-0000-0000-0000-000000001401'$$,
  array[1], 'anon can see the published (approved) athlete'
);
select results_eq(
  $$select count(*)::int from public.athletes where id = '00000000-0000-0000-0000-000000001402'$$,
  array[0], 'anon cannot see the draft athlete'
);
select results_eq(
  $$select count(*)::int from public.competitions where id = '00000000-0000-0000-0000-000000001403'$$,
  array[1], 'anon can see the published competition'
);
select results_eq(
  $$select count(*)::int from public.competitions where id = '00000000-0000-0000-0000-000000001404'$$,
  array[0], 'anon cannot see the draft competition'
);
select results_eq(
  $$select count(*)::int from public.ranking_snapshots where id = '00000000-0000-0000-0000-000000001408'$$,
  array[1], 'anon can see the published ranking snapshot'
);
select results_eq(
  $$select count(*)::int from public.ranking_snapshots where id = '00000000-0000-0000-0000-000000001409'$$,
  array[0], 'anon cannot see the draft ranking snapshot'
);
select results_eq(
  $$select count(*)::int from public.ranking_entries where ranking_snapshot_id = '00000000-0000-0000-0000-000000001408'$$,
  array[1], 'anon can see entries of a published snapshot'
);
select results_eq(
  $$select count(*)::int from public.ranking_entries where ranking_snapshot_id = '00000000-0000-0000-0000-000000001409'$$,
  array[0], 'anon cannot see entries of a draft snapshot'
);
select results_eq(
  $$select count(*)::int from public.ranking_providers where id = '00000000-0000-0000-0000-000000001405' and status = 'active'$$,
  array[1], 'anon can see the active ranking provider (a separate gate from snapshot publication)'
);
select throws_ok(
  $$select count(*) from public.contributor_internal_notes$$,
  '42501', null, 'anon has no grant at all on contributor_internal_notes -- a table-level denial, stronger than an RLS filter'
);
select throws_ok(
  $$select count(*) from public.raw_source_snapshots$$,
  '42501', null, 'anon has no grant at all on raw_source_snapshots -- internal Data Ops records stay fully inaccessible'
);

reset role;
select * from finish();
rollback;
