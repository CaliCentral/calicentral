# P4 daily athlete utility — production readiness

P4 is an additive application-data layer. Sanity remains the canonical editorial and sporting-data store. D1 holds private/high-volume member state and stable canonical references; R2 holds user-uploaded bytes. No member action can promote a ranking, result, identity, competition, or verification state.

## Local implementation

- `migrations/0003_daily_athlete_utility.sql` adds claim audit, moderated media metadata, athlete-controlled presentation, movement taxonomy, training sessions/sets, immutable PR history, skill progress, public team opt-in, and idempotent canonical-update events.
- `wrangler.community.example.jsonc` is a review template only. Placeholder resource IDs must never be copied into production unchanged.
- Uploads fail closed unless D1, R2, the media feature flag, and the upload rate-limit binding are all available. Files are private/pending by default and are delivered publicly only after an audited approval.
- Owner and active moderator removal paths now atomically mark an uploaded
  asset `removed` and `private`, append `mediaRemoved` without replacing prior
  moderation audits, and deny every subsequent application delivery before an
  R2 read. Runtime removal deliberately does not delete R2 bytes; retention
  purge and exact synthetic preview cleanup remain separate reviewed actions.
- Canonical update notifications accept only `approved-public`; sample, blocked, or internal-review events throw before follower notification production.

## P4.5 provisioned state (2026-08-17)

- Cloudflare account: `9519c6e85e533d226371ec6f02689f5d`.
- Production D1: `cali-central-community`
  (`95716af8-50dd-490e-a2ce-db8764a96b32`), created but unmigrated.
- Preview D1: `cali-central-community-preview`
  (`417ed372-717c-493e-a69e-edb817af1db4`), migrations `0001`–`0003`
  applied and remotely verified.
- Production R2 is `cali-central-community-media`; staging R2 is the isolated
  `cali-central-community-media-preview` bucket.
- Production rate-limit namespaces are `1001`–`1004`; staging namespaces are
  isolated as `2001`–`2004`.
- Production community and media flags are false. Staging community and media
  are configured true for the approved synthetic staging lifecycle test.
- Direct preview R2 image/MP4 round-trips and D1 moderation-state transitions
  passed, and every exact synthetic object/row was removed. Production R2
  remained empty.
- P4.6 moved Sanity Studio to a separate local build, retained a noindex
    application handoff, shared Zod across route chunks, and enabled supported
    Wrangler minification. The authoritative upload fell from 30,114.40 KiB /
    6,461.70 KiB gzip to 10,686.56 KiB / 2,743.64 KiB gzip.
- P4.6 follow-up hardening requires skill-proof and claimed-athlete media to be
  owned by the acting member, uploaded, approved, public, and assigned to the
  exact allowed purpose. The buffered Server Action upload path now truthfully
  caps every supported image/video type at 900 KiB beneath Next's 1 MiB raw
  request limit; larger limits require a separately reviewed direct or
  streaming R2 protocol.
- Cloudflare accepted the current sanitized staging version
  `6c0804e8-b753-462b-81e4-a6fb2b6aca76`, reported 32 ms startup, and activated
  it at 100% for `cali-central-staging` with only the preview D1/R2 and staging
  limiter namespaces. The OpenNext post-build guard removes compiled `.env*`
  fallbacks and fails if any non-empty local sensitive value remains in the
  deployable output. The approved application origin is
  `https://cali-central-staging.calicentral.workers.dev`. It passes
  unauthenticated route, health, noindex, and protected-route smoke checks.
  Google OAuth completed successfully once, but a subsequent persisted-output
  exposure requires fresh Sanity read/write tokens, Google client secret, and
  Auth.js secret before authenticated QA resumes. No production Worker was
  deployed.
- The pre-production media policy is in
  [`community-media-operations.md`](community-media-operations.md).

## Required owner-approved production actions

Do not run these commands as part of ordinary development. The owner must review resource names, account, environment, blast radius, backups, and rollback first.

1. Inspect production with `npx wrangler d1 migrations list COMMUNITY_DB
   --remote --config wrangler.jsonc`, record `npx wrangler d1 time-travel info
   COMMUNITY_DB --config wrangler.jsonc --json`, then apply only in a separately
   approved window with `npx wrangler d1 migrations apply COMMUNITY_DB --remote
   --config wrangler.jsonc`. Risk: consequential production schema mutation and
   compatibility/locking risk. Rollback: use the recorded Time Travel bookmark
   after incident review, never ad-hoc destructive SQL.
2. The Google Cloud Console already contains
   `https://cali-central-staging.calicentral.workers.dev` as an authorized
   JavaScript origin and
   `https://cali-central-staging.calicentral.workers.dev/api/auth/callback/google`
   as an authorized redirect URI, and the deployed Auth.js callback succeeded.
   Rotate the exposed staging Google client secret, Sanity read/write tokens,
   and Auth.js secret before repeating sign-in and executing the remaining
   authenticated application, media, and deployed-edge limiter tests.
3. Set production `COMMUNITY_FEATURES_ENABLED=true` only in a later launch
   window, verify read-only behavior, then separately approve
   `COMMUNITY_MEDIA_UPLOADS_ENABLED=true`. Risk: begins accepting D1 writes and
   then user bytes. Rollback: set the relevant flag false and redeploy; retained
   data is not deleted.
4. Deploy production through the reviewed workflow. Risk: public behavior
   changes. Rollback: Cloudflare version rollback to the last known-good
   deployment and disable write flags.

## Preflight and rollback checklist

- Verify the Cloudflare account/environment and exact resource IDs.
- Back up D1 and record the current Time Travel bookmark before migration.
- Confirm R2 retention, moderation, copyright, privacy, and deletion runbooks.
- Keep production and preview buckets separate.
- Confirm all four rate-limit namespaces are distinct and use supported 10/60-second periods.
- Run the full local suite and preview migration first. Migration `0002` uses a
  data-preserving table rebuild and must not be called strictly append-only.
- Verify pending/rejected uploads are private and approved assets return `nosniff` with their stored MIME.
- Verify audit rows for media decisions and athlete-control grants.
- Verify internal/sample canonical updates are rejected and approved-public events are idempotent.
- Roll back code/flags before considering data restoration; never delete records merely to hide an incident.

## Approvals and account actions still required

Production D1 migration, production deployment, all production feature
activation, and all production application writes remain unexecuted. The R2
buckets and isolated bindings passed direct preview verification. The
optimized, environment-sanitized staging Worker was deployed and smoke-tested;
authenticated community, media, and rate-limit verification remains blocked
only by the required credential rotation and is still a staging-only step.
Production launch remains a separately approved operation.
