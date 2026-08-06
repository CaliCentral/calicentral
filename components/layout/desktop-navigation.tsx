"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/types/content";

type DesktopNavigationProps = {
  readonly items: readonly NavigationItem[];
  readonly isAuthenticated: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly onSignOut: () => Promise<void>;
};

function isActiveRoute(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href.includes("#")) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation({
  items,
  isAuthenticated,
  canUseEditorialDesk,
  onSignOut,
}: DesktopNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="hidden xl:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = isActiveRoute(item.href, pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group/nav relative inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent xl:px-4 ${
                  isActive
                    ? "text-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-200 xl:inset-x-4 ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover/nav:scale-x-100"
                  }`}
                />
              </Link>
            </li>
          );
        })}
        {isAuthenticated ? (
          <>
            <li className="ml-1 border-l border-ink/15 pl-1">
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Account
              </Link>
            </li>
            {canUseEditorialDesk ? (
              <li>
                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent transition-colors hover:text-accent-strong focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Editorial desk
                </Link>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Sign out
              </button>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}
