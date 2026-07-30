# ADR 0001: Use Next.js

- Status: Accepted
- Date: 2026-07-30

## Context

Cali Central requires public media pages, athlete profiles, rankings,
competition listings, affiliate pages, account dashboards, and administrative
tools.

## Decision

Use Next.js with TypeScript and the App Router as the primary web framework.

## Reasons

- Supports server-rendered public pages
- Supports dynamic application features
- Provides strong routing and metadata capabilities
- Works with the planned Cloudflare deployment
- Supports gradual development by feature

## Consequences

The project must follow Next.js conventions and verify compatibility with the
selected Cloudflare adapter before production deployment.
