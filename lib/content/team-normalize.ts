import {stegaClean} from "next-sanity";

import type {Team, TeamLeagueAdmissionStatus, TeamPublicStatus, TeamType} from "@/types/team";

type JsonRecord = Record<string, unknown>;

const teamTypes: readonly TeamType[] = ["wcl-franchise", "prospective-wcl-team", "competitive-team", "crew", "club", "gym-team", "national-team", "other"];
const publicStatuses: readonly TeamPublicStatus[] = ["approved-prospective", "official", "active", "inactive", "archived"];
const admissionStatuses: readonly TeamLeagueAdmissionStatus[] = ["not-applicable", "prospective", "candidate", "official-franchise", "active-season-franchise"];

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown, fallback = ""): string {
  const raw = typeof value === "string" ? stegaClean(value).trim() : "";
  return raw || fallback;
}

function optionalString(value: unknown): string | undefined {
  return string(value) || undefined;
}

function safeUrl(value: unknown): string | undefined {
  const candidate = string(value);
  try {
    const url = new URL(candidate);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function oneOf<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  const candidate = string(value);
  return values.includes(candidate as T) ? candidate as T : fallback;
}

function normalizeTeam(value: unknown): Team | null {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const slug = string(source.slug);
  const name = string(source.name);
  if (!canonicalId || !slug || !name) return null;
  const branding = record(source.branding);
  const seo = record(source.seo);
  const prototypeStatus = oneOf(
    source.prototypeStatus,
    ["fictional-prototype", "sample-record", ""] as const,
    "",
  );
  const roster = array(source.roster).flatMap((item) => {
    const member = record(item);
    const athlete = record(member.athlete);
    const athleteId = string(athlete.canonicalId ?? athlete._id);
    const athleteSlug = string(athlete.slug);
    const athleteName = string(athlete.name);
    if (!athleteId || !athleteSlug || !athleteName) return [];
    return [{
      canonicalId: string(member.canonicalId ?? member._key, `${canonicalId}:${athleteId}`),
      athleteSlug,
      athleteName,
      role: string(member.role, "athlete"),
      specialty: optionalString(member.specialty),
      athleteNumber: optionalString(member.athleteNumber),
      captain: member.captain === true,
    }];
  });
  return {
    canonicalId,
    slug,
    name,
    shortName: string(source.shortName, name),
    code: string(source.code),
    teamType: oneOf(source.teamType, teamTypes, "other"),
    publicStatus: oneOf(source.publicStatus, publicStatuses, "inactive"),
    leagueAdmissionStatus: oneOf(source.leagueAdmissionStatus, admissionStatuses, "not-applicable"),
    country: string(source.country),
    administrativeArea: string(source.administrativeArea),
    city: string(source.city),
    trainingBase: string(source.trainingBase),
    foundingYear: typeof source.foundingYear === "number" && Number.isInteger(source.foundingYear) ? source.foundingYear : undefined,
    description: string(source.description),
    disciplines: array(source.disciplines).map((item) => string(item)).filter(Boolean),
    branding: {
      primaryColor: /^#[0-9A-Fa-f]{6}$/.test(string(branding.primaryColor)) ? string(branding.primaryColor) : "#151515",
      secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(string(branding.secondaryColor)) ? string(branding.secondaryColor) : "#F2F0E9",
      accentColor: /^#[0-9A-Fa-f]{6}$/.test(string(branding.accentColor)) ? string(branding.accentColor) : undefined,
      uniformNotes: optionalString(branding.uniformNotes),
      approvalStatus: oneOf(branding.approvalStatus, ["not-reviewed", "in-review", "approved"] as const, "not-reviewed"),
    },
    socialLinks: array(source.socialLinks).flatMap((item) => {
      const link = record(item);
      const url = safeUrl(link.url);
      return url ? [{label: string(link.label, "Team link"), url}] : [];
    }),
    roster,
    featured: source.featured === true,
    seasonLabel: optionalString(source.seasonLabel),
    prototypeStatus: prototypeStatus || undefined,
    seo: Object.keys(seo).length
      ? {
          title: optionalString(seo.metaTitle),
          description: optionalString(seo.metaDescription),
          noIndex: seo.noIndex === true,
        }
      : undefined,
  };
}

export function normalizeTeams(value: unknown): Team[] {
  const seen = new Set<string>();
  return array(value).flatMap((item) => {
    const team = normalizeTeam(item);
    if (!team || seen.has(team.canonicalId) || seen.has(team.slug)) return [];
    seen.add(team.canonicalId);
    seen.add(team.slug);
    return [team];
  });
}

export function normalizeTeamPage(value: unknown): Team | null {
  return normalizeTeam(value);
}
