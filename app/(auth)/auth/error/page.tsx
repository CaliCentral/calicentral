import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export const metadata: Metadata = {
  title: "Authentication unavailable",
  description: "A safe contributor authentication error page.",
};

const safeErrorContent: Record<
  string,
  { readonly title: string; readonly description: string }
> = {
  Configuration: {
    title: "Sign-in is not configured",
    description:
      "A complete provider credential pair and application secret are required before contributor sign-in can begin.",
  },
  AccessDenied: {
    title: "Access was not granted",
    description:
      "This identity cannot access the requested contributor resource. If you believe this is incorrect, contact the editorial team through your existing channel.",
  },
  Suspended: {
    title: "Account access is restricted",
    description:
      "This contributor account cannot use portal tools right now. No private moderation reason is shown here.",
  },
  Provisioning: {
    title: "Account setup is unavailable",
    description:
      "Authentication completed, but contributor setup could not be saved. The editorial team must restore the operational write configuration before changes can be made.",
  },
  OAuthCallback: {
    title: "Provider callback did not complete",
    description:
      "The sign-in provider could not complete the secure callback. Try again without changing the callback URL.",
  },
};

type AuthErrorPageProps = {
  readonly searchParams: Promise<{
    error?: string | string[];
    code?: string | string[];
  }>;
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const rawCode = params.code ?? params.error;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const content =
    (code ? safeErrorContent[code] : undefined) ?? safeErrorContent.OAuthCallback;

  return (
    <main className="technical-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-2xl border border-white/15 bg-surface p-7 sm:p-10">
        <Link
          href="/"
          aria-label="Cali Central home"
          className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <BrandMark className="h-8 w-auto" />
        </Link>
        <p className="mt-10 font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Contributor access / Safe error
        </p>
        <h1 className="mt-4 text-balance text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-ink sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          {content.description}
        </p>
        <p className="mt-4 text-sm leading-6 text-white/55">
          No provider response, internal diagnostic, or credential detail is
          displayed on this page.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Try sign-in again
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
