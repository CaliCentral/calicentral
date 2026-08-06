import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import type { HeroContent } from "@/types/content";

type HeroSectionProps = {
  readonly content: HeroContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b border-white/10 bg-canvas text-ink"
    >
      <div
        aria-hidden="true"
        className="technical-grid pointer-events-none absolute inset-0 opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[7%] hidden w-px bg-white/8 xl:block"
      />

      <Container className="relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(27rem,0.76fr)] lg:items-center lg:gap-12 lg:py-20 xl:gap-20 xl:py-24">
        <div className="relative z-10">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-strong sm:text-xs">
            <span aria-hidden="true" className="h-1 w-7 bg-accent" />
            {content.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="mt-7 max-w-[11ch] text-balance font-display text-[clamp(2.9rem,7.4vw,7rem)] font-black uppercase leading-[0.83] tracking-[-0.07em] text-ink"
          >
            {content.title.lead}{" "}
            <span className="text-accent">
              {content.title.emphasis}
            </span>{" "}
            {content.title.tail}
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            {content.description}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 min-[420px]:items-start sm:flex-row">
            <ButtonLink href={content.primaryAction.href}>
              {content.primaryAction.label}
            </ButtonLink>
            <ButtonLink
              href={content.secondaryAction.href}
              variant="outline"
            >
              {content.secondaryAction.label}
            </ButtonLink>
          </div>

          <dl className="mt-10 max-w-2xl border-y border-white/15 sm:mt-12 sm:grid sm:grid-cols-3">
            {content.signals.map((signal, index) => (
              <div
                key={signal.label}
                className="grid grid-cols-[5rem_1fr] items-center border-t border-white/10 py-4 first:border-t-0 sm:block sm:border-l sm:border-t-0 sm:px-5 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  0{index + 1} / {signal.label}
                </dt>
                <dd className="text-sm font-bold uppercase tracking-[0.04em] text-ink sm:mt-2">
                  {signal.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="Abstract technical illustration of an athlete moving across a calisthenics bar"
      className="relative min-h-[25rem] overflow-hidden border border-white/15 bg-surface shadow-[0_32px_90px_rgba(0,0,0,0.35)] sm:min-h-[34rem] lg:min-h-[38rem]"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div className="technical-grid absolute inset-0 opacity-70" />
        <div className="signal-scan absolute inset-0" />
        <div className="absolute inset-y-0 left-[18%] w-[14%] bg-accent" />
        <div className="absolute inset-y-0 left-[32%] w-px bg-white/20" />
        <div className="absolute right-0 top-[18%] h-px w-[82%] bg-white/25" />
        <div className="absolute right-0 top-[18%] h-[38%] w-[68%] border-b border-r border-white/20" />

        <svg
          viewBox="0 0 620 720"
          className="absolute inset-x-0 bottom-0 h-[88%] w-full text-ink"
          fill="none"
        >
          <path
            d="M88 212h454M118 212v360M512 212v360"
            stroke="currentColor"
            strokeOpacity=".32"
            strokeWidth="10"
          />
          <circle cx="329" cy="240" r="36" fill="currentColor" />
          <path
            d="M319 280c-19 58-7 115 37 167m-38-160-79 78m101-70 100 20m-82 132-72 103m70-103 77 96"
            stroke="currentColor"
            strokeWidth="30"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M222 366h53m129-55h55"
            stroke="#f43f50"
            strokeWidth="8"
          />
        </svg>

        <div className="absolute left-4 top-4 border border-white/25 bg-canvas/90 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink sm:left-6 sm:top-6">
          Field frame / 002
        </div>
        <div className="absolute right-4 top-4 text-right font-mono text-xs uppercase leading-5 tracking-[0.15em] text-white/60 sm:right-6 sm:top-6">
          Worldwide desk
          <br />
          Global field / 001
        </div>
        <span className="absolute -right-2 top-[28%] font-mono text-[6rem] font-black leading-none tracking-[-0.1em] text-white/6 sm:text-[9rem]">
          02
        </span>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-canvas/95 p-5 sm:p-7">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
            Signal / field / frame
          </p>
          <p className="mt-2 max-w-sm text-xl font-black uppercase leading-[1.05] tracking-[-0.035em] text-ink sm:text-2xl">
            Strength is the headline. Community is the story.
          </p>
        </div>
      </div>
    </div>
  );
}
