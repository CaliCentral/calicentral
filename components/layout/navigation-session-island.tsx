"use client";

import { useEffect, useState } from "react";

import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { signOutFromPublicHeader } from "@/lib/auth/actions";
import type { PortalUser } from "@/lib/auth/types";

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

// Provider-agnostic by construction: this fetches /api/session, which
// dispatches through the same getCurrentUser() every server-rendered page
// already uses to pick between Supabase and Auth.js, rather than assuming
// either backend the way next-auth/react's useSession() (Auth.js-only)
// previously did. That assumption was the root cause of the public header
// showing "signed out" for a genuinely-authenticated Supabase session --
// next-auth/react has no way to know about a session it didn't create.
function useSupabaseAwarePortalSession() {
  const [state, setState] = useState<{ status: "loading" | "authenticated" | "unauthenticated"; user: PortalUser | null }>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        const body = (response.ok ? await response.json() : { user: null }) as { user: PortalUser | null };
        if (!cancelled) setState({ status: body.user ? "authenticated" : "unauthenticated", user: body.user });
      } catch {
        if (!cancelled) setState({ status: "unauthenticated", user: null });
      }
    }
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function SessionAwareNavigation() {
  const { status, user } = useSupabaseAwarePortalSession();
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const canSubmit = Boolean(isAuthenticated && user?.accessStatus === "active");
  const canUseEditorialDesk = Boolean(
    isAuthenticated &&
    user?.accessStatus === "active" &&
    (user.role === "editor" || user.role === "admin"),
  );

  async function performSignOut() {
    await signOutFromPublicHeader();
  }

  return (
    <NavigationPresentation
      isAuthenticated={isAuthenticated}
      isSessionLoading={status === "loading"}
      canSubmit={canSubmit}
      canUseEditorialDesk={canUseEditorialDesk}
      displayName={user?.displayName || "Cali Central member"}
      onSignOut={performSignOut}
    />
  );
}

export function NavigationSessionIsland() {
  return <SessionAwareNavigation />;
}
