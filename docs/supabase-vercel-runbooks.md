# Supabase/Vercel operational runbooks

Complements [`rollback-and-recovery.md`](rollback-and-recovery.md) (the
legacy Cloudflare/Sanity/Auth.js runbook, still authoritative for that stack
until retirement) with the new failure modes the Vercel/Supabase/R2/Upstash
architecture introduces. See
[`supabase-vercel-environment-matrix.md`](supabase-vercel-environment-matrix.md)
for the variables referenced below. No production infrastructure exists yet
for this stack — treat everything here as the plan to validate once it does,
not a description of a system already running in production.

## Vercel deployment rollback

1. In the Vercel dashboard, find the last known-good deployment for the
   project (each deployment is immutable and independently addressable).
2. Use "Promote to Production" (or the CLI: `vercel rollback` against the
   linked project) to point the production alias back at that deployment.
   This does not touch git history — `main` keeps moving forward; the alias
   is what moves back.
3. Confirm `/api/health` and a handful of public/auth/admin routes (see the
   smoke-test list in `rollback-and-recovery.md`, adapted for Supabase-backed
   admin) before considering the rollback complete.
4. If the failure was caused by a schema migration that shipped alongside the
   bad deployment, rolling back the Vercel deployment alone is not enough —
   also see "Bad migration response" below; code and schema can drift apart.

## Supabase migration rollback

Supabase migrations in this repo are forward-only SQL files under
`supabase/migrations/`; there are no down-migrations checked in.

1. **Prefer forward-fixing.** Write a new migration that reverses the effect
   (e.g. `drop constraint`, `alter table ... drop column`) rather than trying
   to hand-edit history. This keeps `supabase db reset --local` and a fresh
   preview/production database reproducible from the same linear history.
2. If a migration must never have run at all (e.g. it corrupted data on
   apply), restore from a point-in-time backup taken before it applied (see
   "Database backup/restore" below), then re-apply migrations up to but not
   including the bad one, then ship the corrected migration.
3. Before writing the fix, reproduce the failure locally: `supabase db reset
   --local` re-applies every migration from scratch in order, which is the
   fastest way to confirm a new migration is actually correct before it ever
   touches preview or production.
4. Never edit an already-applied, already-shipped migration file in place —
   anyone who already ran it has drifted from anyone who runs the edited
   version next. Always add a new file.

## Database backup/restore

Supabase Cloud provides automated backups (point-in-time recovery on paid
tiers) per project. Before production cutover:

1. Confirm the production Supabase project's backup tier and retention
   window; point-in-time recovery should be enabled from the moment the
   project is created, not added later.
2. Document the actual restore procedure from the Supabase dashboard once
   that project exists (this repo does not script destructive restores).
3. Practice a restore against a scratch project at least once before launch
   so the first real restore isn't also the first attempt.
4. `supabase/seed.sql` is intentionally empty (see its own comment) — there
   is no seed-based recovery path; only Sanity/D1 export re-import or a
   Supabase-native restore reconstructs real data.

## Auth outage (Supabase Auth / Google OAuth)

1. Check `/api/health` and the Supabase dashboard's Auth service status
   first — distinguish "Supabase Auth is down" from "our Google OAuth client
   config is wrong" (the latter is much more common and is on us to fix).
2. `app/(auth)/auth/error/page.tsx` already maps failure codes to safe,
   specific messages (`Configuration`, `AccessDenied`, `Suspended`,
   `Provisioning`, `OAuthCallback`) — check server logs for which code is
   actually firing before guessing.
3. If Google's OAuth client itself is misconfigured (wrong redirect URI,
   expired secret), fix it in Google Cloud Console and Supabase's Auth
   provider settings together — a mismatch between the two is the most
   common cause of a callback loop.
4. If Supabase Auth itself is degraded, there's no local fallback — surface
   the outage honestly (the existing error page already avoids leaking
   provider internals) rather than attempting a bypass.

## R2 outage (media)

1. Confirm scope: is this the Cloudflare-bound proxy that currently serves
   media, R2 itself, or a future direct Vercel-side R2 client (not yet
   built)?
2. Community media uploads already fail closed by design (`upload_status`
   gating in `lib/community/repository.ts`) — an R2 outage should produce a
   clear "upload unavailable" state, not a silent data-loss path.
3. Do not delete or "clean up" media records during an outage — a record
   pointing at a temporarily-unreachable object is recoverable; a deleted
   record is not.

## Upstash outage

