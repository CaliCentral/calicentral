# Cali Central

Cali Central is a global calisthenics media and competition platform. The
project is intended to bring together editorial coverage, videos, athlete
profiles, verified statistics and standings, worldwide competition listings,
affiliate links, community submissions, and tools for operating Cali
Central-owned competitions.

## Current status

Cali Central is in early development. The current public prototype provides a
branded, responsive homepage, a six-story editorial archive with dynamic
article pages, an eight-profile athlete directory, dynamic athlete dossiers,
distinct provider-attributed athlete-ranking and competition-standings
surfaces, a public team directory with fictional fallback records, a six-event competition directory with
dynamic event records, and an eight-record static media archive with dynamic
editorial detail pages. The public content layer is integrated with Sanity CMS;
typed local sample data remains a centralized build-safe fallback when no
Sanity project is configured.

The repository includes structured schemas, a standalone Sanity Studio, typed GROQ,
Portable Text and image rendering, protected Draft Mode, Visual Editing, and a
guarded sample-content migration tool. It also includes build-safe Auth.js
OAuth integration, a protected contributor portal, structured submission
intake, role-gated editorial operations, and production preparation for
Cloudflare Workers through OpenNext. A remote Sanity project/dataset, OAuth
application, account credentials, CORS origins, Worker deployment, custom
domain, and production secrets are not created by this repository.
Names, athlete profiles, events, standings, statistics, venues, and editorial
reporting are fictional prototype content unless explicitly documented
otherwise.

## Technology stack

The approved target platform direction is:

- Next.js with the App Router
- React
- TypeScript
- Tailwind CSS
- Vercel
- Supabase PostgreSQL and Auth
- Cloudflare R2 for large media objects
- GitHub Actions

The repository is in a gated dual-provider migration. Next.js, React,
TypeScript, Tailwind CSS, Sanity, and the Cloudflare Workers/OpenNext build path
remain configured while the Supabase schema, RLS, offline import tooling,
Supabase Auth boundary, standard R2 adapter, Upstash rate-limit adapter, and
native Vercel configuration are validated. A typed community repository and
additive D1 migrations now support a conditional community UI with feeds, member
pages, discussions, reposts, private saves/collections, moderation, approved
athlete-control links, organization follows, notification preferences,
typed/audience-scoped posts, and mute controls. Production and preview D1
and R2 resources are provisioned and isolated in Wrangler, and distributed
rate-limit bindings are configured. Production community/media flags remain
off; no production application infrastructure is active until a reviewed
deployment and activation window.

See [`docs/decisions`](docs/decisions) and
[`docs/supabase-migration.md`](docs/supabase-migration.md) for the accepted
target and local workflow.
Introducing a different framework, database, CMS, authentication provider, or
paid dependency requires a documented architecture decision.

## Prerequisites

- Node.js 22.12.0 or newer
- npm
- Git

The repository uses npm, as identified by `package-lock.json`.

## Installation

Clone the repository, enter its directory, and install the locked dependency
versions:

VS CODE TERMINAL

```bash
git clone <repository-url>
cd calicentral
npm ci
```

Use `npm ci` for a clean, reproducible installation. Do not commit
`node_modules` or generated `.next` output.

## Local development

Start the development server:

VS CODE TERMINAL

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Application routes live under `app/`. The current public routes are `/`,
`/stories`, `/stories/[slug]`, `/athletes`, `/athletes/[slug]`, `/teams`,
`/teams/[slug]`, `/rankings`, `/standings`, `/standings/methodology`, `/competitions`,
`/competitions/calendar`, `/competitions/[slug]`, `/videos`,
`/videos/archive`, `/videos/[slug]`, `/search`, `/join`, `/verification`,
`/corrections`, `/editorial-standards`, `/privacy`, `/terms`, and
`/accessibility`. Feature-gated community routes include `/community`,
`/community/posts/[id]`, `/members/[handle]`, `/community-guidelines`,
`/account/saved`, `/account/collections`, `/account/collections/[id]`,
`/account/following`, `/account/notifications`, and the
editor-only `/admin/community`. Version-aware `/wcl` and `/wcl/rules` routes
remain behind their server feature flag. The editorial interface is built and
hosted separately from the public Worker. `/studio` is a noindex handoff page,
and editor-only navigation uses the configured standalone Studio URL.

