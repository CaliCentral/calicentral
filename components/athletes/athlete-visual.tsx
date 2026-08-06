import { ContentImage } from "@/components/content/content-image";
import { athleteCategoryLabel } from "@/lib/athlete-taxonomy";
import type { Athlete } from "@/types/athlete";

export type AthleteVisualProps = {
  readonly athlete: Athlete;
  readonly compact?: boolean;
  readonly priority?: boolean;
  readonly className?: string;
};

export function AthleteVisual({
  athlete,
  compact = false,
  priority = false,
  className = "",
}: AthleteVisualProps) {
  const variant = String(athlete.visualVariant);
  const isFrame = variant === "frame";
  const isMotion = variant === "motion";

  return (
    <div
      aria-hidden={athlete.image ? undefined : true}
      className={`relative isolate overflow-hidden ${
        isFrame
          ? "bg-paper text-on-light"
          : isMotion
            ? "bg-accent-dark text-white"
            : "bg-surface-2 text-ink"
      } ${compact ? "min-h-52" : "min-h-[25rem] sm:min-h-[31rem]"} ${className}`}
    >
      {athlete.image ? (
        <>
          <ContentImage
            image={athlete.image}
            sizes={compact ? "(min-width: 768px) 33vw, 100vw" : "(min-width: 1024px) 45vw, 100vw"}
            priority={priority}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/60 via-transparent to-canvas/85"
          />
        </>
      ) : (
        <>
          <div
            className={`absolute inset-0 ${
              isFrame ? "technical-grid-dark" : "technical-grid"
            }`}
          />
          <div className="signal-scan absolute inset-0 opacity-80" />
          <svg
        viewBox="0 0 560 680"
        className="absolute inset-0 size-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {isFrame ? (
          <>
            <rect
              x="82"
              y="78"
              width="396"
              height="524"
              stroke="currentColor"
              strokeOpacity=".23"
              strokeWidth="2"
            />
            <rect
              x="130"
              y="126"
              width="300"
              height="428"
              stroke="currentColor"
              strokeOpacity=".42"
              strokeWidth="10"
            />
            <path
              d="M130 266h300M280 126v428"
              stroke="currentColor"
              strokeOpacity=".2"
              strokeWidth="2"
            />
            <path
              d="M82 188h48M430 492h48"
              stroke="#F43F50"
              strokeWidth="18"
            />
          </>
        ) : isMotion ? (
          <>
            <path
              d="M-18 510c126-22 146-180 265-198 120-19 145 95 331-54"
              stroke="currentColor"
              strokeOpacity=".88"
              strokeWidth="34"
            />
            <path
              d="M-18 566c154-28 168-166 287-180 105-13 147 70 309-69"
              stroke="currentColor"
              strokeOpacity=".24"
              strokeWidth="3"
            />
            <circle
              cx="395"
              cy="190"
              r="116"
              stroke="currentColor"
              strokeOpacity=".2"
              strokeWidth="54"
            />
            <path
              d="M82 130h214M82 164h142"
              stroke="currentColor"
              strokeOpacity=".45"
              strokeWidth="3"
            />
          </>
        ) : (
          <>
            <path
              d="M64 104v492M496 104v492M64 226h432"
              stroke="currentColor"
              strokeOpacity=".22"
              strokeWidth="4"
            />
            <path
              d="M115 558 246 266l90 96 110-222"
              stroke="#F43F50"
              strokeWidth="24"
              strokeLinejoin="bevel"
            />
            <path
              d="M115 598 246 306l90 96 110-222"
              stroke="currentColor"
              strokeOpacity=".18"
              strokeWidth="3"
            />
            <circle cx="246" cy="266" r="17" fill="currentColor" />
            <circle cx="446" cy="140" r="17" fill="currentColor" />
          </>
        )}
          </svg>
        </>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-x-5 top-5 flex items-start justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em] sm:inset-x-7 sm:top-7"
      >
        <span>CC / {athlete.disciplineCode}</span>
        <span className={isFrame ? "text-muted-dark" : "text-white/60"}>
          {athlete.profileNumber}
        </span>
      </div>

      <span
        aria-hidden="true"
        className={`absolute bottom-5 left-5 font-display font-black uppercase leading-[0.72] tracking-[-0.09em] sm:bottom-7 sm:left-7 ${
          compact ? "text-[clamp(4.5rem,19vw,7rem)]" : "text-[clamp(6rem,22vw,12rem)]"
        } ${isMotion ? "text-white" : isFrame ? "text-on-light" : "text-ink"}`}
      >
        {athlete.initials}
      </span>

      <span
        aria-hidden="true"
        className={`absolute bottom-5 right-5 max-w-[8.5rem] text-right font-mono text-xs font-bold uppercase leading-5 tracking-[0.12em] sm:bottom-7 sm:right-7 ${
          isFrame ? "text-muted-dark" : "text-white/65"
        }`}
      >
        Profile frame
        <br />
        {athleteCategoryLabel(athlete.primaryCategory)}
      </span>
      {athlete.image && (athlete.image.caption || athlete.image.credit) ? (
        <p className="absolute bottom-3 right-3 max-w-[60%] bg-canvas/80 px-3 py-2 text-right text-[0.65rem] leading-4 text-white/80">
          {[athlete.image.caption, athlete.image.credit]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
