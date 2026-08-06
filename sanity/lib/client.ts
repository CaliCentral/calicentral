import "server-only";

import { createClient } from "next-sanity";

import { isProductionStage } from "@/lib/site/config";
import {
  apiVersion,
  dataset,
  hasSanityReadToken,
  isSanityConfigured,
  projectId,
} from "@/sanity/env";

const configuredReadToken = () => {
  if (!hasSanityReadToken()) {
    return undefined;
  }

  return process.env.SANITY_API_READ_TOKEN?.trim() || undefined;
};

const readToken = configuredReadToken();

if (isProductionStage && isSanityConfigured && !readToken) {
  throw new Error(
    "Production Sanity content access requires server-side read authorization.",
  );
}

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      // The dataset can remain private while published content is rendered.
      // This module is server-only, and defineLive never receives a browser
      // token, so this value is not serialized into client-side JavaScript.
      token: readToken,
      perspective: "published",
      useCdn: false,
    })
  : null;

export function requireSanityClient() {
  if (!sanityClient) {
    throw new Error(
      "Sanity content was requested without a valid project ID and dataset.",
    );
  }

  return sanityClient;
}
