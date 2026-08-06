# Rollback and recovery

Keep this runbook available before deployment, domain, provider, Sanity, or
secret changes. A Git revert restores only code. It does not restore a Worker
version, Worker secrets/variables, OAuth dashboards, DNS, Sanity content, CORS,
or Studio membership.

## Release records

For every production change, privately record:

- reviewed Git commit and build time;
- deployed Worker version and prior known-good version;
- canonical hostname and route state;
- which environment-variable names changed, but never their values;
- OAuth/CORS/DNS/dashboard changes;
- content migration or Sanity mutation identifiers;
- operator, approver, smoke result, and rollback decision deadline.

Never store secret values or private exports in this repository.

## Emergency Worker rollback

CLOUDFLARE DASHBOARD

1. Freeze additional deployments and identify the affected Worker/version.
2. Inspect safe logs and health without copying OAuth/Draft URLs or private
   bodies.
3. Roll back to the recorded prior known-good Worker version using Cloudflare’s
   version/deployment controls.
4. Restore the prior reviewed Worker variables and secrets only if they changed.
5. Keep the custom domain on the Worker when the prior version is healthy; do
   not churn DNS unnecessarily.
6. Verify HTTPS, health, public routes, sign-in, sign-out, unauthenticated
   account/admin denial, Studio, and Draft Mode.
7. Confirm indexing, sitemap, robots, canonicals, headers, and private caching.

If a version rollback is unavailable, build and deploy the prior reviewed Git
commit only after comparing its expected environment and schemas. Do not assume
old code is compatible with newer content mutations.

VS CODE TERMINAL — RUN MANUALLY AFTER REVIEW

```bash
git status
git show --stat <PRIOR_REVIEWED_COMMIT>
```

Do not use destructive Git reset/checkout operations on a dirty worktree.

## Emergency mutation suspension

If reads are safe but operational writes are suspect, revoke or remove the
Worker’s Sanity write capability in a controlled dashboard change. The
application should fail mutations honestly while public reads and health remain
available. Do not add a public query-parameter bypass or delete operational
documents.

CLOUDFLARE DASHBOARD

Update the affected Worker environment’s `SANITY_API_WRITE_TOKEN` secret state
under incident control, then deploy/restart only as Cloudflare requires.
Record the action without recording the token.

SANITY MANAGE DASHBOARD

Revoke the affected write token when compromise is suspected. Preserve the
Viewer token if public/private reads remain trustworthy. Review recent
operational documents and audits; do not mass-delete them.

A full maintenance mechanism is intentionally not in application code.
For a broad outage, use a reviewed Cloudflare route/version or static
maintenance response that preserves `/api/health` where possible. Plan OAuth
callback/session impact before blocking application routes.

## DNS and domain rollback

Before any domain change, capture the existing DNS records. Website recovery
must preserve mail and other services.

CLOUDFLARE DASHBOARD

1. Remove or revert only the Worker custom-domain/route change that caused the
   failure.
2. Restore the previously recorded web record or route.
3. Keep MX, SPF, DKIM, DMARC, verification, and unrelated subdomain records
   unchanged.
4. Confirm certificate and HTTP-to-HTTPS behavior.
5. Verify the canonical apex/`www` redirect has not become a loop.
6. Confirm `NEXT_PUBLIC_SITE_URL`, `AUTH_URL`, provider callbacks, and Sanity
   CORS still match whichever hostname is active.

DNS caches make rollback non-instantaneous. Do not repeatedly change records
while propagation is still being assessed.

## Environment and secret recovery

Use an approved secret manager as the recovery source. Restore individual
values, not an unreviewed environment dump.

- `AUTH_SECRET` rollback restores compatibility only if the application
  version and cookie expectations also match. Rotating it invalidates sessions.
- Provider client/secret rollback must match provider-dashboard state.
- A Sanity Viewer-token rollback may require a new OpenNext build because
  private published content is read during static generation.
- A write-token rollback affects runtime mutations and should be tested with a
  reversible isolated workflow.
- Public `NEXT_PUBLIC_` changes require a rebuild; changing only a Worker
  runtime value cannot rewrite already generated metadata/HTML.

After recovery, invalidate credentials believed exposed rather than keeping a
known-compromised prior value.

## OAuth recovery

GOOGLE CLOUD/OAUTH DASHBOARD

Verify the active client’s exact canonical origin and
`https://YOUR_DOMAIN/api/auth/callback/google`. Activate a reviewed replacement
secret before revoking the old one. Test a non-bootstrap verified identity
first, then a bootstrap administrator without exposing addresses in logs.

GITHUB DEVELOPER SETTINGS

Verify the homepage and
`https://YOUR_DOMAIN/api/auth/callback/github`. Confirm the authenticated
primary verified email permission still works. Activate a reviewed replacement
credential, update the Worker, test, then revoke the old value.

If sign-in must be disabled, remove the affected provider configuration and
deploy the safe unconfigured state. Existing sessions should still be evaluated
against current Sanity access status until `AUTH_SECRET` is rotated or they
expire.

## Sanity content recovery

Code and schemas live in Git; production content does not.

SANITY MANAGE DASHBOARD

Before launch and at an owner-approved cadence, perform a private Sanity dataset
export using Sanity’s supported controls. Store exports encrypted, access
controlled, outside the repository, and under an approved retention schedule.
Record project/dataset/API context without copying tokens.

Restoration considerations:

- restore into an isolated project/dataset first;
- confirm dataset privacy before importing operational data;
- compare schema version and references;
- validate public content, contributor profiles, submissions, and audit
  relationships;
- treat a restore as a data mutation with explicit approval;
- avoid replacing the active dataset when a targeted correction is safer;
- do not run the fictional seed against production records;
- do not claim an audit history is tamper-proof after restoration.

No dataset export, import, or destructive rollback is automated by this
repository.

## Post-rollback smoke test

Check in this order:

1. `/api/health` returns the expected general state and no secret details.
2. `/`, all public indexes, and one detail of each type render.
3. Unknown content returns branded `404`.
4. Robots, sitemap, canonical URLs, social image, manifest, and favicon use the
   active canonical origin and correct indexing mode.
5. Security headers and CSP report-only remain present.
6. `/sign-in` renders; enabled OAuth callbacks complete on the active host.
7. Session cookie is Secure on HTTPS and sign-out clears access.
8. Unauthenticated `/account` and `/admin` do not leak protected content.
9. Suspended and non-admin accounts remain denied appropriately.
10. `/studio`, Presentation, Draft Mode, and Sanity images work.
11. One reversible contributor/editorial mutation produces one expected audit.
12. Worker logs contain only safe categories; rate-limit rules are not blocking
    normal callbacks.
13. Domain email delivery and MX/SPF/DKIM/DMARC records remain intact.

## Recovery closeout

Preserve an incident timeline, decide whether credentials or personal data were
exposed, notify appropriate private contacts, rotate affected secrets, remove
temporary access, and document prevention work. Re-enable indexing, analytics,
automatic content releases, or aggressive rate limits only after the owner
approves the recovered state.
