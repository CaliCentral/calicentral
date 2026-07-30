import { CategoryLabel } from "@/components/ui/category-label";

type SectionHeadingProps = {
  readonly headingId: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly inverted?: boolean;
  readonly align?: "left" | "split";
};

export function SectionHeading({
  headingId,
  eyebrow,
  title,
  description,
  inverted = false,
  align = "split",
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-9 border-t pt-5 sm:mb-12 sm:pt-6 ${
        inverted ? "border-white/20" : "border-ink/15"
      } ${
        align === "split"
          ? "grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] md:items-end"
          : "max-w-3xl"
      }`}
    >
      <div>
        <CategoryLabel inverted={inverted}>{eyebrow}</CategoryLabel>
        <h2
          id={headingId}
          className={`mt-4 max-w-4xl text-balance text-3xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-4xl lg:text-5xl ${
            inverted ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {description ? (
        <p
          className={`max-w-xl text-sm leading-6 sm:text-base sm:leading-7 ${
            inverted ? "text-white/65" : "text-muted"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
