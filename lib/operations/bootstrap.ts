import "server-only";

import { normalizedEmailSchema } from "@/lib/operations/validation";

function parseEmailAllowlist(value: string | undefined): ReadonlySet<string> {
  const normalized = new Set<string>();

  for (const candidate of value?.split(",") ?? []) {
    const parsed = normalizedEmailSchema.safeParse(candidate);

    if (parsed.success) {
      normalized.add(parsed.data);
    }
  }

  return normalized;
}

export function getBootstrapAdminEmails(): ReadonlySet<string> {
  return parseEmailAllowlist(process.env.CALI_CENTRAL_ADMIN_EMAILS);
}
