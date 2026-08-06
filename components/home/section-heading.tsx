import { CategoryLabel } from "@/components/ui/category-label";

type SectionHeadingProps = {
  readonly headingId: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly index?: string;
  readonly theme?: "dark" | "light";
  readonly align?: "left" | "split";
};

export function SectionHeading({
  headingId,
  eyebrow,
  title,
  description,
  index,
  theme = "dark",
  align = "split",
}: SectionHeadingProps) {
  const isLight = theme === "light";

  return (
    <div
      className={`mb-9 border-t pt-5 sm:mb-12 sm:pt-6 ${
        isLight ? "border-on-light/20" : "border-white/15"
      } ${
        align === "split"
          ? "grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end"
          : "max-w-3xl"
      }`}
    >
      <div>
        {index ? (
          <p
            className={`mb-4 font-mono text-xs font-bold uppercase tracking-[0.17em] ${
              isLight ? "text-muted-dark" : "text-muted"
            }`}
          >
            Section {index} / Field module
          </p>
        ) : null}
        <div
          className={
            isLight
              ? "[&>span]:text-accent-dark [&>span>span]:bg-accent-dark"
              : ""
          }
        >
          <CategoryLabel inverted={!isLight}>{eyebrow}</CategoryLabel>
        </div>
        <h2
          id={headingId}
          className={`mt-4 max-w-4xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-5xl lg:text-6xl ${
            isLight ? "text-on-light" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {description ? (
        <p
          className={`max-w-xl text-sm leading-6 sm:text-base sm:leading-7 ${
            isLight ? "text-muted-dark" : "text-muted"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
