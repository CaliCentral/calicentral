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
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] ${
        inverted ? "text-accent" : "text-rust"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-px w-5 ${inverted ? "bg-accent" : "bg-rust"}`}
      />
      {children}
    </span>
  );
}
