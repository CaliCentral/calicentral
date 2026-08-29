import Link from "next/link";

import {Container} from "@/components/ui/container";
import type {AthleteRankingSnapshot} from "@/types/ranking-source";
import type {Team} from "@/types/team";

export function AthleteSportingRelations({
  athleteSlug,
  snapshots,
  teams,
}: {
  readonly athleteSlug: string;
  readonly snapshots: readonly AthleteRankingSnapshot[];
  readonly teams: readonly Team[];
}) {
  const rankings = snapshots.flatMap((snapshot) =>
    snapshot.entries
      .filter((entry) => entry.athleteSlug === athleteSlug)
      .map((entry) => ({snapshot, entry})),
  );
  const memberships = teams.flatMap((team) =>
    team.roster
      .filter((member) => member.athleteSlug === athleteSlug)
      .map((member) => ({team, member})),
  );
  const history = [...rankings]
    .filter(({entry}) => typeof entry.position === "number")
    .sort((left, right) => left.snapshot.rankingDate.localeCompare(right.snapshot.rankingDate));

  if (!rankings.length && !memberships.length) return null;

  return (
    <section aria-labelledby="athlete-sporting-relations-heading" className="border-b border-white/10 bg-canvas py-16 sm:py-20">
      <Container>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">Sporting data / Sourced relationships</p>
        <h2 id="athlete-sporting-relations-heading" className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink sm:text-5xl">Rankings and teams</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="athlete-rankings-heading">
            <h3 id="athlete-rankings-heading" className="font-display text-2xl font-black uppercase text-ink">Provider rankings</h3>
            {rankings.length ? <><RankingHistory history={history} /><ul className="mt-5 divide-y divide-white/10 border-y border-white/10">{rankings.map(({snapshot, entry}) => <li key={`${snapshot.canonicalId}:${entry.canonicalId}`} className="py-5"><div className="flex items-start justify-between gap-5"><div><p className="font-bold uppercase text-ink">{snapshot.provider.name}</p><p className="mt-1 text-sm text-muted">{snapshot.systemName} · {snapshot.rankingDate}</p></div><span className="font-display text-3xl font-black text-ink">{entry.position ? `#${entry.position}` : "—"}</span></div><a href={snapshot.provenance.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent">View source ↗</a></li>)}</ul></> : <p className="mt-5 border border-white/15 p-5 text-sm leading-6 text-muted">No source-confirmed provider ranking is published.</p>}
          </section>
          <section aria-labelledby="athlete-teams-heading">
            <h3 id="athlete-teams-heading" className="font-display text-2xl font-black uppercase text-ink">Team affiliations</h3>
            {memberships.length ? <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">{memberships.map(({team, member}) => <li key={`${team.canonicalId}:${member.canonicalId}`} className="flex items-center justify-between gap-5 py-5"><div><Link href={`/teams/${team.slug}`} className="font-bold uppercase text-ink hover:text-accent">{team.name}</Link><p className="mt-1 text-sm text-muted">{team.seasonLabel || "Current public roster"}</p></div><span className="font-mono text-xs uppercase text-muted">{member.specialty || member.role}</span></li>)}</ul> : <p className="mt-5 border border-white/15 p-5 text-sm leading-6 text-muted">No confirmed public team affiliation is published.</p>}
          </section>
        </div>
      </Container>
    </section>
  );
}

function RankingHistory({history}: {readonly history: readonly {
  snapshot: AthleteRankingSnapshot;
  entry: AthleteRankingSnapshot["entries"][number];
}[]}) {
  const latestSystem = history.at(-1)?.snapshot.systemSlug;
  const points = history.filter(({snapshot}) => snapshot.systemSlug === latestSystem);
  if (points.length < 2) {
    return <p className="mt-5 border border-dashed border-white/15 p-4 text-sm leading-6 text-muted">Ranking history needs at least two published snapshots in the same system. A single current position is not presented as a trend.</p>;
  }
  const positions = points.map(({entry}) => entry.position as number);
  const maximum = Math.max(...positions);
  const minimum = Math.min(...positions);
  const span = Math.max(1, maximum - minimum);
  const coordinates = points.map(({entry}, index) => {
    const x = points.length === 1 ? 50 : 6 + (index / (points.length - 1)) * 88;
    const y = 10 + (((entry.position as number) - minimum) / span) * 70;
    return `${x},${y}`;
  }).join(" ");
  const provider = points[0]?.snapshot.provider.name ?? "Ranking provider";
  return (
    <figure className="mt-5 border border-white/15 p-4">
      <figcaption className="text-sm font-semibold text-ink">Published position history · {provider}</figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Ranking position changed from ${positions[0]} to ${positions.at(-1)} across ${points.length} published snapshots.`} className="mt-3 h-40 w-full" preserveAspectRatio="none">
        <line x1="6" y1="80" x2="94" y2="80" stroke="currentColor" className="text-white/20" vectorEffect="non-scaling-stroke" />
        <polyline points={coordinates} fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {coordinates.split(" ").map((point, index) => { const [cx, cy] = point.split(","); return <circle key={`${points[index]?.snapshot.canonicalId}-${point}`} cx={cx} cy={cy} r="2" fill="currentColor" className="text-accent" vectorEffect="non-scaling-stroke" />; })}
      </svg>
      <ol className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">{points.map(({snapshot, entry}) => <li key={snapshot.canonicalId}>{snapshot.rankingDate}: <strong className="text-ink">#{entry.position}</strong></li>)}</ol>
      <p className="mt-3 text-xs leading-5 text-muted">Only source-confirmed published snapshots are plotted. Provider attribution and source links remain in the entries below.</p>
    </figure>
  );
}
