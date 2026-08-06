import { ContentImage } from "@/components/content/content-image";
import type { EditorialImage } from "@/types/content";
import type { VideoVisualVariant } from "@/types/video";

type VideoVisualProps = {
  readonly title: string;
  readonly episodeNumber: string;
  readonly duration: string;
  readonly frameCode: string;
  readonly posterLabel: string;
  readonly variant: VideoVisualVariant;
  readonly compact?: boolean;
  readonly image?: EditorialImage;
  readonly priority?: boolean;
};

const variantStyles: Record<VideoVisualVariant, string> = {
  handstand: "bg-surface-2 text-ink",
  static: "bg-canvas text-ink",
  motion: "bg-accent-dark text-ink",
  team: "bg-paper text-on-light",
  field: "bg-surface text-ink",
  portrait: "bg-accent-dark text-ink",
  competition: "bg-canvas text-ink",
};

export function VideoVisual({
  title,
  episodeNumber,
  duration,
  frameCode,
  posterLabel,
  variant,
  compact = false,
  image,
  priority = false,
}: VideoVisualProps) {
  return (
    <div
      role={image ? undefined : "img"}
      aria-label={
        image
          ? undefined
          : `Static non-interactive preview artwork for ${title}, ${episodeNumber}, duration ${duration}. No playback.`
      }
      className={`relative overflow-hidden ${variantStyles[variant]} ${
        compact ? "aspect-[4/3]" : "min-h-[25rem] sm:min-h-[32rem]"
      }`}
    >
      {image ? (
        <>
          <ContentImage
            image={image}
            sizes={compact ? "(min-width: 768px) 33vw, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
            priority={priority}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/55 via-transparent to-canvas/85"
          />
        </>
      ) : (
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:2.75rem_2.75rem]" />
        <div className="absolute inset-x-[12%] top-[17%] h-[58%] border-x border-current opacity-35" />
        <div className="absolute left-[-8%] top-[46%] h-px w-[118%] -rotate-6 bg-current opacity-45" />
        <div className="absolute right-[8%] top-[12%] size-[32%] border-[1.3rem] border-current opacity-10" />
        <div className="absolute bottom-[23%] left-[21%] h-[39%] w-px rotate-[28deg] bg-current opacity-50" />
        <div className="absolute bottom-[23%] left-[21%] h-px w-[47%] rotate-[-14deg] bg-current opacity-50" />
        <span className="absolute -right-2 -top-4 font-mono text-[clamp(5rem,16vw,11rem)] font-black leading-none tracking-[-0.12em] opacity-10">
          {episodeNumber.replace(/\D/g, "").slice(-2)}
        </span>
      </div>
      )}

      <div className="absolute inset-x-4 top-4 flex flex-col items-start gap-2 min-[430px]:flex-row min-[430px]:justify-between sm:inset-x-5 sm:top-5">
        <span className="border border-current/20 bg-canvas/95 px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink">
          {posterLabel}
        </span>
        <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.15em] opacity-70">
          {frameCode}
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2 min-[375px]:flex-row min-[375px]:items-end min-[375px]:justify-between sm:inset-x-5 sm:bottom-5">
        <span className="inline-flex items-center gap-2 bg-canvas/95 px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
          <span aria-hidden="true" className="size-1.5 bg-accent" />
          Static preview / No playback
        </span>
        <span className="bg-canvas/95 px-2.5 py-2 font-mono text-xs font-bold tabular-nums text-ink">
          {duration}
        </span>
      </div>
      {image && (image.caption || image.credit) ? (
        <p className="absolute right-4 top-16 max-w-[60%] bg-canvas/80 px-3 py-2 text-right text-[0.65rem] leading-4 text-white/80">
          {[image.caption, image.credit].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
