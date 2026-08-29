"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import {
  baseProfileItems,
  contributorCreateItems,
  contributorProfileItems,
  editorialProfileItems,
  memberCreateItems,
  moreNavigationItems,
  type NavigationDestination,
  primaryNavigationItems,
} from "@/components/layout/navigation-items";

type DesktopNavigationProps = {
  readonly isAuthenticated: boolean;
  readonly isSessionLoading: boolean;
  readonly canSubmit: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly displayName: string;
  readonly onSignOut: () => Promise<void>;
};

function routePath(href: string) {
  return href.split(/[?#]/, 1)[0] ?? href;
}

function isActiveRoute(href: string, pathname: string) {
  const hrefPath = routePath(href);

  if (hrefPath === "/") {
    return pathname === "/";
  }

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function profileInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "CC";
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 10a5 5 0 0 1 10 0c0 5 2 6 2 6H5s2-1 2-6Z" />
      <path d="M10 19h4" />
    </svg>
  );
}

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 8"
      className={`h-2 w-3 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m1 1 5 5 5-5" />
    </svg>
  );
}

function NavigationDisclosure({
  label,
  items,
  pathname,
  align = "left",
  active = false,
  emphasized = false,
  buttonLeading,
  footer,
}: {
  readonly label: string;
  readonly items: readonly NavigationDestination[];
  readonly pathname: string;
  readonly align?: "left" | "right";
  readonly active?: boolean;
  readonly emphasized?: boolean;
  readonly buttonLeading?: ReactNode;
  readonly footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={`relative inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.13em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          emphasized
            ? "clip-corner bg-accent text-canvas hover:bg-accent-strong"
            : active || open
              ? "text-accent"
              : "text-muted hover:text-ink"
        }`}
      >
        {buttonLeading}
        <span>{label}</span>
        <ChevronIcon open={open} />
        {!emphasized ? (
          <span
            aria-hidden="true"
            className={`absolute inset-x-3 bottom-0 h-0.5 origin-left bg-accent transition-transform ${
              active || open ? "scale-x-100" : "scale-x-0"
            }`}
          />
        ) : null}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={`absolute top-[calc(100%+0.75rem)] z-50 w-[22rem] border border-white/15 bg-surface p-2 shadow-[0_24px_70px_rgba(0,0,0,0.65)] ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <ul className="divide-y divide-white/10">
          {items.map((item) => {
            const itemActive = isActiveRoute(item.href, pathname);

            return (
              <li key={`${item.label}-${item.href}`}>
                <Link
                  href={item.href}
                  aria-current={itemActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="group grid min-h-14 grid-cols-[1fr_auto] gap-3 px-3 py-3 transition-colors hover:bg-canvas focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                >
                  <span>
                    <span
                      className={`block text-sm font-black uppercase tracking-[0.02em] ${
                        itemActive
                          ? "text-accent"
                          : "text-ink group-hover:text-accent"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className="pt-0.5 text-accent transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {footer ? (
          <div className="border-t border-white/15 p-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function DesktopNavigation({
  isAuthenticated,
  isSessionLoading,
  canSubmit,
  canUseEditorialDesk,
  displayName,
  onSignOut,
}: DesktopNavigationProps) {
  const pathname = usePathname();
  const createItems = [
    ...memberCreateItems,
    ...(canSubmit ? contributorCreateItems : []),
  ];
  const profileItems = [
    ...baseProfileItems,
    ...(canSubmit ? contributorProfileItems : []),
    ...(canUseEditorialDesk ? editorialProfileItems : []),
  ];
  const moreActive = moreNavigationItems
    .filter((item) => !item.href.startsWith("/account"))
    .some((item) => isActiveRoute(item.href, pathname));

  return (
    <nav aria-label="Primary navigation" className="hidden xl:block">
      <ul className="flex items-center gap-1">
        {primaryNavigationItems.map((item) => {
          const isActive = isActiveRoute(item.href, pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group/nav relative inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.13em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive ? "text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-200 ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover/nav:scale-x-100"
                  }`}
                />
              </Link>
            </li>
          );
        })}

        <li>
          <NavigationDisclosure
            key={`more-${pathname}`}
            label="More"
            items={moreNavigationItems}
            pathname={pathname}
            active={moreActive}
          />
        </li>

        <li className="ml-1 border-l border-ink/15 pl-1">
          <Link
            href="/search"
            aria-current={
              isActiveRoute("/search", pathname) ? "page" : undefined
            }
            className={`inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.13em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActiveRoute("/search", pathname)
                ? "text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            <SearchIcon />
            Search
          </Link>
        </li>

        {isAuthenticated ? (
          <>
            <li>
              <Link
                href="/account/notifications"
                aria-current={
                  isActiveRoute("/account/notifications", pathname)
                    ? "page"
                    : undefined
                }
                className={`inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.13em] transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActiveRoute("/account/notifications", pathname)
                    ? "text-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                <NotificationIcon />
                <span className="sr-only 2xl:not-sr-only">Notifications</span>
              </Link>
            </li>
            <li>
              <NavigationDisclosure
                key={`create-${pathname}`}
                label="Create"
                items={createItems}
                pathname={pathname}
                emphasized
              />
            </li>
            <li>
              <NavigationDisclosure
                key={`profile-${pathname}`}
                label="Profile"
                items={profileItems}
                pathname={pathname}
                align="right"
                active={
                  pathname.startsWith("/account") ||
                  pathname.startsWith("/admin")
                }
                buttonLeading={
                  <span
                    aria-hidden="true"
                    className="grid size-7 place-items-center rounded-full border border-current/35 font-mono text-[0.58rem] tracking-normal"
                  >
                    {profileInitials(displayName)}
                  </span>
                }
                footer={
                  <div>
                    <p className="truncate text-xs text-muted">
                      Signed in as {displayName}
                    </p>
                    <button
                      type="button"
                      onClick={() => void onSignOut()}
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-between border border-white/15 px-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.11em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Sign out <span aria-hidden="true">→</span>
                    </button>
                  </div>
                }
              />
            </li>
          </>
        ) : !isSessionLoading ? (
          <>
            <li>
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/join"
                className="clip-corner inline-flex min-h-11 items-center bg-accent px-4 text-xs font-bold uppercase tracking-[0.13em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Join
              </Link>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}
