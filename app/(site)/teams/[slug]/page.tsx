import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";

import {Container} from "@/components/ui/container";
import {ContentCommunityActions} from "@/components/community/content-discussion";
import {getTeamPage} from "@/lib/content";
import {isPublicSlug} from "@/lib/content/public-slug";
import {formatGlobalLocation} from "@/lib/geography";
import {createPublicMetadata, publicRobotsMetadata} from "@/lib/site/metadata";
import {accessibleTeamMarkColors} from "@/lib/teams/branding";
import type {TeamPublicStatus} from "@/types/team";

type Props = {readonly params: Promise<{slug: string}>};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  const team = await getTeamPage(slug, {stega: false});
  if (!team) return {title: "Team not found", robots: publicRobotsMetadata(true)};
  return createPublicMetadata({path: `/teams/${team.slug}`, title: `${team.name} — Team profile`, description: team.description, noIndex: team.seo?.noIndex});
}

export default async function TeamPage({params}: Props) {
  const {slug} = await params;
  const team = await getTeamPage(slug);
  if (!team || !isPublicSlug(team.slug)) notFound();
  const prospective = team.publicStatus === "approved-prospective";
  const markColors = accessibleTeamMarkColors(team.branding);
  return (
    <article>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start">
            <div aria-hidden="true" className="grid aspect-square place-items-center border border-white/20 font-display text-4xl font-black" style={markColors}>{team.code}</div>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">Team file / {team.code}</p>
              <h1 className="mt-4 text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl lg:text-8xl">{team.name}</h1>
              <p className="mt-6 text-base font-bold uppercase tracking-[0.02em] text-ink">{formatGlobalLocation(team)}</p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted">{team.description}</p>
              {prospective ? <div className="mt-7 max-w-3xl border border-accent/50 bg-accent/10 p-5"><p className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">Prospective team</p><p className="mt-2 text-sm leading-6 text-muted">Approved for public prospective-team listing. This is not league admission or a guaranteed future competition slot.</p></div> : null}
              {team.prototypeStatus ? <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.11em] text-muted">Fictional prototype record / Not a real team</p> : null}
            </div>
          </div>
        </Container>
      </header>
      <section className="bg-surface-2 py-16 sm:py-20" aria-labelledby="team-record-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">Identity / Public status</p>
              <h2 id="team-record-heading" className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink">Team record</h2>
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
                <Value label="Type" value={team.teamType.replaceAll("-", " ")} />
                <Value label="Public status" value={publicStatusLabel(team.publicStatus)} />
                <Value label="League admission" value={team.leagueAdmissionStatus.replaceAll("-", " ")} />
                <Value label="Training base" value={team.trainingBase || "Not published"} />
                <Value label="Season file" value={team.seasonLabel || "Not published"} />
              </dl>
            </div>
            <div>
              <h2 className="font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink">Public roster</h2>
              <p className="mt-4 text-sm leading-6 text-muted">Only consented, active relationships to public athlete profiles appear here. Application contact details and pending invitations are never queried.</p>
              {team.roster.length ? <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">{team.roster.map((member) => <li key={member.canonicalId} className="flex items-center justify-between gap-5 py-4"><Link href={`/athletes/${member.athleteSlug}`} className="font-bold uppercase text-ink hover:text-accent">{member.athleteName}</Link><span className="font-mono text-xs uppercase text-muted">{member.specialty || member.role}{member.captain ? " / Captain" : ""}</span></li>)}</ul> : <div className="mt-7 border border-white/15 p-6 text-sm leading-6 text-muted">No confirmed public roster is published for this team.</div>}
            </div>
          </div>
          <Link href="/teams" className="mt-10 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink hover:text-accent">← Return to team directory</Link>
        </Container>
      </section>
      <ContentCommunityActions
        targetType="team"
        targetId={team.canonicalId}
        title={team.name}
        returnTo={`/teams/${team.slug}`}
        followType="team"
      />
    </article>
  );
}

function Value({label, value}: {readonly label: string; readonly value: string}) {return <div className="grid grid-cols-[9rem_1fr] gap-4 py-4"><dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">{label}</dt><dd className="text-sm font-bold capitalize text-ink">{value}</dd></div>;}

function publicStatusLabel(status: TeamPublicStatus): string {
  switch (status) {
    case "approved-prospective":
      return "Prospective team listing";
    case "official":
      return "Editorially reviewed public record";
    case "active":
      return "Active public record";
    case "inactive":
      return "Inactive public record";
    case "archived":
      return "Archived public record";
  }
}
