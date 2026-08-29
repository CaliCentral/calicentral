# Approved data owner guide

This is the owner/editor workflow for adding real sports data without editing
application source code. Importers never crawl a provider and never publish a
record automatically.

## 1. Register and approve the source

Edit `data/imports/source-registry.json`. Every manifest uses a stable
`sourceId` from this registry. New sources begin as `unreviewed` or
`review-pending`. Only use `approved-manual-import`, `approved-api`, or
`approved-feed` when you possess real evidence covering the listed data types.

An approved entry must include `approvalBasis`, `approvalReference`,
`approvedBy`, and `approvedAt`. These fields describe actual permission or a
licensed/authorized dataset; never fill them with placeholder text. `denied`
and `expired` sources cannot be written.

```bash
npm run test:source-registry
```

Official Streetlifting remains `review-pending` until legitimate reuse/storage
approval is recorded. Public web access is not approval.

## 2. Copy the right template

Templates:

```text
data/imports/templates/athletes-ranking-template.json
data/imports/templates/competition-template.json
data/imports/templates/organization-template.json
```

Copy—not move—the appropriate template into:

```text
data/imports/official-streetlifting/
data/imports/competitions/
data/imports/organizations/
```

Use a dated descriptive filename. Replace every `replace-with-...` and
`YYYY-MM-DD` value. Remove optional fields the source does not support. Do not
use a search snippet or memory as canonical data.

## 3. Validate locally

```bash
npm run sanity:import:official-streetlifting -- \
  --validate \
  --input=data/imports/official-streetlifting/YOUR-FILE.json

npm run sanity:import:competitions -- \
  --validate \
  --input=data/imports/competitions/YOUR-FILE.json

npm run sanity:import:organizations -- \
  --validate \
  --input=data/imports/organizations/YOUR-FILE.json
```

Run only the command matching your file. Local validation performs no Sanity
access and no mutation. Fix every error before continuing.

## 4. Run the authenticated dry run

Run the same command without `--validate`. It checks the private production
dataset, deterministic IDs, exact identities, collisions, drafts/releases,
source approval, and bounded batches. It still performs zero writes.

```bash
npm run sanity:import:official-streetlifting -- \
  --input=data/imports/official-streetlifting/YOUR-FILE.json

npm run sanity:import:competitions -- \
  --input=data/imports/competitions/YOUR-FILE.json

npm run sanity:import:organizations -- \
  --input=data/imports/organizations/YOUR-FILE.json
```

Review the JSON and Markdown reports under `.tmp/`. Do not proceed when a
write blocker remains.

## 5. Perform an approved create

Use only the confirmation for the data type being written. Confirmations are
temporary shell values; never save them in `.env` or commit them.

```bash
CONFIRM_OSL_IMPORT=YES npm run sanity:import:official-streetlifting -- \
  --write \
  --input=data/imports/official-streetlifting/YOUR-FILE.json

CONFIRM_COMPETITION_IMPORT=YES npm run sanity:import:competitions -- \
  --write \
  --input=data/imports/competitions/YOUR-FILE.json

CONFIRM_ORGANIZATION_IMPORT=YES npm run sanity:import:organizations -- \
  --write \
  --input=data/imports/organizations/YOUR-FILE.json
```

Run only the approved command. The importers use bounded atomic creates and
refuse incompatible existing records. New records remain internal/draft until
separate editorial review.

## 6. Refresh next week or month

Create a new dated manifest for a new observation. Never overwrite an older
ranking snapshot to represent a newer date. Recommended editorial cadence:

- rankings and upcoming competitions: weekly;
- athlete directory and organizations: monthly;
- completed historical events: monthly or less frequently.

Repeat registry validation, local validation, dry run, report review, and the
explicitly confirmed create. The full checklist is in
[`production-data-refresh.md`](production-data-refresh.md).

## 7. Stop or recover safely

If validation or dry run fails, stop. Nothing has been written. Do not use
`--force`, change deterministic IDs, or weaken a visibility gate.

If a later bounded batch fails after earlier batches committed, stop and keep
the `.tmp` report listing created IDs. A fresh dry run recognizes compatible
created records and shows what remains. Do not delete or overwrite records to
"make the import pass"; have an editor review the exact IDs and source facts.

Sample deletion is a separate destructive workflow and is never authorized by
an import confirmation.
