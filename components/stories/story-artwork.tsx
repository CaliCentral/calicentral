import { ContentImage } from "@/components/content/content-image";
import type { Article } from "@/types/article";

type StoryArtworkProps = {
  readonly article: Article;
  readonly compact?: boolean;
  readonly priority?: boolean;
  readonly className?: string;
};

const variantStyles = {
  signal: "bg-accent-dark text-white",
  field: "bg-surface-2 text-ink",
  frame: "bg-paper text-on-light",
} as const;

export function StoryArtwork({
  article,
  compact = false,
  priority = false,
  className = "",
}: StoryArtworkProps) {
  const isLight = article.heroVariant === "frame";

  return (
    <div
      aria-hidden={article.image ? undefined : true}
      className={`relative isolate overflow-hidden ${variantStyles[article.heroVariant]} ${
        compact ? "min-h-56" : "min-h-[24rem] sm:min-h-[30rem]"
      } ${className}`}
    >
      {article.image ? (
        <>
          <ContentImage
            image={article.image}
            sizes={compact ? "(min-width: 768px) 33vw, 100vw" : "(min-width: 1024px) 55vw, 100vw"}
            priority={priority}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/65 via-transparent to-canvas/80"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${
              isLight ? "technical-grid-dark" : "technical-grid"
            }`}
          />
          <div
            aria-hidden="true"
            className={`absolute -right-[12%] top-[9%] size-[52%] rounded-full border-[2.25rem] sm:border-[3rem] ${
              article.heroVariant === "signal"
                ? "border-white/15"
                : "border-accent/80"
            }`}
          />
          <div
            aria-hidden="true"
            className={`absolute left-[23%] top-[-12%] h-[124%] w-px rotate-[24deg] ${
              isLight ? "bg-on-light/20" : "bg-white/25"
            }`}
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[23%] left-0 h-1 w-[72%] bg-accent"
          />
          <div
            aria-hidden="true"
            className={`absolute bottom-[23%] right-0 h-px w-[25%] ${
              isLight ? "bg-on-light/35" : "bg-white/35"
            }`}
          />
        </>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-x-5 top-5 flex items-start justify-between gap-5 font-mono text-xs font-bold uppercase tracking-[0.15em] sm:inset-x-7 sm:top-7"
      >
        <span>CC / {article.heroLabel}</span>
        <span className={isLight ? "text-muted-dark" : "text-white/60"}>
          {article.category}
        </span>
      </div>

      <span
        aria-hidden="true"
        className={`absolute bottom-8 left-5 font-display text-[clamp(5rem,15vw,11rem)] font-black leading-[0.68] tracking-[-0.09em] sm:left-7 ${
          article.heroVariant === "signal"
            ? "text-white"
            : isLight
              ? "text-on-light"
              : "text-ink"
        }`}
      >
        {article.issueNumber}
      </span>
      <span
        aria-hidden="true"
        className="absolute right-5 top-14 max-w-[52%] text-right font-mono text-xs font-bold uppercase leading-5 tracking-[0.13em] sm:right-7 sm:top-16"
      >
        {article.location}
      </span>
      {article.image && (article.image.caption || article.image.credit) ? (
        <p className="absolute bottom-3 right-3 max-w-[60%] bg-canvas/80 px-3 py-2 text-right text-[0.65rem] leading-4 text-white/80">
          {[article.image.caption, article.image.credit]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
