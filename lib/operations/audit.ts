import "server-only";

import { randomUUID } from "node:crypto";

import { requireOperationsClient } from "@/lib/operations/client";
import type { AuditEventInput } from "@/lib/operations/types";

export function createAuditEventDocument(
  input: AuditEventInput,
  auditId = `audit.${randomUUID()}`,
) {
  return {
    _id: auditId,
    _type: "auditEvent",
    eventType: input.eventType,
    actor: {
      _type: "reference",
      _ref: input.actor.id,
    },
    actorRole: input.actor.role,
    targetType: input.targetType,
    targetDocumentId: input.targetDocumentId,
    ...(input.submissionId
      ? {
          submission: {
            _type: "reference",
            _ref: input.submissionId,
          },
        }
      : {}),
    ...(input.contributorId
      ? {
          contributor: {
            _type: "reference",
            _ref: input.contributorId,
          },
        }
      : {}),
    ...(input.previousStatus
      ? { previousStatus: input.previousStatus }
      : {}),
    ...(input.nextStatus ? { nextStatus: input.nextStatus } : {}),
    summary: input.summary.slice(0, 500),
    createdAt: new Date().toISOString(),
    ...(input.metadata
      ? {
          metadata: {
            _type: "auditMetadata",
            ...(input.metadata.previousValue
              ? { previousValue: input.metadata.previousValue.slice(0, 160) }
              : {}),
            ...(input.metadata.nextValue
              ? { nextValue: input.metadata.nextValue.slice(0, 160) }
              : {}),
            ...(input.metadata.noteKind
              ? { noteKind: input.metadata.noteKind.slice(0, 80) }
              : {}),
          },
        }
      : {}),
  };
}

export async function createAuditEvent(input: AuditEventInput): Promise<string> {
  const client = requireOperationsClient();
  const document = createAuditEventDocument(input);
  await client.create(document);
  return document._id;
}
