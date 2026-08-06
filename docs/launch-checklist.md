# Launch checklist

This checklist is an owner-controlled production gate. Keep indexing disabled
until every applicable item is reviewed. Policy pages are drafts and do not
replace legal advice or accessibility testing with users.

## 1. Code and release

- [ ] Review the full working-tree diff; no unrelated redesign or deleted
  fallback/schema/auth workflow.
- [ ] Confirm `package-lock.json` reflects only intentional dependency changes.
- [ ] Confirm `.next`, `.open-next`, `.wrangler`, `.dev.vars`, environment
  files, logs, exports, and smoke output are untracked/ignored.
- [ ] Confirm no Cloudflare account/zone ID, API token, OAuth secret, Auth.js
  secret, Sanity token, allowlist, private key, or private content is committed.
- [ ] Confirm no deprecated Pages adapter or automatic deployment hook exists.
- [ ] Review the accepted Workers/OpenNext architecture decision.
- [ ] Record the candidate Git commit, generated types, build output, and prior
  known-good Worker version.

VS CODE TERMINAL

```bash
npm ci
npm run sanity:types
npm run cf-typegen
npm run lint
npm run typecheck
npm test
npm run build
npm run cf:build
npm run preview
```

- [ ] Workerd preview starts without publishing.
- [ ] Stop preview cleanly after the local smoke checks.
- [ ] Review current `npm audit` and `npm audit --omit=dev` findings; do not use
  a force fix.

## 2. Environment and Cloudflare

- [ ] Choose distinct development, stable staging, and production environments.
- [ ] Set exact site stage and canonical origin; production uses HTTPS and no
  path/query/fragment.
- [ ] Keep indexing approval false during temporary-host and domain validation.
- [ ] Separate public build variables, protected build secrets, runtime
  variables, and encrypted runtime secrets.
- [ ] Confirm the private Sanity Viewer token is available to configured static
  builds without appearing in output.
- [ ] Confirm runtime has only required provider/Sanity/Auth/allowlist secrets.
- [ ] Confirm at least two verified bootstrap administrators and a reviewed
  offboarding procedure.
- [ ] Confirm Wrangler account identity manually before deployment.
- [ ] Keep automatic Workers Builds and GitHub deployment disabled.
- [ ] Record observability sampling/retention/cost shown in the account.
- [ ] Configure staging rate-limit rules in monitor mode before production
  blocking.
- [ ] Confirm no unused D1, R2, KV, Queue, Durable Object, Images, or rate-limit
  binding exists.

## 3. Content owner review

- [ ] Approve or replace prototype homepage copy.
- [ ] Verify every story, author, date, image credit, and related link.
- [ ] Verify athlete names, statistics, records, and fictional/verified status.
- [ ] Verify competition dates, places, registration/ticket/livestream labels,
  and disclaimers.
- [ ] Verify media labels; do not imply a static record is playable.
- [ ] Verify ranking disclaimer and do not call prototype data official.
- [ ] Remove unintentional `TODO`, `FIXME`, placeholder, localhost,
  `example.com`, `href="#"`, developer instruction, or debug copy.
- [ ] Verify public contact details and the security mailbox before publishing.
- [ ] Review Privacy, Terms, and Accessibility drafts with the owner and
  qualified advisers as appropriate.
- [ ] Verify copyright year and footer links.
- [ ] Confirm no unsupported real-world claim or fake sponsor/ticket/streaming
  mark remains.
- [ ] Explicitly choose prototype or production presentation and retain
  fictional notices wherever content remains illustrative.

## 4. Sanity

- [ ] Production unified dataset is private and its plan will remain private.
- [ ] Anonymous operational queries return no documents; do not require `401`
  because private datasets may respond `200` with an empty result.
- [ ] Viewer and operational write tokens are separate, least-privilege, and
  server-only.
- [ ] No `browserToken` or browser mutation path exists.
- [ ] Studio members/roles are reviewed; operational documents are read-only in
  Studio and edited through audited `/admin` workflows.
- [ ] Exact local, stable staging, and production origins are configured; only
  the origins needing authenticated preview use credentials.
- [ ] No credentialed wildcard or obsolete preview origin remains.
- [ ] Presentation points to the exact production frontend origin.
- [ ] Studio, Draft Mode signed enable/disable, Visual Editing, published
  perspective, preview perspective, Portable Text, crop/hotspot images, and
  configuration errors are tested.
- [ ] Published-content release is documented as rebuild-on-publish. The owner
  understands that static HTML, metadata, and sitemap do not update until a
  reviewed rebuild/deploy.
- [ ] Sanity schema extraction and TypeGen match source changes.
- [ ] A private encrypted dataset export/recovery process is approved; no
  export is stored in Git.

