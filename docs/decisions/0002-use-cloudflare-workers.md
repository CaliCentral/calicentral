# ADR 0002: Deploy the full-stack application to Cloudflare Workers

- Status: Accepted
- Date: 2026-07-31

## Context

Cali Central uses Next.js App Router features that require a server runtime:
Route Handlers, Server Actions, Auth.js callbacks and encrypted JWT sessions,
Draft Mode cookies, protected account/admin rendering, and server-side Sanity
mutations. A static export or Pages-only adapter cannot preserve those
behaviors.

The application stores public and existing operational content in Sanity and
has no active direct file-upload pipeline. Community data has a D1-ready typed
repository and additive migration, but no database resource or binding is
configured. Introducing unprovisioned Cloudflare storage products would add
permissions, cost, recovery, and operational complexity without active data.

## Decision

Deploy Next.js to Cloudflare Workers through the supported
`@opennextjs/cloudflare` adapter and Wrangler.

- Use workerd preview as the deployment-runtime validation surface.
- Enable the adapter-required Node compatibility flag at an intentional current
  compatibility date.
- Serve generated static assets through the Workers static-assets binding.
- Use static-assets incremental cache interception for public static output.
- Mount supported Sanity Live Content whenever Sanity is configured so
  published updates invalidate tagged content reads without a hard refresh.
- Keep draft presentation tooling limited to authenticated Draft Mode; no
  browser token is configured.
- Build and host Sanity Studio separately so its editor runtime and Vision do
  not consume the public application Worker bundle. Keep only a noindex handoff
  at `/studio`; Sanity data clients, Live Content, Draft Mode, and Visual
  Editing remain in the application.
- Use Sanity’s image CDN through an allowlisted custom Next image loader rather
  than requiring Cloudflare Images.
- Keep D1, R2, KV, Durable Objects, Queues, and rate-limit bindings absent until
  a concrete application responsibility requires one.
- Keep GitHub Actions validation-only; the first Worker deployment and custom
  domain remain manual, reviewed actions.

## Alternatives considered

### Cloudflare Pages/static export

Rejected because it cannot support the implemented authentication, dynamic
cookies, protected server rendering, Route Handlers, Server Actions, Draft
Mode, and operational mutations as a static export.

### Legacy Next-on-Pages adapter

Rejected in favor of the current supported OpenNext Workers integration.

### R2-backed Next cache

Not selected. R2 is reserved for a defined product file/media-upload
responsibility, which the application does not implement. Published content can
accept a deliberate rebuild release model at launch.

### Dynamic/no-store public rendering

Viable if immediate published Sanity updates become a hard requirement, but it
would increase Worker and Content Lake traffic. The launch architecture favors
stable static output and controlled editorial releases.

### D1 for existing operational records

Not selected. Contributor profiles, submissions, and audits continue to use
guarded Sanity transactions. The separate community repository and migration
remain inactive until a reviewed D1 resource, binding, authorization plan, and
recovery plan are configured.

## Consequences

- OpenNext and Wrangler are required build/development dependencies.
- A clean build may require network access for npm dependencies, fonts, and
  configured private Sanity reads.
- Sanity Live Content handles published-content invalidation for reads made
  through the repository's live query boundary. Code, static assets, and any
  content outside that boundary still require a reviewed rebuild/deploy.
- Draft Mode, Auth.js, the Studio handoff, Server Actions, and images must be
  tested under local workerd and on a routed staging Worker before domain
  attachment. The standalone Studio build, Presentation, and Vision are tested
  separately.
- Cloudflare account settings, secrets, OAuth callbacks, Sanity CORS, dataset
  privacy, and DNS remain explicit external launch work.
- The unified Sanity production dataset must be private because it contains
  contributor and operational records alongside public content.
- New durable storage or automatic deployment requires a concrete need,
  security/recovery review, and an updated decision.
