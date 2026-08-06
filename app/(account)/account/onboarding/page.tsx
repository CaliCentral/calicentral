import type { Metadata } from "next";
import Link from "next/link";

import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import {
  resolveJoinIntent,
  type AccountCapability,
} from "@/lib/account/capabilities";
import { requireAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account onboarding",
};

type AccountOnboardingPageProps = {
  readonly searchParams: Promise<{
    intent?: string | string[];
  }>;
};

const submissionDestinations: Partial<Record<AccountCapability, string>> = {
  athlete: "/account/submissions/new?type=athleteNomination",
  organizer: "/account/submissions/new?type=competitionListing",
  contributor: "/account/submissions/new?type=storyPitch",
};

export default async function AccountOnboardingPage({
  searchParams,
}: AccountOnboardingPageProps) {
  const [params, user] = await Promise.all([
    searchParams,
    requireAuthenticatedUser("/account/onboarding"),
  ]);
  const intent = resolveJoinIntent(params.intent);
  const submissionDestination = submissionDestinations[intent.capability];
  const canSubmit = user.accessStatus === "active";

  return (
    <OperationsPage
      eyebrow="Account / Onboarding"
      title={`Begin as ${intent.title}`}
      description={intent.description}
      actions={
        <Link
          href="/account/profile"
          className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Complete account profile
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)]">
        <OperationsPanel
          title="Your next step"
          description="This path uses the existing Cali Central account and moderated submission workflow."
        >
          <p className="text-sm leading-7 text-muted">{intent.nextStep}</p>

          {submissionDestination && canSubmit ? (
            <Link
              href={submissionDestination}
              className="mt-6 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open the relevant submission form
            </Link>
          ) : null}

          {submissionDestination && !canSubmit ? (
            <p className="mt-6 border-l-2 border-amber-300 pl-4 text-xs leading-6 text-amber-100/80">
              Submission tools remain unavailable until the existing account
              access review is complete. Choosing this path does not bypass
              that review.
            </p>
          ) : null}
        </OperationsPanel>

        <OperationsNotice title="Capability boundary">
          <p>
            The selected path is used only to guide this onboarding screen. It
            is not an editorial role, verification badge, or permission grant,
            and it has not been saved as a subscription or public claim.
          </p>
          <p className="mt-3">
            One person may eventually use several member, athlete, organizer,
            or contributor capabilities through the same account.
          </p>
        </OperationsNotice>
      </div>
    </OperationsPage>
  );
}
