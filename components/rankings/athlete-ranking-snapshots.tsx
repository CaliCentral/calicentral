import Link from "next/link";

import type {AthleteRankingSnapshot} from "@/types/ranking-source";

export function AthleteRankingSnapshots({snapshots}: {readonly snapshots: readonly AthleteRankingSnapshot[]}) {
  return <div className="space-y-7">{snapshots.map((snapshot) => (
    <section key={snapshot.canonicalId} className="border border-white/15 bg-surface">
      <header className="grid gap-5 border-b border-white/10 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">{snapshot.provider.name} / {snapshot.rankingKind.replaceAll("-", " ")}</p>
          <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.045em] text-ink">{snapshot.systemName}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{[snapshot.discipline, snapshot.division, snapshot.weightClass, snapshot.geographicScope].filter(Boolean).join(" · ")}</p>
        </div>
        <dl className="grid grid-cols-2 gap-5 font-mono text-xs uppercase text-muted">
          <div><dt>Ranking date</dt><dd className="mt-1 font-bold text-ink">{snapshot.rankingDate}</dd></div>
          <div><dt>Source checked</dt><dd className="mt-1 font-bold text-ink">{snapshot.checkedAt.slice(0, 10)}</dd></div>
        </dl>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-left">
          <caption className="sr-only">{snapshot.provider.name} {snapshot.systemName} athlete ranking</caption>
          <thead className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.11em] text-muted"><tr><th scope="col" className="px-5 py-4">Rank</th><th scope="col" className="px-5 py-4">Athlete</th><th scope="col" className="px-5 py-4">Points / rating</th><th scope="col" className="px-5 py-4">Rank change</th></tr></thead>
          <tbody className="divide-y divide-white/10">{snapshot.entries.map((entry) => <tr key={entry.canonicalId}><td className="px-5 py-4 font-display text-2xl font-black text-ink">{entry.position ?? "—"}</td><th scope="row" className="px-5 py-4 text-sm font-bold uppercase text-ink">{entry.athleteSlug ? <Link href={`/athletes/${entry.athleteSlug}`} className="hover:text-accent">{entry.athleteName}</Link> : entry.athleteName}</th><td className="px-5 py-4 font-mono text-xs text-muted">{entry.points !== undefined ? `${entry.points} pts` : entry.rating !== undefined ? entry.rating : "Not provided"}</td><td className="px-5 py-4 font-mono text-xs text-muted">{entry.previousPosition && entry.position ? `${entry.previousPosition - entry.position > 0 ? "+" : ""}${entry.previousPosition - entry.position}` : "New / unavailable"}</td></tr>)}</tbody>
        </table>
      </div>
      <footer className="border-t border-white/10 p-5 text-sm text-muted sm:px-7"><a href={snapshot.provenance.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold uppercase tracking-[0.11em] text-accent hover:text-accent-strong">View {snapshot.provider.name} source ↗</a><p className="mt-3">Authority: {snapshot.provider.name}. Verification: {snapshot.provenance.verificationStatus.replaceAll("-", " ")}. Cali Central preserves this dated snapshot and does not present it as a universal world ranking.</p></footer>
    </section>
  ))}</div>;
}