SANITY MANAGE DASHBOARD

Review dataset visibility, token permissions, Studio membership, CORS origins,
and Presentation origin. Do not mutate production content or CORS merely to
complete this checklist; make each account-side change separately and record
it.

## 5. Authentication

- [ ] `AUTH_URL` exactly matches the chosen canonical HTTPS site origin.
- [ ] Production and staging use different Auth.js/provider secrets and
  allowlists.
- [ ] Google origin and callback are exact; Google verified email is required.
- [ ] GitHub homepage/callback are exact; primary verified email lookup works.
- [ ] No transient preview hostname is registered as a callback.
- [ ] Sign-in, callback, session refresh, sign-out, and provider error state are
  tested with non-sensitive test identities.
- [ ] HTTPS session/state cookies have expected Secure, HttpOnly, SameSite,
  path, and expiration behavior.
- [ ] Redirect tests reject foreign, protocol-relative, backslash, malformed,
  and localhost-in-production destinations.
- [ ] Pending, suspended, archived, contributor, editor, and administrator
  access behaviors are verified.
- [ ] Unauthenticated and unauthorized account/admin bodies expose no private
  data and are never shared-cached.
- [ ] Role/access changes are serialized; final-admin and bootstrap offboarding
  limits are understood.
- [ ] Missing provider/write configuration fails honestly without a bypass or
  fake administrator.

GOOGLE CLOUD/OAUTH DASHBOARD

Verify `https://YOUR_DOMAIN` and
`https://YOUR_DOMAIN/api/auth/callback/google` after replacing the placeholder
with the chosen canonical host.

GITHUB DEVELOPER SETTINGS

Verify `https://YOUR_DOMAIN` and
`https://YOUR_DOMAIN/api/auth/callback/github` after replacing the placeholder
with the chosen canonical host.

## 6. Security and privacy

- [ ] Baseline security headers are present on public and private routes.
- [ ] HSTS appears only on the reviewed production HTTPS origin; preload and
  `includeSubDomains` remain off until all subdomains/email are reviewed.
- [ ] CSP report-only is exercised on public, Auth.js, Studio, Presentation,
  Draft Mode, and error routes; no unexplained wildcard/`unsafe-eval`.
- [ ] `X-Robots-Tag` and private/no-store behavior cover sign-in, Auth.js,
  account, admin, Studio, Draft Mode, and health.
- [ ] Cloudflare “Cache Everything” excludes all private/dynamic action paths.
- [ ] OAuth/Draft query strings, request bodies, tokens, emails, profiles,
  allowlists, submissions, notes, and raw exceptions never enter logs.
- [ ] Worker automatic invocation URL logs remain disabled; safe structured
  application events are visible.
- [ ] Submission creation replay/idempotency and workflow revision guards are
  tested; no double-click duplicate is created.
- [ ] Profile no-op/audit behavior and account quotas are reviewed.
- [ ] Cloudflare rate limits are observed before blocking and return `429`
  without logging bodies.
- [ ] Privacy/retention/deletion-review periods and backup access are
  owner-approved without unsupported compliance claims.
- [ ] Incident and credential-rotation owners are assigned.

## 7. SEO, metadata, and assets

- [ ] `metadataBase`, every canonical, Open Graph URL, sitemap URL, and social
  image use the chosen canonical origin.
- [ ] No duplicate title, undefined value, localhost production URL, stega
  metadata, private data, or official claim exists.
- [ ] Durable 1200×630 default social image has correct dimensions and alt text.
- [ ] Favicon, 192/512 icons, Apple touch icon, and manifest load; no offline
  support or service worker is claimed.
- [ ] `robots.txt` disallows indexing until production stage plus explicit
  approval; private paths remain disallowed.
- [ ] Sitemap contains only valid, unique, published, indexable public routes
  and safely handles fallback/empty content.
- [ ] Account/admin/Studio/Auth/Draft/health never appear in sitemap or public
  social metadata.
- [ ] Fictional Person, SportsEvent, VideoObject, offer, rating, and ranking
  structured data remains omitted.
- [ ] Only after all checks: deliberately set production stage and indexing
  approval, rebuild, and recheck the artifact before deployment.

## 8. Accessibility and responsive behavior

Review approximately 320, 375, 430, 768, 1024, 1280, 1440, and very wide
layouts.

- [ ] Every major page/error/policy state has one useful `h1`, logical heading
  order, landmarks, skip navigation, and visible keyboard focus.
- [ ] Desktop/mobile navigation links work, active states are clear, the mobile
  dialog is labeled, focus is contained/restored, and it closes on Escape/link.
- [ ] Forms have labels, associated errors/summaries, keyboard-operable
  controls, status text independent of color, and no fake success.
