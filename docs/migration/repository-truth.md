# Supabase/Vercel migration repository truth

Audit date: 2026-08-29

This inventory was completed before migration code was changed. It describes
the dirty working tree at `2c5405356d65a5cf5c1f3c494a176fc75bfd8aa3` on
branch `main`. The remote is `https://github.com/CaliCentral/calicentral.git`.
At audit time Git reported 107 changed tracked entries and 107 untracked
entries. All pre-existing work is owner-owned and must be preserved.

## Sanity

- Five direct packages: `sanity`, `next-sanity`, `@sanity/vision`,
  `@sanity/image-url`, and `@portabletext/react`.
- Twenty-four document schemas: athlete, audit event, author, competition,
  contributor identity claim, contributor profile, two external identity
  mappings, operational lock, organization, product, ranking category,
  provider, snapshot and system, ruleset, site settings, sporting result,
  story, submission, team, team season, video and video series.
- Forty-nine object schemas plus the `accessibleImage` image schema. These
  cover accessibility/SEO, Portable Text, athlete and competition records,
  editorial intake, rankings, provenance, sporting measurements/results,
  teams and video records.
- Thirty-nine named GROQ queries in `sanity/queries.ts`, spanning public,
  sitemap, page, admin, ranking, competition, organization, team, product,
  story, athlete and video projections.
- Read clients: `sanity/lib/client.ts`, `sanity/lib/live.ts`, and
  `lib/content/sanity-source.ts`. The configured dataset is authoritative;
  fallback data is used only when Sanity is not configured.
- Write client: `sanity/lib/write-client.ts`, wrapped by
  `lib/operations/client.ts` and the guarded operations repositories/actions.
- Studio and preview: `sanity.config.ts`, `sanity.cli.ts`,
  `sanity/structure.ts`, `sanity/presentation.ts`, the `/studio` handoff,
  Draft Mode routes, `SanityLive`, and draft-mode UI components.
- Generated files: `schema.json` and `sanity.types.ts`.
- Migration/import scripts: seed, production-readiness reporting, reviewed
  organizations/competitions, Official Streetlifting, ranking-provider,
  ranking-athlete and Abu ranking tools. Ranking and competition validators
  consume generated Sanity types or query projections.
- Environment names: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`,
  `NEXT_PUBLIC_SANITY_STUDIO_URL`, `SANITY_API_READ_TOKEN`,
  `SANITY_API_WRITE_TOKEN`, `SANITY_TELEMETRY_DISABLED`, seed guards, and the
  image-loader origin/path constants.

## D1

- Three migrations, 693 lines total. They produce 31 effective application
  tables and 37 effective indexes. Migration 0002's two temporary tables
  replace `saved_items` and `collection_items`; they are not additional final
  tables.
- Domains: member profiles/social accounts; athlete controls; posts, media,
  comments, likes and reposts; saves and collections; follows, blocks and
  mutes; reports and moderation/audit events; notifications/preferences; team
  and organization memberships/invitations; media metadata; claimed-athlete
  presentation; movements, sessions, session movements and sets; personal
  records and skill progress; canonical update events.
- Five SQL repositories contain 155 `.prepare()`/`.batch()` call sites:
  `lib/community/repository.ts` (118), `media-repository.ts` (13),
  `athlete-presentation.ts` (5), `canonical-updates.ts` (4), and
  `lib/training/repository.ts` (14 prepare calls plus one batch-oriented
  transaction path counted by the audit search).
- Runtime adapters in `lib/community/runtime.ts`, media/athlete-presentation
  runtime modules, and `lib/training/runtime.ts` obtain `COMMUNITY_DB` from
  `getCloudflareContext`. Actions derive member identity from the server
  session and repositories use prepared statements.

## Auth.js

- Auth.js 5 beta uses encrypted JWT sessions with an eight-hour maximum age;
  there is no session database.
- Google and GitHub OAuth are supported. Google requires a verified-email
  claim; GitHub resolves a primary verified email through its authenticated
  email API.
- OAuth callbacks provision an idempotent Sanity contributor profile and a
  hashed identity claim. The provider/account pair creates the stable private
  principal; raw email is not used as a document identifier.
- Effective roles are contributor, editor and admin. Bootstrap admin/editor
  allowlists take precedence over stored roles. Access states are active,
  pending, suspended and archived. Every protected action resolves current
  server state again.
- Session helpers expose anonymous, authenticated, contributor, editor and
  admin gates while preserving `profileConfigured` behavior.

## Workers, R2 and rate limiting

- OpenNext/Wrangler entry points are `open-next.config.ts`, `wrangler.jsonc`,
  `wrangler.typegen.jsonc`, `cloudflare-env.d.ts`, the OpenNext initialization
  in `next.config.ts`, build/preview/deploy scripts, and the generated-output
  sanitizer.
- Worker bindings are `ASSETS`, `COMMUNITY_DB`, `COMMUNITY_MEDIA`, and four
  rate limiters. Production and staging use distinct D1 databases, R2 buckets
  and limiter namespaces. Production community/media flags are false.
- R2 bytes are private. D1 stores ownership, purpose, MIME, size, upload,
  moderation, visibility, soft-removal and audit state. Uploads validate MIME
  and file signatures and are capped at 900 KiB. Delivery checks metadata
  before reading R2 and uses `no-store`; application removal does not
  physically delete bytes.
- Rate policies are STRICT (claim/report/profile), INTERACTION
  (like/save/notification), UPLOAD, and WRITE (remaining mutations). The
  interface is already structurally provider-neutral, but runtime discovery is
  Worker-specific.

## Migration safety conclusion

Sanity, D1, Auth.js and OpenNext cannot be removed yet. No Supabase schema,
RLS test, import equivalence report, Supabase-backed admin editor, or
production-equivalent Vercel verification existed at audit time. R2 is the
only Cloudflare application service explicitly retained by the approved
target.
