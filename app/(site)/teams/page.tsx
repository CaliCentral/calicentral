import type {Metadata} from "next";

import {TeamDirectory} from "@/components/teams/team-directory";
import {Container} from "@/components/ui/container";
import {getTeams} from "@/lib/content";
import {featureConfig} from "@/lib/features/config";
import {createPublicMetadata} from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicMetadata({
  path: "/teams",
  title: "Calisthenics team directory",
  description: "Browse public calisthenics teams, crews, clubs, and explicitly labeled prospective-team records by worldwide geography.",
});

export default async function TeamsPage({searchParams}: {readonly searchParams: Promise<{country?: string | string[]; region?: string | string[]; status?: string | string[]}>}) {
  const [teams, params] = await Promise.all([getTeams(), searchParams]);
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const prospectiveCount = teams.filter((team) => team.publicStatus === "approved-prospective").length;
  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Worldwide field / Canonical team records</p>
          <h1 className="mt-5 max-w-5xl text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl lg:text-8xl">Teams, crews, clubs, and franchises.</h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-muted sm:text-lg">Public team identity is separate from private applications, roster invitations, league admission, and competition eligibility.</p>
          <dl className="mt-10 flex flex-wrap gap-px bg-white/15">
            <Stat label="Public records" value={teams.length} />
            <Stat label="Prospective" value={prospectiveCount} />
            <Stat label="Countries" value={new Set(teams.map((team) => team.country)).size} />
          </dl>
        </Container>
      </header>
      <section aria-labelledby="team-directory-heading" className="bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mb-9 border-t border-white/15 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">Directory / Public records only</p>
            <h2 id="team-directory-heading" className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink sm:text-5xl">Team field</h2>
            {!featureConfig.publicProspectiveTeams ? <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">Prospective-team listings are currently disabled. Private applications are never included in this directory.</p> : null}
          </div>
          <TeamDirectory teams={teams} country={first(params.country)} administrativeArea={first(params.region)} status={first(params.status)} />
        </Container>
      </section>
    </>
  );
}

function Stat({label, value}: {readonly label: string; readonly value: number}) {
  return <div className="min-w-36 bg-surface px-5 py-4"><dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-2 font-display text-3xl font-black text-ink">{String(value).padStart(2, "0")}</dd></div>;
}
