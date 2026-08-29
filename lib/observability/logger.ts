import "server-only";

export type SafeLogSeverity = "info" | "warning" | "error";

export type SafeLogEvent =
  | "auth.profile_lookup_failed"
  | "auth.profile_provision_failed"
  | "auth.provider_rejected"
  | "auth.runtime_error"
  | "auth.runtime_warning"
  | "auth.session_lookup_failed"
  | "draft_mode.disable_failed"
  | "draft_mode.enable_failed"
  | "health.degraded"
  | "community.mutation_failed"
  | "community.read_failed"
  | "operations.mutation_failed";

export type SafeErrorCategory =
  | "auth_error"
  | "configuration_error"
  | "content_read_error"
  | "content_write_error"
  | "community_error"
  | "draft_mode_error"
  | "operation_error"
  | "provider_email_unverified";

export type SafeRouteCategory =
  | "auth"
  | "draft_mode"
  | "health"
  | "community"
  | "operations";

export type SafeAuthProvider = "google" | "github";

type SafeLogInput = {
  readonly severity: SafeLogSeverity;
  readonly event: SafeLogEvent;
  readonly routeCategory: SafeRouteCategory;
  readonly errorCategory?: SafeErrorCategory;
  readonly provider?: SafeAuthProvider;
  readonly statusCode?: number;
};

/**
 * Emit only explicitly allowlisted operational metadata.
 *
 * Callers intentionally cannot attach arbitrary errors, request URLs, headers,
 * query strings, identifiers, or user-provided values. This keeps OAuth codes,
 * Draft Mode secrets, tokens, email addresses, and content out of application
 * logs even when a downstream library throws a rich error object.
 */
export function safeLog(input: SafeLogInput): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    application: "cali-central",
    severity: input.severity,
    event: input.event,
    routeCategory: input.routeCategory,
    ...(input.errorCategory
      ? { errorCategory: input.errorCategory }
      : {}),
    ...(input.provider ? { provider: input.provider } : {}),
    ...(Number.isInteger(input.statusCode)
      ? { statusCode: input.statusCode }
      : {}),
  });

  if (input.severity === "error") {
    console.error(entry);
    return;
  }

  if (input.severity === "warning") {
    console.warn(entry);
    return;
  }

  console.info(entry);
}