- [ ] Tables have captions/headers and remain usable on narrow screens.
- [ ] Long CMS names, titles, URLs, metadata, policy copy, account actions,
  admin tables, dialogs, and footer do not clip or cause horizontal overflow.
- [ ] Images have meaningful or intentionally empty alt text, intrinsic sizes,
  responsive sources, stable layout, and no broken external host.
- [ ] External/new-tab link behavior is understandable to assistive technology.
- [ ] Reduced motion is honored; no autoplay, flashing, hover-only essential
  content, or fake media controls.
- [ ] Studio’s configuration state and shell remain readable at narrow widths.

This is an implementation audit, not formal WCAG certification.

## 9. Performance and third parties

- [ ] Review route rendering modes and public/private cache behavior in the
  final Next and OpenNext builds.
- [ ] Public directories omit full bodies and use bounded queries; private
  dashboards omit unnecessary content and audit history.
- [ ] Draft/Visual Editing client code is limited to authenticated Draft Mode.
- [ ] Sanity CDN image loader emits responsive widths/quality and rejects
  untrusted transform hosts.
- [ ] Fonts are self-hosted in output with a sensible fallback and no runtime
  Google Fonts request; clean builds have documented network needs.
- [ ] No unknown marketing, advertising, replay, fingerprinting, Turnstile, or
  duplicate analytics script.
- [ ] No autoplay media, giant original image, excessive preload, or all-page
  Studio script.
- [ ] Record observed build/bundle results without claiming production Core Web
  Vitals before traffic exists.
- [ ] Run the nonpublishing Wrangler dry run and confirm the compressed Worker
  fits the selected account plan; the reviewed local handler gzip was
  4,622,305 bytes, above the documented Workers Free 3 MB limit.
- [ ] If enabled, Cloudflare Web Analytics is dashboard-managed, reviewed for
  privacy, and not duplicated in code.

## 10. Temporary Worker and custom domain

- [ ] Deploy manually to `workers.dev`; retain the returned version and prior
  version.
- [ ] Complete all route/security/private-data smoke tests there with indexing
  disabled.
- [ ] Choose one canonical apex or `www` hostname; configure the other only as a
  permanent redirect.
- [ ] Inventory DNS before attachment and preserve every unrelated record.
- [ ] Attach the domain, confirm certificate/HTTPS/redirect, and retest.
- [ ] Confirm MX, SPF, DKIM, DMARC, verification, and mail delivery are intact.
- [ ] Rebuild with the final canonical origin, then update exact OAuth
  callbacks, Sanity CORS, and Presentation origin.
- [ ] Verify canonical metadata, sitemap, robots, cookies, analytics decision,
  and no hostname redirect loop.

CLOUDFLARE DASHBOARD

Attach the custom domain only after temporary-host validation. Never delete MX,
SPF, DKIM, or DMARC records while connecting the site.

## 11. Complete post-deployment smoke check

Public:

- [ ] `/`, `/stories`, one story, `/athletes`, one athlete, `/rankings`,
  `/competitions`, one competition, `/videos`, and one video.
- [ ] `/privacy`, `/terms`, `/accessibility`, unknown route, and forced safe
  error behavior.
- [ ] Favicon/icons, social image, manifest, robots, sitemap, canonical links,
  headings, prototype notices, filters, related links, and responsive images.

Auth/account:

- [ ] Sign-in configuration, Google/GitHub callback when enabled, verified
  identity gate, session cookie, account dashboard/profile/submissions/new
  submission/detail, sign-out, suspended account, and unauthorized admin.

Sanity:

- [ ] Studio sign-in/shell, Presentation, signed Draft Mode enable/disable,
  Visual Editing, published rebuild behavior, private reads, images, CORS, one
  guarded write, and honest missing-config/error states.

Admin:

- [ ] Dashboard, submission queue/detail, reviewer assignment, visible feedback,
  private notes isolation, contributor list/detail, role/access safeguards,
  audit event, and Studio link authorization.

Operations:

- [ ] Health response/status, safe Worker logs, `404`, error boundary, security
  headers/CSP report, cache exclusions, rate-limit `429` when enabled, and
  analytics only if approved.

## 12. Release decision

- [ ] Owner approves content, policy drafts, privacy/retention, and canonical
  hostname.
- [ ] Engineering owner approves code, advisories, runtime preview, headers,
  cache, logs, external configuration, and rollback evidence.
- [ ] Sanity owner approves dataset privacy, roles, tokens, CORS, Presentation,
  and recovery.
- [ ] Domain owner approves route/certificate and verifies email DNS.
- [ ] OAuth owner approves exact provider settings.
- [ ] Indexing approval is an explicit last step, not a side effect of deploy.
- [ ] Prior Worker version and emergency contacts are immediately available.
