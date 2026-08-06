"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { NavigationItem } from "@/types/content";

type MobileNavigationProps = {
  readonly items: readonly NavigationItem[];
  readonly isAuthenticated: boolean;
  readonly canUseEditorialDesk: boolean;
  readonly onSignOut: () => Promise<void>;
};

export function MobileNavigation({
  items,
  isAuthenticated,
  canUseEditorialDesk,
  onSignOut,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelId = useId();
  const panelTitleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
    if (!isOpen || event.key !== "Tab") {
      return;
    }

    const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href]'
    );

    if (!focusableElements?.length) {
      return;
    }

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
            <span id={panelTitleId}>Signal / Navigation</span>
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
              {items.map((item, index) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : !item.href.includes("#") &&
                      (pathname === item.href ||
                        pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={closeMenuAndRestoreFocus}
                      className={`group relative grid min-h-16 grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-3 text-xl font-black uppercase tracking-[-0.035em] transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:min-h-[4.5rem] sm:text-2xl ${
                        isActive
                          ? "text-accent"
                          : "text-ink hover:text-accent"
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

          {isAuthenticated ? (
            <nav
              aria-label="Contributor navigation"
              className="mt-5 border-t border-ink/15 pt-5"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Contributor session
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                <li>
                  <Link
                    href="/account"
                    onClick={closeMenuAndRestoreFocus}
                    className="inline-flex min-h-12 w-full items-center justify-between border border-ink/20 px-4 text-sm font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Account
                    <span aria-hidden="true" className="text-accent">
                      →
                    </span>
                  </Link>
                </li>
                {canUseEditorialDesk ? (
                  <li>
                    <Link
                      href="/admin"
                      onClick={closeMenuAndRestoreFocus}
                      className="inline-flex min-h-12 w-full items-center justify-between border border-accent/45 px-4 text-sm font-bold uppercase tracking-[0.1em] text-accent transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Editorial desk
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ) : null}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void onSignOut();
                    }}
                    className="inline-flex min-h-12 w-full items-center border border-ink/20 px-4 text-sm font-bold uppercase tracking-[0.1em] text-muted transition-colors hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </nav>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 border-t border-ink/15 pt-5 font-mono text-xs uppercase tracking-[0.16em] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>California base</span>
            <span>Worldwide field</span>
          </div>
        </div>
      </div>
    </div>
  );
}
