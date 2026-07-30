import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/ui/container";
import { competitions } from "@/data/homepage";

export function CompetitionsSection() {
  return (
    <section
      id="competitions"
      aria-labelledby="competitions-heading"
      className="bg-ink py-16 text-white sm:py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          headingId="competitions-heading"
          eyebrow="Competition calendar"
          title="Next on the floor"
          description="A first look at the event directory Cali Central is building for athletes, organizers, and spectators."
          inverted
        />

        <div className="grid border border-white/15 lg:grid-cols-3">
          {competitions.map((competition, index) => (
            <article
              key={competition.id}
              className={`relative flex min-h-[24rem] flex-col justify-between border-white/15 p-6 sm:p-8 lg:border-l lg:first:border-l-0 ${
                index > 0 ? "border-t lg:border-t-0" : ""
              } ${competition.featured ? "bg-rust" : "bg-ink"}`}
            >
              <div>
                <div className="flex items-start justify-between gap-5">
                  <time
                    dateTime={competition.dateTime}
                    className="flex flex-col"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                      {competition.month}
                    </span>
                    <span className="mt-1 text-6xl font-semibold leading-none tracking-[-0.06em]">
                      {competition.day}
                    </span>
                  </time>
                  <span
                    className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                      competition.featured
                        ? "border-white/35 text-white"
                        : "border-accent/50 text-accent"
                    }`}
                  >
                    {competition.status}
                  </span>
                </div>

                <p
                  className={`mt-10 text-xs font-bold uppercase tracking-[0.15em] ${
                    competition.featured ? "text-white/70" : "text-accent"
                  }`}
                >
                  {competition.division}
                </p>
                <h3 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.04em]">
                  {competition.name}
                </h3>
              </div>

              <div className="border-t border-white/20 pt-5">
                <p className="text-sm font-bold">
                  {competition.location}
                  <span
                    className={`font-normal ${
                      competition.featured ? "text-white/75" : "text-white/60"
                    }`}
                  >
                    {" "}
                    / {competition.region}
                  </span>
                </p>
                <p
                  className={`mt-2 text-xs uppercase tracking-[0.14em] ${
                    competition.featured ? "text-white/75" : "text-white/55"
                  }`}
                >
                  Event preview · Schedule pending
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-white/50">
          All event names, dates, divisions, and locations are fictional sample
          content for this prototype. No registration is available.
        </p>
      </Container>
    </section>
  );
}
