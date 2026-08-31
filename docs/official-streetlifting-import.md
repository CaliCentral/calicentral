# Official Streetlifting import review

This integration is intentionally **manual and under review**. A follow-up
review on August 30, 2026 confirmed that the public Official Streetlifting
site is a Rails/Hotwire application with server-rendered competition, result,
athlete, record, and ranking pages. Standard `Accept: application/json`
negotiation on a ranking page returned an error rather than a public data API.
No documented API, export, licensed feed, or machine-use agreement was found.
`robots.txt` contains two sitemap declarations and no allow/disallow rules,
but that is discovery metadata rather than reuse permission. Do not activate
an autonomous crawler unless Official Streetlifting authorizes it and its
access, attribution, rate-limit, and retention terms are recorded here.

The provider-neutral deterministic adapter now lives in
`lib/data-ops/providers/official-streetlifting.ts`. It accepts only reviewed
public routes on the exact rankings origin, refuses redirects and non-HTML or
oversized responses, uses a transparent user agent and timeout, records a
SHA-256 content identity plus parser version, and parses stable athlete,
competition, and result URLs rather than matching people by name. Its fetch
function is not scheduled and does not write to any database.

## Reviewed ranking inputs

The reviewed local input is:

```text
data/imports/official-streetlifting/2026-08-11-male-all4-minus-101kg.json
```

It is a manual transcription of one provider table. It contains the top eight
Male All4 -101kg World entries plus Abu Asada at provider position 17. Each row
keeps the provider URL/slug, provider display name, source country, ordinal
position, and observed kilogram total. Kilograms remain manifest performance
data; they are never mapped to ranking `points` or `rating`.

Additional reviewed ranking observations can be supplied incrementally without
creating one giant file. Repeat `--input` for explicit files, or point
`--input-dir` at a directory containing only versioned Official Streetlifting
ranking manifests:

```bash
npx sanity exec scripts/import-official-streetlifting.ts -- \
  --input=data/imports/official-streetlifting/rankings-2026-08-11-a.json \
  --input=data/imports/official-streetlifting/rankings-2026-08-11-b.json

npx sanity exec scripts/import-official-streetlifting.ts -- \
  --input-dir=data/imports/official-streetlifting/reviewed-rankings
```

Directory discovery is intentionally non-recursive and accepts JSON files
only. File count, file size, row count, snapshot count, and unique-athlete
count are capped; inputs are sorted and deduplicated before parsing. Each file is
validated independently, then athlete identity facts, deterministic ranking
systems, and historical snapshot IDs are checked for conflicts across the
whole set. Repeated athletes are allowed across snapshots only when their exact
provider identity, URL, display name, country, and explicit canonical mapping
agree. Position and manifest-only performance may change between snapshots.

The original nine-row file retains an additional exact fixture guard for its
reviewed system metadata, rows, positions, kilogram values, timestamp, and Abu
mapping. Other files use the same provider/system-aware safety rules but are
not silently treated as that fixed observation.

For every manifest, the ranking-system slug and canonical ID are derived from
the provider, sex division, category, geographic scope, and weight class, so a
file cannot reuse an ID while changing those dimensions. Country names must
resolve through Cali Central's canonical geography list. Two-letter codes are
checked directly; provider three-letter codes require an explicit reviewed
mapping in the importer and unknown mappings fail closed.

The provider page does not publish a clear ranking-effective date. The input
therefore declares an observation-date policy: `rankingDate` is the date the
table was checked, `checkedAt` retains the timestamp, and `sourcePublishedAt`
is omitted. Do not use sitemap `lastmod` as a ranking date.

## Run the review

VS CODE TERMINAL

```bash
npx sanity exec scripts/import-official-streetlifting.ts
```

For local parsing, relationship checks, cross-file deduplication, and manifest
generation without constructing a Sanity client, use:

```bash
npx sanity exec scripts/import-official-streetlifting.ts -- --validate
```

The script validates and writes the local manifest before making any Sanity
request. It then performs read-only identity matching, idempotency checks,
an authenticated dataset-ACL check, a direct token-free document-count check,
raw-perspective draft/release collision checks, and sample-reference
inspection. Live reads use bounded ID batches, bounded page sizes, and bounded
concurrency; the importer does not load every athlete or identity merely to
plan the reviewed set. Generated
review artifacts are ignored under `.tmp/`:

```text
.tmp/official-streetlifting-athletes.json
.tmp/official-streetlifting-import-report.json
.tmp/official-streetlifting-import-report.md
.tmp/official-streetlifting-sample-cleanup.json
.tmp/official-streetlifting-sample-cleanup.md
```

Default execution performs zero mutations and zero deletions. It never fetches
Official Streetlifting during the run.

## Identity and publication boundaries

Matching is only by exact ranking provider plus `providerAthleteId`, followed
by an explicit editorial mapping when one is present. Names are never identity
keys. In particular, `bikai-christian-kevin` and
`christian-kevin-bikai` remain distinct provider records.

Abu's exact provider identity must resolve to `athlete.abu-asada`. A reviewed
input bundle may omit Abu (for example, a Female or different weight-class
snapshot); if it includes Abu, the bundle-local source and planned match counts
must each be exactly one with the explicit canonical mapping. Authenticated
preflight always fetches Abu independently of the selected inputs and requires
exactly one live canonical athlete and one exact live external identity. Any
live-count, variant, ID, or reference mismatch aborts the plan. New canonical
athletes use deterministic IDs and are
created only with source-supported or internal lifecycle fields:

