import { createHash } from "node:crypto";

export type ExistingExternalIdentity = {
  readonly canonicalId: string;
  readonly provider: string;
  readonly externalId: string;
};

export type IdentityResolution =
  | { readonly state: "new"; readonly canonicalId: string; readonly basis: "stable-external-id-absent" }
  | { readonly state: "matched"; readonly canonicalId: string; readonly basis: "exact-provider-external-id" }
  | { readonly state: "ambiguous"; readonly candidateIds: readonly string[]; readonly basis: "duplicate-provider-external-id" };

export function stableDataOpsUuid(namespace: string, sourceId: string): string {
  const bytes = createHash("sha256").update(`${namespace}\0${sourceId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function resolveExternalIdentity(input: {
  readonly provider: string;
  readonly externalId: string;
  readonly existing: readonly ExistingExternalIdentity[];
  readonly newIdNamespace: string;
}): IdentityResolution {
  const matches = input.existing.filter(
    (identity) => identity.provider === input.provider && identity.externalId === input.externalId,
  );
  const candidateIds = [...new Set(matches.map((identity) => identity.canonicalId))];
  if (candidateIds.length > 1) {
    return { state: "ambiguous", candidateIds, basis: "duplicate-provider-external-id" };
  }
  if (candidateIds.length === 1) {
    return { state: "matched", canonicalId: candidateIds[0], basis: "exact-provider-external-id" };
  }
  return {
    state: "new",
    canonicalId: stableDataOpsUuid(input.newIdNamespace, `${input.provider}:${input.externalId}`),
    basis: "stable-external-id-absent",
  };
}
