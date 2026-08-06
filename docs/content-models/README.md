# Content Models

This directory records CMS and application data-model responsibilities.

Registered Sanity models:

- Article
- Video
- Athlete
- Competition standing (`rankingCategory` is retained as the dataset type name)
- Competition
- Submission
- Contributor profile
- Audit event
- Author
- Video series
- Site settings
- Internal contributor identity claim
- Internal operational lock

Structured objects within those documents cover athlete statistics and
achievements, competition schedules/divisions/participants/results, standing
entries and verified result sources, competition action links, supporting
links, editorial notes, Portable Text, accessibility, and SEO fields.

Public standings are limited to competition scope. Publication requires an
approved methodology, a season label, and verified public result provenance
for every entry. Country standings remain unavailable until a separate
eligibility and points methodology is approved.

Competition results separate public provenance (verification status, source,
ruleset, category/division, optional bodyweight and evidence video) from
private verification notes, evidence URLs, and reviewer identity. Sample
results never qualify for the verified-results archive. Public action links
support registration, tickets, official sites, results, maps, livestreams,
and organizer social profiles; affiliate actions require a visible partner
and disclosure.

Each model document should describe:

- Purpose
- Public fields
- Private fields
- Required fields
- Relationships
- Validation rules
- Permissions
- Retention requirements
