# Production deployment

Cali Central targets Cloudflare Workers through the supported
`@opennextjs/cloudflare` adapter. It is not a static Pages export: Auth.js,
Server Actions, Route Handlers, cookies, Draft Mode, protected pages, and
server-side Sanity mutations all require a Worker runtime.

This repository prepares a deployment but does not deploy, attach a domain,
change DNS, upload secrets, enable automatic deployment, or modify external
OAuth/Sanity settings.

## Runtime architecture

- Next.js App Router remains the application framework.
- OpenNext builds `.open-next/worker.js` and static assets.
- Wrangler runs the output under local workerd and performs a future manual
  Worker deployment.
- The default Wrangler environment targets the reviewed production Worker
  name; the named `staging` environment targets `cali-central-staging` so
  account-side values can remain isolated.
- `nodejs_compat` provides the adapter/runtime compatibility required by the
  reviewed dependency graph.
- Static framework assets bypass the Worker and use immutable caching.
- Public content uses static generation plus a reviewed rebuild after publish.
  Draft Mode bypasses the static cache and keeps live preview tooling isolated
  to authenticated preview sessions.
- Sanity remains the content and operational store. D1 and R2 have no current
  responsibility and no empty resources or bindings are configured.
- Sanity CDN performs responsive image transformations through the local
  allowlisted image loader; Cloudflare Images is not required.

`npm run build` creates the ordinary Next.js production build.
`npm run cf:build` creates the OpenNext Worker artifact.
`npm run preview` rebuilds that artifact and serves it locally with
Wrangler/workerd. `npm run deploy` exists only for an intentional manual
deployment and must not be used as a validation command.

`wrangler.typegen.jsonc` deliberately mirrors only the compatibility settings
and `ASSETS` binding from the deployment configuration. It has no entry point
and cannot deploy. This keeps committed Wrangler types deterministic both
before and after the ignored `.open-next/worker.js` artifact exists.

## Worker size and account plan gate

The reviewed OpenNext artifact produced a 17,035,638-byte default handler;
gzip of that local handler was 4,565,808 bytes. That is a useful warning, not
the authoritative upload measurement, because Wrangler performs final
bundling. Cloudflare currently documents a 3 MB compressed Worker limit on
Workers Free and 10 MB on Workers Paid:
<https://developers.cloudflare.com/workers/platform/limits/>.

Run Wrangler’s nonpublishing dry run after the final build and inspect its
reported total. Do not attempt a Free-plan launch unless the final result is
within 3 MB. Otherwise select an appropriate paid Workers plan or reduce the
bundle before deployment; no plan change was made by this milestone.

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

## Local production-runtime review

VS CODE TERMINAL

```bash
npm ci
npm run sanity:types
npm run cf-typegen
npm run check
npm run cf:build
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npm run preview
```

Use a second terminal for HTTP checks while preview remains active. Stop the
preview with `Ctrl+C`. The preview is local and does not publish a Worker.

VS CODE TERMINAL

```bash
for route_path in \
  / \
  /stories \
  /stories/built-on-the-bars \
  /athletes \
  /athletes/maya-calder \
  /standings \
  /standings/methodology \
  /competitions/calendar \
  /competitions \
  /competitions/pacific-motion-open \
  /videos \
  /videos/finding-control-through-the-handstand-line \
  /privacy \
  /terms \
  /robots.txt \
  /sitemap.xml \
  /manifest.webmanifest \
  /api/health \
  /sign-in \
  /account \
  /admin \
  /studio \
  /route-that-does-not-exist
do
  curl --silent --show-error --output /dev/null \
    --write-out "%{http_code} %{redirect_url} ${route_path}\n" \
    "http://localhost:8787${route_path}"
done
```

