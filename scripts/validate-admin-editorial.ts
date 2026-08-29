import assert from "node:assert/strict";

import {
  addRankingEntrySchema,
  createAthleteSchema,
  createCompetitionSchema,
  createOrganizationSchema,
  createProvenanceSchema,
  createRankingProviderSchema,
  createRankingSystemSchema,
  createSourceRecordSchema,
  createSportingResultSchema,
  transitionEditorialSchema,
  updateAthleteSchema,
} from "@/lib/supabase/admin-validation";

function validateAthleteSchemaAcceptsAWellFormedRecord() {
  const parsed = createAthleteSchema.safeParse({
    permanentId: "athlete.permanent.1",
    slug: "test-athlete",
    name: "Test Athlete",
    displayName: "",
    biography: "",
    country: "US",
    administrativeArea: "",
    city: "",
    disciplines: "street,freestyle",
    specialties: "",
    identityState: "unconfirmed",
    editorialState: "draft",
  });
  assert.equal(parsed.success, true, "a well-formed athlete create input must parse");
  if (parsed.success) {
    assert.deepEqual(parsed.data.disciplines, ["street", "freestyle"], "the comma-separated disciplines field must split into a trimmed array");
  }
}

function validateAthleteSchemaRejectsAnInvalidSlugAndState() {
  const badSlug = createAthleteSchema.safeParse({
    permanentId: "athlete.permanent.2", slug: "Not A Slug", name: "X",
    disciplines: "", specialties: "", identityState: "unconfirmed", editorialState: "draft",
  });
  assert.equal(badSlug.success, false, "a slug with spaces/uppercase must be rejected");

  const badState = createAthleteSchema.safeParse({
    permanentId: "athlete.permanent.3", slug: "valid-slug", name: "X",
    disciplines: "", specialties: "", identityState: "made-up-state", editorialState: "draft",
  });
  assert.equal(badState.success, false, "an identityState outside the schema's enum must be rejected, matching the athletes_identity_state_check constraint");
}

function validateUpdateAthleteSchemaHasNoNameBasedMergeField() {
  // There is deliberately no "mergeWithAthleteId" or "matchByName" field
  // anywhere in this schema -- athlete identity must never be merged by name
  // alone (see docs/data-provenance.md). This assertion exists so a future
  // edit that adds such a field breaks a test, forcing a conscious decision
  // rather than a silent regression.
  const shape = Object.keys(updateAthleteSchema.shape);
  assert.equal(shape.some((key) => /merge|matchByName/i.test(key)), false, "no merge-by-name-style field must ever be added to the athlete update schema");
}

function validateOrganizationAndCompetitionEnums() {
  const badOrg = createOrganizationSchema.safeParse({ slug: "valid-slug", name: "Org", reviewState: "not-a-state" });
  assert.equal(badOrg.success, false, "an invalid organization reviewState must be rejected");

  const goodCompetition = createCompetitionSchema.safeParse({
    permanentId: "competition.permanent.1", slug: "valid-comp", name: "Comp", status: "scheduled",
    disciplines: "strength", publicState: "draft",
  });
  assert.equal(goodCompetition.success, true, "a minimal valid competition create input must parse");
}

function validateRankingSchemas() {
  const badProvider = createRankingProviderSchema.safeParse({
    slug: "valid-slug", name: "Provider", integrationMethod: "carrier-pigeon", attributionRequirement: "Credit required",
  });
  assert.equal(badProvider.success, false, "an integrationMethod outside the enum must be rejected");

  const goodSystem = createRankingSystemSchema.safeParse({
    providerId: "00000000-0000-4000-8000-000000000001", slug: "valid-system", name: "System",
    rankingKind: "points", discipline: "freestyle", geographicScope: "global",
  });
  assert.equal(goodSystem.success, true, "a minimal valid ranking system create input must parse");

  const goodEntry = addRankingEntrySchema.safeParse({
    rankingSnapshotId: "00000000-0000-4000-8000-000000000002",
    athleteId: "00000000-0000-4000-8000-000000000003",
    rank: "3", entryStatus: "ranked",
  });
  assert.equal(goodEntry.success, true, "a string-encoded rank from FormData must coerce to a number");
  if (goodEntry.success) assert.equal(goodEntry.data.rank, 3, "the coerced rank must be numeric");
}

function validateSportingResultRequiresExactlyOneOfAthleteOrTeam() {
  const base = {
    competitionId: "00000000-0000-4000-8000-000000000010",
    division: "open", event: "strength", resultStatus: "official",
    sourceRecordId: "00000000-0000-4000-8000-000000000011",
  };
  const neither = createSportingResultSchema.safeParse(base);
  assert.equal(neither.success, false, "a sporting result with neither athleteId nor teamId must be rejected");

  const both = createSportingResultSchema.safeParse({
    ...base,
    athleteId: "00000000-0000-4000-8000-000000000012",
    teamId: "00000000-0000-4000-8000-000000000013",
  });
  assert.equal(both.success, false, "a sporting result with both athleteId and teamId must be rejected, matching the sporting_results_check CHECK constraint");

  const athleteOnly = createSportingResultSchema.safeParse({ ...base, athleteId: "00000000-0000-4000-8000-000000000012" });
  assert.equal(athleteOnly.success, true, "a sporting result with exactly one of athleteId/teamId must be accepted");
}

function validateEditorialTransitionEnum() {
  const valid = transitionEditorialSchema.safeParse({ id: "00000000-0000-4000-8000-000000000020", state: "published" });
  assert.equal(valid.success, true, "a valid editorial publication state must parse");

  const invalid = transitionEditorialSchema.safeParse({ id: "00000000-0000-4000-8000-000000000020", state: "live" });
  assert.equal(invalid.success, false, "a publication state outside transition_editorial_publication's allowed set must be rejected client-side before ever reaching the RPC");
}

function validateProvenanceAndSourceRecordSchemas() {
  const badTrustClass = createProvenanceSchema.safeParse({
    targetType: "athletes", targetId: "00000000-0000-4000-8000-000000000030",
    sourceRecordId: "00000000-0000-4000-8000-000000000031", trustClass: "vibes",
  });
  assert.equal(badTrustClass.success, false, "a trustClass outside the enum must be rejected, preserving the source-truth/identity/editorial/official/ranking distinctions");

  const goodSource = createSourceRecordSchema.safeParse({ provider: "Official Streetlifting", sourceType: "result" });
  assert.equal(goodSource.success, true, "a minimal valid source record create input must parse");
  if (goodSource.success) assert.equal(goodSource.data.verificationState, "unverified", "a source record must default to unverified, never a pre-trusted state");
}

validateAthleteSchemaAcceptsAWellFormedRecord();
validateAthleteSchemaRejectsAnInvalidSlugAndState();
validateUpdateAthleteSchemaHasNoNameBasedMergeField();
validateOrganizationAndCompetitionEnums();
validateRankingSchemas();
validateSportingResultRequiresExactlyOneOfAthleteOrTeam();
validateEditorialTransitionEnum();
validateProvenanceAndSourceRecordSchemas();

console.log("validate-admin-editorial: all assertions passed");
