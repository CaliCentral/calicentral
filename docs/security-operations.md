# Security operations

This runbook describes practical launch controls; it is not a compliance
certification. Account-side controls must be tested first in staging and
reviewed after material application changes.

## Data boundary

Public content, contributor profiles, submissions, and audit events currently
share one Sanity dataset. The production dataset must therefore be private.
Application projections and private routes do not protect records from direct
Content Lake queries when a dataset is public.

Required launch controls:

- private unified production dataset;
- server-only Viewer token for published and preview reads;
- separate least-privilege server-only write token;
- no browser token;
- reviewed Studio membership and the smallest practical Sanity role;
- operational document types read-only in Studio so `/admin` remains the
  audited workflow;
- anonymous operational queries verified to return no documents.

Sanity’s standard write roles cover the dataset broadly. Application and Studio
controls are defense in depth, not document-level backend authorization.
Audit documents are useful operational history, not tamper-proof compliance
logs. Export them only through an approved private recovery process.

## Authentication and authorization

- Auth.js uses encrypted JWT sessions with an eight-hour maximum.
- Provider identity is accepted only when its email is verified. Google’s
  verified claim is checked; GitHub’s authenticated `/user/emails` response is
  checked for a matching primary verified address. OAuth tokens are not stored
  or logged.
- `AUTH_URL` and the production site origin must be the same canonical HTTPS
  origin. Callback and return paths remain same-origin.
- Account and admin pages are dynamic, session-authorized, noindex, and
  unavailable to shared caches. Every Server Action repeats current identity,
  access, role, ownership, validation, and workflow checks.
- Auth.js cookie defaults must be verified on the deployed HTTPS origin:
  session and state cookies should be Secure as applicable, HttpOnly, scoped
  appropriately, SameSite-compatible with provider callbacks, and removed on
  sign-out. Draft Mode cookies must never appear in shared cached responses.
- Keep at least two verified bootstrap administrators. Effective-administrator
  removals share a Sanity revision guard, so concurrent changes cannot both
  commit against the same administrator set. Still perform role/access changes
  one at a time and confirm the resulting administrator set.
- Removing an address from a bootstrap allowlist does not erase a stored role.
  Offboarding means removing the allowlist entry, redeploying, changing the
  stored role/access through the guarded workflow, revoking provider access
  when appropriate, and reviewing recent audits.

Never use a query-string maintenance or administrator bypass.

## Mutation controls

Existing controls include bounded Zod input, HTTP(S)-only URLs, credential
rejection, state-machine validation, ownership checks, revision guards, and
atomic operational mutation/audit transactions. Contributor provisioning uses
a deterministic provider-derived identity.

Before open contributor launch, verify:

- repeated submission creation returns the same safe result for its validated
  idempotency key;
- transition, reviewer, feedback, role, and access replays cannot duplicate a
  state change or editorial draft;
- contributor profile no-op updates do not create unbounded audit noise;
- per-account active-draft/submission quotas are approved and enforced;
- active lists and audit views remain bounded;
- correction requests contain no confidential or identity-document material.

Client-side disabled buttons are usability controls, not idempotency.

## Cloudflare rate limiting

No in-memory limiter or unconfigured binding is presented as production
protection. Configure dashboard-side rules after observing staging traffic.
Start in log/monitor mode, exclude known internal validation only with a
reviewed non-secret rule, and then enable explicit `429 Too Many Requests`
responses.

Suggested initial per-IP ceilings are intentionally conservative starting
points, not traffic guarantees:

| Path/method category | Observe first | Initial blocking candidate |
| --- | --- | --- |
| `/api/auth/*` | Provider callback completion and failures | 60 requests/minute; use a tighter rule only for sign-in initiation, not successful callback completion |
| POST `/account/*` | Submission/profile action rate by authenticated session | 30 requests/minute plus application account quotas |
| POST `/admin/*` | Editorial/admin mutation rate | 60 requests/minute; alert on role/access bursts |
| `/api/draft-mode/*` | Signed preview activity | 20 requests/minute |
| `/api/health` | Monitor probes separately | 60 requests/minute unless an approved monitor needs more |

