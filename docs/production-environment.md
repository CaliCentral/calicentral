# Production environment

This is the environment contract for Cali Central. Values shown in this
document are placeholders. Never copy production secrets into the repository,
issues, pull requests, screenshots, or support messages.

## Environments

| Environment | Site stage | Origin | Content behavior | Indexing |
| --- | --- | --- | --- | --- |
| Local | `development` | `http://localhost:3000` | Local fallback when Sanity is not configured | Off |
| Preview/staging | `preview` | The exact HTTPS preview origin | Isolated Sanity/OAuth configuration | Off |
| Public prototype | `prototype` | An explicit HTTPS origin | Published content with prototype notices | Off unless deliberately approved |
| Production | `production` | The chosen canonical HTTPS origin | Private Sanity dataset, server-authenticated reads | On only with explicit approval |

Use separate secrets and OAuth applications for preview and production.
Never make a transient pull-request hostname an OAuth callback. Prefer one
stable staging Worker or staging hostname. `wrangler.jsonc` names that Worker
`cali-central-staging`; the default environment remains `cali-central`.

## Variable inventory

“Build” means the value must be present while Next.js/OpenNext renders static
output. “Runtime” means the deployed Worker must receive the value.

| Variable | Exposure | Build | Runtime | Required behavior |
| --- | --- | ---: | ---: | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Yes | Yes | Exact canonical origin. Preview, prototype, and production require public HTTPS with no credentials, path, query, or fragment; only development may use localhost. |
| `SITE_STAGE` | Server configuration | Yes | Yes | One of `development`, `preview`, `prototype`, or `production`. Defaults conservatively outside production. |
| `SITE_INDEXING_ENABLED` | Server configuration | Yes | Yes | Must be exactly `true` as a second production indexing approval. Leave false everywhere else. |
| `SITE_CONTACT_EMAIL` | Server configuration rendered publicly | Yes | Yes | Optional owner-reviewed public contact address for policy pages. Omit safely when unavailable. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public | Yes | Yes | Omit with the dataset to use fictional local fallback content. |
| `NEXT_PUBLIC_SANITY_DATASET` | Public | Yes | Yes | Dataset name. The unified production dataset must be private. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Public | Yes | Yes | Pinned API date used by the application. |
| `SANITY_API_READ_TOKEN` | Secret | Yes in configured production | Yes | Viewer-only token for private published reads and Draft Mode. Never prefix with `NEXT_PUBLIC_`. |
| `SANITY_API_WRITE_TOKEN` | Secret | No | Yes | Least-privilege token for guarded contributor/editorial mutations. |
| `AUTH_SECRET` | Secret | No | Yes | Auth.js JWT/session encryption secret, unique per environment. |
| `AUTH_URL` | Server-only configuration | No | Yes | Exact canonical origin; must match `NEXT_PUBLIC_SITE_URL` in production. |
| `GOOGLE_CLIENT_ID` | Server-only identifier | No | Yes | Optional; both Google values are required to enable the provider. |
| `GOOGLE_CLIENT_SECRET` | Secret | No | Yes | Optional Google OAuth client secret. |
| `GITHUB_CLIENT_ID` | Server-only identifier | No | Yes | Optional; both GitHub values are required to enable the provider. |
| `GITHUB_CLIENT_SECRET` | Secret | No | Yes | Optional GitHub OAuth client secret. |
| `CALI_CENTRAL_ADMIN_EMAILS` | Secret personal data | No | Yes | Comma-separated verified bootstrap identities. Keep out of build logs and source control. |
| `CALI_CENTRAL_EDITOR_EMAILS` | Secret personal data | No | Yes | Comma-separated verified bootstrap identities. Keep out of build logs and source control. |
| `NEXTJS_ENV` | Local tool control | No | Local preview only | Optional `.dev.vars` selector that lets OpenNext preview load development environment files. Do not deploy as product configuration. |

`CONFIRM_SANITY_SEED` is a local safety confirmation for the manual seed tool,
not a deployed application variable. Cloudflare API tokens and account
identifiers are operator/CI credentials, not application runtime variables.
They are not committed to `wrangler.jsonc`.
`NODE_ENV` is framework-owned. `NEXT_TELEMETRY_DISABLED` and
`SANITY_TELEMETRY_DISABLED` are nonsecret CI/tool noise controls, not product
configuration.

## Missing-value behavior

- With no complete public Sanity connection, public routes use the explicitly
  labeled fictional fallback and Studio shows configuration guidance.
- Development alone may fall back to `http://localhost:3000`. Preview,
  prototype, and production stages fail closed until an explicit public HTTPS
  origin is configured, preventing a deliberately staged deployment from
  emitting localhost canonicals.
