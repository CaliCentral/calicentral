# Cali Central

Cali Central is a global calisthenics media and competition platform. The
project is intended to bring together editorial coverage, videos, athlete
profiles, verified statistics and rankings, worldwide competition listings,
affiliate links, community submissions, and tools for operating Cali
Central-owned competitions.

## Current status

Cali Central is in early development. Milestone 1 provides a branded,
responsive public homepage and application shell powered by typed local sample
data. It includes editorial, video, competition, athlete, and rankings
previews.

External services, authentication, production data models, deployment
configuration, and production infrastructure have not been implemented yet.
Homepage names, events, rankings, and statistics are fictional prototype
content unless explicitly documented otherwise.

## Technology stack

The approved platform direction is:

- Next.js with the App Router
- React
- TypeScript
- Tailwind CSS
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Sanity CMS
- GitHub Actions

Only Next.js, React, TypeScript, Tailwind CSS, and supporting lint/build tooling
are currently configured. The Cloudflare and Sanity technologies above are
planned and should not be considered active integrations.

See [`docs/decisions`](docs/decisions) for accepted architecture decisions.
Introducing a different framework, database, CMS, authentication provider, or
paid dependency requires a documented architecture decision.

## Prerequisites

- Node.js 20.9.0 or newer
- npm
- Git

The repository uses npm, as identified by `package-lock.json`.

## Installation

Clone the repository, enter its directory, and install the locked dependency
versions:

```bash
git clone <repository-url>
cd calicentral
npm ci
```

Use `npm ci` for a clean, reproducible installation. Do not commit
`node_modules` or generated `.next` output.

## Local development

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Application routes live under `app/`. Changes made during development are
reflected by the Next.js development server.

Before opening a pull request, run the available validation commands:

```bash
npm run lint
npm run build
```

## Available npm commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production Next.js build. |
| `npm run start` | Run an existing production build. |
| `npm run lint` | Run ESLint across the repository. |

There is not yet a dedicated automated test or type-check script. TypeScript is
checked as part of the Next.js build.

## Project structure

```text
.
├── .github/
│   └── ISSUE_TEMPLATE/   # Bug and feature request templates
├── app/                  # Next.js App Router pages, layout, and global styles
├── components/
│   ├── home/             # Focused public homepage sections
│   ├── layout/           # Shared header, navigation, and footer
│   └── ui/               # Small reusable presentation primitives
├── data/                 # Typed local prototype content
├── docs/
│   ├── architecture/     # System structure and integration documentation
│   ├── content-models/   # Planned CMS and application data models
│   ├── decisions/        # Architecture decision records
│   ├── legal/            # Working drafts requiring professional review
│   ├── product/          # Product requirements, phases, and checklists
│   └── security/         # Repository-safe security practices
├── public/               # Static public assets
├── types/                # Shared public content types
├── AGENTS.md             # Repository instructions for coding agents
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and npm scripts
└── tsconfig.json         # TypeScript configuration
```

## Environment variables

No environment variables are required by the current application.

Future integrations with Cloudflare, Sanity, authentication, or other services
will require a documented environment-variable contract and approved secret
storage. When that happens, provide a safe example file containing names and
non-secret placeholders only.

Never commit:

- Passwords or recovery codes
- API tokens or private keys
- Cloudflare credentials
- Sanity write tokens
- Production database exports
- Private athlete, participant, or submission data
- Identity documents, waivers, signatures, or private addresses

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

Production deployment is not configured.

Cloudflare Workers is the planned deployment target, but no Cloudflare adapter,
bindings, environments, or deployment workflow has been added. Compatibility
between the selected adapter and the project's Next.js features must be
verified before production deployment. Do not interpret a successful local
Next.js build as confirmation that the application is ready for Cloudflare.

## Security reporting

Do not report suspected vulnerabilities, exposed credentials, or privacy
incidents in a public issue.

Report security and privacy concerns privately by emailing
[security@calicentral.com](mailto:security@calicentral.com). Do not include
unnecessary personal data, production records, credentials, or identity
documents in the report.

General security guidance is maintained in
[`docs/security`](docs/security/README.md).

## Roadmap summary

Development is expected to proceed in controlled milestones:

1. Build a branded, responsive, public read-only foundation using local sample
   data.
2. Define platform architecture, service boundaries, content models, data
   ownership, permissions, and operational policies.
3. Integrate editorial content and media services after their architecture
   decisions and schemas are approved.
4. Add competition listings, athlete profiles, verified results, and rankings
   with documented provenance and correction workflows.
5. Introduce public accounts, submissions, moderation, and administrative tools
   only after authentication, authorization, privacy, retention, and audit
   requirements are established.
6. Validate and configure Cloudflare deployment, automated checks, monitoring,
   and production operations.

Detailed roadmap and feature requirements belong in
[`docs/product`](docs/product/README.md). Legal drafts require review by a
qualified attorney before production use.
