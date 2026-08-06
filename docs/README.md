# Cali Central Documentation

This directory contains technical, product, legal, security, and content-model
documentation for the Cali Central platform.

## Sections

- `architecture/` — system structure, services, integrations, and data flow
- `decisions/` — architecture decision records
- `legal/` — working legal drafts requiring professional review
- `content-models/` — Sanity and database model documentation
- `security/` — security practices that are safe to store in the repository
- `product/` — feature requirements, phases, and launch checklists

## Production operations

- [Production deployment](production-deployment.md) — Workers/OpenNext,
  workerd preview, manual deployment, custom domain, and Workers Builds
- [Production environment](production-environment.md) — build variables,
  runtime values, secrets, stages, and rotation
- [Launch checklist](launch-checklist.md) — code, content, account-side, domain,
  and complete smoke gates
- [Security operations](security-operations.md) — data privacy, authentication,
  headers, rate limits, logging, incidents, and retention
- [Rollback and recovery](rollback-and-recovery.md) — Worker, DNS, secrets,
  OAuth, and Sanity recovery

Do not store passwords, API tokens, private athlete records, identity documents,
waivers, private submissions, or production customer data in this repository.
