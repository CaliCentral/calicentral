# Community database (D1 provisioned, production inactive)

`migrations/0001_community_foundation.sql` is the unprovisioned initial schema.
It creates member profiles/social accounts, public posts and media references,
generic post/story/video comments, generic repost activity, likes, private
saves, private ordered collections, follows, blocks, mutes, private reports,
moderation audit events, notifications, and transactional team
membership/invitation foundations.

The reviewed P3 schema also records typed posts and author-selected audiences,
notification preferences, and a private one-member/one-athlete control record.
Athlete control is created only by the explicit administrator action on an
approved existing-athlete claim; unique member, athlete, and submission keys
prevent duplicate control. It does not modify sporting results, rankings,
verification, or source provenance.

Important database constraints include case-insensitive unique handles;
idempotent like/save/follow/repost keys; public/status indexes; collection-owner
checks in repository writes; soft content states; and foreign keys for D1-owned
entities. Binary files do not belong in D1.

`migrations/0002_organization_memberships_and_product_saves.sql` is a
data-preserving forward migration, but it is not literally append-only DDL. It
uses SQLite's copy/drop/rename rebuild pattern to extend the private
Save/Collections target constraint to products, then adds reviewed organization
membership/capability records. It does not put canonical organizations or
products in D1, and an active membership requires recorded server-side review
metadata. After an existing-organization claim is approved in Sanity, an
administrator must explicitly grant the claim's exact requested capabilities
from the submission review screen. Approval by itself does not mutate D1.

`migrations/0003_daily_athlete_utility.sql` is also additive. It provides the
P4 training log, movement taxonomy, PR history/provenance, skill progress,
athlete-controlled presentation, public team-affiliation opt-in, immutable
claim/media audit events, moderated R2 metadata, and idempotent canonical
notification events. Full resource setup and rollback guidance lives in
[`p4-production-readiness.md`](p4-production-readiness.md).

The reviewed `COMMUNITY_DB` bindings are now present in `wrangler.jsonc`:

- the default/production environment targets `cali-central-community`;
- `env.staging` targets the separate `cali-central-community-preview` database.

Production community and media flags remain false. Only the preview database
may receive migrations during P4.5. Local `wrangler dev` continues to use local
simulated persistence unless an operator explicitly selects a remote mode.

## Owner-controlled D1 setup

The two D1 resources were created during the approved P4.5 provisioning run.
Production migration remains a separate owner-approved operation:

```bash
npx wrangler d1 migrations list COMMUNITY_DB --remote --config wrangler.jsonc
npx wrangler d1 time-travel info COMMUNITY_DB --config wrangler.jsonc
npx wrangler d1 migrations apply COMMUNITY_DB --remote --config wrangler.jsonc
```

Regenerate binding types and initialize a persistent local D1 instance with:

```bash
npm run cf-typegen
npx wrangler d1 migrations apply cali-central-community --local --config wrangler.jsonc
COMMUNITY_FEATURES_ENABLED=true npm run dev
```

Migration `0002` is logically data-preserving but uses SQLite's copy/drop/rename
table-rebuild pattern to extend two `CHECK` constraints. Review that DDL and a
current Time Travel bookmark before production application; do not describe
the SQL as strictly append-only.

Before setting the feature flag in a deployed environment, verify backups and
rollback, schema application, Auth.js callbacks, member-profile opt-in,
ownership rejection, target validation, duplicate idempotency, block behavior,
report/audit access, and the feature-off/database-missing states. Use the
reviewed distributed rate-limit bindings at the `COMMUNITY_RATE_LIMIT_STRICT`,
`COMMUNITY_RATE_LIMIT_WRITE`, `COMMUNITY_RATE_LIMIT_INTERACTION`, and
`COMMUNITY_RATE_LIMIT_UPLOAD` hooks before public production use. The legacy
single binding remains a compatibility fallback, not the recommended layout.

## Owner-reviewed R2 media setup

Guarded upload and moderation routes are installed and remain fail closed
without the feature flag, D1, R2, and rate-limit bindings. P4.5 provisioned the
two isolated buckets:

```bash
npx wrangler r2 bucket create cali-central-community-media
npx wrangler r2 bucket create cali-central-community-media-preview
```

The default/production `COMMUNITY_MEDIA` binding targets only
`cali-central-community-media`; `env.staging` targets only the `-preview`
bucket. Production uploads remain disabled. Staging may enable the media flag
only for the approved synthetic lifecycle test. A flag alone never enables
uploads.
