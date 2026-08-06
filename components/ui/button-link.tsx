import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  readonly children: ReactNode;
  readonly href: string;
  readonly variant?: "primary" | "light" | "outline";
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
      "bg-accent text-canvas hover:bg-accent-strong focus-visible:outline-accent",
    light:
      "bg-paper text-on-light hover:bg-white focus-visible:outline-paper",
    outline:
      "border border-white/30 bg-transparent text-ink hover:border-accent hover:text-accent focus-visible:outline-accent",
  };

  return (
    <Link
      href={href}
      className={`clip-corner inline-flex min-h-12 items-center justify-center gap-3 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${variants[variant]} ${className}`}
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
