# ADR 0003: Migrate the application to Vercel, Supabase and R2

- Status: Accepted
- Date: 2026-08-29
- Supersedes: ADR 0002 after the equivalence and cutover gates pass

## Context

Cali Central now needs one relational authority for application, community,
editorial and sporting data, database-enforced ownership, and native Next.js
hosting. The current split across private Sanity documents and D1 works, but
duplicates identity boundaries and couples application persistence to the
Cloudflare Worker runtime. Large user/media objects already have a deliberate
private R2 lifecycle and should not be moved into PostgreSQL.

## Decision

- Deploy the Next.js App Router application natively on Vercel.
- Use Supabase PostgreSQL for normalized identity, editorial, sport,
  community, training, media metadata, provenance and audit state.
- Use Supabase Auth with Google OAuth. Preserve an Auth.js compatibility path
  until session, provisioning, role, capability and ownership equivalence is
  behaviorally verified.
- Enforce data boundaries with PostgreSQL constraints and Row Level Security.
- Keep Cloudflare R2 private for media objects and use its S3-compatible API
  behind a provider-neutral media store.
- Keep the existing STRICT, WRITE, INTERACTION and UPLOAD policies behind a
  provider interface. Upstash Redis is the preferred Vercel provider when
  production rate limiting is provisioned.
- Do not delete external Sanity or Cloudflare resources during the local
  migration. Remove local application dependencies only after import dry runs,
  row/relationship equivalence, RLS, admin replacement, public reads and
  production-equivalent builds pass.

## Trust invariants

Source-confirmed, identity-confirmed, editorial-reviewed, official result,
external ranking and Cali Central ranking are distinct states. Profile claims
are not identity truth; self-reported records are not verified results; unknown
numeric data stays null. Athlete identity uses permanent IDs and is never
merged by name alone. Server-side code derives actors from the authenticated
session rather than accepting client-supplied actor identifiers.

## Consequences

The migration is deliberately dual-run capable. Existing providers remain the
default until their replacement has proven equivalence. During this period,
new code must not weaken existing publication, provenance, ranking,
moderation, ownership or deletion gates. Production data import and Vercel
production deployment remain separate owner-approved operations.
