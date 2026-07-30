import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/ui/container";
import { rankingsPreview } from "@/data/homepage";
import type { RankingMovement } from "@/types/content";

export function RankingsPreviewSection() {
  return (
    <section
      id="rankings"
      aria-labelledby="rankings-heading"
      className="bg-paper py-16 sm:py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          headingId="rankings-heading"
          eyebrow="Rankings preview"
          title="A clearer view of the field"
          description={rankingsPreview.description}
        />

        <div className="overflow-hidden border border-ink/15 bg-canvas">
          <div className="flex flex-col gap-3 border-b border-ink/15 bg-ink px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                Sample category
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                {rankingsPreview.category}
              </h3>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/50">
              Prototype standings · Not official
            </p>
          </div>

          <div className="w-full">
            <table className="w-full table-fixed border-collapse text-left">
              <caption className="sr-only">
                Fictional sample rankings for{" "}
                {rankingsPreview.category.toLowerCase()}
              </caption>
              <thead>
                <tr className="border-b border-ink/10 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="w-14 px-4 py-4 sm:w-20 sm:px-7">
                    Rank
                  </th>
                  <th scope="col" className="px-2 py-4 sm:px-4">
                    Athlete
                  </th>
                  <th
                    scope="col"
                    className="hidden w-40 px-4 py-4 sm:table-cell"
                  >
                    Region
                  </th>
                  <th
                    scope="col"
                    className="w-16 px-2 py-4 text-right sm:w-24 sm:px-4"
                  >
                    Pts
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-4 py-4 text-right sm:w-28 sm:px-7"
                  >
                    Move
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankingsPreview.entries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className="border-b border-ink/10 last:border-b-0"
                  >
                    <td className="px-4 py-5 sm:px-7 sm:py-6">
                      <span
                        className={`font-mono text-xl font-bold tracking-[-0.04em] ${
                          entry.rank === 1 ? "text-rust" : "text-ink"
                        }`}
                      >
                        {String(entry.rank).padStart(2, "0")}
                      </span>
                    </td>
                    <th
                      scope="row"
                      className="px-2 py-5 text-sm font-bold text-ink sm:px-4 sm:py-6 sm:text-base"
                    >
                      {entry.name}
                      <span className="mt-1 block text-xs font-medium uppercase tracking-[0.08em] text-muted sm:hidden">
                        {entry.region}
                      </span>
                    </th>
                    <td className="hidden px-4 py-5 text-sm text-muted sm:table-cell sm:py-6">
                      {entry.region}
                    </td>
                    <td className="px-2 py-5 text-right font-mono text-xs font-bold tabular-nums text-ink sm:px-4 sm:py-6 sm:text-sm">
                      {entry.points}
                    </td>
                    <td className="px-4 py-5 text-right sm:px-7 sm:py-6">
                      <MovementLabel movement={entry.movement} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-xs leading-5 text-muted">
          Rankings are sample prototype content. Cali Central has not verified
          these fictional athletes, placements, or point totals.
        </p>
      </Container>
    </section>
  );
}

function MovementLabel({
  movement,
}: {
  readonly movement: RankingMovement;
}) {
  if (movement.direction === "same") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.07em] text-muted">
        <span aria-hidden="true">—</span>
        <span className="hidden sm:inline">No change</span>
        <span className="sr-only sm:hidden">No change</span>
      </span>
    );
  }

  const isUp = movement.direction === "up";
  const label = `${isUp ? "Up" : "Down"} ${movement.places}`;

  return (
    <span
      aria-label={label}
      className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.07em] ${
        isUp ? "text-pacific" : "text-rust"
      }`}
    >
      <span aria-hidden="true">{isUp ? "↑" : "↓"}</span>
      <span>{movement.places}</span>
      <span className="sr-only">{isUp ? "places up" : "places down"}</span>
    </span>
  );
}