- `verification.identityStatus = unverified`;
- `verification.profileStatus = not-reviewed`;
- `rankingEligible = false`;
- no prototype marker;
- no biography, city, social links, photo, team, organization, or personal
  records.

The `prototypeStatus` athlete field is optional specifically so a real internal
record cannot inherit the public `sample-record` gate. Provider, system,
snapshot, profile review, external match, and account-control statuses remain
independent.

An existing provider identity or explicit editorial mapping is rejected when
its target athlete is marked `sample-record`, `fictional-prototype`, or
`not-official`. Importing a real provider record never silently converts or
adopts a non-production athlete.

## Mutation gates

Do not use either mutation mode while reviewing the generated reports. Import
writes require both:

```text
--write
CONFIRM_OSL_IMPORT=YES
```

Sample deletion is a separate operation and requires:

```text
--delete-samples
CONFIRM_DELETE_SAMPLE_ATHLETES=YES
```

The two mutation modes are mutually exclusive. A successful full preflight
proposes only absent deterministic IDs, then uses bounded atomic create
transactions so a concurrent ID collision fails instead of being silently
accepted. Ranking systems are created first, athlete/identity pairs are never
split across batches, and snapshots are created last. If a later batch fails,
the completed batch IDs are persisted in the report; a repeat run performs a
fresh full preflight, recognizes those deterministic records, and resumes
without overwriting an editorially enriched athlete. The script refuses to delete
`athlete.abu-asada`, refuses every non-`sample-record` candidate, refuses
draft/release ambiguity, and uses a mutation-time query that selects only
still-unreferenced sample records.

Cleanup reference discovery is also ID-batched and paged. Candidate discovery
includes every athlete explicitly marked `sample-record`,
`fictional-prototype`, or `not-official`. The latter two statuses are always
report-only and non-deletable; the existing guarded deletion path remains
restricted to `sample-record`. Every reference in the cleanup artifact includes
one of the required sample/prototype, real, site-configuration, or
unknown/review classifications plus a remediation instruction. Absence of an
explicit content marker remains unknown rather than being guessed from a title
or name.

## Competition inputs

Competition ingestion is a separate provider-neutral reviewed-data contract;
ranking manifests are not accepted as competition data and `--input-dir`
should not mix the two formats. The separate
[`import-reviewed-competitions.ts`](../scripts/import-reviewed-competitions.ts)
workflow is documented in
[`reviewed-competition-import.md`](reviewed-competition-import.md). It supports
source-only records with internal reviewed keys as well as optional exact
provider identities when the source actually exposes them. No competition
facts or example records are inferred from ranking data.

Before any future write, all reported blockers must be resolved. In particular,
the unified dataset must report a private ACL and direct token-free queries
must expose no operational or internal documents. Source/reuse approval must
also be recorded; the current manual source review is not provider
authorization.

Weekly ranking refreshes and monthly athlete-directory reviews use this same
versioned-manifest workflow. The complete operating checklist, confirmation
boundaries, post-write verification, and rollback stop conditions are in
[`production-data-refresh.md`](production-data-refresh.md). A refresh never
changes profile approval merely because a ranking source was confirmed.

## Supabase ranking and discovery rehearsal

The Supabase-native workflow inventories the live public taxonomy and walks
pagination without writing:

```bash
npm run rehearse:official-streetlifting
```

For the host-locked, read-only preview matching plan and a local ignored cache:

```bash
npm run rehearse:official-streetlifting:preview -- --cache-dir=.tmp/osl-live
```

The generated `input-manifest.json` can be imported only into the loopback
Supabase stack with both local write flags:

```bash
npm run import:official-streetlifting:supabase -- \
  --input-manifest=.tmp/osl-live/input-manifest.json \
  --observed-on=YYYY-MM-DD \
  --write \
  --confirm-local-import
```

The live inventory observed on 2026-08-30 exposed 26 stable categories: four
supported absolute tables (Female/Male × All4/2-lift), 12 weight-class record
tables, eight division record tables, and two all-time world-record pages. The
22 record surfaces remain `UNSUPPORTED` until dedicated deterministic parsers
exist; they are not forced through the ranking-table parser. The four absolute
tables traversed 148 HTTP pages but normalized to four content-addressed
snapshots. The source returns page 1 for an out-of-range ranking page, so the
rehearsal explicitly detects and discards that pagination reset.

Display-name accents vary for a small number of stable athlete IDs. Those
variants remain row-level evidence and review warnings; the external ID alone
anchors identity. Ranking rows use source result IDs because the same athlete
can legitimately appear more than once in a source table. Repeated imports page
all existing identities instead of relying on Supabase's default 1,000-row
response cap.

The read-only hosted preview inventory currently contains five legacy draft
ranking systems. Four are plausible counterparts for the four supported
absolute source tables, but they encode the lift format in `category` and omit
the source methodology, equipment, and category dimensions. They must remain
`AMBIGUOUS_REVIEW` until an editor confirms and backfills those dimensions;
the importer must neither force-match them nor create duplicates. The fifth
legacy system is Male All4 -101kg and is not a candidate for the absolute
Male All4 table. No hosted ranking mutation is approved while this review is
open.
