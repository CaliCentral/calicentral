import "server-only";

import type { TokenSet } from "@auth/core/types";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import {
  configuredAuthProviders,
  getAuthSecret,
  getOAuthCredentials,
  isAuthConfigured,
  useSecureAuthCookies,
} from "@/lib/auth/config";
import {
  createAuthIdentity,
  createAuthIdentityFromToken,
  provisionContributorProfile,
  resolvePortalUser,
} from "@/lib/auth/identity";
import {
  fetchVerifiedGitHubProfile,
  hasVerifiedOAuthEmail,
} from "@/lib/auth/provider-verification";
import { resolveTrustedAuthRedirect } from "@/lib/auth/redirects";
import { isAuthProviderId } from "@/lib/auth/types";
import { safeLog } from "@/lib/observability/logger";
import { getSiteOrigin } from "@/lib/site/config";

const providers: Provider[] = isAuthConfigured
  ? getOAuthCredentials().map((credentials) => {
      if (credentials.id === "google") {
        return Google({
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
        });
      }

      return GitHub({
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        userinfo: {
          url: "https://api.github.com/user",
          async request({ tokens }: { tokens: TokenSet }) {
            return fetchVerifiedGitHubProfile(tokens.access_token);
          },
        },
      });
    })
  : [];

const authConfig = {
  secret: getAuthSecret(),
  providers,
  trustHost: isAuthConfigured,
  useSecureCookies: useSecureAuthCookies,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  logger: {
    error() {
      safeLog({
        severity: "error",
        event: "auth.runtime_error",
        routeCategory: "auth",
        errorCategory: "auth_error",
      });
    },
    warn() {
      safeLog({
        severity: "warning",
        event: "auth.runtime_warning",
        routeCategory: "auth",
        errorCategory: "auth_error",
      });
    },
    debug() {
      // Intentionally silent. Auth debug metadata can contain OAuth material.
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const provider = account?.provider;

      if (!isAuthProviderId(provider)) {
        safeLog({
          severity: "warning",
          event: "auth.provider_rejected",
          routeCategory: "auth",
          errorCategory: "auth_error",
        });
        return false;
      }

      if (
        !hasVerifiedOAuthEmail({
          provider,
          profile,
          userEmail: user.email,
        })
      ) {
        safeLog({
          severity: "warning",
          event: "auth.provider_rejected",
          routeCategory: "auth",
          errorCategory: "provider_email_unverified",
          provider,
        });
        return false;
      }

      const identity = createAuthIdentity(account, user);

      if (!identity) {
        return false;
      }

      await provisionContributorProfile(identity);
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        const identity = createAuthIdentity(account, user);

        if (identity) {
          token.authProvider = identity.provider;
          token.providerAccountId = identity.providerAccountId;
          token.email = identity.normalizedEmail;
          token.name = identity.name;
          token.picture = identity.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      const identity = createAuthIdentityFromToken(token);

      if (!identity) {
        session.user.id = "";
        session.user.displayName = session.user.name ?? "Contributor";
        session.user.role = "contributor";
        session.user.accessStatus = "pending";
        session.user.authProvider = null;
        session.user.profileConfigured = false;
        return session;
      }

      const portalUser = await resolvePortalUser(identity);

      session.user.id = portalUser.id;
      session.user.name = portalUser.displayName;
      session.user.displayName = portalUser.displayName;
      session.user.email = portalUser.email;
      session.user.image = portalUser.avatarUrl;
      session.user.role = portalUser.role;
      session.user.accessStatus = portalUser.accessStatus;
      session.user.authProvider = portalUser.authProvider;
      session.user.profileConfigured = portalUser.profileConfigured;

      return session;
    },
    redirect({ url }) {
      return resolveTrustedAuthRedirect(url, getSiteOrigin());
    },
  },
} satisfies NextAuthConfig;

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth(authConfig);

export {
  configuredAuthProviders,
  isAuthConfigured,
};
