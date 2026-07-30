import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { heroContent } from "@/data/homepage";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-canvas"
    >
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(28rem,0.8fr)] lg:items-center lg:gap-16 lg:py-20 xl:py-24">
        <div>
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-rust">
            <span aria-hidden="true" className="h-px w-8 bg-rust" />
            {heroContent.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-4xl text-balance text-[clamp(3rem,8.6vw,6.9rem)] font-semibold leading-[0.88] tracking-[-0.07em] text-ink"
          >
            {heroContent.title.lead}{" "}
            <span className="font-normal italic text-rust">
              {heroContent.title.emphasis}
            </span>{" "}
            {heroContent.title.tail}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            {heroContent.description}
          </p>

          <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <ButtonLink href={heroContent.primaryAction.href}>
              {heroContent.primaryAction.label}
            </ButtonLink>
            <Link
              href={heroContent.secondaryAction.href}
              className="inline-flex min-h-11 items-center border-b border-ink/35 text-sm font-bold text-ink transition-colors hover:border-rust hover:text-rust focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              {heroContent.secondaryAction.label}
            </Link>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-3 border-y border-ink/15 py-5 sm:mt-12">
            {heroContent.signals.map((signal) => (
              <div
                key={signal.label}
                className="border-l border-ink/10 pl-3 first:border-l-0 first:pl-0 sm:pl-5"
              >
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {signal.label}
                </dt>
                <dd className="mt-2 text-xs font-bold text-ink sm:text-sm">
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
    <div className="relative min-h-[28rem] overflow-hidden bg-ink text-white shadow-[0_28px_70px_rgba(25,22,18,0.18)] sm:min-h-[34rem]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:3.5rem_3.5rem]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 size-72 rounded-full border-[3.5rem] border-accent sm:size-96"
      />
      <div
        aria-hidden="true"
        className="absolute left-[12%] top-[24%] h-[42%] w-px rotate-[28deg] bg-white/40"
      />
      <div
        aria-hidden="true"
        className="absolute left-[28%] top-[10%] h-[68%] w-px rotate-[28deg] bg-white/15"
      />
      <div className="absolute left-5 top-5 flex items-center gap-2 bg-canvas px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-ink sm:left-7 sm:top-7">
        <span className="size-1.5 rounded-full bg-rust" aria-hidden="true" />
        Field note 001
      </div>

      <div className="absolute bottom-0 left-0 right-0 grid gap-5 border-t border-white/15 bg-ink/90 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            The movement, documented
          </p>
          <p className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">
            Strength is the headline. Community is the story.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
          <span className="grid size-10 place-items-center rounded-full border border-white/25 text-accent">
            01
          </span>
          California
          <br />
          Worldwide
        </div>
      </div>
    </div>
  );
}
