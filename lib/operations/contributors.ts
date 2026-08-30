import "server-only";

import { createHash } from "node:crypto";

import { getBootstrapRole } from "@/lib/auth/config";
import { createAuditEventDocument } from "@/lib/operations/audit";
import { requireOperationsClient } from "@/lib/operations/client";
import { OperationalError } from "@/lib/operations/errors";
import {
  normalizeAdminContributor,
  normalizeContributorIdentity,
  normalizeContributorReference,
  normalizeEditorContributor,
  normalizeOwnContributorProfile,
} from "@/lib/operations/normalize";
import {
  countEffectiveAdministratorCandidates,
  higherRole,
} from "@/lib/operations/permissions";
import type { OperationalLockGuard } from "@/lib/operations/locks";
import { CONTRIBUTOR_IDENTITY_PROJECTION } from "@/lib/operations/projections";
import type {
  AdminContributorDetail,
  AuthIdentityInput,
  ContributorIdentityRecord,
  ContributorReference,
  ContributorRole,
  EditorContributorSummary,
  OperationalActor,
  OwnContributorProfile,
} from "@/lib/operations/types";
import {
  normalizedEmailSchema,
  operationalDocumentIdSchema,
  safeHttpUrlSchema,
  type ContributorProfileUpdateInput,
} from "@/lib/operations/validation";
import { useSupabaseAuth } from "@/lib/supabase/config";
import {
  getSupabaseAssignableReviewers,
  getSupabaseContributorForAdmin,
  getSupabaseContributorForEditor,
  getSupabaseOwnContributorProfile,
} from "@/lib/operations/supabase-read";

const OWN_PROFILE_PROJECTION = `{
  "id": _id,
  displayName,
  normalizedEmail,
  avatarUrl,
  role,
  accessStatus,
  biography,
  location,
  areasOfInterest,
  contributorSince,
  lastSignedInAt,
  termsAcceptedAt,
  "linkedAuthorId": linkedAuthor._ref,
  "linkedAthleteId": linkedAthlete._ref
}`;

const EDITOR_CONTRIBUTOR_PROJECTION = `{
  "id": _id,
  displayName,
  normalizedEmail,
  avatarUrl,
  role,
  accessStatus,
  biography,
  location,
  areasOfInterest,
  contributorSince,
  lastSignedInAt,
  termsAcceptedAt,
  "linkedAuthorId": linkedAuthor._ref,
  "linkedAthleteId": linkedAthlete._ref,
  "submissionCount": count(*[
    _type == "submission" &&
    submitter._ref == ^._id
  ]),
  "activeReviewCount": count(*[
    _type == "submission" &&
    submitter._ref == ^._id &&
    status in ["submitted", "inReview", "revisionRequested"]
  ])
}`;
const MAX_OPERATIONAL_LIST_RESULTS = 250;
const CONTRIBUTOR_EMAIL_CLAIM_NAMESPACE =
  "cali-central:contributor-email-claim:v1";

type ContributorIdentityClaim = {
  readonly contributorId: string;
};

function isMutationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

function createContributorEmailClaimId(normalizedEmail: string): string {
  const digest = createHash("sha256")
    .update(
      `${CONTRIBUTOR_EMAIL_CLAIM_NAMESPACE}\u0000${normalizedEmail}`,
      "utf8",
    )
    .digest("hex");

  return `contributor-email-claim.${digest}`;
}

async function getContributorIdentityClaim(
  contributorEmailClaimId: string,
): Promise<ContributorIdentityClaim | null> {
  const client = requireOperationsClient();
  const result = await client.fetch<{ contributorId?: unknown } | null>(
    `*[
      _type == "contributorIdentityClaim" &&
      _id == $id
    ][0] { "contributorId": contributor._ref }`,
    { id: contributorEmailClaimId },
  );

  return typeof result?.contributorId === "string"
    ? { contributorId: result.contributorId }
    : null;
}

