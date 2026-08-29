"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

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

type MobileNavigationProps = {
  readonly isAuthenticated: boolean;
  readonly isSessionLoading: boolean;
  readonly canSubmit: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly displayName: string;
  readonly onSignOut: () => Promise<void>;
};

function isActiveRoute(href: string, pathname: string) {
  const hrefPath = href.split(/[?#]/, 1)[0] ?? href;
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function SectionLinks({
  items,
  pathname,
  onNavigate,
}: {
  readonly items: readonly NavigationDestination[];
  readonly pathname: string;
  readonly onNavigate: () => void;
}) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const active = isActiveRoute(item.href, pathname);

        return (
          <li key={`${item.label}-${item.href}`}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`group flex min-h-14 items-start justify-between gap-4 border px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-ink/20 text-ink hover:border-accent hover:text-accent"
              }`}
            >
              <span>
                <span className="block text-sm font-black uppercase tracking-[0.04em]">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mt-1 block text-xs normal-case leading-5 tracking-normal text-muted">
                    {item.description}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className="text-accent transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNavigation({
  isAuthenticated,
  isSessionLoading,
  canSubmit,
  canUseEditorialDesk,
  displayName,
  onSignOut,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelId = useId();
  const panelTitleId = useId();
  const createItems = [
    ...memberCreateItems,
    ...(canSubmit ? contributorCreateItems : []),
  ];
  const profileItems = [
    ...baseProfileItems,
    ...(canSubmit ? contributorProfileItems : []),
    ...(canUseEditorialDesk ? editorialProfileItems : []),
  ];

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      firstLinkRef.current?.focus();
    });

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  function closeMenuAndRestoreFocus() {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function trapMenuFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!isOpen || event.key !== "Tab") return;

    const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), a[href]",
    );

    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((current) => !current)}
        className={`group flex size-11 items-center justify-center border text-ink transition-colors hover:border-accent hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isOpen
            ? "border-accent bg-accent text-canvas"
            : "border-ink/20 bg-surface"
        }`}
      >
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ${
              isOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-200 ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-200 ${
              isOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={panelTitleId}
        hidden={!isOpen}
        onKeyDown={trapMenuFocus}
        className="fixed inset-x-0 top-[4.5rem] h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-ink/10 bg-canvas shadow-[0_24px_70px_rgba(0,0,0,0.58)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(243,241,236,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(243,241,236,0.035)_1px,transparent_1px)] [background-size:2rem_2rem]"
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-[86rem] flex-col px-5 pb-8 pt-6 sm:px-8">
          <div className="flex items-center justify-between gap-4 border-b border-ink/15 pb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            <span id={panelTitleId}>Cali Central / Navigation</span>
            <button
              type="button"
              onClick={closeMenuAndRestoreFocus}
              className="inline-flex min-h-11 items-center gap-2 px-2 text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Close
              <span aria-hidden="true" className="text-accent">
                ×
              </span>
            </button>
          </div>

          <nav aria-label="Mobile primary navigation">
            <ul className="divide-y divide-ink/10">
              {primaryNavigationItems.map((item, index) => {
                const isActive = isActiveRoute(item.href, pathname);

                return (
                  <li key={item.href}>
                    <Link
                      ref={
                        (index === 0
                          ? firstLinkRef
                          : undefined) as Ref<HTMLAnchorElement>
                      }
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={closeMenuAndRestoreFocus}
                      className={`group relative grid min-h-16 grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-3 text-xl font-black uppercase tracking-[-0.035em] transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:min-h-[4.5rem] sm:text-2xl ${
                        isActive ? "text-accent" : "text-ink hover:text-accent"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="font-mono text-xs font-semibold tracking-[0.12em] text-muted"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{item.label}</span>
                      <span
                        aria-hidden="true"
                        className="text-base text-accent transition-transform duration-200 group-hover:translate-x-1"
                      >
                        →
                      </span>
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-3 -left-5 w-0.5 bg-accent sm:-left-8"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-5 grid gap-3 border-y border-ink/15 py-5 sm:grid-cols-2">
            <Link
              href="/search"
              onClick={closeMenuAndRestoreFocus}
              className="inline-flex min-h-14 items-center justify-between border border-ink/20 px-4 text-sm font-black uppercase tracking-[0.08em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Search Cali Central <span aria-hidden="true">⌕</span>
            </Link>
            {isAuthenticated ? (
              <a
                href="#mobile-create"
                className="clip-corner inline-flex min-h-14 items-center justify-between bg-accent px-4 text-sm font-black uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                + Create <span aria-hidden="true">↓</span>
              </a>
            ) : !isSessionLoading ? (
              <Link
                href="/join"
                onClick={closeMenuAndRestoreFocus}
                className="clip-corner inline-flex min-h-14 items-center justify-between bg-accent px-4 text-sm font-black uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Join Cali Central <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>

          {isAuthenticated ? (
            <section
              id="mobile-create"
              aria-labelledby="mobile-create-heading"
              className="scroll-mt-6 border-b border-ink/15 py-6"
            >
              <p
                id="mobile-create-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent"
              >
                + Create
              </p>
              <SectionLinks
                items={createItems}
                pathname={pathname}
                onNavigate={closeMenuAndRestoreFocus}
              />
              {!canSubmit ? (
                <p className="mt-3 text-xs leading-5 text-muted">
                  Editorial submission options appear after existing account
                  access checks allow them.
                </p>
              ) : null}
            </section>
          ) : null}

          <section
            aria-labelledby="mobile-more-heading"
            className="border-b border-ink/15 py-6"
          >
            <p
              id="mobile-more-heading"
              className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted"
            >
              More
            </p>
            <SectionLinks
              items={moreNavigationItems}
              pathname={pathname}
              onNavigate={closeMenuAndRestoreFocus}
            />
          </section>

          {isAuthenticated ? (
            <section aria-labelledby="mobile-profile-heading" className="py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p
                  id="mobile-profile-heading"
                  className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted"
                >
                  Profile
                </p>
                <p className="max-w-full truncate text-xs text-muted">
                  {displayName}
                </p>
              </div>
              <SectionLinks
                items={profileItems}
                pathname={pathname}
                onNavigate={closeMenuAndRestoreFocus}
              />
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void onSignOut();
                }}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-between border border-ink/20 px-4 text-sm font-bold uppercase tracking-[0.1em] text-muted transition-colors hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
              >
                Sign out <span aria-hidden="true">→</span>
              </button>
            </section>
          ) : !isSessionLoading ? (
            <nav aria-label="Account access" className="py-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Account access
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/sign-in"
                  onClick={closeMenuAndRestoreFocus}
                  className="inline-flex min-h-12 items-center justify-between border border-ink/20 px-4 text-sm font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Sign in <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/join"
                  onClick={closeMenuAndRestoreFocus}
                  className="clip-corner inline-flex min-h-12 items-center justify-between bg-accent px-4 text-sm font-bold uppercase tracking-[0.1em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Join <span aria-hidden="true">→</span>
                </Link>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
