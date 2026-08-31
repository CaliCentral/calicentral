# Athlete ranking system

`/rankings` is the athlete-oriented, provider-attributed ranking archive.
`/standings` remains the competition/team/league standings surface. The two
routes do not share authority or imply a universal Cali Central world rank.

## Canonical model

Sanity owns `organization`, `rankingProvider`, `rankingSystem`,
`rankingSnapshot`, and the private `externalAthleteIdentity` mapping. A system
defines provider, discipline, source-defined division/weight/sex/age fields,
scope, methodology version, and ranking kind. A snapshot freezes its effective
date, source publication/check dates, entries, and provenance. Historical
snapshots are new documents; they are not silently overwritten.

The Supabase model additionally stores `external_system_key`, `source_url`,
`lift_format`, `equipment`, and `methodology_category` on each external
system. Matching is provider plus those structured dimensions; a title is
never an identity key. Outcomes are `EXACT_MATCH`,
`EXTERNAL_ONLY_NEW_SYSTEM`, `AMBIGUOUS_REVIEW`, `UNSUPPORTED`, or `UNKNOWN`.
Ambiguity is retained in `ranking_system_match_reviews` rather than guessed.

External entries use the provider result/row ID as their stable identity. An
athlete may legitimately have more than one source row in a ranking. When a
canonical athlete link is unresolved, `provider_athlete_id` and
`source_display_name` remain on the entry and the public UI labels the row as
pending identity review. Repeated unchanged source content reuses one snapshot;
a changed source hash creates a new historical snapshot. Public history derives
previous position by canonical athlete ID or stable external athlete ID.

Every normalized provider, snapshot, and entry exposes a stable canonical ID.
Names and slugs remain presentation. External identities retain provider IDs,
URLs, display names, aliases, matching state, and private review notes. Never
merge athletes by name alone. Unmatched snapshot entries preserve their source
display name without creating a false canonical athlete link.

The protected admin review path uses a separate query, data-transfer type, and
normalizer from the public path. It may show draft lifecycle values and
under-review providers, but does not project private identity notes, source
policy notes, or snapshot editorial notes. Public filters and the active-source
normalizer must not be reused or relaxed for admin convenience.

## Publication boundary

Public ranking queries are bounded and require all of the following:

- snapshot `publicationStatus == published`;
- source verification of `source-confirmed` or `official`;
- a valid public HTTP(S) source URL;
- `EXTERNAL_RANKINGS_ENABLED=true`.

The application never scrapes a provider, fetches an arbitrary submitted URL,
or calls a third party during page render. Empty or disabled data renders an
honest empty state. Athlete pages show only entries linked to the canonical
athlete and label the provider beside every position.

## Authority language

Provider authority must precede the position, for example “Provider name —
World #12.” Profile control, editorial profile review, result-source review,
ranking-provider authority, and WCL eligibility are separate states.

Provider-specific offline import review is documented in
[`official-streetlifting-import.md`](official-streetlifting-import.md). It
feeds the provider-neutral model through a local manifest and is dry-run only
unless independent import and deletion confirmations are supplied.
