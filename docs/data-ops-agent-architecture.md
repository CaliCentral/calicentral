# Cali Central Data Operations Agent — architecture proposal

Status: **local deterministic foundation implemented; recurring execution is
disabled.** The immutable snapshot/extraction/review schema, provider registry,
Official Streetlifting parsers, ranking matcher, provider-neutral competition
discovery, diff planning, source-health reporting, and local rehearsal exist.
No scheduler is enabled, no autonomous hosted writes exist, and every
auto-apply policy remains disabled. Real automated writes still require a
separate explicit approval.

## Why this needs its own trust boundary

Every other part of this migration has been built around one non-negotiable
rule, stated repeatedly across `docs/decisions/0003-use-vercel-supabase-and-r2.md`
and `docs/supabase-migration.md`: **source truth, normalized Cali truth,
editorial interpretation, and UGC/self-report are four different things that
must never silently collapse into each other**, and **athlete identity is
never merged by name alone**. An automated agent that discovers, ingests, and
proposes changes to athlete/competition/ranking data is the single riskiest
thing that could be added to this system, precisely because automation is
good at doing the wrong thing at scale quietly. The whole design below exists
to make that structurally hard, not just policy-discouraged.

## Trust pipeline

```
EXTERNAL SOURCE (official site, PDF, API, permitted social post)
        |
        v
[1] RAW IMMUTABLE SNAPSHOT  --  exact bytes + fetch metadata, never mutated
        |
        v
[2] DETERMINISTIC PARSER  --  tried first, always; structured, versioned, testable
        |  (falls through only if deterministic parsing fails/low-confidence)
        v
[2b] AI EXTRACTION  --  only for messy/unstructured sources; provider-neutral,
     structured-output schema, never free-form prose written to the DB
        |
        v
[3] IDENTITY RESOLUTION  --  match against existing athletes/orgs/competitions,
     or flag as a new-identity candidate; NEVER auto-merge by name
        |
        v
[4] CONFIDENCE SCORING  --  per-field, not just per-record
        |
        v
[5] CHANGE PROPOSAL  --  a diff against current normalized truth, with
     provenance back to [1], sitting in a review queue
        |
        v
[6a] AUTO-APPLY (high confidence, low risk, narrow field allowlist only)
[6b] HUMAN REVIEW (everything else)  -->  applies through the EXISTING admin
     mutation path (admin-actions.ts), not a separate write path
```

This mirrors the schema pattern already in production:
`source_records` (raw, provider-attributed) → `provenance` (field-level
attribution with a `trust_class`) → the normalized tables (`athletes`,
`competitions`, `sporting_results`, `ranking_snapshots`) → editorial/UGC
tables that are explicitly separate (`editorial_content`, `posts`,
`athlete_claims`). The data-ops agent is a new *producer* into the same
pipeline, not a parallel system with its own truth model.

## Proposed schema additions

The initial proposal is now implemented by migrations
`202608300006_data_ops_review_pipeline.sql` and
`202608300012_rankings_and_competition_discovery.sql`. The second migration
adds provider capabilities and fetch limits, discovery-run coverage, immutable
competition/roster observations, and explicit ranking-system match review.
The SQL sketches below remain explanatory, not a separate schema to apply.

All new, additive tables — no changes to existing tables except where noted.
Table/column names follow this repo's existing conventions (`snake_case`,
`*_state`/`*_status` text columns with explicit `check` constraints, a
`source_record_id` thread back to provenance where relevant).

