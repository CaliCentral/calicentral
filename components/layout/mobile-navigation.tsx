"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { NavigationItem } from "@/types/content";

type MobileNavigationProps = {
  readonly items: readonly NavigationItem[];
};

export function MobileNavigation({ items }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = "mobile-navigation";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-md border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${
              isOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform ${
              isOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        className="absolute inset-x-0 top-full border-b border-ink/15 bg-canvas px-5 pb-6 pt-2 shadow-[0_18px_35px_rgba(25,22,18,0.12)] sm:px-8"
      >
        <nav aria-label="Mobile primary navigation">
          <ul className="divide-y divide-ink/10">
            {items.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={index === 0 ? "page" : undefined}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center justify-between py-3 text-lg font-semibold tracking-[-0.02em] text-ink transition-colors hover:text-rust focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-sm text-rust">
                    0{index + 1}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
