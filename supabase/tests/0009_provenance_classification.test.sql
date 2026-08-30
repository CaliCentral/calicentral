begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_column('public', 'athletes', 'provenance_status', 'athletes carries a provenance_status column');
select has_column('public', 'competitions', 'provenance_status', 'competitions carries a provenance_status column');
select has_column('public', 'organizations', 'provenance_status', 'organizations carries a provenance_status column');
select has_column('public', 'teams', 'provenance_status', 'teams carries a provenance_status column');
select has_column('public', 'products', 'provenance_status', 'products carries a provenance_status column');

insert into public.athletes (id, permanent_id, slug, name, editorial_state) values
  ('00000000-0000-0000-0000-000000000901', 'athlete.permanent.prov', 'prov-athlete', 'Provenance Test Athlete', 'draft');
select is(
  (select provenance_status::text from public.athletes where id = '00000000-0000-0000-0000-000000000901'),
  'unknown',
  'a new athlete with no explicit provenance defaults to unknown, never real or fictional by omission'
);

update public.athletes set provenance_status = 'fictional_sample' where id = '00000000-0000-0000-0000-000000000901';
select is(
  (select provenance_status::text from public.athletes where id = '00000000-0000-0000-0000-000000000901'),
  'fictional_sample',
  'provenance_status can be explicitly set to fictional_sample'
);

select throws_ok(
  $$update public.athletes set provenance_status = 'made-up-value' where id = '00000000-0000-0000-0000-000000000901'$$,
  '22P02',
  null,
  'provenance_status rejects a value outside the four defined states'
);

select * from finish();
rollback;