Public account entry begins at `/join` or `/sign-in`. The Join guide presents
member, athlete, team manager, organizer, and contributor intents through the same Auth.js
identity; selecting an intent does not grant a role, verification, or
publication access. Authenticated contributors use `/account`; active editors
and administrators use the separately protected `/admin` workspace. Protected
routes remain noindex, and authorization continues to run on the server.

Before opening a pull request, run the available validation commands:

VS CODE TERMINAL

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

After changing schemas or named GROQ queries, also run:

VS CODE TERMINAL

```bash
npm run sanity:types
```

## Available npm commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production Next.js build. |
| `npm run start` | Run an existing production build. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run focused repository invariants without remote mutation. |
| `npm run check` | Run the local nonpublishing validation suite. |
| `npm run sanity:schema` | Extract `schema.json` with required-field enforcement. |
| `npm run sanity:typegen` | Generate `sanity.types.ts` from schemas and named queries. |
| `npm run sanity:types` | Extract the schema, then generate types. |
| `npm run studio:dev` | Start the standalone Sanity Studio locally. |
| `npm run studio:build` | Build the standalone Studio under ignored `.sanity/dist`. |
| `npm run sanity:seed` | Validate the deterministic fictional seed locally; no remote write. |
| `npm run sanity:import:official-streetlifting` | Generate the reviewed Official Streetlifting manifest/import/cleanup dry run; no mutation by default. |
| `npm run sanity:import:competitions` | Validate or dry-run provider-neutral reviewed competition manifests; no mutation by default. |
| `npm run sanity:import:organizations` | Validate or dry-run reviewed canonical organization manifests; no mutation by default. |
| `npm run test:source-registry` | Validate source approval statuses and required evidence without Sanity access. |
| `npm run sanity:report:production-readiness` | Generate the read-only production composition, manifest eligibility, and remaining sample-content reports under `.tmp/`. |
| `npm run cf-typegen` | Regenerate Worker binding types from Wrangler config. |
| `npm run cf:build` | Build the OpenNext Cloudflare Worker artifact. |
| `npm run preview` | Build and run the Worker locally under workerd; does not publish. |
| `npm run deploy` | Build and deploy the Worker; manual use only after review. |

Neither `build`, `check`, nor `preview` publishes a Worker. The deploy command
must not be run as routine validation.

## Project structure

```text
.
├── .github/
│   └── ISSUE_TEMPLATE/   # Bug and feature request templates
├── app/                  # Public, auth, account, admin, Studio, and API routes
├── components/
│   ├── athletes/         # Athlete directory and profile presentation
│   ├── account/          # Private saved-library and collection presentation
│   ├── competitions/     # Competition directory and event records
│   ├── community/        # Feed, discussion, repost, save, and share UI
│   ├── home/             # Focused public homepage sections
│   ├── layout/           # Shared header, navigation, and footer
│   ├── operations/       # Contributor and editorial operations UI
│   ├── members/          # Safe public member-profile presentation
│   ├── teams/            # Public team directory and profile presentation
│   ├── standings/        # Gated standings, verified results, methodology
│   ├── rankings/         # Provider-attributed athlete ranking snapshots
│   ├── stories/          # Story cards, article layouts, and artwork
│   ├── videos/           # Static media archive and editorial records
│   └── ui/               # Small reusable presentation primitives
├── data/                 # Typed fictional fallback and migration content
├── docs/
│   ├── architecture/     # System structure and integration documentation
│   ├── content-models/   # Registered CMS and application data models
│   ├── decisions/        # Architecture decision records
│   ├── legal/            # Working drafts requiring professional review
│   ├── product/          # Product requirements, phases, and checklists
│   └── security/         # Repository-safe security practices
├── public/               # Static public assets
├── lib/
│   ├── auth/             # Server-only identity, session, and role helpers
│   ├── community/        # Fail-closed typed D1 repository and media boundary
│   ├── content/          # Server-only repository, fallback, and CMS adapters
│   ├── operations/       # Validation, workflow, repositories, and actions
│   ├── wcl/              # Pure versioned WCL calculations and readiness
│   └── presentation/     # Content-neutral display helpers
├── sanity/               # Schemas, queries, mappers, Studio, and preview config
├── scripts/              # Guarded deterministic migration tooling
├── types/                # Shared public content types
├── AGENTS.md             # Repository instructions for coding agents
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and npm scripts
└── tsconfig.json         # TypeScript configuration
```