function createContributorIdentityClaimDocument(input: {
  readonly id: string;
  readonly contributorId: string;
  readonly createdAt: string;
}) {
  return {
    _id: input.id,
    _type: "contributorIdentityClaim",
    contributor: {
      _type: "reference",
      _ref: input.contributorId,
    },
    createdAt: input.createdAt,
  };
}

async function recoverConcurrentProvisioning(
  identity: AuthIdentityInput,
): Promise<ContributorIdentityRecord> {
  const provisioned = await getContributorByAuthIdentity(identity);

  if (provisioned) {
    return provisioned;
  }

  throw new OperationalError(
    "identity_conflict",
    "This sign-in identity could not be linked to a unique contributor record.",
  );
}

function normalizeIdentityInput(identity: AuthIdentityInput): {
  provider: string;
  providerAccountId: string;
  normalizedEmail: string | null;
  name: string | null;
  image: string | null;
} {
  const provider = identity.provider.trim().toLowerCase();
  const providerAccountId = identity.providerAccountId.trim();
  const parsedEmail = normalizedEmailSchema.safeParse(
    identity.normalizedEmail ?? identity.email,
  );
  const parsedImage = safeHttpUrlSchema.safeParse(identity.image);

  if (provider !== "google" && provider !== "github") {
    throw new OperationalError(
      "invalid_input",
      "The authentication provider identity is invalid.",
    );
  }

  if (!providerAccountId || providerAccountId.length > 255) {
    throw new OperationalError(
      "invalid_input",
      "The authentication account identity is invalid.",
    );
  }

  return {
    provider,
    providerAccountId,
    normalizedEmail: parsedEmail.success ? parsedEmail.data : null,
    name: identity.name?.trim().slice(0, 80) || null,
    image:
      parsedImage.success && new URL(parsedImage.data).protocol === "https:"
        ? parsedImage.data
        : null,
  };
}

export function createContributorDocumentId(
  identity: Pick<AuthIdentityInput, "provider" | "providerAccountId">,
): string {
  const provider = identity.provider.trim().toLowerCase();
  const providerAccountId = identity.providerAccountId.trim();

  if (
    (provider !== "google" && provider !== "github") ||
    !providerAccountId ||
    providerAccountId.length > 255
  ) {
    throw new OperationalError(
      "invalid_input",
      "A stable authentication identity is required.",
    );
  }

  const digest = createHash("sha256")
    .update(`${provider}\u0000${providerAccountId}`, "utf8")
    .digest("hex");

  return `contributor.${digest}`;
}

async function fetchIdentityMatches(
  query: string,
  params: Record<string, string>,
): Promise<ContributorIdentityRecord[]> {
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(query, params);

  return result.flatMap((value) => {
    const normalized = normalizeContributorIdentity(value);
    return normalized ? [normalized] : [];
  });
}

