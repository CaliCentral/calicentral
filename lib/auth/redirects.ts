const UNSAFE_URL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f\\]/;

export function safeAuthReturnPath(
  candidate: string | undefined,
  fallback = "/account",
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    UNSAFE_URL_CHARACTER_PATTERN.test(candidate)
  ) {
    return fallback;
  }

  return candidate;
}

/**
 * Resolve an Auth.js redirect without allowing browser URL normalization to
 * reinterpret a backslash/control-character path as a protocol-relative URL.
 * Same-origin absolute URLs must not contain embedded credentials.
 */
export function resolveTrustedAuthRedirect(
  candidate: string,
  trustedOrigin: string,
): string {
  const origin = new URL(trustedOrigin).origin;

  if (UNSAFE_URL_CHARACTER_PATTERN.test(candidate)) {
    return origin;
  }

  if (candidate.startsWith("/")) {
    const safePath = safeAuthReturnPath(candidate, "");

    if (!safePath) {
      return origin;
    }

    const destination = new URL(safePath, `${origin}/`);
    return destination.origin === origin
      ? destination.toString()
      : origin;
  }

  try {
    const destination = new URL(candidate);

    if (
      destination.origin !== origin ||
      destination.username ||
      destination.password
    ) {
      return origin;
    }

    return destination.toString();
  } catch {
    return origin;
  }
}
