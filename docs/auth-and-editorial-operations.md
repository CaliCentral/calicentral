# Contributor authentication and editorial operations

Cali Central separates public publishing, contributor intake, editorial
operations, and Sanity Studio. The portal does not replace Studio and never
publishes public content automatically.

## Architecture

- The public `(site)` routes read published editorial content through the
  Milestone 6 content repository.
- Auth.js provides OAuth sign-in and encrypted JWT sessions without adding a
  session database.
- The contributor portal under `/account` handles identity, profiles, pitches,
  revision requests, and contributor-visible feedback.
- The public `/join` guide sends member, athlete, organizer, and contributor
  intents through this same Auth.js identity system.
- The editorial operations area under `/admin` handles intake, assignment,
  moderation, access management, and audit history.
- Sanity Studio at `/studio` remains the only full content editor and publishing
  interface.
- Operational reads and writes use a separate server-only Sanity client. No
  Sanity token or mutation shape is sent to the browser.

Server Components authorize every protected page. Every Server Action repeats
authentication, role, access-status, ownership, validation, and workflow checks
before issuing a focused mutation.

## Dependencies

The integration uses Auth.js (`next-auth`) and Zod. Auth.js owns OAuth state,
callback verification, CSRF protections, encrypted JWT sessions, sign-in, and
sign-out. Zod validates each security-sensitive form on the server.

There is no credentials provider, password database, ORM, session database,
email service, upload service, or browser-side Sanity client.

## Environment variables

Copy `.env.example` to `.env.local` and provide only the values used locally:

VS CODE TERMINAL

```dotenv
AUTH_SECRET=
AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

CALI_CENTRAL_ADMIN_EMAILS=
CALI_CENTRAL_EDITOR_EMAILS=

NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-01
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_STAGE=development
SITE_INDEXING_ENABLED=false
```

All values except the existing `NEXT_PUBLIC_` Sanity connection fields and site
URL are server-only. `AUTH_URL` is the canonical server-side Auth.js origin and
must match `NEXT_PUBLIC_SITE_URL`. Never add `NEXT_PUBLIC_` to OAuth secrets,
`AUTH_SECRET`, allowlists, or the Sanity write token.

`CALI_CENTRAL_ADMIN_EMAILS` and `CALI_CENTRAL_EDITOR_EMAILS` are
comma-separated lists. Parsing trims whitespace, lowercases addresses, removes
duplicates, and ignores empty or malformed entries. Do not commit real
addresses.

Generate `AUTH_SECRET` with the official Auth.js CLI or an approved
cryptographically secure secret generator:

VS CODE TERMINAL

```bash
npx auth secret
```

Review the generated local file before continuing and never commit it.

## OAuth setup

### Google

Create a Web application OAuth client in the Google Cloud console. For local
review, use:

GOOGLE CLOUD/OAUTH DASHBOARD

- Application origin: `http://localhost:3000` (also set as `AUTH_URL`)
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

Place the client ID and secret in `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`. The Google button appears only when both values,
`AUTH_SECRET`, and canonical `AUTH_URL` are present.

### GitHub

Create an OAuth App in GitHub developer settings. For local review, use:

GITHUB DEVELOPER SETTINGS

- Homepage URL: `http://localhost:3000` (also set as `AUTH_URL`)
- Authorization callback URL:
  `http://localhost:3000/api/auth/callback/github`

Place the credentials in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. The
GitHub button appears only when both values, `AUTH_SECRET`, and canonical
`AUTH_URL` are present.

Production uses exact `https://YOUR_DOMAIN` origins and the same callback paths.
See [Production deployment](production-deployment.md). Do not reuse local OAuth
secrets in production or register arbitrary transient preview hosts.

## Build-safe unconfigured behavior

No OAuth configuration is required to build or view public pages. When
`AUTH_SECRET`, canonical `AUTH_URL`, or all provider pairs are absent:

- `/sign-in` explains that contributor access is not configured;
- no provider button or development-login bypass is rendered;
- `/account` and `/admin` cannot create a session;
- no default contributor, editor, or administrator is invented;
- Sanity operational mutations remain unavailable.

Auth can succeed when a provider is configured even if the Sanity write token
is absent. In that state the account shows an honest provisioning limitation;
it does not claim that a contributor profile or submission was saved.

## Contributor provisioning

After a successful OAuth callback, the server first requires a provider-verified
email, then normalizes the provider identity and looks up an existing
contributor profile. Google’s verified-email claim is checked. GitHub’s
authenticated email endpoint must return a matching primary verified email;
its access token is used only for that request and is never stored or logged. A
deterministic profile ID is derived from a SHA-256 hash of the provider and
provider account ID; raw email addresses are never used in document IDs.