CLOUDFLARE DASHBOARD

Create separate staging and production WAF/rate-limit rules using exact
method/path expressions. Do not inspect or log request bodies. Preserve OAuth
callback completion and signed Draft Mode behavior. Review false positives,
provider IP aggregation, NAT traffic, and billing/retention shown in the
account before enabling blocking.

If a public unauthenticated form is added later, reevaluate Turnstile with
mandatory server-side token/action/hostname validation. It is unnecessary for
the current authenticated forms.

## Response security

The application sets baseline headers for content sniffing, referrer
minimization, unused browser capabilities, opener behavior, and route-aware
private caching/noindex. HSTS is production HTTPS-only and intentionally avoids
`includeSubDomains` or preload until every subdomain and email dependency is
reviewed.

Content Security Policy begins in report-only mode. Public and Studio surfaces
have different Sanity, frame, worker, and connection requirements. Before
enforcement:

1. exercise public navigation, Sanity images, Auth.js sign-in/sign-out,
   Studio, Presentation, Draft Mode, Visual Editing, and error pages in staging;
2. review violations for the exact route and resource origin without logging
   query strings or private content;
3. remove obsolete sources and investigate every wildcard;
4. confirm `object-src 'none'`, a constrained `base-uri`, form destinations,
   and Presentation frame relationships;
5. confirm production does not require `unsafe-eval`;
6. promote only the tested route-aware policy to enforcement.

The repository does not configure a CSP report collector because violation
payloads can include sensitive URLs and a public ingestion endpoint would need
its own abuse, retention, and privacy design. During bounded staging tests,
inspect report-only violations in browser developer tools and correlate only
allowlisted error categories in Worker logs. Do not claim central CSP reporting
or enforcement until an approved collector and route-specific policy exist.

Do not add `X-Frame-Options: DENY` globally: the intended Presentation
integration requires controlled framing. Do not apply Cloudflare “Cache
Everything” to auth, account, admin, Studio, Draft Mode, health, or Server
Action requests.

## Logging and observability

Application logs use a small allowlist of timestamp, application name, event,
severity, route category, status, provider, and error category. Never add raw
objects to a log call.

Never log:

- request URLs or query strings on OAuth/Draft routes;
- cookies, authorization headers, OAuth/Sanity/Auth secrets;
- email addresses, provider profiles, allowlists, or environment dumps;
- submission bodies, correction details, private notes, or full audit
  snapshots;
- raw exceptions whose cause may contain request/provider data.

Automatic Worker invocation logging is disabled because request URLs may carry
OAuth codes/state or signed preview parameters. Restrained application logs
remain enabled. Confirm current Cloudflare retention, sampling, and cost in the
dashboard; this repository makes no retention or pricing promise.

Production browser source maps are not enabled. Do not publish or upload them
unless a protected, access-controlled diagnostic workflow is deliberately
introduced and reviewed for bundled private implementation details.

VS CODE TERMINAL — RUN MANUALLY AFTER REVIEW

```bash
npx wrangler tail --format pretty
```

Use real-time logs only during a bounded diagnostic window. Reproduce with test
identities and content, avoid copying raw output into issues, stop the tail
when finished, and delete any local capture containing personal data.

CLOUDFLARE DASHBOARD

Review Worker observability for safe error categories, status changes, latency,
rate-limit events, profile-provisioning spikes, unexpected health failures, and
deployment-version correlation. Do not enable full request/body logging.

## Health and incident diagnosis

`/api/health` is an unauthenticated, no-store, noindex, constant-time readiness
signal. It exposes application name, stage, timestamp, and only a general
ready/degraded state. No version binding is configured, so deployment version
is omitted. It performs no Sanity query and reveals no missing-secret inventory
or operational counts.

