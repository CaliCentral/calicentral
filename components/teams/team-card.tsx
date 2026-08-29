import Link from "next/link";

import {countryNameFor, formatGlobalLocation} from "@/lib/geography";
import {accessibleTeamMarkColors} from "@/lib/teams/branding";
import type {Team} from "@/types/team";

export function TeamCard({team}: {readonly team: Team}) {
  const prospective = team.publicStatus === "approved-prospective";
  const markColors = accessibleTeamMarkColors(team.branding);
  return (
    <article className="group flex h-full flex-col border border-white/15 bg-surface p-5 transition-colors hover:border-white/35 sm:p-6">
      <div className="flex items-start justify-between gap-5">
        <div
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center border border-white/20 font-display text-xl font-black"
          style={markColors}
        >
          {team.code || team.name.slice(0, 3).toUpperCase()}
        </div>
        <span className="border border-white/20 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-muted">
          {prospective ? "Prospective team" : team.teamType.replaceAll("-", " ")}
        </span>
      </div>
      <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent">
        {countryNameFor(team.country)} / {team.code}
      </p>
      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.045em] text-ink">
        <Link href={`/teams/${team.slug}`} className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          {team.name}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">{formatGlobalLocation(team)}</p>
      <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted">{team.description}</p>
      {prospective ? (
        <p className="mt-5 border-l-2 border-accent pl-3 text-xs leading-5 text-muted">
          Public prospective listing only. This is not league admission or a guaranteed competition slot.
        </p>
      ) : null}
      <span className="mt-auto inline-flex min-h-11 items-end pt-7 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink group-hover:text-accent">
        Open team file <span aria-hidden="true" className="ml-2">→</span>
      </span>
    </article>
  );
}
