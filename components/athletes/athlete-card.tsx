import Link from "next/link";

import { AthleteVisual } from "@/components/athletes/athlete-visual";
import {
  athleteCategoryLabel,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

export type AthleteCardProps = {
  readonly athlete: Athlete;
  readonly compact?: boolean;
};

export function AthleteCard({
  athlete,
  compact = false,
}: AthleteCardProps) {
  const location = formatGlobalLocation(athlete);
  const verificationLabel =
    athlete.verification.profileStatus === "approved"
      ? "Editorial profile approved"
      : athlete.verification.identityStatus === "profile-control-confirmed"
        ? "Profile control confirmed"
        : "Verification not claimed";

  return (
    <Link
      href={`/athletes/${athlete.slug}`}
      className="group block h-full border border-white/15 bg-surface transition-colors hover:border-accent/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <article className="flex h-full min-w-0 flex-col">
        <AthleteVisual athlete={athlete} compact />

        <div className={`flex flex-1 flex-col ${compact ? "p-5" : "p-5 sm:p-6"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-bold uppercase tracking-[0.12em]">
            <span className="text-accent">{athlete.status}</span>
            <span className="text-muted">{athlete.profileNumber}</span>
          </div>

          <h3
            className={`mt-4 text-balance font-display font-black uppercase leading-[0.92] tracking-[-0.05em] text-ink transition-colors group-hover:text-accent ${
              compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            }`}
          >
            {athlete.name}
          </h3>

          <p className="mt-4 font-mono text-xs font-bold uppercase leading-5 tracking-[0.12em] text-muted">
            {location || "Location not published"}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="border border-accent/55 px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent">
              {athleteCategoryLabel(athlete.primaryCategory)}
            </span>
            {athlete.specialties.map((specialty) => (
              <span
                key={specialty}
                className="border border-white/15 px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink"
              >
                {athleteSpecialtyLabel(specialty)}
              </span>
            ))}
          </div>

          {!compact ? (
            <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted">
              {athlete.shortBio}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5 font-mono text-xs font-bold uppercase leading-5 tracking-[0.11em]">
            <span className="text-muted">{verificationLabel}</span>
            <span
              aria-hidden="true"
              className="text-lg text-accent transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
