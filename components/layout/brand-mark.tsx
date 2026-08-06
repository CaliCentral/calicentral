type BrandMarkProps = {
  readonly className?: string;
  readonly size?: "default" | "large";
};

export function BrandMark({
  className = "",
  size = "default",
}: BrandMarkProps) {
  const isLarge = size === "large";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center ${
        isLarge ? "gap-4" : "gap-3"
      } ${className}`}
    >
      <span
        className={`relative grid shrink-0 place-items-center border border-ink/20 bg-surface-2 font-black leading-none tracking-[-0.09em] text-ink transition-colors group-hover:border-accent/70 ${
          isLarge ? "size-12 text-xs" : "size-9 text-xs"
        }`}
      >
        CC
        <span
          className="absolute -right-px -top-px size-3 border-r-2 border-t-2 border-accent"
        />
      </span>

      <span
        className={`font-black uppercase leading-none tracking-[-0.055em] text-ink ${
          isLarge ? "text-xl sm:text-2xl" : "text-[0.95rem] sm:text-base"
        }`}
      >
        Cali
        <span className="mx-1.5 text-accent" aria-hidden="true">
          /
        </span>
        Central
      </span>
    </span>
  );
}
