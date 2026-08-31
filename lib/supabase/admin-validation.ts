import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.");

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || undefined);
const uuid = z.string().uuid();
const optionalUuid = z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined);
const csvList = z
  .string()
  .trim()
  .transform((value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []));

/**
 * FormData always yields a string (never undefined) for a present field, so
 * a blank optional <input type="number"> submits "" -- plain
 * `z.coerce.number().optional()` would coerce "" to 0 via JS's numeric
 * coercion and then fail any `.positive()`/`.int()` check instead of being
 * treated as omitted. Strip blank strings to undefined before coercing.
 */
const optionalNumber = () =>
  z.preprocess((value) => (value === "" || value === undefined ? undefined : value), z.coerce.number().optional());
const optionalPositiveInt = () =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional(),
  );

export const athleteEditorialStates = ["draft", "in-review", "approved", "archived"] as const;
export const athleteIdentityStates = ["unconfirmed", "identity-confirmed", "disputed", "retired"] as const;
// Matches the provenance_status enum added in
// supabase/migrations/202608300008_provenance_classification.sql -- a
// coarse "is this whole record real or dev/sample data" classification,
// distinct from the per-field provenance/trust_class ledger below.
export const provenanceStatuses = ["real_verified", "real_unverified", "fictional_sample", "unknown"] as const;

export const createAthleteSchema = z.object({
  permanentId: requiredText(120),
  slug,
  name: requiredText(160),
  displayName: optionalText(160),
  biography: optionalText(4_000),
  country: optionalText(80),
  administrativeArea: optionalText(80),
  city: optionalText(80),
  disciplines: csvList,
  specialties: csvList,
  identityState: z.enum(athleteIdentityStates).default("unconfirmed"),
  editorialState: z.enum(athleteEditorialStates).default("draft"),
  provenanceStatus: z.enum(provenanceStatuses).default("unknown"),
});

export const updateAthleteSchema = createAthleteSchema.omit({ permanentId: true }).partial();

export const organizationReviewStates = ["draft", "in-review", "approved", "rejected", "archived"] as const;

