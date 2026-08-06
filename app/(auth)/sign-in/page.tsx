import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { PendingButton } from "@/components/operations/pending-button";
import {
  authConfiguration,
  configuredAuthProviders,
  getCurrentUser,
  isAuthConfigured,
  type AuthProviderId,
} from "@/lib/auth";
import { safeAuthReturnPath } from "@/lib/auth/redirects";
import { isSanityMutationConfigured } from "@/sanity/lib/write-client";

export const metadata: Metadata = {
  title: "Account sign in",
  description: "Secure access to a Cali Central account.",
};

type SignInPageProps = {
  readonly searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function safeCallbackPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return safeAuthReturnPath(candidate);
}

const safeErrorMessages: Record<string, string> = {
  AccessDenied:
    "This identity does not currently have access to the requested account area.",
  Configuration:
    "Account authentication is temporarily unavailable in this environment.",
  OAuthCallback:
    "The provider could not complete sign-in. Please try again.",
  OAuthAccountNotLinked:
    "Use the same provider previously connected to this contributor identity.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [params, currentUser] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  if (currentUser) {
    redirect(safeCallbackPath(params.callbackUrl));
  }

  const callbackPath = safeCallbackPath(params.callbackUrl);
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorCode
    ? (safeErrorMessages[errorCode] ??
      "Sign-in did not complete. No account changes were made.")
    : null;

  return (
    <main className="technical-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl overflow-hidden border border-white/15 bg-surface shadow-2xl shadow-black/30 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <section className="signal-scan flex flex-col justify-between border-b border-white/15 bg-canvas p-6 sm:p-9 lg:border-b-0 lg:border-r">
          <div>
            <Link
              href="/"
              aria-label="Return to Cali Central"
              className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <BrandMark className="h-9 w-auto" />
            </Link>
            <p className="mt-12 font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Cali Central account / Secure access
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-ink sm:text-5xl">
              Take your place in the field.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted">
              Use one private account to manage your profile, choose how you
              want to take part, submit information when eligible, and follow
              editorial review.
            </p>
          </div>
          <p className="mt-12 border-t border-white/10 pt-5 text-xs leading-5 text-white/50">
            This operational portal is separate from public athlete profiles
            and does not publish submissions automatically.
          </p>
        </section>

        <section className="p-6 sm:p-9 lg:p-12" aria-labelledby="access-heading">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Secure identity
          </p>
          <h2
            id="access-heading"
            className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-ink"
          >
            Sign in to continue
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Use an available provider for the same Cali Central account across
            member, athlete, organizer, or contributor activity. We do not
            offer passwords or an impersonation login.
          </p>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-6 border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
            >
              {errorMessage}
            </div>
          ) : null}

          {!isAuthConfigured ? (
            <div className="mt-7 border border-amber-300/35 bg-amber-300/[0.08] p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.06em] text-amber-100">
                Provider configuration required
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Account authentication has not been enabled for this
                environment. Public Cali Central pages and the Join guide remain
                available.
              </p>
              {authConfiguration.googlePartiallyConfigured ||
              authConfiguration.githubPartiallyConfigured ? (
                <p className="mt-3 text-xs leading-5 text-amber-100/80">
                  A provider credential pair is incomplete. Both its client ID
                  and secret are required, together with AUTH_SECRET.
                </p>
              ) : null}
              {!authConfiguration.authUrlConfigured ? (
                <p className="mt-3 text-xs leading-5 text-amber-100/80">
                  A canonical AUTH_URL origin is also required so callbacks do
                  not rely on an untrusted request host.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              {configuredAuthProviders.map((provider) => (
                <ProviderForm
                  key={provider.id}
                  providerId={provider.id}
                  providerLabel={provider.label}
                  callbackPath={callbackPath}
                />
              ))}
            </div>
          )}

          {isAuthConfigured && !isSanityMutationConfigured() ? (
            <p className="mt-5 border-l-2 border-amber-300 pl-4 text-xs leading-5 text-amber-100/80">
              Sign-in is available, but account provisioning and portal
              changes require a configured Sanity write token.
            </p>
          ) : null}

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Before submitting
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted">
              Do not include confidential information or private athlete
              contact details. Submissions may be reviewed and edited by Cali
              Central staff, and submission does not guarantee publication.
            </p>
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Return to public site
          </Link>
        </section>
      </div>
    </main>
  );
}

function ProviderForm({
  providerId,
  providerLabel,
  callbackPath,
}: {
  readonly providerId: AuthProviderId;
  readonly providerLabel: string;
  readonly callbackPath: string;
}) {
  async function startProviderSignIn() {
    "use server";

    const configured = configuredAuthProviders.some(
      (provider) => provider.id === providerId,
    );

    if (!configured) {
      redirect("/auth/error?code=Configuration");
    }

    await signIn(providerId, { redirectTo: callbackPath });
  }

  return (
    <form action={startProviderSignIn}>
      <PendingButton
        pendingLabel={`Connecting to ${providerLabel}…`}
        className="w-full border border-white/20 bg-white/[0.04] text-ink hover:border-accent hover:text-accent focus-visible:outline-accent"
      >
        {`Continue with ${providerLabel}`}
      </PendingButton>
    </form>
  );
}