The 2026-08-06 local workerd review completed this matrix successfully. Public
routes returned `200` with their expected page markers; the unknown route
returned `404`; unauthenticated `/account` and `/admin` requests returned safe
`307` sign-in redirects; `/sign-in` and `/studio` rendered their honest
unconfigured states; and the credential-free `/api/health` response returned
the intended `503` degraded status without naming missing secrets. The preview
was stopped cleanly after the checks.

Inspect representative bodies and response headers as well as status codes.
Unauthenticated account/admin requests must redirect or deny without private
content; Studio must either load or show its explicit configuration state.
Health must be no-store and general, and the unknown route must return `404`.
Do not test real OAuth against localhost unless the provider application is
explicitly configured for the local callback.

## Manual first deployment

Use a temporary `workers.dev` address before any custom-domain work. Review the
complete diff, production environment, private Sanity dataset, provider
verification, and rollback plan first.

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
git status
git log -1 --oneline
npm ci
npm run sanity:types
npm run cf-typegen
npm run check
npm run cf:build
npm run preview
```

Stop preview after the smoke checks.

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
npx wrangler login
npx wrangler whoami
```

Confirm the intended Cloudflare account before setting any secret. Set only the
reviewed environment’s secrets as described in
[Production environment](production-environment.md).

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
npm run deploy
```

That command publishes the first intentionally unconfigured, non-indexed
Worker so Cloudflare can assign its temporary hostname. It was deliberately
not run during Milestone 8. Record the resulting Worker version and hostname;
do not test OAuth or mutations on this bootstrap version.

CLOUDFLARE DASHBOARD

Open **Workers & Pages → cali-central → Settings → Variables and Secrets**.
Add the reviewed nonsecret runtime values and encrypted secrets listed in the
environment runbook, using the exact assigned `workers.dev` origin and keeping
indexing false. Use the dashboard’s reviewed deploy action once. A newly
created Worker had no values for `--keep-vars` to preserve.

Put the matching build-time values in the reviewed, ignored local build
environment. Rebuild and deploy the configured version:

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
npm run cf:build
npm run deploy
```

Only the configured version is ready for the temporary-host smoke checks.

## Temporary-host validation

Before attaching a domain, validate the exact deployed `workers.dev` origin:

- public indexes and one valid detail of each content type;
- Privacy, Terms, Accessibility, favicon, manifest, social image, robots,
  sitemap, canonical metadata, and an unknown route;
- health status and safe Worker logs;
- sign-in configuration, protected account/admin denial, and Studio noindex;
- Draft Mode, Presentation, private Sanity reads, images, and one reversible
  test workflow in an isolated environment;
- `Cache-Control`, `X-Robots-Tag`, baseline security headers, and CSP
  report-only events;
- no private response body in unauthenticated requests.

Keep indexing disabled on the temporary hostname.

## Custom domain

Do not silently choose apex or `www`. Inventory current DNS and decide which
single hostname is canonical. Apex is a reasonable simple default when no
existing website routing conflicts, but the domain owner must approve it.
Whichever host is selected must be used consistently by metadata, sitemap,
Auth.js, OAuth callbacks, Sanity CORS, and Presentation.

CLOUDFLARE DASHBOARD

1. Export or otherwise record the current DNS configuration.
2. Confirm the deployed Worker version is healthy at `workers.dev`.
3. Attach only the chosen canonical custom domain to the Worker.
4. Configure the alternate apex/`www` hostname as a permanent redirect to the
   canonical host.
5. Confirm an active HTTPS certificate and HTTP-to-HTTPS redirect.
6. Do not enable “Cache Everything” for auth, account, admin, Studio,
   Draft Mode, health, or Server Action traffic.
7. Recheck every unrelated DNS record.

**Do not delete or replace MX, SPF, DKIM, or DMARC records while connecting the
website.** Domain email configuration is independent of the Worker route.
Also preserve verification, subdomain, and service records not owned by this
application.

After the hostname decision, update the build/runtime origin, Auth.js origin,
provider callbacks, Sanity CORS and Presentation origin, rebuild, and validate
canonical output. Do not expose both hosts as independent canonical sites.