1. `createConfiguredUpstashRateLimiter()` already fails closed on any Redis
   error (`catch { return { success: false } }` in
   `lib/community/upstash-rate-limit.ts`) — during an outage, rate-limited
   actions become unavailable rather than unlimited. This is the correct
   direction to fail for abuse-prone actions (posting, uploads), but means a
   full Upstash outage will visibly block those actions platform-wide.
4. If an extended outage makes this unacceptable, the fix is a deliberate,
   reviewed code change (e.g. a feature flag to bypass rate limiting
   temporarily) — never a manual database edit to fake successful checks.

## Google OAuth failure (client-side symptom)

See "Auth outage" above for the Supabase-side runbook. The distinguishing
symptom from a full Auth outage: sign-in redirects to Google and back
successfully, but `exchangeCodeForSession` fails, or the user lands on
`/auth/error?code=OAuthCallback`. This almost always means the redirect URI
registered in Google Cloud Console doesn't exactly match what Supabase Auth
is using for this environment — check that first, before touching secrets.

## Bad migration response

1. Stop before any further migrations apply on top of the bad one — a later
   migration may implicitly depend on the broken state and make the eventual
   fix harder to reason about.
2. Reproduce locally first (`supabase db reset --local`), never debug a bad
   migration by experimenting directly against preview or production.
3. If the migration already applied to preview/production and caused a data
   problem (not just a schema problem), see "Database backup/restore."
4. If it only caused a schema problem (e.g. a constraint that's too strict
   and now blocks legitimate writes), forward-fix per "Supabase migration
   rollback" above — add a new migration, don't edit history.
5. Re-run the full local gate (`npm run typecheck && npm run lint && npm test
   && npm run test:migrations && npm run build && supabase test db`) before
   shipping the fix migration, exactly as for any other migration.

## Legacy rollback during cutover

While both stacks are live (the phased period described in
[`supabase-migration.md`](supabase-migration.md)), a Supabase-side incident
does not necessarily mean falling back to Sanity/D1/Auth.js — that fallback
is only clean for the specific subsystem that hasn't cut over yet.

1. `AUTH_MIGRATION_PROVIDER` is the actual rollback lever for auth
   specifically — flipping it back to `authjs` reverts session handling
   without a code deploy, but only while Auth.js's own configuration
   (`AUTH_SECRET`, provider credentials) is still intact and not yet
   retired.
2. Once a legacy component is past its retirement proof gate (see
   [`supabase-migration.md`](supabase-migration.md)'s per-component
   checklist), rolling back to it is no longer a safe option — the rollback
   window closes at retirement, not at "whenever convenient."
3. Never partially roll back (e.g. auth on Supabase, editorial reads back on
   Sanity) without explicitly checking that the two systems' identity models
   still agree — `contributorIdentityClaim`'s Postgres-native replacement
   assumes Supabase Auth is authoritative; reverting auth alone while keeping
   Supabase-sourced content live could re-open the duplicate-identity problem
   that replacement was built to prevent.

## First-hour/day launch monitoring

**First hour:**
- Watch `/api/health` continuously (it already reports `degraded` honestly
  rather than a bare 200 — treat any non-`ready` response as actionable).
- Watch Vercel's function logs for error-rate spikes, not just total traffic.
- Watch Supabase's dashboard for connection-count and query-latency spikes —
  a cold local-development-shaped connection pool assumption failing under
  real concurrent traffic is a common first-hour surprise.
- Confirm the CI-verified RLS/pgTAP suite's assumptions actually hold against
  real signups: spot-check that a freshly-signed-up real user gets exactly
  the `contributor` role and no more (mirrors the pgTAP escalation coverage
  in `supabase/tests/0004_role_escalation_and_authorization.test.sql`, now
  against real accounts).
- Confirm indexing is still off unless this is the deliberate production
  launch moment (`SITE_INDEXING_ENABLED` + `SITE_STAGE=production` together).

**First day:**
- Review the moderation/report queue at least once — a launch traffic spike
  is exactly when the first real abuse reports arrive.
- Confirm Upstash rate-limit counters are actually resetting on schedule (not
  stuck open or stuck closed) under real traffic patterns, not just the
  synthetic key-format test in `scripts/validate-rate-limit.ts`.
- Confirm backups actually ran (don't assume — check the Supabase dashboard).
- Reconcile at least one real production count against what was expected
  from the pre-launch migration equivalence report, the same discipline used
  throughout the preview migration work.
