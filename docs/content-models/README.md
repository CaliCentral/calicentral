# Content Models

This directory records CMS and application data-model responsibilities.

Registered Sanity models:

- Article
- Video
- Athlete
- Competition standing (`rankingCategory` is retained as the dataset type name)
- Competition
- Team and historical team season roster
- Organization and ruleset metadata
- Ranking provider, athlete ranking system, and dated ranking snapshot
- Private external athlete and competition identity mappings
- Structured sporting result
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
They also cover reusable sporting provenance, typed measurements and result
performances, public team branding/social links, consented historical roster
relationships, WCL equipment determinations, and private team-application
roster intake.

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