```sql
-- A registered way to reach one external source. Config only, no secrets.
create table public.source_adapters (
  id uuid primary key default gen_random_uuid(),
  slug extensions.citext not null unique,
  name text not null,
  adapter_kind text not null check (adapter_kind in ('official-site', 'pdf', 'api', 'permitted-social')),
  target_domain text not null,
  parser_strategy text not null default 'deterministic' check (parser_strategy in ('deterministic', 'ai-extraction')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'retired')),
  schedule_cron text,
  last_run_at timestamptz,
  last_success_at timestamptz,
  consecutive_failure_count integer not null default 0,
  health_state text not null default 'unknown' check (health_state in ('unknown', 'healthy', 'degraded', 'failing')),
  access_rules_note text not null default '', -- e.g. "public results page, no auth wall, robots.txt allows"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exact, unmutated capture of what was fetched. Content-addressed so the
-- same raw payload is never stored twice, and every downstream artifact can
-- always be traced back to exactly what was actually seen.
create table public.raw_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid not null references public.source_adapters(id) on delete restrict,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  content_type text not null,
  raw_payload_ref text not null, -- R2 object key; raw bytes never live in Postgres
  http_status integer,
  fetch_metadata jsonb not null default '{}'::jsonb,
  unique (source_adapter_id, content_hash)
);

-- One parse attempt over one snapshot. Immutable once written -- a
-- corrected extraction is a new row, not an edit, so "what did we think this
-- said at the time" is always answerable.
create table public.source_extractions (
  id uuid primary key default gen_random_uuid(),
  raw_snapshot_id uuid not null references public.raw_source_snapshots(id) on delete restrict,
  extraction_method text not null check (extraction_method in ('deterministic-parser', 'ai-extraction')),
  parser_version text,
  ai_model_id text, -- e.g. 'claude-sonnet-5'; null for deterministic
  ai_router_provider text, -- provider-neutral: which backend actually served it
  extracted_at timestamptz not null default now(),
  extracted_payload jsonb not null, -- structured, schema-validated output only -- never raw prose
  extraction_confidence numeric check (extraction_confidence between 0 and 1),
  extraction_status text not null default 'succeeded' check (extraction_status in ('succeeded', 'partial', 'failed')),
  failure_reason text
);

-- The identity-resolution step's own audit trail, kept distinct from the
-- resolution result living on the change proposal below, so a bad match can
-- be traced back to exactly what evidence led to it.
create table public.identity_resolution_attempts (
  id uuid primary key default gen_random_uuid(),
  source_extraction_id uuid not null references public.source_extractions(id) on delete restrict,
  candidate_entity_type text not null check (candidate_entity_type in ('athlete', 'organization', 'competition', 'team')),
  candidate_entity_id uuid, -- null if this attempt proposes a brand-new identity
  match_basis jsonb not null default '{}'::jsonb, -- e.g. {"external_id_match": true, "name_similarity": 0.4} -- name alone is never sufficient, enforced in application code, not just documented
  match_confidence numeric not null check (match_confidence between 0 and 1),
  resolution_state text not null default 'proposed' check (resolution_state in ('proposed', 'confirmed', 'rejected', 'ambiguous')),
  created_at timestamptz not null default now()
);

-- The actual thing a human (or, for a narrow allowlist, the system) acts on.
create table public.change_proposals (
  id uuid primary key default gen_random_uuid(),
  source_extraction_id uuid not null references public.source_extractions(id) on delete restrict,
  identity_resolution_attempt_id uuid references public.identity_resolution_attempts(id) on delete set null,
  target_table text not null,
  target_id uuid, -- null when the proposal is to create a new row
  proposed_change jsonb not null, -- field-level diff, not a full-row replacement
  change_kind text not null check (change_kind in ('create', 'update', 'flag-stale', 'flag-duplicate', 'flag-conflict')),
  confidence numeric not null check (confidence between 0 and 1),
  risk_tier text not null check (risk_tier in ('low', 'medium', 'high')),
  review_state text not null default 'pending' check (review_state in ('pending', 'auto-applied', 'approved', 'rejected', 'superseded')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  applied_source_record_id uuid references public.source_records(id) on delete set null, -- once approved, this is the source_record that provenance ends up pointing to
  created_at timestamptz not null default now()
);

-- A narrow, explicit, admin-editable allowlist of exactly which
-- (target_table, field, risk_tier) combinations may ever auto-apply.
-- Nothing auto-applies by default; a row must exist here first.
create table public.auto_apply_policies (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  field_path text not null,
  max_risk_tier text not null check (max_risk_tier in ('low')), -- deliberately cannot be raised past 'low' without a schema change, not just a config change
  min_confidence numeric not null check (min_confidence >= 0.9),
  requires_second_model_verification boolean not null default true,
  enabled boolean not null default false,
  created_by uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (target_table, field_path)
);
```

Notes on the design choices above:

