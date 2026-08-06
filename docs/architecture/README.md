# Architecture Documentation

The production application is a full-stack Next.js App Router Worker. See the
accepted [Cloudflare Workers decision](../decisions/0002-use-cloudflare-workers.md)
and the [production deployment runbook](../production-deployment.md).

Architecture subjects:

- Next.js application structure
- Cloudflare Workers/OpenNext deployment
- Sanity CMS integration
- Authentication and authorization
- Affiliate-link tracking
- Competition directory
- Athlete profiles and rankings
- Admin and moderation systems

Cloudflare D1 and R2 are intentionally absent: Sanity owns current content and
operational records, and no direct file-upload pipeline exists. Adding either
service requires a concrete responsibility and architecture decision.
