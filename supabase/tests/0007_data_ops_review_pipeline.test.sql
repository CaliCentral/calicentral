begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'source_adapters', 'source adapter registry exists');
select has_table('public', 'raw_source_snapshots', 'raw snapshot registry exists');
select has_table('public', 'source_extractions', 'versioned extraction registry exists');
select has_table('public', 'identity_resolution_attempts', 'identity resolution audit exists');
select has_table('public', 'change_proposals', 'human review queue exists');
select has_table('public', 'auto_apply_policies', 'explicit auto-apply allowlist exists');

select is(
  (select status from public.source_adapters where slug = 'official-streetlifting'),
  'paused',
  'Official Streetlifting scheduling is disabled by default'
);
select is(
  (select count(*)::int from public.auto_apply_policies where enabled),
  0,
  'no field is eligible for autonomous writes by default'
);

insert into public.raw_source_snapshots (
  id, source_adapter_id, source_url, source_entity_type, fetched_at,
  content_hash, content_type, raw_payload_ref, http_status, parser_version
) values (
  '00000000-0000-0000-0000-000000000701',
  (select id from public.source_adapters where slug = 'official-streetlifting'),
  'https://rankings.officialstreetlifting.com/results/', 'results-directory', now(),
  repeat('a', 64), 'text/html', 'local-review/fixture.html', 200, 'osl-html-v1'
);
select throws_ok(
  $$update public.raw_source_snapshots set source_url = 'https://example.test' where id = '00000000-0000-0000-0000-000000000701'$$,
  'P0001', 'audit events are immutable', 'raw snapshots cannot be rewritten'
);

select throws_ok(
  $$insert into public.identity_resolution_attempts (
      source_extraction_id, candidate_entity_type, external_provider, external_id,
      match_basis, match_confidence
    ) values (
      '00000000-0000-0000-0000-000000000799', 'athlete', 'official-streetlifting',
      'athlete-one', '{"name_only": true}', 0.5
    )$$,
  '23514', null, 'identity attempts reject name-only matching before resolution'
);

select throws_ok(
  $$insert into public.auto_apply_policies (
      target_table, field_path, max_risk_tier, min_confidence, created_by
    ) values ('competitions', 'start_date', 'medium', 0.95, gen_random_uuid())$$,
  '23514', null, 'auto-apply risk cannot be raised above low'
);

select * from finish();
rollback;
