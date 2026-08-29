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

- [P4 daily athlete utility readiness](p4-production-readiness.md)
- [Athlete ranking system](athlete-ranking-system.md)
- [Official Streetlifting import review](official-streetlifting-import.md)
- [Reviewed competition import](reviewed-competition-import.md)
- [Production data refresh](production-data-refresh.md)
- [Approved data owner guide](approved-data-owner-guide.md)
- [Team system](team-system.md)
- [Community system](community-system.md)
- [WCL rules engine](wcl-rules-engine.md)
- [Data provenance](data-provenance.md)
- [Community database](community-database.md)

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
