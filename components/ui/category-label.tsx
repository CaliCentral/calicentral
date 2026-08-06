import type { ReactNode } from "react";

type CategoryLabelProps = {
  readonly children: ReactNode;
  readonly inverted?: boolean;
};

export function CategoryLabel({
  children,
  inverted = false,
}: CategoryLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] ${
        inverted ? "text-accent" : "text-accent-dark"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1 w-5 ${inverted ? "bg-accent" : "bg-accent-dark"}`}
      />
      {children}
    </span>
  );
}
