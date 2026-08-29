import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { PortalNavigationLink } from "@/components/operations/portal-navigation-link";
import { StatusLabel } from "@/components/operations/status-label";
import { featureConfig } from "@/lib/features/config";
import { studioUrl } from "@/lib/site/studio";

type PortalShellProps = {
  readonly children: ReactNode;
  readonly section: "account" | "admin";
  readonly displayName: string;
  readonly role: string;
  readonly accessStatus: string;
  readonly signOutAction: () => Promise<void>;
};

const accountLinks = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  {
    href: "/account/submissions",
    label: "Submissions",
    matchNested: true,
    excludedPath: "/account/submissions/new",
  },
  { href: "/account/submissions/new", label: "New submission" },
  { href: "/account/saved", label: "Saved", community: true },
  { href: "/account/collections", label: "Collections", community: true },
  { href: "/account/following", label: "Following", community: true },
  { href: "/account/notifications", label: "Notifications", community: true },
  { href: "/account/training", label: "Training", community: true },
  { href: "/account/records", label: "PRs", community: true },
  { href: "/account/skills", label: "Skills", community: true },
  { href: "/account/media", label: "Media", community: true },
  { href: "/account/athlete-profile", label: "Athlete profile", community: true },
  { href: "/account/teams", label: "Teams" },
] as const;

const adminLinks = [
  { href: "/admin", label: "Desk overview" },
  {
    href: "/admin/submissions",
    label: "Submission queue",
    matchNested: true,
  },
  {
    href: "/admin/contributors",
    label: "Contributors",
    matchNested: true,
  },
  {
    href: "/admin/athletes",
    label: "Athletes",
    matchNested: true,
  },
  {
    href: "/admin/competitions",
    label: "Competitions",
    matchNested: true,
  },
  {
    href: "/admin/rankings",
    label: "Rankings",
    matchNested: true,
  },
  { href: "/admin/audit", label: "Audit history" },
  { href: "/admin/community", label: "Trust & Safety", community: true },
] as const;

export function PortalShell({
  children,
  section,
  displayName,
  role,
  accessStatus,
  signOutAction,
}: PortalShellProps) {
  const links = section === "admin"
    ? adminLinks.filter(
        (link) =>
          (link.href !== "/admin/audit" || role === "admin") &&
          (!("community" in link) || !link.community || featureConfig.community),
      )
    : accountLinks.filter(
        (link) =>
          !("community" in link) || !link.community || featureConfig.community,
      );
  const canUseAdmin =
    accessStatus === "active" && (role === "editor" || role === "admin");

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#portal-main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 bg-accent px-4 py-3 text-sm font-bold text-canvas transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to portal content
      </a>
      <header className="border-b border-white/12 bg-surface">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Cali Central home"
              className="inline-flex min-h-11 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <BrandMark className="h-8 w-auto" />
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusLabel kind="role" value={role} />
              <StatusLabel kind="access" value={accessStatus} />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {section === "admin"
                  ? "Editorial operations / Internal"
                  : "Contributor portal / Account"}
              </p>
              <p className="mt-2 text-sm text-muted">Signed in as {displayName}</p>
            </div>
            <nav aria-label={`${section} navigation`}>
              <ul className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <PortalNavigationLink {...link} />
                  </li>
                ))}
                {section === "account" && canUseAdmin ? (
                  <li>
                    <Link
                      href="/admin"
                      className="inline-flex min-h-10 items-center border border-accent/45 px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.11em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Editorial desk
                    </Link>
                  </li>
                ) : null}
                {section === "admin" ? (
                  <>
                    <li>
                      <Link
                        href="/account"
                        className="inline-flex min-h-10 items-center border border-white/15 px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.11em] text-white/75 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        My account
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={studioUrl}
                        className="inline-flex min-h-10 items-center border border-accent/45 px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.11em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Open Studio
                      </Link>
                    </li>
                  </>
                ) : null}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main id="portal-main">{children}</main>
    </div>
  );
}
