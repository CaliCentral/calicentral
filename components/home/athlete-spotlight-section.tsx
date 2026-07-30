import { CategoryLabel } from "@/components/ui/category-label";
import { Container } from "@/components/ui/container";
import { athleteSpotlight } from "@/data/homepage";

export function AthleteSpotlightSection() {
  return (
    <section
      id="athlete-spotlight"
      aria-labelledby="athlete-heading"
      className="bg-clay py-16 sm:py-20 lg:py-28"
    >
      <Container>
        <div className="grid overflow-hidden bg-canvas shadow-[0_24px_65px_rgba(42,35,26,0.12)] lg:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
          <AthletePortrait />

          <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
            <div>
              <CategoryLabel>{athleteSpotlight.label}</CategoryLabel>
              <h2
                id="athlete-heading"
                className="mt-5 text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-5xl xl:text-6xl"
              >
                {athleteSpotlight.name}
              </h2>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-rust">
                {athleteSpotlight.discipline} · {athleteSpotlight.location}
              </p>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted">
                {athleteSpotlight.biography}
              </p>
              <blockquote className="mt-8 border-l-2 border-rust pl-5 text-xl font-medium italic leading-8 tracking-[-0.02em] text-ink sm:text-2xl">
                “{athleteSpotlight.quote}”
              </blockquote>
            </div>

            <dl className="mt-10 grid grid-cols-2 border-t border-ink/15 sm:grid-cols-4">
              {athleteSpotlight.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="border-b border-ink/15 py-5 pr-4 sm:border-b-0 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0"
                >
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 text-sm font-bold leading-5 text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}

function AthletePortrait() {
  return (
    <div
      role="img"
      aria-label={`Abstract portrait placeholder for fictional sample athlete ${athleteSpotlight.name}`}
      className="relative min-h-[27rem] overflow-hidden bg-pacific text-white sm:min-h-[34rem] lg:min-h-full"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:3rem_3rem]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-[12%] size-72 rounded-full border-[3.25rem] border-accent/80"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 400 560"
        className="absolute bottom-0 left-1/2 h-[88%] w-auto -translate-x-1/2 text-ink/85"
        fill="none"
      >
        <circle cx="200" cy="112" r="58" fill="currentColor" />
        <path
          d="M142 182c22-14 94-14 116 0l42 170-38 142H138l-38-142 42-170Z"
          fill="currentColor"
        />
        <path
          d="m149 205-91 147m193-147 91 147"
          stroke="currentColor"
          strokeWidth="42"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute left-6 top-6 border border-white/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] sm:left-8 sm:top-8">
        Profile study / 001
      </span>
      <span className="absolute bottom-6 left-6 font-mono text-5xl font-bold tracking-[-0.08em] text-accent sm:bottom-8 sm:left-8 sm:text-7xl">
        {athleteSpotlight.initials}
      </span>
    </div>
  );
}
