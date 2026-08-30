# Supabase/Vercel production environment matrix

This is the environment-variable contract for the **target** architecture
(Vercel + Supabase + R2 + Upstash), complementing
[`production-environment.md`](production-environment.md), which documents the
**legacy** Cloudflare Workers/Sanity/Auth.js contract that remains authoritative
until the cutover gates in
[ADR 0003](decisions/0003-use-vercel-supabase-and-r2.md) pass. Never copy real
values into this repository, issues, pull requests, or chat. Values shown here
are variable names and behavior, never real secrets.

## Categories

- **PUBLIC** — shipped into the browser bundle (`NEXT_PUBLIC_` prefix). Never
  put a secret in this category.
- **SERVER-ONLY** — read only in server code/build; not secret in nature, but
  not shipped to the browser either.
- **SECRET** — credential material. Vercel "Sensitive"/encrypted, never logged,
  never in a generated report.
- **OPTIONAL** — the app degrades safely (a feature turns off, a fallback
  renders) when absent; absence must never crash a build or a request.
- **LEGACY-DURING-ROLLBACK** — only needed while Sanity/Auth.js/D1 remain live
  fallbacks during the phased cutover in
  [`supabase-migration.md`](supabase-migration.md); removed at legacy
  retirement.

## Vercel

| Variable | Category | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Canonical HTTPS origin for the environment. Preview and production must each have their own distinct value — never share one across environments. |
| `SITE_STAGE` | SERVER-ONLY | `development`\|`preview`\|`prototype`\|`production`. Drives `isProductionStage`/`isPublicIndexingEnabled` fail-closed logic in `lib/site/config.ts`. Currently stored as a Vercel "Secret" for this project even though the value itself isn't sensitive — harmless, but inconsistent; no need to change it. |
| `SITE_INDEXING_ENABLED` | SERVER-ONLY | Must be exactly `true`, and only alongside `SITE_STAGE=production`, to allow indexing. Leave `false`/unset everywhere else. |
| `SITE_CONTACT_EMAIL` | OPTIONAL | Public contact address rendered on `/help`, `/privacy`, `/terms`, `/copyright`. Currently unset in this environment — those pages correctly say so rather than inventing an address, but the contact route is non-functional until this is set. |

## Supabase

| Variable | Category | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | Project API URL. Distinct per environment (preview project `pwgpthnhopmquvuqqqys` vs. a future production project). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PUBLIC | The publishable/anon key. Safe to expose — RLS is the actual boundary, not this key's secrecy. |
| `SUPABASE_SERVICE_ROLE_KEY` | SECRET | Bypasses RLS entirely. **Never add this to Vercel.** It is consumed only by `scripts/migration/*.ts` (local-write path, hard-refuses any non-`localhost` `SUPABASE_URL`) and by the currently-unused `lib/supabase/admin.ts`. If that admin client is ever wired into a live route, it must run in a context that never reaches the client bundle, and this key still must not live in Vercel's general env store for that route — prefer a narrowly-scoped server action environment or a separate secrets manager. |
| `SUPABASE_URL` | SERVER-ONLY | Used only by the migration tooling's local-vs-production write guard; not consumed by the running app itself, which uses `NEXT_PUBLIC_SUPABASE_URL`. |
| `AUTH_MIGRATION_PROVIDER` | SERVER-ONLY | `authjs` (default) or `supabase`. Flips which auth path the app reads sessions from. LEGACY-DURING-ROLLBACK once Auth.js is retired — the flag itself is removed, not just set permanently to `supabase`. |

## Cloudflare R2

| Variable | Category | Notes |
| --- | --- | --- |
| R2 access key / secret (binding-based, no fixed name yet for the Vercel-side client) | SECRET | Not yet wired for direct Vercel access — media currently flows through the existing Cloudflare-bound proxy. Before any Vercel-side R2 client is added, scope its credential to the specific bucket (`cali-central-community-media-preview` for preview; a separate, never-shared bucket for production) and mark it Sensitive in Vercel. |
| Bucket name | SERVER-ONLY | Preview: `cali-central-community-media-preview`. Production (future): a distinct bucket, never the preview one. |

## Upstash

| Variable | Category | Notes |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | SECRET | Currently stored on Vercel as a plain Config variable, not marked Sensitive — this should be corrected, but doing so today requires removing and re-adding the variable (Vercel has no in-place reclassify), which means re-entering the value; flagged for the owner to do via the dashboard rather than done here. Configured today only on the Preview scope — no Production scope exists yet, so there is currently no cross-environment sharing. |
| `UPSTASH_REDIS_REST_TOKEN` | SECRET | Same handling as the URL. |

Rate-limit keys are namespaced as `calicentral:rate:<SITE_STAGE>:<policy>:<key>`
(see `lib/community/upstash-rate-limit.ts`) specifically so preview and a
future production environment cannot contaminate each other's counters even
if they were ever pointed at the same Redis database — but the safer and
recommended path is still a **separate Upstash database per environment**.

## Google OAuth

| Variable | Category | Notes |
| --- | --- | --- |
| Google client ID / secret (consumed by Supabase Auth's own provider config, not an app env var) | SECRET | Configured inside the Supabase dashboard's Auth provider settings per project, not as a Vercel env var. Preview and production Supabase projects need their own registered redirect URIs in Google Cloud Console; never point production's OAuth client at a preview redirect URI or vice versa. PKCE must remain enabled — do not disable it to work around a redirect-URI mismatch during debugging. |

## Sanity — LEGACY-DURING-ROLLBACK

| Variable | Category | Notes |
| --- | --- | --- |
| `SANITY_API_READ_TOKEN` | SECRET, LEGACY-DURING-ROLLBACK | Still exposed from a prior session per this migration's owner notes; must be rotated before any real export, independent of this matrix. |
| `SANITY_API_WRITE_TOKEN` | SECRET, LEGACY-DURING-ROLLBACK | Same rotation requirement; also should be scoped to read-only once Sanity is retired to a pure historical/rollback source, since nothing should be writing to it post-cutover. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` / `NEXT_PUBLIC_SANITY_API_VERSION` | PUBLIC, LEGACY-DURING-ROLLBACK | Removed entirely at Sanity retirement (see `docs/supabase-migration.md`'s cutover gates), not just left unset. |

## Auth.js — LEGACY-DURING-ROLLBACK

| Variable | Category | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | SECRET, LEGACY-DURING-ROLLBACK | Still required while `AUTH_MIGRATION_PROVIDER=authjs` remains the default anywhere. Rotating it invalidates active Auth.js sessions — coordinate with the Supabase-session cutover so users aren't double-invalidated. |
| `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Auth.js-side) | SECRET/SERVER-ONLY, LEGACY-DURING-ROLLBACK | Distinct from the Supabase-side Google OAuth client above — do not reuse the same Google OAuth client ID for both Auth.js and Supabase Auth simultaneously; register separate clients so retiring one doesn't silently break the other mid-rollback. |

## What's still missing before this matrix is launch-complete

- No production Supabase/R2/Upstash projects exist yet (expected — not
  approved to create in this session).
- No documented process for who holds the actual secret values today, where
  they're backed up, or the rotation cadence going forward — that belongs in
  [`security-operations.md`](security-operations.md), which does not yet
  mention any of the variables in this document.
- `SUPABASE_SERVICE_ROLE_KEY` handling above is a recommendation, not a
  tested guarantee — if `lib/supabase/admin.ts` is ever wired into a live
  route, revisit this section before that ships.
