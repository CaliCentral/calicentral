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

### Migration coverage classification

Every D1 table (all 31, across the three `migrations/*.sql` files) has a
write transformer in `scripts/migration/d1-to-supabase.ts`. D1 coverage is
complete; there is nothing to classify there.

Two of the 24 Sanity document types have no write transformer in
`scripts/migration/sanity-to-supabase.ts`, by design:

| Sanity type | Classification | Why |
| --- | --- | --- |
| `contributorIdentityClaim` | OBSOLETE / INTENTIONALLY EXCLUDED | Existed only to guard against duplicate contributor provisioning in a document store with no unique constraints. Postgres's `UNIQUE` constraint on `members.auth_user_id` plus the `provision_auth_user()` trigger already does this atomically and natively; there is no historical or content value in the claim documents themselves. |
| `operationalLock` | OBSOLETE / INTENTIONALLY EXCLUDED | Existed only to serialize risky admin mutations in a document store with no real transactions. Postgres has real transactions, and `public.operational_locks` (added in `202608290002_editorial_and_sport.sql`) already replaces it. |

Both are logged as `INTENTIONALLY EXCLUDED` warnings (not silently dropped)
in every dry-run report produced by `sanity-to-supabase.ts`, distinct from
the generic "no write transformer yet" warning used for a genuine gap.

One known residual gap, tracked rather than silently accepted: Postgres
`members.email_normalized` has no `UNIQUE` constraint today, unlike the
`auth_user_id`/`legacy_principal_id` columns. `contributorIdentityClaim`'s
retirement above assumes one verified email maps to one `auth.users` row,
which holds today because only Google is wired as a Supabase Auth provider.
If a second provider is added before this constraint exists, the same real
person could provision two `members` rows via the same email through
different providers -- add a `UNIQUE` constraint on `email_normalized` (or an
equivalent reconciliation step) before or alongside enabling a second
provider.

## Auth migration boundary

`AUTH_MIGRATION_PROVIDER=authjs` is the default. When an isolated environment
has passed its auth checks, `supabase` enables the Supabase Google OAuth
callback and server-side session resolver. Auth.js remains installed until
anonymous, authenticated, expired/invalid, admin, provisioning,
`profileConfigured`, ownership, and cross-user tests pass end to end.

Bootstrap administrator/editor parity is database-enforced. Environment
allowlists may shape the application-layer role during the dual-run window,
but Postgres RLS authority comes only from an active `member_roles` row.
`bootstrap_role_emails` is the database-controlled trust anchor; it must be
populated per environment through an approved secret-safe operational step,
never with a real email committed in a migration. On OAuth callback,
`bootstrap_activate_self()` can activate and grant only the authenticated
caller's mapped role, preserves their contributor role, rejects suspended or
archived members, is idempotent, and appends a role-grant audit event.

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
