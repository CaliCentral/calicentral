# AGENTS.md

## Project

Cali Central is a global calisthenics media and competition platform.

The platform will include:

- News and editorial content
- Video pages
- Athlete accounts and public profiles
- Verified statistics and rankings
- Worldwide competition listings
- Affiliate registration, ticket, and livestream links
- Cali Central-owned competitions
- Public user accounts
- Content submissions
- Administrative and moderation tools

## Technology

Use the following unless an approved architecture decision says otherwise:

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- Vercel
- Supabase PostgreSQL and Auth
- Cloudflare R2 for large media objects
- GitHub Actions

Sanity, Cloudflare D1, Auth.js, and the Workers/OpenNext runtime are legacy
migration sources. Preserve them until the equivalence gates in ADR 0003 pass.

Do not introduce a new framework, database, CMS, authentication provider, or
paid dependency without documenting the reason.

## Working Rules

Before changing code:

1. Read this file.
2. Read the root `README.md`.
3. Review relevant files under `docs/`.
4. Inspect existing code and package scripts.
5. State assumptions when requirements are unclear.
6. Prefer small, reviewable changes over large unrelated rewrites.

Do not delete or substantially rewrite unrelated code.

## Installation

Use the package manager identified by the repository lockfile.

Expected command when npm is in use:

VS CODE TERMINAL

```bash
npm ci
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
