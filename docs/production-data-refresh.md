# Production data refresh

Cali Central refreshes sports data from versioned, editor-reviewed local
manifests. Runtime pages never call a ranking provider or event source. The
operating sequence is:

```text
authorized source update
→ reviewed manifest
→ local validation
→ authenticated dry run
→ editorial and rights review
→ explicitly confirmed bounded create
→ post-write validation
→ Sanity-backed public and admin views
```

Public availability is a separate editorial decision. A source-confirmed
ranking does not approve an athlete profile, activate a provider or ranking
system, publish a snapshot, or publish a competition.

## Before every refresh

1. Add a new dated JSON manifest under the appropriate `data/imports/`
   directory. Never edit an older observation to represent a new date.
2. Record only facts supported by the reviewed source. Keep missing fields
   absent and never map performance kilograms to points, rating, or score.
3. Record source-rights status honestly. A public page is not authorization.
   Pending or incomplete approval makes the batch ineligible for writes.
4. Run local validation, then the authenticated dry run. Review every proposed
   deterministic ID, exact provider identity match, collision, and blocker.
5. Generate the production inventory:

   ```bash
   npm run sanity:report:production-readiness
   ```

6. Stop if Abu's canonical athlete or exact Official Streetlifting identity is
   not unique, if his stored #17 observation disappeared unexpectedly, if the
   dataset is not private, or if anonymous reads expose documents.

## Weekly ranking refresh

1. Add one or more new dated Official Streetlifting ranking manifests. Each
   distinct provider/system/date remains a distinct historical snapshot.
2. Validate without constructing a Sanity client:

   ```bash
   npm run sanity:import:official-streetlifting -- --validate
   ```

3. Run the default authenticated dry run and review the JSON and Markdown
   artifacts under `.tmp/`.
4. Only when the manifest records approved source rights and the dry run has no
   blockers may an authorized operator use both `--write` and
   `CONFIRM_OSL_IMPORT=YES`. Never place the confirmation in committed files.
5. Re-run the dry run after the create. Identical deterministic records must be
   repeat-idempotent; incompatible collisions require manual review.

Provider activation, system activation, snapshot publication, and athlete
profile approval remain separate editor operations.

## Weekly competition refresh

1. Add organizer/federation-reviewed manifests under
   `data/imports/competitions/`. Prefer authoritative event records and stable
   source IDs; otherwise use the reviewed source key contract.
2. Run local validation:

   ```bash
   npm run sanity:import:competitions -- --validate
   ```

3. Run a default dry run for non-empty inputs and review identity, canonical
   organization, source, slug, variant, and collision checks.
4. A create requires complete approval evidence, confirmed/official source
   facts, `--write`, and `CONFIRM_COMPETITION_IMPORT=YES`. Official
   Streetlifting competition data also requires `CONFIRM_OSL_IMPORT=YES`.
5. New competitions remain internal drafts. Publication and any relationship
   to a ranking snapshot require separate source-supported editorial review.

The importer never creates an organization from an ambiguous organizer label.

## Monthly organization refresh

1. Add a source-approved manifest under `data/imports/organizations/` using
   the owner template. Reuse a reviewed canonical ID only when the manifest
   explicitly supplies it; a similar name is not identity evidence.
2. Validate and dry-run separately:

   ```bash
   npm run sanity:import:organizations -- --validate
   npm run sanity:import:organizations
   ```

3. Review deterministic IDs, slugs, raw draft/release variants, country codes,
   source approval, and existing-record compatibility. The importer creates no
   competition relationship automatically.
4. An authorized create additionally requires `--write` and
   `CONFIRM_ORGANIZATION_IMPORT=YES`. Public publication remains a separate
   editorial action.

## Monthly athlete-directory review

1. Aggregate the latest eligible reviewed ranking manifests and dry-run them
   together to detect cross-file identity conflicts.
2. Match exact provider plus provider-athlete ID first. Never merge by name.
3. Review newly created internal profiles in `/admin/athletes`. External-source
   records remain `not-reviewed`, unclaimed, and ranking-ineligible by default.
4. Approve a public profile only through the existing editorial workflow and
   only when the profile itself has sufficient reviewed content. Ranking-source
   confirmation alone is insufficient.
5. Re-run the production report and verify the real share of `/athletes` and
   `/competitions` without weakening their visibility predicates.

## Sample-content cleanup

Sample cleanup is not part of an import confirmation. It requires a fresh
inbound-reference audit, appropriate real public replacements, resolved Site
settings, no provider identity dependency, zero broken references, and the
separate cleanup confirmation required by the cleanup tool. If no eligible
replacement exists, retain the sample graph or use an existing empty state;
never point public configuration at hidden content.

The generated `.tmp/sample-replacement-queue.{json,md}` prioritizes Site
settings dependencies and records the real replacement each public sample
needs. It is an editorial queue, not deletion approval.

## Post-write verification

After any authorized create, run typecheck, lint, ranking and competition
validation, the full test suite, `git diff --check`, live Sanity document
validation, the importer dry run, and the production-readiness report. Record
the exact created IDs and final counts. Stop before publication if duplicates,
broken references, unexpected public records, or lifecycle changes appear.
