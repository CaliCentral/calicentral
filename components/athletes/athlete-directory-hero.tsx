import { Container } from "@/components/ui/container";
import type { Athlete } from "@/types/athlete";

type AthleteDirectoryHeroProps = {
  readonly athletes: readonly Athlete[];
};

export function AthleteDirectoryHero({
  athletes,
}: AthleteDirectoryHeroProps) {
  const regionCount = new Set(athletes.map((athlete) => athlete.region)).size;
  const disciplineCount = new Set(
    athletes.flatMap((athlete) => athlete.disciplines),
  ).size;

  const signals = [
    { label: "Athlete files", value: athletes.length },
    { label: "Regions", value: regionCount },
    { label: "Disciplines", value: disciplineCount },
  ] as const;

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-canvas">
      <div aria-hidden="true" className="technical-grid absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-12 size-72 rotate-12 border-[2.75rem] border-accent/15 sm:right-8 sm:size-96 sm:border-accent/65"
      />
      <div
        aria-hidden="true"
        className="absolute right-[24%] top-0 h-full w-px -rotate-12 bg-white/15"
      />

      <Container className="relative grid min-h-[34rem] content-end gap-10 py-14 sm:min-h-[40rem] sm:py-20 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            <span aria-hidden="true" className="h-1 w-8 shrink-0 bg-accent" />
            Athlete file / Directory
          </p>
          <h1 className="mt-7 max-w-5xl font-display text-[clamp(3.15rem,10vw,8.5rem)] font-black uppercase leading-[0.79] tracking-[-0.075em] text-ink">
            Profiles from
            <span className="block text-accent">the field.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Fictional athlete records demonstrating how Cali Central will
            document training, competition, style, and the stories behind
            performance.
          </p>
          <p className="mt-5 max-w-xl border-l-2 border-accent pl-4 font-mono text-xs font-bold uppercase leading-5 tracking-[0.1em] text-ink">
            Public prototype / Sample records only
          </p>
        </div>

        <dl className="grid min-w-0 grid-cols-2 border-l border-t border-white/15 sm:grid-cols-3 lg:grid-cols-1 lg:border-t-0">
          {signals.map((signal, index) => (
            <div
              key={signal.label}
              className={`min-w-0 border-b border-r border-white/15 p-4 sm:p-5 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
                0{index + 1} / {signal.label}
              </dt>
              <dd className="mt-2 font-display text-4xl font-black leading-none tracking-[-0.06em] text-ink sm:text-5xl">
                {String(signal.value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
