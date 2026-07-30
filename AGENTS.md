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
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Sanity CMS
- GitHub Actions

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

```bash
npm ci
