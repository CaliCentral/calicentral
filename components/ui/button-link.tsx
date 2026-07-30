import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  readonly children: ReactNode;
  readonly href: string;
  readonly variant?: "primary" | "light";
  readonly className?: string;
};

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const variants = {
    primary:
      "bg-ink text-canvas hover:bg-accent hover:text-ink focus-visible:outline-ink",
    light:
      "bg-canvas text-ink hover:bg-accent focus-visible:outline-canvas",
  };

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-md px-5 py-3 text-sm font-bold tracking-[-0.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${variants[variant]} ${className}`}
    >
      {children}
      <ArrowIcon />
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
    >
      <path
        d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