Provisioning is idempotent:

- it creates one profile when none exists;
- it starts ordinary first-time contributors in `pending` access;
- it starts explicit bootstrap editors/administrators in `active` access so
  their configured operational role is usable;
- it refreshes safe identity metadata and `lastSignedInAt`;
- it preserves biography, interests, role, access state, and editorial links;
- it never stores OAuth access tokens, refresh tokens, or session tokens;
- it never creates a public author or athlete automatically.

A server-managed `contributorIdentityClaim` stores only a SHA-256-derived
email claim ID and contributor reference. Creating that claim in the same
transaction as a new profile prevents concurrent provider callbacks from
creating duplicate normalized-email profiles; the raw email is not copied into
the claim or its document ID.

If a provider does not supply an email, portal authorization remains
unavailable.

Pending contributors may complete only the approved profile fields. An
administrator must activate the account before submission mutations are
available.

## Join intents and account capabilities

`/join` presents four non-privileged onboarding intents: member, athlete,
organizer, and contributor. They are defined centrally in
`lib/account/capabilities.ts` and are deliberately separate from portal roles.
An intent cannot grant editor or administrator access, activate a pending
account, verify an athlete or organizer, publish content, or bypass moderation.

The selected intent is carried through the existing safe same-origin Auth.js
callback into `/account/onboarding`. It currently personalizes that screen and
suggests an existing moderated submission type; it is not stored as a
permission, newsletter subscription, or public profile claim. This is the
documented boundary until the owner approves a persistent multi-capability
account model.

## Roles and access

Effective role resolution is evaluated on the server in this order:

1. bootstrap administrator allowlist;
2. bootstrap editor allowlist;
3. role stored on the contributor profile;
4. conservative `contributor` default.

Protected mutations resolve the current profile again instead of relying only
on a role copied into a long-lived JWT.

Roles:

- `contributor`: maintains permitted profile fields and their own submissions;
- `editor`: includes contributor capabilities and can review, assign, provide
  feedback, approve for development, reject, and open Studio;
- `admin`: includes editor capabilities and can manage roles/access and view the
  full audit log.

Access states:

- `active`: normal permitted access;
- `pending`: signed in, but profile or operations setup is incomplete;
- `suspended`: may view an access notice and sign out, but cannot mutate;
- `archived`: retained as history with no active portal mutations.

Bootstrap administrators remain effective regardless of their stored profile
role. Demotion, suspension, or archival is rejected when it would remove the
last effective administrator. High-risk administrator removals include the
revision of a non-sensitive `operationalLock` document in the same transaction,
so concurrent removals cannot both pass an earlier administrator count.

## Submission types and privacy

Supported types:

- story pitch;
- athlete nomination;
- competition listing;
- media pitch;
- correction request.

The public `/corrections` guide links into the correction-request form through
the same sign-in flow. The form may be preselected from a validated
`type=correctionRequest` query value, but all fields, ownership, access, and
workflow rules are still enforced on the server.

Forms use bounded plain-text fields and at most eight HTTP(S) supporting links.
They do not accept files, raw HTML, embeds, passwords, government IDs, birth
dates, home addresses, medical/financial information, or private athlete
contact details. URLs are validated but never fetched or previewed.

Contributors acknowledge that they have authority to submit the material, have
not intentionally included confidential information, and understand that
review and editing do not guarantee publication or transfer ownership.

## Workflow

Statuses:

- `draft`
- `submitted`
- `inReview`
- `revisionRequested`
- `approved`
- `rejected`
- `withdrawn`
- `archived`

Contributor transitions:

- draft → submitted or withdrawn;
- revision requested → submitted or withdrawn;
- submitted → withdrawn only before active review.

Editor transitions:

- submitted → in review, revision requested, approved, or rejected;
- in review → revision requested, approved, or rejected;
- after contributor resubmission returns a record to submitted, submitted → in
  review;
- approved or rejected → archived.

No restoration transition is implemented in this milestone. Archived records
are retained; any future restoration path must be explicitly defined and
administrator-only. The centralized workflow module rejects every unlisted
transition.

“Approved” always means “Approved for editorial development.” It does not
publish, verify, rank, register, or create official results. Automatic
conversion into public Sanity content is intentionally not performed.

## Contributor permissions

An active contributor can:

- edit display name, biography, location, and areas of interest;
- create and edit their own draft;
- edit their own revision-requested submission;
- submit or resubmit for review;
- withdraw an eligible submission;
- view their own status and contributor-visible feedback.

The server query is restricted to that contributor before any data reaches a
Client Component. A contributor cannot read another submission, private notes,
reviewer identity beyond the public assignment state, roles, access controls,
or Studio links.

## Editorial and administrator permissions

