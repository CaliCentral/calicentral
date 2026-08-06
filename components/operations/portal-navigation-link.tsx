"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PortalNavigationLinkProps = {
  readonly href: string;
  readonly label: string;
  readonly matchNested?: boolean;
  readonly excludedPath?: string;
};

export function PortalNavigationLink({
  href,
  label,
  matchNested = false,
  excludedPath,
}: PortalNavigationLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (matchNested &&
      pathname.startsWith(`${href}/`) &&
      pathname !== excludedPath);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex min-h-10 items-center border px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.11em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        isActive
          ? "border-accent bg-accent/10 text-accent"
          : "border-white/15 text-white/75 hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </Link>
  );
}
