import { ContentImage } from "@/components/content/content-image";
import type { EditorialImage } from "@/types/content";
import type { CompetitionVisualVariant } from "@/types/competition";

type CompetitionVisualProps = {
  readonly name: string;
  readonly eventNumber: string;
  readonly variant: CompetitionVisualVariant;
  readonly compact?: boolean;
  readonly image?: EditorialImage;
  readonly priority?: boolean;
};

const variantStyles: Record<CompetitionVisualVariant, string> = {
  signal: "bg-accent-dark text-ink",
  field: "bg-surface-2 text-ink",
  frame: "bg-paper text-on-light",
};

export function CompetitionVisual({
  name,
  eventNumber,
  variant,
  compact = false,
  image,
  priority = false,
}: CompetitionVisualProps) {
  return (
    <div
      role={image ? undefined : "img"}
      aria-label={image ? undefined : `Abstract technical event artwork for ${name}`}
      className={`relative overflow-hidden ${variantStyles[variant]} ${
        compact ? "aspect-[16/10]" : "min-h-[22rem] sm:min-h-[28rem]"
      }`}
    >
      {image ? (
        <>
          <ContentImage
            image={image}
            sizes={compact ? "(min-width: 768px) 33vw, 100vw" : "(min-width: 1024px) 45vw, 100vw"}
            priority={priority}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/45 via-transparent to-canvas/80"
          />
        </>
      ) : (
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:2.5rem_2.5rem]" />
        <div className="absolute inset-y-[12%] left-[14%] w-[34%] border-x border-current opacity-30" />
        <div className="absolute inset-x-[8%] top-[29%] h-px bg-current opacity-45" />
        <div className="absolute -right-[11%] top-[18%] size-[48%] rounded-full border-[1.2rem] border-current opacity-10" />
        <div className="absolute bottom-[18%] left-[26%] h-[32%] w-px -rotate-[26deg] bg-current opacity-55" />
        <div className="absolute bottom-[18%] left-[26%] h-px w-[52%] -rotate-[8deg] bg-current opacity-55" />
        <span className="absolute -right-1 -top-3 font-mono text-[clamp(5rem,14vw,10rem)] font-black leading-none tracking-[-0.12em] opacity-10">
          {eventNumber}
        </span>
      </div>
      )}

      <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between sm:inset-x-6 sm:bottom-6">
        <span className="border border-current/25 bg-canvas/90 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-ink">
          Field record / {eventNumber}
        </span>
        <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] opacity-70">
          Fictional event
        </span>
      </div>
      {image && (image.caption || image.credit) ? (
        <p className="absolute right-4 top-4 max-w-[60%] bg-canvas/80 px-3 py-2 text-right text-[0.65rem] leading-4 text-white/80">
          {[image.caption, image.credit].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
