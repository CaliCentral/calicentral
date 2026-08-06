import type { Metadata } from "next";
import Link from "next/link";

import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { requireAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account access",
};

type AccountAccessPageProps = {
  readonly searchParams: Promise<{
    reason?: string | string[];
    status?: string | string[];
  }>;
};

const accessCopy: Record<
  string,
  { readonly title: string; readonly description: string }
> = {
  pending: {
    title: "Account setup is pending",
    description:
      "Your identity is authenticated, but contributor setup or activation has not completed. Portal mutations remain unavailable.",
  },
  suspended: {
    title: "Account access is suspended",
    description:
      "You can remain signed in to see this status and sign out, but submission and editorial tools are unavailable.",
  },
  archived: {
    title: "Account access is archived",
    description:
      "This account is retained as a historical contributor record and cannot use active portal tools.",
  },
  forbidden: {
    title: "You do not have access to that workspace",
    description:
      "The requested editorial operation requires a higher active role. Authorization is checked on the server.",
  },
};

export default async function AccountAccessPage({
  searchParams,
}: AccountAccessPageProps) {
  const [user, params] = await Promise.all([
    requireAuthenticatedUser("/account/access"),
    searchParams,
  ]);
  const reasonValue = Array.isArray(params.reason)
    ? params.reason[0]
    : params.reason;
  const reason = reasonValue === "forbidden"
    ? "forbidden"
    : user.accessStatus;
  const content = accessCopy[reason] ?? {
    title: "Account access is unavailable",
    description:
      "This contributor identity cannot use the requested portal feature.",
  };

  return (
    <OperationsPage
      eyebrow="Account / Access status"
      title={content.title}
      description={content.description}
      actions={
        <Link
          href="/"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Visit public site
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <OperationsPanel
          title="Current account record"
          description="No private moderation reason or internal editorial note is exposed here."
        >
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Identity
              </dt>
              <dd className="mt-2 break-words font-semibold text-ink">
                {user.displayName}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Access
              </dt>
              <dd className="mt-2">
                <StatusLabel kind="access" value={user.accessStatus} />
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Role
              </dt>
              <dd className="mt-2">
                <StatusLabel kind="role" value={user.role} />
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Profile provisioning
              </dt>
              <dd className="mt-2 text-sm text-muted">
                {user.profileConfigured ? "Contributor record available" : "Not saved"}
              </dd>
            </div>
          </dl>
        </OperationsPanel>
        <OperationsPanel
          title="What you can do"
          description="Public reporting remains available regardless of portal access."
        >
          <ul className="space-y-3 text-sm leading-6 text-muted">
            <li>Review the status shown on this page.</li>
            {user.accessStatus === "pending" && user.profileConfigured ? (
              <li>
                <Link
                  href="/account/profile"
                  className="font-semibold text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Complete the approved contributor-profile fields
                </Link>{" "}
                while activation is pending.
              </li>
            ) : null}
            <li>Sign out from the portal header.</li>
            <li>
              Contact the editorial team through an existing working channel if
              you believe the restriction is incorrect.
            </li>
          </ul>
        </OperationsPanel>
      </div>
    </OperationsPage>
  );
}
