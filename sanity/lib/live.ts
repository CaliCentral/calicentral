import "server-only";

import { draftMode } from "next/headers";
import { defineLive, type LivePerspective } from "next-sanity/live";
import { createElement } from "react";

import { sanityClient } from "@/sanity/lib/client";

const readToken = process.env.SANITY_API_READ_TOKEN?.trim() || false;
const live = sanityClient
  ? defineLive({
      client: sanityClient,
      serverToken: readToken,
      // Draft reads stay on the server. Passing a browserToken would expose a
      // dataset token to preview JavaScript, which this integration forbids.
      browserToken: false,
    })
  : null;

export type SanityRequestMode = {
  readonly perspective: LivePerspective;
  readonly stega: boolean;
};

export async function getSanityRequestMode(
  publishedOnly = false,
): Promise<SanityRequestMode> {
  if (publishedOnly) {
    return { perspective: "published", stega: false };
  }

  const { isEnabled } = await draftMode();

  if (isEnabled) {
    if (!readToken) {
      throw new Error(
        "Sanity Draft Mode is enabled, but SANITY_API_READ_TOKEN is not configured.",
      );
    }

    return { perspective: "drafts", stega: true };
  }

  return { perspective: "published", stega: false };
}

export function requireSanityFetch() {
  if (!live) {
    throw new Error(
      "Sanity content was requested without a configured Live Content client.",
    );
  }

  return live.sanityFetch;
}

export async function SanityLive() {
  if (!live) {
    return null;
  }

  const { isEnabled } = await draftMode();

  return createElement(live.SanityLive, {
    includeDrafts: isEnabled && Boolean(readToken),
  });
}