export const createOrganizationSchema = z.object({
  slug,
  name: requiredText(160),
  organizationType: optionalText(80),
  website: optionalText(2_048),
  country: optionalText(80),
  description: optionalText(4_000),
  reviewState: z.enum(organizationReviewStates).default("draft"),
  provenanceStatus: z.enum(provenanceStatuses).default("unknown"),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const competitionPublicStates = ["draft", "in-review", "published", "cancelled", "archived"] as const;

export const createCompetitionSchema = z.object({
  permanentId: requiredText(120),
  slug,
  name: requiredText(160),
  shortName: optionalText(80),
  status: requiredText(60),
  organizationId: optionalUuid,
  rulesetId: optionalUuid,
  startDate: optionalText(10),
  endDate: optionalText(10),
  country: optionalText(80),
  city: optionalText(80),
  summary: optionalText(4_000),
  disciplines: csvList,
  publicState: z.enum(competitionPublicStates).default("draft"),
  provenanceStatus: z.enum(provenanceStatuses).default("unknown"),
});

export const updateCompetitionSchema = createCompetitionSchema.omit({ permanentId: true }).partial();

export const rankingProviderStatuses = ["active", "inactive", "under-review"] as const;
export const rankingProviderIntegrationMethods = ["manual", "editorial", "structured-import", "authorized-api", "licensed-feed"] as const;

export const createRankingProviderSchema = z.object({
  slug,
  name: requiredText(160),
  organizationId: optionalUuid,
  website: optionalText(2_048),
  status: z.enum(rankingProviderStatuses).default("under-review"),
  integrationMethod: z.enum(rankingProviderIntegrationMethods),
  attributionRequirement: requiredText(500),
  sourcePolicyNotes: optionalText(4_000),
});

export const updateRankingProviderSchema = z.object({
  status: z.enum(rankingProviderStatuses).optional(),
  website: optionalText(2_048),
  sourcePolicyNotes: optionalText(4_000),
});

export const rankingSystemStatuses = ["draft", "active", "inactive"] as const;
export const rankingKinds = [
  "ordinal-position",
  "points",
  "rating",
  "season-standings",
  "qualification-ranking",
  "record-leaderboard",
  "relative-strength",
] as const;

export const createRankingSystemSchema = z.object({
  providerId: uuid,
  slug,
  name: requiredText(160),
  rankingKind: z.enum(rankingKinds),
  discipline: requiredText(120),
  geographicScope: requiredText(120),
  movement: optionalText(120),
  division: optionalText(120),
  weightClass: optionalText(60),
  sexDivision: optionalText(60),
  ageGroup: optionalText(60),
  methodologyNotes: optionalText(4_000),
  status: z.enum(rankingSystemStatuses).default("draft"),
});

export const rankingSnapshotPublicationStatuses = ["draft", "in-review", "published", "withdrawn", "superseded"] as const;

export const createRankingSnapshotSchema = z.object({
  rankingSystemId: uuid,
  rankingDate: requiredText(10),
  sourceRecordId: uuid,
  checkedAt: requiredText(40),
  season: optionalText(40),
  methodologyVersion: optionalText(60),
  publicationStatus: z.enum(rankingSnapshotPublicationStatuses).default("draft"),
});

export const rankingEntryStatuses = ["ranked", "provisional", "disqualified", "withdrawn"] as const;

export const addRankingEntrySchema = z.object({
  rankingSnapshotId: uuid,
  athleteId: uuid,
  rank: optionalPositiveInt(),
  points: optionalNumber(),
  rating: optionalNumber(),
  entryStatus: z.enum(rankingEntryStatuses).default("ranked"),
});

export const sportingResultStatuses = [
  "imported",
  "submitted",
  "provisional",
  "source-confirmed",
  "official",
  "corrected",
  "disputed",
  "disqualified",
  "withdrawn",
  "superseded",
] as const;

export const createSportingResultSchema = z
  .object({
    competitionId: uuid,
    athleteId: optionalUuid,
    teamId: optionalUuid,
    division: requiredText(120),
    event: requiredText(120),
    placement: optionalPositiveInt(),
    resultStatus: z.enum(sportingResultStatuses),
    sourceRecordId: uuid,
    rulesetId: optionalUuid,
  })
  .refine((value) => Boolean(value.athleteId) !== Boolean(value.teamId), {
    message: "Provide exactly one of athleteId or teamId.",
    path: ["athleteId"],
  });

export const updateSportingResultStatusSchema = z.object({
  id: uuid,
  resultStatus: z.enum(sportingResultStatuses),
});

export const editorialPublicationStates = ["draft", "in-review", "approved", "published", "unpublished", "archived"] as const;

export const createEditorialDraftSchema = z.object({
  contentType: z.enum(["story", "video"]),
  slug,
  title: requiredText(200),
  excerpt: optionalText(500),
});

export const updateEditorialCoreSchema = z.object({
  id: uuid,
  title: requiredText(200).optional(),
  excerpt: optionalText(500),
  slug: slug.optional(),
});

export const transitionEditorialSchema = z.object({
  id: uuid,
  state: z.enum(editorialPublicationStates),
  reason: optionalText(500),
});

export const updateStoryFieldsSchema = z.object({
  id: uuid,
  category: optionalText(80),
  eyebrow: optionalText(80),
  featured: z.coerce.boolean().optional(),
  readTimeMinutes: optionalPositiveInt(),
});

export const videoOwnershipStatuses = ["cali-central-original", "third-party-attributed", "source-unavailable"] as const;

export const updateVideoFieldsSchema = z.object({
  id: uuid,
  ownershipStatus: z.enum(videoOwnershipStatuses).optional(),
  sourcePlatform: optionalText(80),
  sourceAccount: optionalText(80),
  originalPostUrl: optionalText(2_048),
  durationSeconds: optionalPositiveInt(),
});

export const sourceVerificationStates = [
  "unverified",
  "submitted",
  "provisional",
  "source-confirmed",
  "official",
  "corrected",
  "disputed",
  "disqualified",
  "withdrawn",
  "superseded",
  "identity-confirmed",
  "editorial-reviewed",
  "editorially-verified",
] as const;

export const createSourceRecordSchema = z.object({
  provider: requiredText(160),
  sourceType: requiredText(80),
  publicUrl: optionalText(2_048),
  title: optionalText(200),
  externalRecordId: optionalText(200),
  publicationDate: optionalText(10),
  verificationState: z.enum(sourceVerificationStates).default("unverified"),
});

export const provenanceTrustClasses = [
  "source-confirmed",
  "identity-confirmed",
  "editorial-reviewed",
  "official-result",
  "external-ranking",
  "cali-central-ranking",
  "self-reported",
  "sample",
] as const;

export const createProvenanceSchema = z.object({
  targetType: requiredText(60),
  targetId: uuid,
  sourceRecordId: uuid,
  trustClass: z.enum(provenanceTrustClasses),
  fieldPath: optionalText(200),
});
