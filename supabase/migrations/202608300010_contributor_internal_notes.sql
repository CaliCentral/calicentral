begin;

-- Sanity's contributorProfile.internalNotes (admin-only private moderation
-- context about a contributor, shown on /admin/contributors/[id]) has no
-- Supabase equivalent. It cannot simply become a column on public.profiles:
-- that table's own SELECT policy is intentionally readable by the owning
-- contributor themselves (profiles_public_select), and internal notes must
-- never be contributor-visible. A separate, narrowly-scoped table with its
-- own admin-only policy is the smallest correct fix, not a workaround.
create table public.contributor_internal_notes (
  member_id uuid primary key references public.members(id) on delete cascade,
  notes text not null default '' check (char_length(notes) <= 6000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members(id) on delete set null
);

alter table public.contributor_internal_notes enable row level security;
alter table public.contributor_internal_notes force row level security;

create policy contributor_internal_notes_admin_all on public.contributor_internal_notes
  for all to authenticated
  using (private.has_role('admin')) with check (private.has_role('admin'));

grant select, insert, update, delete on public.contributor_internal_notes to authenticated;

commit;