- A credential-free build with no explicit `SITE_STAGE` retains the repository
  fallback, remains noindex, and reports degraded readiness. It exists for
  local/CI validation only and is not a deployable launch configuration.
- When Sanity is configured, it is authoritative. Empty content renders an
  honest empty state; query failures are not disguised as fallback content.
- Production readiness is degraded if the canonical origin, private-dataset
  read capability, Auth.js configuration, or operational write capability is
  incomplete. The public health route reports only the general state.
- OAuth buttons appear only for complete provider pairs. No development bypass
  or default administrator is created.
- Missing contact configuration omits contact links; it does not invent an
  address.
- Analytics remains disabled until enabled in the Cloudflare dashboard.

## Local files

Use `.env.local` for Next.js local development. Wrangler/workerd also supports
an uncommitted `.dev.vars`; `.dev.vars.example` documents names only. Both
files are ignored. Keep preview and production values out of local shared
files when possible.

VS CODE TERMINAL

```bash
cp .env.example .env.local
npm run dev
```

Do not place production credentials in `.env.local`.

## Cloudflare build variables

For a configured production-content build, provide the site origin, server-side
stage/indexing controls, and public Sanity connection variables to the build.
Because public pages and the sitemap are prerendered against a private Sanity dataset,
`SANITY_API_READ_TOKEN` is also a protected build secret. Make the same
canonical public values available to the Worker runtime.

Do not solve a build-variable problem by adding `NEXT_PUBLIC_` to a secret.
OpenNext output can contain statically rendered content, so build only in a
trusted environment and never print environment dumps.

CLOUDFLARE DASHBOARD

In Workers Builds, add nonsecret build variables separately from encrypted
build secrets. Keep automatic deployment disabled for the first launch. Pin a
compatible Node 22 release and use the locked npm dependency graph.

For the Worker runtime, open **Workers & Pages → cali-central → Settings →
Variables and Secrets**. Add these reviewed values as ordinary variables:

- `NEXT_PUBLIC_SITE_URL`
- `SITE_STAGE`
- `SITE_INDEXING_ENABLED`
- `SITE_CONTACT_EMAIL` when approved
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `AUTH_URL`
- `GOOGLE_CLIENT_ID` when Google is enabled
- `GITHUB_CLIENT_ID` when GitHub is enabled

Use the exact same origin and Sanity public identifiers that were supplied to
the build. Keep indexing false on the temporary Worker. A new Worker has no
dashboard values for the deploy script’s `--keep-vars` flag to preserve, so
complete this step immediately after the first non-indexed deployment and
before functional OAuth or mutation testing.

## Worker runtime secrets

Store runtime secrets with Cloudflare’s encrypted secret controls. Set them
individually; do not bulk-delete or bulk-replace an environment.

VS CODE TERMINAL — RUN MANUALLY AFTER REVIEW

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put SANITY_API_READ_TOKEN
npx wrangler secret put SANITY_API_WRITE_TOKEN
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put CALI_CENTRAL_ADMIN_EMAILS
npx wrangler secret put CALI_CENTRAL_EDITOR_EMAILS
```

Only set provider and allowlist secrets that are actually used. Provider client
IDs and `AUTH_URL` are not secret, but they remain server-side Worker
configuration rather than browser variables.

Each `wrangler secret put` command creates and immediately deploys a new Worker
version. Prefer adding the reviewed secrets together in the dashboard for the
initial setup; use the command templates only after the Worker exists and
during an intentional change window.

## Production invariants

- `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` are the same chosen HTTPS origin.
- The alternate apex/www hostname redirects to the canonical hostname.
- `SITE_STAGE=production` alone does not enable indexing;
  `SITE_INDEXING_ENABLED=true` is also required.
- The unified production Sanity dataset is private and anonymous operational
  queries return no documents.
- Viewer and write tokens are different, least-privilege, server-only secrets.
- Production and staging use different Auth.js secrets, provider credentials,
  allowlists, Sanity datasets or projects, and Cloudflare environments.
- At least two verified bootstrap administrators are available before launch.
- Any environment change is recorded in the operator change log without
  recording its value.

## Rotation

Rotate one dependency at a time, verify the health route and affected workflow,
and retain a recoverable prior configuration until validation finishes.
Rotating `AUTH_SECRET` invalidates active sessions. Removing an address from a
bootstrap allowlist does not change the stored Sanity role; offboarding also
requires a reviewed role/access change and redeployment.

See [Security operations](security-operations.md) and
[Rollback and recovery](rollback-and-recovery.md) before changing production
secrets.