async function findContributorMatches(identity: AuthIdentityInput): Promise<{
  normalized: ReturnType<typeof normalizeIdentityInput>;
  matches: ContributorIdentityRecord[];
}> {
  const normalized = normalizeIdentityInput(identity);
  const deterministicId = createContributorDocumentId(identity);
  const client = requireOperationsClient();
  const byId = normalizeContributorIdentity(
    await client.fetch<unknown>(
      `*[_type == "contributorProfile" && _id == $id][0] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
      { id: deterministicId },
    ),
  );

  if (byId) {
    const collisions = await fetchIdentityMatches(
      `*[
        _type == "contributorProfile" &&
        _id != $id &&
        (
          (authProvider == $provider && providerAccountId == $providerAccountId) ||
          ($normalizedEmail != "" && normalizedEmail == $normalizedEmail)
        )
      ][0...1] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
      {
        id: deterministicId,
        provider: normalized.provider,
        providerAccountId: normalized.providerAccountId,
        normalizedEmail: normalized.normalizedEmail ?? "",
      },
    );

    if (collisions.length > 0) {
      throw new OperationalError(
        "identity_conflict",
        "This sign-in identity is linked to more than one contributor record.",
      );
    }

    return { normalized, matches: [byId] };
  }

  const byProvider = await fetchIdentityMatches(
    `*[
      _type == "contributorProfile" &&
      authProvider == $provider &&
      providerAccountId == $providerAccountId
    ][0...2] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
    {
      provider: normalized.provider,
      providerAccountId: normalized.providerAccountId,
    },
  );

  if (byProvider.length > 1) {
    throw new OperationalError(
      "identity_conflict",
      "This authentication identity is linked to more than one contributor record.",
    );
  }

  if (byProvider.length === 1 || !normalized.normalizedEmail) {
    return { normalized, matches: byProvider };
  }

  const byEmail = await fetchIdentityMatches(
    `*[
      _type == "contributorProfile" &&
      normalizedEmail == $normalizedEmail
    ][0...2] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
    { normalizedEmail: normalized.normalizedEmail },
  );

  if (byEmail.length > 1) {
    throw new OperationalError(
      "identity_conflict",
      "This sign-in email is linked to more than one contributor record.",
    );
  }

  return { normalized, matches: byEmail };
}

export async function getContributorByAuthIdentity(
  identity: AuthIdentityInput,
): Promise<ContributorIdentityRecord | null> {
  const { normalized, matches } = await findContributorMatches(identity);
  const match = matches[0] ?? null;

  if (
    match &&
    (match.authProvider !== normalized.provider ||
      match.providerAccountId !== normalized.providerAccountId)
  ) {
    // A unique email match belonging to a different provider identity is not
    // auto-linked. This avoids an implicit cross-provider account takeover.
    throw new OperationalError(
      "identity_conflict",
      "This email is already linked to a different sign-in identity.",
    );
  }

  return match;
}

