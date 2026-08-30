import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/operations/portal-shell";
import { requireAuthenticatedUser, signOutCurrentSession } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

// Keep authorization request-bound even when a credential-free build would
// otherwise be eligible for static prerendering.
export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await requireAuthenticatedUser("/account");

  async function performSignOut() {
    "use server";
    await signOutCurrentSession("/");
  }

  return (
    <PortalShell
      section="account"
      displayName={user.displayName}
      role={user.role}
      accessStatus={user.accessStatus}
      signOutAction={performSignOut}
    >
      {children}
    </PortalShell>
  );
}
