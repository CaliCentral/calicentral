import type { Metadata } from "next";
import type { ReactNode } from "react";

import { signOut } from "@/auth";
import { PortalShell } from "@/components/operations/portal-shell";
import { requireEditor } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

// Every editorial role/access decision must be resolved for the current
// request, including builds created before OAuth credentials are supplied.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await requireEditor("/admin");

  async function performSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <PortalShell
      section="admin"
      displayName={user.displayName}
      role={user.role}
      accessStatus={user.accessStatus}
      signOutAction={performSignOut}
    >
      {children}
    </PortalShell>
  );
}
