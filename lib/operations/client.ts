import "server-only";

import { OperationalError } from "@/lib/operations/errors";
import { requireSanityWriteClient } from "@/sanity/lib/write-client";

export function requireOperationsClient() {
  try {
    return requireSanityWriteClient();
  } catch {
    throw new OperationalError(
      "configuration_unavailable",
      "Account and editorial changes are unavailable until Sanity write access is configured.",
    );
  }
}
