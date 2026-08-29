"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";

import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

type NavigationPresentationProps = {
  readonly isAuthenticated: boolean;
  readonly isSessionLoading: boolean;
  readonly canSubmit: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly displayName: string;
  readonly onSignOut: () => Promise<void>;
};

function NavigationPresentation({
  isAuthenticated,
  isSessionLoading,
  canSubmit,
  canUseEditorialDesk,
  displayName,
  onSignOut,
}: NavigationPresentationProps) {
  return (
    <>
      <DesktopNavigation
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        canSubmit={canSubmit}
        canUseEditorialDesk={canUseEditorialDesk}
        displayName={displayName}
        onSignOut={onSignOut}
      />
      <MobileNavigation
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        canSubmit={canSubmit}
        canUseEditorialDesk={canUseEditorialDesk}
        displayName={displayName}
        onSignOut={onSignOut}
      />
    </>
  );
}

function SessionAwareNavigation() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated" && Boolean(user?.id);
  const canSubmit = Boolean(isAuthenticated && user?.accessStatus === "active");
  const canUseEditorialDesk = Boolean(
    isAuthenticated &&
    user?.accessStatus === "active" &&
    (user.role === "editor" || user.role === "admin"),
  );

  async function performSignOut() {
    await signOut({ redirectTo: "/" });
  }

  return (
    <NavigationPresentation
      isAuthenticated={isAuthenticated}
      isSessionLoading={status === "loading"}
      canSubmit={canSubmit}
      canUseEditorialDesk={canUseEditorialDesk}
      displayName={user?.displayName || user?.name || "Cali Central member"}
      onSignOut={performSignOut}
    />
  );
}

export function NavigationSessionIsland() {
  return (
    <SessionProvider>
      <SessionAwareNavigation />
    </SessionProvider>
  );
}