Editors can view the secure queue, review complete submission content, assign
an active editor/admin reviewer, update internal priority, request revisions,
approve for development, reject, archive resolved submissions, add private notes, and update
contributor-visible feedback.

Administrators can additionally manage contributor roles/access, update
internal contributor notes, apply suspension/reactivation/archival safeguards,
and inspect the full audit history.

Private editorial notes and contributor-visible feedback are separate schema
fields and separate projections. Private notes are never fetched by contributor
queries or hidden merely with CSS.

Operational directories and histories use bounded queries. Account overview
counts are computed by Sanity while only the five latest submission summaries
are returned; larger directory views are capped at 250 records for this
milestone.

## Audit records

Meaningful mutations create server-authored `auditEvent` documents with a
resolved actor, actor role, target, concise summary, timestamp, and applicable
previous/next status. Browser forms cannot supply event IDs, actor identity, or
audit metadata. Records contain no tokens or complete submission snapshots.

If an audit event cannot be created as part of an operational mutation, the
action reports failure honestly. Review the implementation before enabling a
real dataset.

## Sanity write access

The unified production dataset must be private because it contains operational
identity/submission records next to public content.
`SANITY_API_READ_TOKEN` must be a Viewer-only server token for configured
published reads and Draft Mode. `SANITY_API_WRITE_TOKEN` must be a separate
least-privilege server-only token with the document permissions required for
contributor profiles, submissions, and audit events. The write client:

- is imported only by server-only repositories and actions;
- disables CDN use;
- uses the configured stable API version;
- exposes no arbitrary query or mutation endpoint;
- never prints its token.

No remote mutation or OAuth sign-in is performed during repository setup.
Validate against an isolated development dataset before using editorial data.

## Studio integration

Studio includes read-only views of operational submissions, contributors, and
audit events. Internal identity-claim and transaction-lock documents are
server-managed and omitted from the custom Studio structure. Operational
document creation, duplication, deletion, publishing, and field editing are
suppressed in Studio so the guarded `/admin` workflows remain the mutation
path. These UI restrictions complement—but do not replace—private-dataset
access and server authorization. Editors use `/studio` for public editorial
content.

Only effective editors/admins receive a portal link to the local embedded
Studio. Sanity membership still independently controls Studio authentication.

## Local review

1. Build and open `/sign-in` without auth variables; confirm no fake buttons.
2. Add one OAuth provider, `AUTH_SECRET`, and canonical `AUTH_URL`; restart the
   development server.
3. Use an isolated Sanity development dataset and least-privilege write token.
4. Add the test identity to the bootstrap admin or editor allowlist.
5. Sign in and confirm one contributor profile is provisioned.
6. Create, save, submit, revise, resubmit, and withdraw test submissions.
7. Confirm another contributor cannot open those document IDs.
8. Review the queue as editor and exercise only valid transitions.
9. Confirm contributor pages never show private editorial notes.
10. Test role/access changes and the final-administrator safeguard.
11. Inspect generated audit events and Studio document previews.
12. Sign out and verify protected routes redirect.

Also run:

VS CODE TERMINAL

```bash
npm run sanity:schema
npm run sanity:typegen
npm run typecheck
npm test
npm run lint
npm run build
```

## Known limitations

- Real Google/GitHub callbacks, session cookies, and contributor provisioning
  require external credentials plus an isolated configured Sanity dataset and
  were not exercised by repository-only validation.
- Submission and contributor directories intentionally load at most 250 recent
  operational records; cursor pagination is not implemented in this milestone.
- Archived-submission restoration and automatic conversion of approved intake
  into public-content drafts are intentionally omitted.
- Distributed rate limiting remains an account-side launch control; the portal
  also relies on authentication, bounded inputs, idempotency, workflow checks,
  and server-only mutations. See the staged Cloudflare rule plan in
  [Security operations](security-operations.md).
- Auth.js remains on the installed `next-auth` 5 beta release. Its production
  provider callbacks and cookie behavior require staging validation before
  launch.

## Production operations

Milestone 8 prepares production OAuth origins/callbacks, secret storage,
private-dataset requirements, Cloudflare compatibility, rate-limiting guidance,
monitoring, retention review, and incident procedures. It deliberately adds no
unreliable in-memory limiter and makes no compliance claim. Complete:

- [Production environment](production-environment.md)
- [Security operations](security-operations.md)
- [Launch checklist](launch-checklist.md)
- [Rollback and recovery](rollback-and-recovery.md)

The 2026-08-06 dependency-audit snapshot and unresolved toolchain advisories
are recorded in [Security operations](security-operations.md). Re-run both
audits for every launch candidate; do not apply a forced downgrade or major
upgrade blindly.
