import "server-only";

import { normalizeEmail } from "@/lib/auth/config";
import type { AuthProviderId } from "@/lib/auth/types";

const GITHUB_API_ORIGIN = "https://api.github.com";
const VERIFIED_EMAIL_MARKER = "caliCentralEmailVerified";

type OAuthProfile = Record<string, unknown>;

type GitHubEmailRecord = {
  readonly email: string;
  readonly primary: boolean;
  readonly verified: boolean;
};

const isRecord = (value: unknown): value is OAuthProfile =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseGitHubEmail = (value: unknown): GitHubEmailRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const email = normalizeEmail(
    typeof value.email === "string" ? value.email : null,
  );

  if (!email) {
    return null;
  }

  return {
    email,
    primary: value.primary === true,
    verified: value.verified === true,
  };
};

const githubHeaders = (accessToken: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${accessToken}`,
  "User-Agent": "Cali-Central",
});

const fetchGitHubJson = async (
  pathname: "/user" | "/user/emails",
  accessToken: string,
): Promise<unknown> => {
  const response = await fetch(`${GITHUB_API_ORIGIN}${pathname}`, {
    headers: githubHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("GitHub identity verification failed.");
  }

  return response.json();
};

/**
 * Auth.js' default GitHub provider accepts the primary email (or first email)
 * returned by GitHub without requiring it to be verified. Always resolve the
 * authenticated account and its email list from GitHub's official API and
 * expose only a verified primary address to the sign-in callback.
 */
export async function fetchVerifiedGitHubProfile(
  accessToken: unknown,
): Promise<OAuthProfile> {
  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("GitHub identity verification failed.");
  }

  const [profileValue, emailValues] = await Promise.all([
    fetchGitHubJson("/user", accessToken),
    fetchGitHubJson("/user/emails", accessToken),
  ]);

  if (!isRecord(profileValue) || !Array.isArray(emailValues)) {
    throw new Error("GitHub identity verification failed.");
  }

  const verifiedPrimaryEmail = emailValues
    .map(parseGitHubEmail)
    .find((email) => email?.primary && email.verified);

  return {
    ...profileValue,
    email: verifiedPrimaryEmail?.email ?? null,
    [VERIFIED_EMAIL_MARKER]: Boolean(verifiedPrimaryEmail),
  };
}

export function hasVerifiedOAuthEmail({
  provider,
  profile,
  userEmail,
}: {
  readonly provider: AuthProviderId;
  readonly profile: unknown;
  readonly userEmail: string | null | undefined;
}): boolean {
  if (!isRecord(profile)) {
    return false;
  }

  const normalizedUserEmail = normalizeEmail(userEmail);
  const normalizedProfileEmail = normalizeEmail(
    typeof profile.email === "string" ? profile.email : null,
  );

  if (
    !normalizedUserEmail ||
    normalizedUserEmail !== normalizedProfileEmail
  ) {
    return false;
  }

  if (provider === "google") {
    return profile.email_verified === true;
  }

  return profile[VERIFIED_EMAIL_MARKER] === true;
}