## Environment summary

No environment variables are required to build or review the fictional local
fallback. Copy `.env.example` to `.env.local` for local integrations. Public
configuration covers the canonical site origin, site stage, explicit indexing
approval, optional contact, and Sanity project/dataset/API version.

`SANITY_API_READ_TOKEN` is a server-only, read-only Viewer token for protected
published reads from the required private production dataset and for protected
Draft Mode. `SANITY_API_WRITE_TOKEN` is a separate server-only,
least-privilege token used by guarded contributor/editorial mutations and the
explicitly confirmed seed command. Neither secret may use a `NEXT_PUBLIC_`
prefix.

When project ID and dataset are missing, no fake project is queried and the
public site uses the local fallback. When they are valid, Sanity is
authoritative: query errors surface and empty datasets render empty states
instead of silently restoring sample records.

Complete project, Studio, CORS, Draft Mode, migration, and TypeGen instructions
are in [`docs/sanity-setup.md`](docs/sanity-setup.md).
The complete build/runtime/secret matrix is in
[`docs/production-environment.md`](docs/production-environment.md).

## Contributor portal and editorial operations

The public `/join` experience uses a reusable non-privileged capability
contract for member, athlete, team manager, organizer, and contributor onboarding. These
capabilities are deliberately separate from the trusted `contributor`,
`editor`, and `admin` portal roles. The selected Join intent currently guides
the post-authentication screen only; it is not persisted as a permission or
subscription. One person can choose a different path later without creating a
second identity system.

Auth.js provides conditional Google and GitHub OAuth sign-in with encrypted JWT
sessions. A provider button appears only when that provider has a complete
credential pair, `AUTH_SECRET`, and canonical `AUTH_URL` are configured. With
no provider configured, the public site and production build remain available,
`/sign-in` shows setup guidance, and no development bypass or default
administrator is created.

The portal supports contributor profiles, six structured submission types,
draft/save/submit/revision/withdrawal workflows, contributor-visible feedback,
an editor queue, reviewer assignment, private notes, access and role management,
and server-authored audit records. “Approved” means approved for editorial
development; it never publishes or verifies public content.

Server-only environment variables:

- `AUTH_SECRET`
- `AUTH_URL`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- `CALI_CENTRAL_ADMIN_EMAILS`
- `CALI_CENTRAL_EDITOR_EMAILS`
- `SANITY_API_WRITE_TOKEN`

The two bootstrap allowlists use comma-separated email addresses. Copy
`.env.example` for the full contract. Run `npm run sanity:types`,
`npm run lint`, and `npm run build` after operational schema or application
changes. Setup, callback URLs, role resolution, workflow rules, security
assumptions, and the local review checklist are documented in
[`docs/auth-and-editorial-operations.md`](docs/auth-and-editorial-operations.md).

Never commit:

- Passwords or recovery codes
- API tokens or private keys
- Cloudflare credentials
- Sanity write tokens
- Production database exports
- Private athlete, participant, or submission data
- Identity documents, waivers, signatures, or private addresses

