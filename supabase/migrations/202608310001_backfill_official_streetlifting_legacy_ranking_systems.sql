begin;

-- The four legacy Official Streetlifting absolute ranking systems (migrated
-- from Sanity as drafts) encoded lift format in `category` ("All4"/"Classic")
-- and never populated the structured `lift_format`/`equipment`/
-- `methodology_category` columns 202608300012 added. Against the live source
-- parser -- which always emits category "absolute-total", equipment
-- "source-defined", and methodology "source-total-descending" for these four
-- pages -- that gap left every one of them AMBIGUOUS_REVIEW in the ranking-
-- system matcher (lib/data-ops/ranking-system-matcher.ts), never EXACT_MATCH.
--
-- This backfill only reshapes existing structured dimensions on rows that
-- already exist; it creates no new systems, snapshots, or entries, and does
-- not touch the separate Male All4 -101kg World system (it stays weight-
-- class-specific and must never match an absolute source table). Stable keys
-- and source URLs were confirmed 2026-08-31 by a single read-only fetch of
-- https://rankings.officialstreetlifting.com/ and match
-- officialStreetliftingStableRankingKey() exactly.
update public.ranking_systems
set
  category = 'absolute-total',
  lift_format = 'all4',
  equipment = 'source-defined',
  methodology_category = 'source-total-descending',
  external_system_key = '/rankings?gender=female',
  source_url = 'https://rankings.officialstreetlifting.com/rankings?gender=female'
where slug = 'official-streetlifting-female-all4-absolute';

update public.ranking_systems
set
  category = 'absolute-total',
  lift_format = '2-lift-pull-dip',
  equipment = 'source-defined',
  methodology_category = 'source-total-descending',
  external_system_key = '/rankings/classic?gender=female',
  source_url = 'https://rankings.officialstreetlifting.com/rankings/classic?gender=female'
where slug = 'official-streetlifting-female-classic-absolute';

update public.ranking_systems
set
  category = 'absolute-total',
  lift_format = 'all4',
  equipment = 'source-defined',
  methodology_category = 'source-total-descending',
  external_system_key = '/rankings?gender=male',
  source_url = 'https://rankings.officialstreetlifting.com/rankings?gender=male'
where slug = 'official-streetlifting-male-all4-absolute';

update public.ranking_systems
set
  category = 'absolute-total',
  lift_format = '2-lift-pull-dip',
  equipment = 'source-defined',
  methodology_category = 'source-total-descending',
  external_system_key = '/rankings/classic?gender=male',
  source_url = 'https://rankings.officialstreetlifting.com/rankings/classic?gender=male'
where slug = 'official-streetlifting-male-classic-absolute';

-- Fail the migration loudly rather than silently backfilling nothing if the
-- expected legacy rows are ever absent (for example, a fresh environment
-- seeded after this migration but before the Sanity-migrated legacy rows
-- exist should not report false success).
do $$
declare
  backfilled_count integer;
begin
  select count(*) into backfilled_count
  from public.ranking_systems
  where slug in (
    'official-streetlifting-female-all4-absolute',
    'official-streetlifting-female-classic-absolute',
    'official-streetlifting-male-all4-absolute',
    'official-streetlifting-male-classic-absolute'
  )
  and category = 'absolute-total';
  if backfilled_count not in (0, 4) then
    raise exception 'Expected 0 or 4 legacy Official Streetlifting absolute systems backfilled, found %', backfilled_count;
  end if;
end $$;

commit;
