import Link from "next/link";

import { SectionHeading } from "@/components/home/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import type { AthleteRankMovement } from "@/types/athlete";
import type { RankingCategory } from "@/types/ranking";

type RankingsPreviewSectionProps = {
  readonly category: RankingCategory | null;
};

export function RankingsPreviewSection({
  category: rankingsPreview,
}: RankingsPreviewSectionProps) {
  return (
    <section
      id="standings"
      aria-labelledby="standings-heading"
      className="bg-canvas py-16 text-ink sm:py-20 lg:py-24"
    >
      <Container>
        {rankingsPreview ? (
          <>
          <SectionHeading
          headingId="standings-heading"
          eyebrow="Latest competition standing"
          title="Verified results, published position"
          description={rankingsPreview.description}
          index="05"
        />

          <div className="overflow-hidden border border-white/15 bg-surface">
          <div className="technical-grid flex flex-col gap-4 border-b border-white/15 bg-surface-2 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                Published board / Verified result sources
              </p>
              <h3 className="mt-2 text-balance font-display text-xl font-black uppercase leading-tight tracking-[-0.025em] text-ink sm:text-2xl">
                {rankingsPreview.title} — {rankingsPreview.region}
              </h3>
            </div>
            <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <span aria-hidden="true" className="size-1.5 bg-accent" />
              {rankingsPreview.seasonLabel} / Approved methodology
            </p>
          </div>

          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">
              Published competition standings for{" "}
              {rankingsPreview.title.toLowerCase()},{" "}
              {rankingsPreview.region.toLowerCase()}
            </caption>
            <thead>
              <tr className="border-b border-white/10 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted sm:text-xs">
                <th scope="col" className="w-12 px-3 py-4 sm:w-20 sm:px-7">
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
                  className="w-14 px-3 py-4 text-right sm:w-28 sm:px-7"
                >
                  Move
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingsPreview.entries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-white/10 last:border-b-0 ${
                      entry.rank === 1 ? "bg-accent/5" : ""
                    }`}
                  >
                    <td className="border-r border-white/10 px-3 py-5 sm:px-7 sm:py-6">
                      <span
                        className={`font-mono text-2xl font-black tracking-[-0.07em] sm:text-3xl ${
                          entry.rank === 1 ? "text-accent" : "text-ink"
                        }`}
                      >
                        {String(entry.rank).padStart(2, "0")}
                      </span>
                    </td>
                    <th
                      scope="row"
                      className="px-2 py-5 text-sm font-bold leading-5 text-ink sm:px-4 sm:py-6 sm:text-base"
                    >
                      <Link
                        href={`/athletes/${entry.athleteSlug}`}
                        className="underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        {entry.athleteName}
                      </Link>
                      <span className="mt-1 block font-mono text-xs font-medium uppercase leading-4 tracking-[0.08em] text-muted sm:hidden">
                        {entry.region}
                      </span>
                    </th>
                    <td className="hidden px-4 py-5 text-sm text-muted sm:table-cell sm:py-6">
                      {entry.region}
                    </td>
                    <td className="px-2 py-5 text-right font-mono text-xs font-bold tabular-nums text-ink sm:px-4 sm:py-6 sm:text-sm">
                      {entry.points.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-5 text-right sm:px-7 sm:py-6">
                      <MovementLabel movement={entry.movement} />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs leading-5 text-muted">
            Every listed entry is gated by an approved methodology and at
            least one publicly accessible verified result source.
          </p>
          <ButtonLink
            href="/standings"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
          >
            View standings and results
          </ButtonLink>
          </div>
          </>
        ) : (
          <ContentEmptyState
            eyebrow="Competition standings / Awaiting publication"
            title="No competition standing is published"
            description="No board has passed the approved-methodology and verified-source publication gate."
          />
        )}
      </Container>
    </section>
  );
}

function MovementLabel({
  movement,
}: {
  readonly movement: AthleteRankMovement;
}) {
  if (movement.direction === "hold") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-[0.07em] text-muted">
        <span aria-hidden="true">—</span>
        <span>Hold</span>
      </span>
    );
  }

  if (movement.direction === "new") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-[0.07em] text-accent">
        <span aria-hidden="true">+</span>
        <span>New</span>
      </span>
    );
  }

  const isUp = movement.direction === "up";

  return (
    <span
      aria-label={movement.label}
      className={`inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-[0.07em] ${
        isUp ? "text-accent-strong" : "text-muted"
      }`}
    >
      <span aria-hidden="true">{isUp ? "↑" : "↓"}</span>
      <span>{movement.label}</span>
    </span>
  );
}
