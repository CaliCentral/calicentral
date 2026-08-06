export type OperationalErrorCode =
  | "access_denied"
  | "authentication_required"
  | "configuration_unavailable"
  | "identity_conflict"
  | "invalid_input"
  | "invalid_transition"
  | "not_found"
  | "operation_failed";

/**
 * An intentionally small error type whose messages are safe to return from
 * Server Actions. Low-level Sanity and authentication errors are never copied
 * into this object.
 */
export class OperationalError extends Error {
  readonly code: OperationalErrorCode;

  constructor(code: OperationalErrorCode, message: string) {
    super(message);
    this.name = "OperationalError";
    this.code = code;
  }
}

export function isOperationalError(error: unknown): error is OperationalError {
  return error instanceof OperationalError;
}
