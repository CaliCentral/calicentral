import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";

type PolicyPageProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly introduction: string;
  readonly children: ReactNode;
};

type PolicySectionProps = {
  readonly title: string;
  readonly children: ReactNode;
};

export function PolicyPage({
  eyebrow,
  title,
  introduction,
  children,
}: PolicyPageProps) {
  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-5xl text-balance font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-ink sm:text-6xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            {introduction}
          </p>
          <p className="mt-8 inline-flex border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
            Owner-review draft · Not final
          </p>
        </Container>
      </header>

      <div className="technical-grid-dark bg-paper py-14 text-on-light sm:py-18 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[13rem_minmax(0,48rem)] lg:justify-center lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="border-t border-on-light/20 pt-4 font-mono text-xs font-bold uppercase leading-5 tracking-[0.15em] text-accent-dark">
              Publication status
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-dark">
              This page records the intended launch approach and still
              requires owner and legal review.
            </p>
          </aside>

          <div className="space-y-12">{children}</div>
        </Container>
      </div>
    </>
  );
}

export function PolicySection({
  title,
  children,
}: PolicySectionProps) {
  return (
    <section className="border-t border-on-light/20 pt-7">
      <h2 className="font-display text-3xl font-black uppercase tracking-[-0.035em] sm:text-4xl">
        {title}
      </h2>
      <div className="mt-5 space-y-5 text-base leading-8 text-muted-dark [&_a]:font-bold [&_a]:text-accent-dark [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-accent-dark [&_li]:pl-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-3">
        {children}
      </div>
    </section>
  );
}