- **No table here ever writes directly to `athletes`/`competitions`/etc.**
  Every proposal flows through the *existing* admin server actions
  (`lib/supabase/admin-actions.ts`), even for an auto-applied change — the
  agent's privilege is "create a change_proposals row," never "write to the
  normalized tables." This means every invariant already enforced there
  (the athlete-identity no-merge-by-name rule, XOR checks, RLS) applies
  automatically to agent-sourced changes with zero new enforcement code.
- `raw_source_snapshots` never stores raw bytes in Postgres — they go to R2
  (a new bucket or prefix, never the community-media bucket), keeping
  Postgres small and giving raw evidence the same storage/retention model as
  other media.
- `max_risk_tier` on `auto_apply_policies` is constrained to `'low'` at the
  database level, not just by convention — raising the auto-apply ceiling
  requires a reviewed migration, not a config toggle an compromised admin
  session could flip.
- `identity_resolution_attempts.match_basis` is a structured record of *why*
  a match was proposed specifically so "matched by name similarity alone"
  is a visible, auditable, and rejectable pattern rather than an invisible
  implementation detail.

## Confidence scoring and auto-apply thresholds

Confidence is **per-field on the change proposal**, not a single per-record
score — a proposal that's 95% confident about a competition's `start_date`
but only 40% confident about a `placement` value must be splittable so the
high-confidence field can auto-apply (if `auto_apply_policies` allows it for
that field) while the low-confidence field waits for review, rather than an
all-or-nothing gate forcing every low-confidence field to also block the
high-confidence ones, or worse, letting a low-confidence field ride through
attached to a high-confidence sibling.

Auto-apply requires **all** of:
1. An enabled row in `auto_apply_policies` for that exact `(target_table,
   field_path)`.
2. `risk_tier = 'low'` on the proposal itself (schema-enforced ceiling).
3. `confidence >= min_confidence` (schema-enforced floor of 0.9).
4. If `requires_second_model_verification` is true (the default), a second,
   independent model call agreeing with the extraction before it's eligible
   — this is exactly the "second-model verification for high-consequence
   ambiguities" the brief asked for, applied as a gate rather than an
   afterthought.

Everything else — every new-identity proposal, every proposal touching
`identity_state`, `editorial_state`, `verification_state`, or any
provenance/trust field, and every medium/high risk_tier proposal regardless
of confidence — goes to human review, full stop.

## Provider-neutral AI router and cost controls

