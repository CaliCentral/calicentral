"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";

import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import type { NavigationItem } from "@/types/content";

type NavigationSessionIslandProps = {
  readonly items: readonly NavigationItem[];
};

type NavigationPresentationProps = {
  readonly items: readonly NavigationItem[];
  readonly isAuthenticated: boolean;
  readonly isSessionLoading: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly onSignOut: () => Promise<void>;
};

function NavigationPresentation({
  items,
  isAuthenticated,
  isSessionLoading,
  canUseEditorialDesk,
  onSignOut,
}: NavigationPresentationProps) {
  return (
    <>
      <DesktopNavigation
        items={items}
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        canUseEditorialDesk={canUseEditorialDesk}
        onSignOut={onSignOut}
      />
      <MobileNavigation
        items={items}
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        canUseEditorialDesk={canUseEditorialDesk}
        onSignOut={onSignOut}
      />
    </>
  );
}

function SessionAwareNavigation({
  items,
}: {
  readonly items: readonly NavigationItem[];
}) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated" && Boolean(user?.id);
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
      items={items}
      isAuthenticated={isAuthenticated}
      isSessionLoading={status === "loading"}
      canUseEditorialDesk={canUseEditorialDesk}
      onSignOut={performSignOut}
    />
  );
}

export function NavigationSessionIsland({
  items,
}: NavigationSessionIslandProps) {
  return (
    <SessionProvider>
      <SessionAwareNavigation items={items} />
    </SessionProvider>
  );
}