export async function ensureContributorProfile(
  identity: AuthIdentityInput,
  effectiveBootstrapRole?: ContributorRole | null,
): Promise<ContributorIdentityRecord> {
  const client = requireOperationsClient();
  const { normalized, matches } = await findContributorMatches(identity);
  const existing = matches[0] ?? null;
  const now = new Date().toISOString();

  if (!normalized.normalizedEmail) {
    throw new OperationalError(
      "invalid_input",
      "A verified email address is required to create a contributor profile.",
    );
  }

  if (
    existing &&
    (existing.authProvider !== normalized.provider ||
      existing.providerAccountId !== normalized.providerAccountId)
  ) {
    throw new OperationalError(
      "identity_conflict",
      "This email is already linked to a different sign-in identity.",
    );
  }

  const contributorId = existing?.id ?? createContributorDocumentId(identity);
  const contributorEmailClaimId = createContributorEmailClaimId(
    normalized.normalizedEmail,
  );
  const identityClaim = await getContributorIdentityClaim(
    contributorEmailClaimId,
  );

  if (
    identityClaim &&
    identityClaim.contributorId !== contributorId
  ) {
    throw new OperationalError(
      "identity_conflict",
      "This sign-in email is already linked to a different contributor record.",
    );
  }

  const identityClaimDocument = createContributorIdentityClaimDocument({
    id: contributorEmailClaimId,
    contributorId,
    createdAt: now,
  });

  if (existing) {
    const emailMatches = await fetchIdentityMatches(
      `*[
        _type == "contributorProfile" &&
        normalizedEmail == $normalizedEmail &&
        _id != $id
      ][0...1] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
      { normalizedEmail: normalized.normalizedEmail, id: existing.id },
    );

    if (emailMatches.length > 0) {
      throw new OperationalError(
        "identity_conflict",
        "This sign-in email is already linked to another contributor record.",
      );
    }

    // Bootstrap allowlists are evaluated at request time. Never persist their
    // elevated role into the profile, or removing an address from the
    // allowlist would leave permanent administrative access behind.
    const effectiveActorRole = effectiveBootstrapRole
      ? higherRole(existing.role, effectiveBootstrapRole)
      : existing.role;
    const nextAccessStatus =
      effectiveBootstrapRole && existing.accessStatus === "pending"
        ? "active"
        : existing.accessStatus;
    let transaction = client.transaction().patch(existing.id, (patch) => {
      let nextPatch = patch.ifRevisionId(existing.revisionId).set({
        normalizedEmail: normalized.normalizedEmail,
        lastSignedInAt: now,
        updatedAt: now,
        ...(normalized.image ? { avatarUrl: normalized.image } : {}),
        ...(nextAccessStatus !== existing.accessStatus
          ? { accessStatus: nextAccessStatus }
          : {}),
      });

      if (
        normalized.name &&
        (!existing.displayName || existing.displayName === "Contributor")
      ) {
        nextPatch = nextPatch.set({ displayName: normalized.name });
      }

      return nextPatch;
    });

    if (nextAccessStatus !== existing.accessStatus) {
      transaction = transaction.create(
        createAuditEventDocument({
          eventType: "contributorReactivated",
          actor: {
            id: existing.id,
            displayName: existing.displayName,
            role: effectiveActorRole,
            accessStatus: nextAccessStatus,
            normalizedEmail: normalized.normalizedEmail,
          },
          targetType: "contributor",
          targetDocumentId: existing.id,
          contributorId: existing.id,
          summary: "Bootstrap access activated the contributor profile.",
          metadata: {
            previousValue: existing.accessStatus,
            nextValue: nextAccessStatus,
          },
        }),
      );
    }

    if (!identityClaim) {
      // `create`, rather than `createIfNotExists`, turns the email-hash claim
      // into an atomic uniqueness lock across concurrent provider callbacks.
      transaction = transaction.create(identityClaimDocument);
    }

    try {
      await transaction.commit();
    } catch (error) {
      if (isMutationConflict(error)) {
        return recoverConcurrentProvisioning(identity);
      }

      throw error;
    }

    return {
      ...existing,
      normalizedEmail: normalized.normalizedEmail,
      accessStatus: nextAccessStatus,
      avatarUrl: normalized.image ?? existing.avatarUrl,
      displayName:
        normalized.name &&
        (!existing.displayName || existing.displayName === "Contributor")
          ? normalized.name
          : existing.displayName,
      lastSignedInAt: now,
    };
  }

  const id = contributorId;
  // The runtime allowlist supplies any bootstrap elevation. The stored role
  // remains independently manageable and does not inherit that elevation.
  const role = "contributor";
  const effectiveActorRole = effectiveBootstrapRole ?? role;
  const accessStatus = effectiveBootstrapRole ? "active" : "pending";
  const displayName = normalized.name ?? "Contributor";
  const auditId = `audit.contributor-created.${id.slice("contributor.".length)}`;
  const actor: OperationalActor = {
    id,
    displayName,
    role: effectiveActorRole,
    accessStatus,
    normalizedEmail: normalized.normalizedEmail,
  };
  const document = {
    _id: id,
    _type: "contributorProfile",
    displayName,
    normalizedEmail: normalized.normalizedEmail,
    authProvider: normalized.provider,
    providerAccountId: normalized.providerAccountId,
    ...(normalized.image ? { avatarUrl: normalized.image } : {}),
    role,
    accessStatus,
    biography: "",
    location: "",
    areasOfInterest: [],
    contributorSince: now,
    lastSignedInAt: now,
    createdAt: now,
    updatedAt: now,
    internalNotes: "",
  };

  let transaction = client
    .transaction()
    .createIfNotExists(document)
    .createIfNotExists(
      createAuditEventDocument(
        {
          eventType: "contributorCreated",
          actor,
          targetType: "contributor",
          targetDocumentId: id,
          contributorId: id,
          summary: "Contributor profile provisioned after authenticated sign-in.",
        },
        auditId,
      ),
    );

  if (!identityClaim) {
    transaction = transaction.create(identityClaimDocument);
  }

  try {
    await transaction.commit();
  } catch (error) {
    if (isMutationConflict(error)) {
      return recoverConcurrentProvisioning(identity);
    }

    throw error;
  }

  const provisioned = normalizeContributorIdentity(
    await client.fetch<unknown>(
      `*[_type == "contributorProfile" && _id == $id][0] ${CONTRIBUTOR_IDENTITY_PROJECTION}`,
      { id },
    ),
  );

  if (!provisioned) {
    throw new OperationalError(
      "operation_failed",
      "The contributor profile could not be loaded after provisioning.",
    );
  }

  return provisioned;
}

export async function getOwnContributorProfile(
  contributorId: string,
): Promise<OwnContributorProfile | null> {
  if (useSupabaseAuth) {
    return getSupabaseOwnContributorProfile(contributorId);
  }
  const id = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  return normalizeOwnContributorProfile(
    await client.fetch<unknown>(
      `*[_type == "contributorProfile" && _id == $id][0] ${OWN_PROFILE_PROJECTION}`,
      { id },
    ),
  );
}

export async function getContributorDirectory(): Promise<
  EditorContributorSummary[]
> {
  const client = requireOperationsClient();
  const result = await client.fetch<unknown[]>(
    `*[_type == "contributorProfile"] | order(displayName asc)[0...$limit] ${EDITOR_CONTRIBUTOR_PROJECTION}`,
    { limit: MAX_OPERATIONAL_LIST_RESULTS },
  );
  return result.flatMap((value) => {
    const normalized = normalizeEditorContributor(value);
    return normalized ? [normalized] : [];
  });
}

export async function countContributorProfiles(): Promise<number> {
  const client = requireOperationsClient();
  const count = await client.fetch<number>(
    `count(*[_type == "contributorProfile"])`,
  );
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export async function getContributorForAdmin(
  contributorId: string,
): Promise<AdminContributorDetail | null> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  if (useSupabaseAuth) {
    return getSupabaseContributorForAdmin(id);
  }
  const client = requireOperationsClient();
  return normalizeAdminContributor(
    await client.fetch<unknown>(
      `*[_type == "contributorProfile" && _id == $id][0] {
        ${EDITOR_CONTRIBUTOR_PROJECTION.slice(1, -1)},
        "revisionId": _rev,
        authProvider,
        providerAccountId,
        internalNotes,
        createdAt,
        updatedAt
      }`,
      { id },
    ),
  );
}

export async function getContributorForEditor(
  contributorId: string,
): Promise<EditorContributorSummary | null> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  if (useSupabaseAuth) {
    return getSupabaseContributorForEditor(id);
  }
  const client = requireOperationsClient();
  return normalizeEditorContributor(
    await client.fetch<unknown>(
      `*[_type == "contributorProfile" && _id == $id][0] ${EDITOR_CONTRIBUTOR_PROJECTION}`,
      { id },
    ),
  );
}

export async function getAssignableReviewers(): Promise<
  ContributorReference[]
> {
  if (useSupabaseAuth) {
    return [...(await getSupabaseAssignableReviewers())];
  }
  const client = requireOperationsClient();
  const result = await client.fetch<
    Array<{
      readonly normalizedEmail?: unknown;
      readonly [key: string]: unknown;
    }>
  >(
    `*[
      _type == "contributorProfile" &&
      accessStatus == "active"
    ] | order(displayName asc)[0...$limit] {
      "id": _id,
      displayName,
      normalizedEmail,
      avatarUrl,
      role,
      accessStatus
    }`,
    { limit: MAX_OPERATIONAL_LIST_RESULTS },
  );
  return result.flatMap((value) => {
    const normalized = normalizeContributorReference(value);

    if (!normalized) {
      return [];
    }

    const bootstrapRole = getBootstrapRole(
      typeof value.normalizedEmail === "string"
        ? value.normalizedEmail
        : null,
    );
    const effectiveRole = bootstrapRole
      ? higherRole(normalized.role, bootstrapRole)
      : normalized.role;

    return effectiveRole === "contributor"
      ? []
      : [{ ...normalized, role: effectiveRole }];
  });
}

export async function countOtherEffectiveAdministrators(input: {
  readonly contributorId: string;
  readonly bootstrapAdminEmails: readonly string[];
}): Promise<number> {
  const id = operationalDocumentIdSchema.parse(input.contributorId);
  const bootstrapAdminEmails = [
    ...new Set(
      input.bootstrapAdminEmails.map((email) =>
        normalizedEmailSchema.parse(email),
      ),
    ),
  ];
  const client = requireOperationsClient();
  const result = await client.fetch<{
    activeProfileAdministratorCount?: unknown;
    provisionedBootstrapEmails?: unknown;
  }>(
    `{
      "activeProfileAdministratorCount": count(*[
        _type == "contributorProfile" &&
        _id != $id &&
        accessStatus == "active" &&
        (
          role == "admin" ||
          normalizedEmail in $bootstrapAdminEmails
        )
      ]),
      "provisionedBootstrapEmails": *[
        _type == "contributorProfile" &&
        _id != $id &&
        normalizedEmail in $bootstrapAdminEmails
      ].normalizedEmail
    }`,
    { id, bootstrapAdminEmails },
  );
  const activeProfileAdministratorCount =
    typeof result.activeProfileAdministratorCount === "number"
      ? result.activeProfileAdministratorCount
      : Number.NaN;
  const provisionedBootstrapEmails = Array.isArray(
    result.provisionedBootstrapEmails,
  )
    ? result.provisionedBootstrapEmails.filter(
        (email): email is string => typeof email === "string",
      )
    : [];

  return countEffectiveAdministratorCandidates({
    activeProfileAdministratorCount,
    bootstrapAdminEmails,
    provisionedBootstrapEmails,
  });
}

export async function countActiveContributorSubmissions(
  contributorId: string,
): Promise<number> {
  const id = operationalDocumentIdSchema.parse(contributorId);
  const client = requireOperationsClient();
  return client.fetch<number>(
    `count(*[
      _type == "submission" &&
      submitter._ref == $id &&
      status in ["draft", "submitted", "inReview", "revisionRequested"]
    ])`,
    { id },
  );
}

export async function updateContributorProfileRecord(
  actor: OperationalActor,
  input: ContributorProfileUpdateInput,
): Promise<"updated" | "unchanged"> {
  const client = requireOperationsClient();
  const current = await client.fetch<{
    revisionId?: unknown;
    displayName?: unknown;
    biography?: unknown;
    location?: unknown;
    areasOfInterest?: unknown;
  } | null>(
    `*[_type == "contributorProfile" && _id == $id][0] {
      "revisionId": _rev,
      displayName,
      biography,
      location,
      areasOfInterest
    }`,
    { id: actor.id },
  );
  const revisionId =
    typeof current?.revisionId === "string"
      ? current.revisionId.trim()
      : "";

  if (!current || !revisionId) {
    throw new OperationalError(
      "operation_failed",
      "The contributor profile is not available.",
    );
  }

  const currentAreasOfInterest = Array.isArray(current.areasOfInterest)
    ? current.areasOfInterest.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const areasAreEqual =
    currentAreasOfInterest.length === input.areasOfInterest.length &&
    currentAreasOfInterest.every(
      (value, index) => value === input.areasOfInterest[index],
    );
  const unchanged =
    current.displayName === input.displayName &&
    (current.biography ?? "") === input.biography &&
    (current.location ?? "") === input.location &&
    areasAreEqual;

  if (unchanged) {
    return "unchanged";
  }

  const now = new Date().toISOString();
  const audit = createAuditEventDocument({
    eventType: "profileUpdated",
    actor,
    targetType: "contributor",
    targetDocumentId: actor.id,
    contributorId: actor.id,
    summary: "Contributor updated approved profile fields.",
  });

  await client
    .transaction()
    .patch(actor.id, (patch) =>
      patch
        .ifRevisionId(revisionId)
        .set({
          displayName: input.displayName,
          biography: input.biography,
          location: input.location,
          areasOfInterest: input.areasOfInterest,
          updatedAt: now,
        }),
    )
    .create(audit)
    .commit();

  return "updated";
}

export async function updateContributorRoleRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly role: ContributorRole;
  readonly administratorGuard?: OperationalLockGuard;
}): Promise<void> {
  const client = requireOperationsClient();
  const audit = createAuditEventDocument({
    eventType: "contributorRoleChanged",
    actor: input.actor,
    targetType: "contributor",
    targetDocumentId: input.contributor.id,
    contributorId: input.contributor.id,
    summary: "Administrator changed a contributor role.",
    metadata: {
      previousValue: input.contributor.role,
      nextValue: input.role,
    },
  });
  let transaction = client
    .transaction()
    .patch(input.contributor.id, (patch) =>
      patch
        .ifRevisionId(input.contributor.revisionId)
        .set({ role: input.role, updatedAt: new Date().toISOString() }),
    )
    .create(audit);

  if (input.administratorGuard) {
    transaction = transaction.patch(
      input.administratorGuard.id,
      (patch) =>
        patch
          .ifRevisionId(input.administratorGuard!.revisionId)
          .set({ updatedAt: new Date().toISOString() }),
    );
  }

  await transaction.commit();
}

export async function updateContributorAccessRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly accessStatus: "active" | "pending" | "suspended" | "archived";
  readonly administratorGuard?: OperationalLockGuard;
}): Promise<void> {
  const client = requireOperationsClient();
  const eventType =
    input.accessStatus === "suspended"
      ? "contributorSuspended"
      : input.accessStatus === "archived"
        ? "contributorArchived"
        : "contributorReactivated";
  const audit = createAuditEventDocument({
    eventType,
    actor: input.actor,
    targetType: "contributor",
    targetDocumentId: input.contributor.id,
    contributorId: input.contributor.id,
    summary: "Administrator changed contributor portal access.",
    metadata: {
      previousValue: input.contributor.accessStatus,
      nextValue: input.accessStatus,
    },
  });
  let transaction = client
    .transaction()
    .patch(input.contributor.id, (patch) =>
      patch
        .ifRevisionId(input.contributor.revisionId)
        .set({
          accessStatus: input.accessStatus,
          updatedAt: new Date().toISOString(),
        }),
    )
    .create(audit);

  if (input.administratorGuard) {
    transaction = transaction.patch(
      input.administratorGuard.id,
      (patch) =>
        patch
          .ifRevisionId(input.administratorGuard!.revisionId)
          .set({ updatedAt: new Date().toISOString() }),
    );
  }

  await transaction.commit();
}

export async function updateContributorInternalNotesRecord(input: {
  readonly actor: OperationalActor;
  readonly contributor: AdminContributorDetail;
  readonly internalNotes: string;
}): Promise<void> {
  const client = requireOperationsClient();
  const audit = createAuditEventDocument({
    eventType: "contributorInternalNotesUpdated",
    actor: input.actor,
    targetType: "contributor",
    targetDocumentId: input.contributor.id,
    contributorId: input.contributor.id,
    summary: "Administrator updated private contributor notes.",
    metadata: { noteKind: "privateContributorNote" },
  });
  await client
    .transaction()
    .patch(input.contributor.id, (patch) =>
      patch
        .ifRevisionId(input.contributor.revisionId)
        .set({
          internalNotes: input.internalNotes,
          updatedAt: new Date().toISOString(),
        }),
    )
    .create(audit)
    .commit();
}
