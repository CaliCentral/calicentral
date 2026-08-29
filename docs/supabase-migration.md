# Local Supabase and Vercel migration

This workflow is local-only. It does not link a hosted Supabase project,
deploy Vercel, import production data, delete Sanity/D1 resources, or alter R2
objects.

## Local stack

Cali Central uses project ID `calicentral` and ports 55320–55329, rather than
Supabase's defaults. This allows a separate IHM stack to run at the same time.

```bash
supabase start
supabase db reset --local
supabase test db
supabase stop
```

The committed npm aliases are `npm run supabase:start`,
`npm run supabase:reset`, `npm run test:db`, and `npm run supabase:stop`.
If a local `.env.local` is malformed, repair it without printing or committing
secrets; the Supabase CLI parses local environment files before startup.

The schema is under `supabase/migrations/`. Database tests are transaction
scoped under `supabase/tests/` and leave no fixture rows behind.

## Offline migration dry runs

Export files are inputs; the tools never delete or modify their sources.

```bash
npm run migrate:sanity -- --input=/absolute/path/export.ndjson --report=.tmp/sanity-migration.json
npm run migrate:d1 -- --input=/absolute/path/d1-export.json --report=.tmp/d1-migration.json
npm run test:migrations
```

Reports include exact input/output counts, skipped transformers, relationship
errors and deterministic target IDs. Add `--include-rows` only for a reviewed
non-sensitive fixture because it places normalized rows in report output.

The tools refuse all non-local writes. A local write additionally requires
`--write --confirm-local-migration`, `SUPABASE_URL` pointing to localhost, and
`SUPABASE_SERVICE_ROLE_KEY`. Production import needs a later owner-approved
gate and is intentionally unavailable here.

## Auth migration boundary

`AUTH_MIGRATION_PROVIDER=authjs` is the default. When an isolated environment
has passed its auth checks, `supabase` enables the Supabase Google OAuth
callback and server-side session resolver. Auth.js remains installed until
anonymous, authenticated, expired/invalid, admin, provisioning,
`profileConfigured`, ownership, and cross-user tests pass end to end.

## R2 and rate limiting

Vercel accesses the existing private R2 bucket through standard S3-compatible
credentials (`R2_*`). PostgreSQL stores metadata and authorization only. The
application still checks owner, purpose, signature/MIME, moderation and
removal state before delivery. It does not physically delete R2 bytes during
application removal.

Upstash is optional and unprovisioned. When its two server-only variables are
present, the existing STRICT, WRITE, INTERACTION and UPLOAD policies use the
Redis provider. A configured provider failure denies the protected operation.

## Cutover gates

Do not remove Sanity, D1, Auth.js or OpenNext until the migration dry runs have
zero errors, row/relationship diffs match, RLS and application tests pass, the
Supabase-backed admin covers create/edit/review/publish/unpublish/provenance,
public route output is equivalent, R2 lifecycle tests pass, and a native
Vercel preview has completed authenticated staging QA. Production data import,
deployment, indexing and external resource deletion remain separately gated.