For an incident:

1. Record time, affected route category, Worker version, and observed status.
2. Stop risky mutations by removing or revoking the runtime write capability
   through a controlled environment change; preserve public reads and health
   when safe.
3. If identity integrity is uncertain, disable the affected OAuth provider in
   configuration and preserve callback behavior long enough to avoid trapping
   an in-progress planned change.
4. Inspect allowlisted logs and Cloudflare security events without request
   bodies.
5. Roll back the Worker/configuration using the recovery runbook.
6. Preserve relevant Sanity history and private exports; do not destructively
   rewrite the dataset as an initial response.
7. Rotate exposed credentials and invalidate sessions as appropriate.
8. Verify public, auth, account/admin denial, Studio, Draft Mode, and health.
9. Document the root cause and preventive action without credentials or
   personal data.

Use the privately established security contact only after the mailbox has been
verified. Do not put a suspected credential or privacy incident in a public
GitHub issue.

## Secret rotation

- `AUTH_SECRET`: deploy the new value in a controlled window; all active
  sessions should be expected to become invalid.
- OAuth secret: create/activate the replacement in the provider dashboard,
  update the Worker secret, verify callback/login, then revoke the old value.
- Sanity Viewer token: update build and runtime secret, rebuild static content,
  verify public/Draft/Studio paths, then revoke the old token.
- Sanity write token: update runtime only, exercise a reversible isolated
  mutation/audit, then revoke the old token.
- Bootstrap allowlists: make a reviewed configuration change plus stored
  access/role change; never print the addresses.

Keep recovery material in an approved password/secret manager, not a repository
document or Sanity record.

## Privacy and retention

Policy pages are owner-review drafts. Before launch, the owner must set and
approve periods and procedures for contributor identities, submissions,
private editorial notes, audit records, Worker logs, account suspension,
deletion/review requests, and backups. Consider legal holds and editorial
integrity without claiming unsupported statutory compliance.

Cloudflare hosts/security-processes requests; Sanity stores public and
operational documents; OAuth providers supply identity data. Do not add public
analytics, advertising, replay, or tracking cookies without a separate privacy
and consent review.

## Dependency and source review

For each launch candidate, run a fresh audit, classify production versus
development advisories, and coordinate framework/CMS upgrades. Never use
`npm audit fix --force` as an unattended remedy.

VS CODE TERMINAL

```bash
npm audit
npm audit --omit=dev
```

The 2026-08-06 launch-candidate audit, after updating Next.js to `16.3.0` and
Wrangler to `4.119.0`, reported 13 dependency nodes: 8 moderate, 5 high, and 0
critical. `npm audit --omit=dev` reported the same counts because OpenNext and
Sanity are direct application dependencies even though the remaining advisory
paths are in their build, preview, and CLI tooling:

- Wrangler → Miniflare → Undici remains on Undici `7.28.0`; the installed
  latest compatible Wrangler release does not yet resolve that advisory.
- Sanity CLI transitives include the reported `adm-zip`, `js-yaml`, `uuid`, and
  related wrapper advisories.
- npm's suggested remedies downgrade current OpenNext/Wrangler/Sanity packages
  or cross major-version boundaries, so no forced fix was applied.

The Next.js update removed the framework advisories present in the baseline
audit. Reassess upstream releases before deployment and avoid processing
untrusted archives or YAML through the affected CLI paths.

Also review the diff and tracked files for credentials, private data,
`NEXT_PUBLIC_` secrets, generated `.open-next`/`.wrangler` output, source maps,
debug statements, deprecated Cloudflare adapters, and deployment hooks. Do not
paste suspected values into chat or logs.

## Optional security.txt

Do not publish `/.well-known/security.txt` until a valid monitored security
contact, canonical URL, and intentionally maintained expiry are approved. Do
not promise a bounty or disclosure policy that does not exist.
