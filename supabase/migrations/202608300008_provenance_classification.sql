begin;

-- Sanity's `prototypeStatus` field ("real" | "sample-record" |
-- "fictional-prototype" | "not-official") distinguished genuine content from
-- development sample data, but the Sanity -> Supabase migration only carried
-- it onto editorial_content and ranking_categories -- athletes, competitions,
-- organizations, teams, and products have no queryable provenance at all
-- today, which blocks ever safely deleting sample data from those tables
-- without guessing from names. This adds an explicit, per-table provenance
-- column (the same per-table text+check pattern already used for
-- identity_state/editorial_state/review_state, not a new normalized
-- relation) with four states. New rows and every existing untouched row
-- default to 'unknown' -- never 'fictional_sample' or 'real_verified' --
-- so nothing is misclassified by omission; classification is populated by a
-- separate, explicit, evidence-based backfill pass.

create type public.provenance_status as enum (
  'real_verified',
  'real_unverified',
  'fictional_sample',
  'unknown'
);

alter table public.athletes add column provenance_status public.provenance_status not null default 'unknown';
alter table public.competitions add column provenance_status public.provenance_status not null default 'unknown';
alter table public.organizations add column provenance_status public.provenance_status not null default 'unknown';
alter table public.teams add column provenance_status public.provenance_status not null default 'unknown';
alter table public.products add column provenance_status public.provenance_status not null default 'unknown';

create index athletes_provenance_status_idx on public.athletes (provenance_status);
create index competitions_provenance_status_idx on public.competitions (provenance_status);
create index organizations_provenance_status_idx on public.organizations (provenance_status);
create index teams_provenance_status_idx on public.teams (provenance_status);
create index products_provenance_status_idx on public.products (provenance_status);

commit;