## Search, trust, and update preferences

`/search` performs a bounded server-side search over published stories,
athletes, teams, competitions, and videos through the existing content repository.
It explicitly excludes drafts, private submissions, account records, and
moderation notes; no separate search service is required.

Public trust guidance lives at `/verification`, `/corrections`, and
`/editorial-standards`. Correction requests reuse the authenticated moderated
submission workflow and never overwrite published content directly.

The homepage describes planned newsletter interests but does not present a
subscription form. No email provider or delivery pipeline is configured, and
joining does not subscribe an account.

The repository ignores `.env*` files. Store production secrets only in approved
secret-management systems.

## Contribution workflow

1. Read `AGENTS.md`, this README, and the relevant documentation under `docs/`.
2. Create a focused branch from the current default branch.
3. Confirm the requirement and document important architectural decisions.
4. Make a small, reviewable change without rewriting unrelated code.
5. Add or update documentation when behavior, setup, or architecture changes.
6. Run `npm run lint` and `npm run build`.
7. Review the diff for generated files, secrets, private data, and unrelated
   changes.
8. Open a pull request describing the change, verification performed, and any
   known limitations.

Use the repository issue templates for bug reports and feature requests. Never
place credentials, private submissions, or personal data in an issue or pull
request.

## Deployment status

Cloudflare Workers is the configured deployment target through
`@opennextjs/cloudflare` and Wrangler. The repository supports a local workerd
preview and a manual deploy command, but Milestone 8 does not publish a Worker,
attach a domain, change DNS, upload secrets, alter OAuth/Sanity dashboards, or
enable automatic deployment.

Published page queries mount the supported `SanityLive` listener for tag-based
refresh without exposing a browser token; Draft Mode provides authenticated
preview and visual editing. Metadata/sitemap release behavior still requires
production review. The unified production Sanity dataset must be
private because it also stores contributor and operational records.

Production review:

- [`docs/production-data-refresh.md`](docs/production-data-refresh.md)
- [`docs/approved-data-owner-guide.md`](docs/approved-data-owner-guide.md)
- [`docs/production-deployment.md`](docs/production-deployment.md)
- [`docs/production-environment.md`](docs/production-environment.md)
- [`docs/launch-checklist.md`](docs/launch-checklist.md)
- [`docs/security-operations.md`](docs/security-operations.md)
- [`docs/rollback-and-recovery.md`](docs/rollback-and-recovery.md)

VS CODE TERMINAL

```bash
npm run sanity:types
npm run cf-typegen
npm run check
npm run cf:build
npm run preview
```

VS CODE TERMINAL — RUN MANUALLY AFTER COMMIT AND REVIEW

```bash
npm run deploy
```

The final command publishes a Worker. It is documented for deliberate use and
was not run while preparing this milestone.

The reviewed local OpenNext handler gzip is about 4.57 MB, so the final
Wrangler dry-run size must be checked against the selected Workers plan before
deployment; it is above Cloudflare’s documented 3 MB Workers Free limit.

## Security reporting

Do not report suspected vulnerabilities, exposed credentials, or privacy
incidents in a public issue.

No public security address is configured in the repository. Before launch, the
owner must establish a reviewed private reporting channel and set
`SITE_CONTACT_EMAIL` only if that address is appropriate for public policy
contact. Do not include unnecessary personal data, production records,
credentials, or identity documents in a report.

General security guidance is maintained in
[`docs/security`](docs/security/README.md).

## Roadmap summary

Milestones 1–7 established the public experience, architecture, content
models, Sanity integration, contributor accounts, submissions, and editorial
operations. Milestone 8 prepares that full-stack application for a controlled
Cloudflare Workers launch without performing the deployment or account-side
configuration.

Detailed roadmap and feature requirements belong in
[`docs/product`](docs/product/README.md). Legal drafts require review by a
qualified attorney before production use.
