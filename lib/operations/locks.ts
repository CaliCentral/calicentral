import "server-only";

import { requireOperationsClient } from "@/lib/operations/client";
import { OperationalError } from "@/lib/operations/errors";

const ADMINISTRATOR_MUTATION_LOCK_ID =
  "operational-lock.administrator-mutations";

export type OperationalLockGuard = {
  readonly id: string;
  readonly revisionId: string;
};

/**
 * Return a shared revision guard used to serialize administrator removals.
 * The lock contains no identity or content data; its `_rev` is included in
 * the same transaction as the guarded contributor mutation.
 */
export async function getAdministratorMutationGuard(): Promise<OperationalLockGuard> {
  const client = requireOperationsClient();
  const now = new Date().toISOString();

  await client.createIfNotExists({
    _id: ADMINISTRATOR_MUTATION_LOCK_ID,
    _type: "operationalLock",
    purpose: "Serialize effective-administrator removals",
    updatedAt: now,
  });

  const lock = await client.fetch<{ revisionId?: unknown } | null>(
    `*[
      _type == "operationalLock" &&
      _id == $id
    ][0] { "revisionId": _rev }`,
    { id: ADMINISTRATOR_MUTATION_LOCK_ID },
  );

  if (typeof lock?.revisionId !== "string" || !lock.revisionId) {
    throw new OperationalError(
      "operation_failed",
      "Administrator safeguards are temporarily unavailable.",
    );
  }

  return {
    id: ADMINISTRATOR_MUTATION_LOCK_ID,
    revisionId: lock.revisionId,
  };
}
