import "server-only";

import { createClient, type SanityClient } from "next-sanity";

import {
  apiVersion,
  dataset,
  isSanityConfigured,
  projectId,
} from "@/sanity/env";

function configuredWriteToken(): string | null {
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
  return token || null;
}

/**
 * A non-secret capability check for account and operations error states.
 */
export function isSanityMutationConfigured(): boolean {
  return isSanityConfigured && configuredWriteToken() !== null;
}

/**
 * Returns the server-only Sanity mutation client or throws a stable,
 * user-displayable configuration error. The token itself is never exported.
 */
export function requireSanityWriteClient(): SanityClient {
  const token = configuredWriteToken();

  if (!isSanityConfigured || !token) {
    throw new Error(
      "Editorial operations are unavailable because Sanity mutations are not configured.",
    );
  }

  // Cloudflare Workers forbid reusing request-scoped I/O across invocations.
  // A fresh client also gives each request its own requester/cancellation state.
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    fetch: true,
    useCdn: false,
    perspective: "published",
  });
}