## OAuth URLs

Replace `YOUR_DOMAIN` only after the canonical-host decision.

| Setting | Production value pattern |
| --- | --- |
| Site/sign-in origin | `https://YOUR_DOMAIN` |
| Sign-in page | `https://YOUR_DOMAIN/sign-in` |
| Auth.js route base | `https://YOUR_DOMAIN/api/auth` |
| Google callback | `https://YOUR_DOMAIN/api/auth/callback/google` |
| GitHub callback | `https://YOUR_DOMAIN/api/auth/callback/github` |

Local callback patterns are
`http://localhost:3000/api/auth/callback/google` and
`http://localhost:3000/api/auth/callback/github`. Use one stable, non-indexed
staging hostname for preview callbacks; do not register arbitrary preview URLs.

GOOGLE CLOUD/OAUTH DASHBOARD

Create or update a production Web application only after review. Set the exact
authorized JavaScript origin and Google callback shown above. Do not use a
wildcard, path variant, alternate hostname, or HTTP production URL.

GITHUB DEVELOPER SETTINGS

Create or update the production OAuth App only after review. Set its homepage
to the exact canonical origin and its callback to the GitHub URL above. Cali
Central verifies the provider email through GitHub’s authenticated email API;
the application never stores that access token.

## Sanity production connection

SANITY MANAGE DASHBOARD

1. Confirm the unified production dataset is **private** and the selected plan
   will keep it private.
2. Create separate least-privilege Viewer and operational write tokens.
3. Give Studio access only to reviewed members.
4. Add `http://localhost:3000` with credentials only for local authenticated
   preview work.
5. Add the exact production frontend origin with credentials for embedded
   Studio/Presentation/Draft Mode.
6. Add a stable staging origin separately when used.
7. Never combine credentials with a wildcard origin; remove obsolete preview
   origins after use.
8. Configure Presentation to the exact canonical frontend origin.

The production launch test for dataset privacy is an anonymous query for an
operational document type that returns no documents. Sanity may return HTTP
`200` with an empty result for a private dataset; status alone is not the test.
Do not publish production submissions, contributor profiles, or audit events.

Published public changes follow a rebuild-on-publish release model. Draft Mode
provides authenticated preview and visual editing. Document the reviewed
build/deploy that publishes a content change; do not promise immediate live
cache invalidation.

## Workers Builds (optional later)

No automatic workflow is enabled by this repository. A future Workers Builds
configuration may connect the repository after the first manual deployment is
stable.

CLOUDFLARE DASHBOARD

- Repository: the reviewed Cali Central repository.
- Primary branch: the repository’s actual protected primary branch.
- Root directory: repository root.
- Install command: `npm ci`.
- Build command: `npm run cf:build`.
- Deploy command: `npm run deploy`.
- Node: a supported pinned Node 22 release compatible with `package.json`.
- Build variables: nonsecret site-origin/stage/indexing/Sanity values and the
  protected private-dataset read token required during static generation.
- Runtime secrets: Auth.js, provider, Sanity, and bootstrap values listed in
  the environment runbook.
- Preview: a stable staging Worker/environment with isolated values and
  indexing disabled.

Keep production-branch automatic deployment disabled until the owner explicitly
approves it. GitHub Actions in this repository validates only and never
deploys.

## Analytics

Use dashboard-managed Cloudflare Web Analytics only if the owner enables it.
The application intentionally adds no analytics script, advertising tracker,
session replay, fingerprinting, or token. Confirm the dashboard is not
duplicating an injected script and review the privacy draft before enabling
nonessential measurement.

## Post-deployment

Complete [Launch checklist](launch-checklist.md), retain the prior Worker
version, and keep [Rollback and recovery](rollback-and-recovery.md) open during
domain changes. A successful Worker build does not validate provider
dashboards, Sanity account settings, certificate issuance, or DNS preservation.