- The extraction step calls a thin internal router, not a hardcoded provider
  SDK, so the model backing `ai_router_provider` can change without touching
  extraction logic — mirrors this repo's existing pattern of never hardcoding
  a single vendor dependency without documenting why (see AGENTS.md's "no
  new paid dependency without documenting the reason").
  - Deterministic parsers are tried first for every source, always — the
    router is only invoked when a source is genuinely unstructured (a PDF
    with no consistent layout, free-text roster announcements, etc.), which
    keeps both cost and hallucination surface area to the minimum the
    problem actually requires.
  - Second-model verification (for auto-apply eligibility) deliberately uses
    a *different* provider/model than the primary extraction, not just a
    second call to the same model, to avoid correlated failure modes.
- Cost controls: a per-adapter daily/monthly extraction budget
  (`source_adapters` could grow a `monthly_ai_budget_cents` column when this
  is built), a hard global kill switch independent of any per-adapter
  setting, and routing every extraction call through the same audit trail
  (`source_extractions` already records `ai_model_id`/`ai_router_provider`)
  so spend is always attributable to a specific adapter and source.

## Source health, scheduling, and audit trail

- `source_adapters.health_state`/`consecutive_failure_count` give a simple,
  queryable signal for "this source has been failing silently" — a data-ops
  agent that keeps retrying a source whose HTML structure changed six months
  ago and quietly extracting garbage is a worse failure mode than one that
  visibly stops and asks for attention.
- Scheduling (`schedule_cron`) is metadata only in this design — the actual
  execution substrate (a Vercel Cron job, a queue worker, etc.) is an
  implementation decision for the build-out phase, not an architecture
  decision that needs to be locked in now.
- Every state-changing action in this pipeline — a new snapshot, an
  extraction, a resolution attempt, a proposal's review decision — already
  has its own timestamped row by design (this is the audit trail; there is
  no separate audit_events duplication needed for this subsystem
  specifically, unlike the editorial/admin side which layers audit_events on
  top of already-mutable rows).

## Rollback

Because nothing here ever overwrites a normalized row without going through
`change_proposals` and the existing admin mutation/provenance path, rollback
of a bad agent-sourced change is **identical to rolling back any other
provenance-backed editorial change already supported today**: the
`provenance` row for the affected field points at the `source_record` the
proposal created, which points back through `applied_source_record_id` to
the exact `change_proposals` row, which points back to the exact
`source_extraction` and `raw_source_snapshot` that produced it. Reverting is
"find what the field's provenance says it was before, apply that as a new
correction" — no bespoke agent-rollback mechanism is needed.

## Proposed `/admin/data-ops` UX

A new top-level admin section, gated like every other admin route
(`requireEditor`/`requireAdmin`), with these views:

1. **Source health dashboard** — one row per `source_adapters` entry:
   status, last run, last success, consecutive failures, a manual
   "run now" action (admin-only), and a pause/resume toggle. This is the
   single place to notice "this source has been silently failing for two
   weeks."
2. **Review queue** — `change_proposals` filtered to `review_state = 'pending'`,
   grouped by `target_table`, each showing: the proposed diff, confidence
   per field, the resolved identity (or "new identity candidate" flag,
   rendered with extra visual weight given the no-merge-by-name rule),
   a link to the underlying raw snapshot, and Approve/Reject/Request-changes
   actions that call the *existing* admin update actions under the hood —
   approving a proposal is implemented as "call
   `updateAthleteAction`/`createSportingResultAction`/etc. with this diff,"
   not a new write path.
3. **Auto-apply policy editor** — CRUD on `auto_apply_policies`, admin-only,
   with the schema-enforced `risk_tier = 'low'` ceiling visible in the UI as
   a hard limit, not just documentation.
4. **Duplicate/stale finder** — a read-only report view (existing-data
   analysis, not agent-sourced) surfacing likely-duplicate athlete/
   organization records and stale (`checked_at` far in the past)
   `source_records`, feeding into the same review queue as ordinary change
   proposals rather than a separate merge tool — this keeps "the agent found
   a data-quality issue" and "the agent found new information" on one
   consistent review path.
5. **Cost/usage dashboard** — extraction call volume and spend by adapter and
   by model, over time, so a runaway adapter is visible immediately.

## Explicit non-goals for this design

- **No uncontrolled autonomous writes.** Every write to a normalized table
  still goes through the existing, already-RLS-protected admin mutation
  layer; the agent's own privilege surface is limited to the new
  agent-specific tables above.
- **No social scraping that violates platform access rules.** `source_adapters
  .adapter_kind = 'permitted-social'` exists as a category specifically so
  any such source must be explicitly reviewed and marked as permitted
  (e.g. via an official API/partnership) before an adapter can even be
  created for it — this is a placeholder for a future explicit approval, not
  a default-on capability.
- **No name-only identity merging**, enforced structurally (identity
  resolution is its own auditable table, high-risk by default, human-
  reviewed unless a future, separately-approved auto-apply policy is added
  for a narrow, low-risk identity-adjacent field — which this design
  deliberately makes hard to do by accident given the `risk_tier` ceiling).

## What would actually get built, in order, if this is approved

1. `source_adapters` + `raw_source_snapshots` + one deterministic parser for
   one real, permitted, low-risk source (e.g. a single official ranking
   provider's public results page) — no AI extraction yet, no auto-apply.
2. `source_extractions` + `identity_resolution_attempts` + `change_proposals`
   + the review-queue UI, still fully human-reviewed, still one source.
3. AI extraction as a fallback path for that same source only, second-model
   verification wired but auto-apply still fully disabled.
4. The first real `auto_apply_policies` row, for the narrowest plausible
   field (e.g. a ranking snapshot's `checked_at` timestamp), reviewed and
   approved explicitly by the owner before `enabled = true`.
5. Only after (1)-(4) prove out on one source: additional adapters, the
   cost dashboard, and the duplicate/stale finder.
