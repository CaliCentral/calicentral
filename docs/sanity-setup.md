# Sanity CMS setup

Cali Central uses Sanity for editorial content while retaining the repository's
fictional local records as a build-safe fallback. This integration does not
create a Sanity project, dataset, account, token, CORS origin, or deployment.
Those are deliberate external setup steps.

## Runtime and packages

Use Node.js 22.12.0 or newer and npm. The locked Sanity 5 toolchain requires
that Node version even though Next.js itself supports older releases.

Install the repository exactly as locked:

VS CODE TERMINAL

```bash
npm ci
```

The CMS integration uses:

- `sanity` for schemas and the embedded Studio
- `next-sanity` for typed queries, Live Content, Draft Mode, and Visual Editing
- `@sanity/vision` for the development-only Studio query tool
- `@sanity/image-url` for crop- and hotspot-aware image URLs
- `@portabletext/react` for safe structured story rendering

## Create and connect a project

Create the Sanity project and dataset in the Sanity account separately. Do not
run an interactive initializer in this repository. Copy the safe example file:

VS CODE TERMINAL

```bash
cp .env.example .env.local
```

Then set:

VS CODE TERMINAL

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=your-real-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-01
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_STAGE=development
SITE_INDEXING_ENABLED=false
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
```

`NEXT_PUBLIC_SANITY_PROJECT_ID`, dataset, API version, and site URL are public
configuration. `SITE_STAGE` and `SITE_INDEXING_ENABLED` are server-read launch
controls. `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` are server-only
secrets and must never use a `NEXT_PUBLIC_` prefix. The Viewer token
is required for published server reads when the production dataset is private;
the separate write token powers guarded contributor/editorial operations in
[`auth-and-editorial-operations.md`](auth-and-editorial-operations.md); scope it
only to the document mutations that environment needs.

The public application behaves in two explicit modes:

- Without a valid project ID and dataset, it uses the centralized fictional
  records under `data/`. `/studio` displays setup guidance and no Sanity client
  makes a content request.
- With valid configuration, Sanity is authoritative. Query failures are
  surfaced, and an empty dataset produces public empty states. The application
  never silently substitutes local records for an empty or failing configured
  dataset.

Restart `npm run dev` after changing environment variables.

## Extract schemas and generate query types

Schemas are defined in `sanity/schemaTypes/`. Named queries in
`sanity/queries.ts` are discovered by Sanity TypeGen.

VS CODE TERMINAL

```bash
npm run sanity:schema
npm run sanity:typegen
```

Or run both in order:

VS CODE TERMINAL

```bash
npm run sanity:types
```

`sanity:schema` writes `schema.json`.
`sanity:typegen` writes the generated `sanity.types.ts`. Do not edit either
generated file manually. Regenerate them after changing a schema or named GROQ
query and review both files with the source change.

## Studio

Start the Next.js application and open
[http://localhost:3000/studio](http://localhost:3000/studio). The Studio is
embedded in its own App Router group, carries `noindex`, and is not wrapped in
the public header, footer, Live Content bridge, or Visual Editing overlay.

The desk is grouped into:

- Site — the single `siteSettings` document
- Editorial — stories and authors
- Editorial Operations — submissions, contributors, and audit events
- Athletes — athlete profiles and ranking categories
- Competitions — competition records
- Media — videos and series

`siteSettings` uses the stable document ID `siteSettings`. Studio removes the
duplicate-create affordances and limits singleton actions.

## Draft Mode, Presentation, and Visual Editing

Published content is the default public perspective. Draft previews require:

1. A server-only Sanity Viewer token in `SANITY_API_READ_TOKEN`.
2. The frontend origin added to the Sanity project's CORS origins with
   credentials enabled.
3. An authenticated Studio session with access to the project.
4. A server-capable deployment; Draft Mode cannot work as a pure static export.

The Presentation Tool calls `/api/draft-mode/enable`. That route uses Sanity's
official signed preview handshake and returns a clear unavailable response when
project configuration or the Viewer token is missing. It does not accept a
home-grown shared-secret query parameter. `/api/draft-mode/disable` clears the
cookie and redirects to the fixed same-site `/` route.

The read token is supplied only to server-side preview requests. It is never
configured as a `browserToken`, serialized into props, or included in public
JavaScript. Give it Viewer/read-only permissions—never Editor or write
permissions. Visual Editing mounts only in Draft Mode and does not wrap
`/studio`.

Live refresh and Visual Editing mount only in authenticated Draft Mode. Draft
cookies bypass the public static cache, and draft documents are fetched through
authenticated Server Components without a browser token. Published HTML,
metadata, and sitemap use a rebuild-on-publish release model because the
Workers static-assets cache does not provide tag revalidation. A CMS publish
does not replace that reviewed rebuild/deploy.

Presentation resolves the homepage and story, athlete, competition, video, and
ranking routes. External hosts must use the configured site URL and matching
CORS origin; this repository does not add those account-level settings.

## Images and Portable Text

Editorial image fields require an asset and enforce the choice between
meaningful alternative text and an explicitly decorative image. Crop and
hotspot data are preserved when the content adapter creates Sanity CDN URLs.
The public renderer uses `next/image`, known dimensions, responsive `sizes`,
optional low-quality placeholders, captions, and credits. A local custom image
loader accepts only Sanity image-CDN URLs and requests bounded responsive width,
quality, fit, and automatic format transforms, avoiding a Cloudflare Images
binding. Existing abstract CSS/SVG visuals remain the fallback when no CMS
image is assigned.

Story bodies use a constrained Portable Text schema: paragraphs, level-two and
level-three headings, block quotes, bullet and numbered lists, strong and
emphasis marks, safe internal and external links, pull quotes, fact boxes,
dividers, and editorial images. Raw HTML, iframe, and script blocks are not
accepted. The React renderer validates link protocols and never injects raw
HTML.

## Review and migrate the fictional sample content

The seed tool is deterministic and does nothing remotely by default:

VS CODE TERMINAL

```bash
npm run sanity:seed
```

To review the import payload as NDJSON:

VS CODE TERMINAL

```bash
npx sanity exec scripts/seed-sanity.ts -- --ndjson
```

Redirect that output only to a deliberate review file outside the repository
if needed. It contains fictional public prototype content, not assets or
secrets.

After reviewing the script, schemas, target project, dataset, stable IDs, and
dry-run output, an authorized editor can explicitly write the records:

VS CODE TERMINAL — RUN MANUALLY AFTER REVIEW

```bash
CONFIRM_SANITY_SEED=YES \
SANITY_API_WRITE_TOKEN=your-server-only-editor-token \
npx sanity exec scripts/seed-sanity.ts -- --write
```

The tool uses stable IDs for Site Settings, authors, stories, athletes,
competitions, video series, videos, and ranking categories. It validates
references, array keys, dates, durations, chapter timestamps, and ranking
uniqueness before any request. The write path uses create-or-replace only for
those owned stable IDs; it issues no deletes, creates no fake image assets,
creates no playback/embed URLs, and does not touch unrelated document IDs.

Do not run the write command against a dataset containing editorial work with
the same IDs unless replacement of those exact sample records is intended.
There is no automatic seed during install, development, build, Studio startup,
or deployment.

## Production configuration

Before production:

- create or choose the real Sanity project and private unified dataset
- assign least-privilege Viewer and operational write tokens
- configure credentialed CORS for every preview origin
- set the production site URL and environment variables in secret storage
- review dataset visibility and Studio member permissions
- regenerate schema/query types
- validate Draft Mode and Presentation on the deployed origin
- confirm operational documents cannot be edited/published directly in Studio
- approve the rebuild-on-publish release policy
- validate Cloudflare workerd support for Draft Mode and embedded Studio

SANITY MANAGE DASHBOARD

For local authenticated preview, add `http://localhost:3000` with credentials.
For production, add only the exact `https://YOUR_DOMAIN` frontend origin with
credentials where Presentation/embedded Studio requires it. Add a stable
staging origin separately. Never combine credentials with a wildcard or add
every possible `workers.dev` origin. Remove obsolete preview origins.

See [Production deployment](production-deployment.md),
[Production environment](production-environment.md), and
[Launch checklist](launch-checklist.md). No Sanity project, token, CORS rule,
schema deployment, import, or dataset setting is changed automatically.
