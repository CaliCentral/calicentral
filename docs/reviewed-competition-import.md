# Reviewed competition import

Competition ingestion uses strict, provider-neutral JSON manifests prepared by
an editor. The importer reads local files only. It does not crawl a provider,
preview a URL, infer missing facts, create an organizer, publish a record, or
derive competitions from ranking data.

`rankingSnapshot.sourceCompetitions` is an optional, source-established
relationship. This importer never edits a ranking snapshot or infers that link;
it remains absent unless a separately reviewed input and workflow explicitly
support the relationship.

## Source-only and provider-backed records

Every competition has a stable editorial `reviewedKey`. That supports official
organizer pages and event calendars that expose no external record ID. A
source-only record creates no `externalCompetitionIdentity` and does not
populate `externalProviderId`.

When a source really supplies a stable competition ID, the manifest may also
declare an existing `rankingProvider` plus `providerCompetitionId`. That branch
matches only on the exact provider reference and provider competition ID. A
name is always a display fact, never an identity key. The importer never
creates a provider; the referenced provider must already exist and agree with
the reviewed metadata.

## Manifest contract

Each non-recursive JSON input uses schema version 1 and
`collectionMethod: "manual-editorial"`:

```json
{
  "schemaVersion": 1,
  "kind": "competitions",
  "collectionMethod": "manual-editorial",
  "sourceRights": {
    "reviewStatus": "review-pending",
    "automatedCollectionAllowed": false,
    "notes": "Record the reuse review; a public page alone is not permission."
  },
  "source": {
    "sourceTitle": "Organizer event calendar",
    "sourceType": "organizer-source",
    "sourceUrl": "https://organizer.example/events",
    "checkedAt": "2026-08-11T12:00:00Z",
    "verificationStatus": "unverified"
  },
  "competitions": [
    {
      "reviewedKey": "organizer-event-2026",
      "name": "Organizer Event 2026",
      "startDate": "2026-10-03",
      "country": "US",
      "disciplines": ["streetlifting"],
      "primaryDiscipline": "streetlifting"
    }
  ]
}
```

`provider` is optional. If used, it has this shape, and an entry may add a
source-supported `providerCompetitionId`, `providerCompetitionUrl`, and
`providerDisplayName`:

```json
{
  "canonicalId": "rankingProvider.example-provider",
  "slug": "example-provider",
  "name": "Example Provider",
  "website": "https://provider.example/",
  "integrationMethod": "manual",
  "status": "under-review"
}
```

Optional competition facts are limited to source-supported end date, status,
location, venue, organizer label, existing canonical organization reference,
disciplines, primary discipline, format, and registration, official-site,
results, or livestream URLs. Per-entry `sourceTitle` and `sourceUrl` may
override a manifest-level index page when an event has its own official page.
Unknown facts stay absent. `organizationId` must
reference an existing, unambiguous canonical organization; the importer never
creates one from a label.

An approved source-rights block must include `reviewStatus: "approved"`, an
`approvalReference`, and `approvedAt`. A write also requires the source facts
to be `source-confirmed` or `official`. Approval of reuse and confirmation of
facts remain separate review decisions.

## Validate and review

The default directory is `data/imports/competitions`. It may be absent or
empty while no reviewed inputs exist. Directory discovery is non-recursive,
JSON-only, sorted, deduplicated, and capped. A ranking manifest fails the
competition schema instead of being silently mixed into the run.

Local validation constructs no Sanity client:

```bash
npx sanity exec scripts/import-reviewed-competitions.ts -- --validate
```

Use repeated `--input` values or one `--input-dir` for incremental sets:

```bash
npx sanity exec scripts/import-reviewed-competitions.ts -- \
  --validate \
  --input=data/imports/competitions/reviewed-a.json \
  --input=data/imports/competitions/reviewed-b.json

npx sanity exec scripts/import-reviewed-competitions.ts -- \
  --input-dir=data/imports/competitions/reviewed
```

Without `--validate`, execution is still a zero-mutation dry run. It performs
bounded, raw-perspective reads to verify provider and organization references,
exact external identities, canonical IDs, deterministic slugs, and published,
draft, and release variants. It also verifies a private dataset ACL with a
direct token-free query before any write can proceed. Existing records are
never patched or replaced. A rerun accepts editorially added fields, but every
fact present in the reviewed manifest must remain compatible with an existing
deterministic record, including provenance and action URLs.

Generated review artifacts are ignored under `.tmp/`:

```text
.tmp/reviewed-competition-import-plan.json
.tmp/reviewed-competition-import-report.json
.tmp/reviewed-competition-import-report.md
```

## Mutation boundary

Every new canonical record uses `contentStatus: "published-record"` and
`publicStatus: "draft"`. It includes provenance and only manifest-supported
facts. Provider-backed identity records remain `candidate` / `not-reviewed`.
Neither state publishes or verifies the competition.

After the reports, source rights, target dataset, and proposed documents have
been independently reviewed, an authorized operator may explicitly request
creates:

```bash
CONFIRM_COMPETITION_IMPORT=YES \
SANITY_API_WRITE_TOKEN=your-server-only-editor-token \
npx sanity exec scripts/import-reviewed-competitions.ts -- \
  --write \
  --input=data/imports/competitions/reviewed.json
```

Official Streetlifting inputs additionally require
`CONFIRM_OSL_IMPORT=YES`. This second confirmation does not replace documented
source/reuse approval.

Writes use bounded atomic `create` transactions. A new competition and all of
its proposed external identities stay in the same create unit; a collision
fails rather than overwriting editorial work. Completed batch IDs are persisted
after each transaction so a later failure can be reviewed before a fresh,
idempotent preflight. The importer has no update, publish, or delete path.

Use the weekly competition checklist in
[`production-data-refresh.md`](production-data-refresh.md) for versioning,
validation, rights review, explicit confirmation, and post-write inventory.
Competition refreshes remain local-manifest driven and never infer missing
events from rankings or provider pages.
