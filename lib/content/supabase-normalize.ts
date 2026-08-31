import "server-only";

import type {
  Athlete,
  AthleteCompetitionCategory,
  AthleteDiscipline,
  AthleteSpecialty,
} from "@/types/athlete";
import type {
  Competition,
  CompetitionContentStatus,
  CompetitionDiscipline,
  CompetitionResult,
  CompetitionResultVerificationStatus,
  CompetitionStatus,
} from "@/types/competition";
import type {
  AthleteRankingSnapshot,
  AthleteRankingSnapshotEntry,
} from "@/types/ranking-source";

const ATHLETE_DISCIPLINES: readonly AthleteDiscipline[] = [
  "Freestyle", "Static strength", "Dynamic freestyle", "Endurance", "Strength", "Hand balancing",
];
const ATHLETE_SPECIALTIES: readonly AthleteSpecialty[] = [
  "dynamic-freestyle", "static-combinations", "hand-balancing", "weighted-calisthenics",
  "pull-strength", "dip-strength", "muscle-ups", "endurance", "statics", "team-competition",
  "coaching", "content-creation",
];
const COMPETITION_DISCIPLINES: readonly CompetitionDiscipline[] = [
  "freestyle", "streetlifting", "weighted-calisthenics", "static-strength", "dynamic",
  "endurance", "skills", "team", "mixed",
];

// Supabase carries no equivalent of Sanity's rich editorial category taxonomy
// for athletes -- every canonical athlete written so far comes from the
// Official Streetlifting source or the admin CRUD form, both strength-
// discipline domains, so this is a documented, honest default rather than a
// fabricated classification. It never overrides a recognized value actually
// present in the athlete's own disciplines/specialties.
const DEFAULT_ATHLETE_DISCIPLINE: AthleteDiscipline = "Strength";
const DEFAULT_ATHLETE_CATEGORY: AthleteCompetitionCategory = "power-strength";
const DEFAULT_COMPETITION_DISCIPLINE: CompetitionDiscipline = "streetlifting";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A nested single-row FK join (e.g. ranking_systems -> ranking_providers)
// comes back from supabase-js as an array without generated Database types
// to tell it otherwise -- same pattern already used in
// app/(admin)/admin/db/rankings/page.tsx.
function firstOf<T>(value: T | readonly T[] | null | undefined): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null | undefined) ?? null;
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function filterKnown<T extends string>(values: readonly string[] | null | undefined, allowed: readonly T[]): T[] {
  const set = new Set<string>(allowed);
  return (values ?? []).filter((value): value is T => set.has(value));
}

export type SupabaseAthleteRow = {
  readonly id: string;
  readonly permanent_id: string;
  readonly slug: string;
  readonly name: string;
  readonly display_name: string | null;
  readonly biography: string;
  readonly country: string | null;
  readonly administrative_area: string | null;
  readonly city: string | null;
  readonly disciplines: readonly string[] | null;
  readonly specialties: readonly string[] | null;
  readonly identity_state: string;
  readonly provenance_status: string;
  readonly updated_at: string;
};

/**
 * Only ever called with rows the caller already restricted to
 * editorial_state = 'approved' (see SupabaseContentRepository) -- this
 * function does not itself gate publication, it normalizes an already
 * publication-safe row.
 */
export function normalizeSupabaseAthlete(row: SupabaseAthleteRow): Athlete {
  const disciplines = filterKnown(row.disciplines, ATHLETE_DISCIPLINES);
  const specialties = filterKnown(row.specialties, ATHLETE_SPECIALTIES);
  const biography = row.biography.trim();
  return {
    canonicalId: row.id,
    slug: row.slug,
    name: row.name,
    initials: initialsFor(row.name),
    profileNumber: "",
    status: "",
    city: row.city ?? "",
    state: row.administrative_area ?? "",
    country: row.country ?? "",
    administrativeArea: row.administrative_area ?? "",
    region: "",
    disciplines,
    primaryDiscipline: disciplines[0] ?? DEFAULT_ATHLETE_DISCIPLINE,
    primaryCategory: DEFAULT_ATHLETE_CATEGORY,
    specialties,
    profileLabel: "",
    shortBio: biography,
    fullBio: biography ? biography.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) : [],
    quote: "",
    trainingBase: "",
    yearsActive: "",
    style: "",
    featured: false,
    updatedAt: row.updated_at,
    verification: {
      identityStatus: row.identity_state === "identity-confirmed" ? "profile-control-confirmed" : "unverified",
      // Only approved rows reach this function at all (see doc comment above).
      profileStatus: "approved",
    },
    socialLinks: [],
    rankingEligible: true,
    statistics: [],
    achievements: [],
    timeline: [],
    competitionHistory: [],
    relatedStorySlugs: [],
    relatedAthleteSlugs: [],
    visualVariant: "signal",
    disciplineCode: "",
  };
}

function normalizeCompetitionStatus(status: string): CompetitionStatus {
  switch (status) {
    case "upcoming": return "upcoming";
    case "completed": return "completed";
    case "cancelled": return "cancelled";
    case "postponed": return "postponed";
    default: return "unknown";
  }
}

function normalizeContentStatus(provenanceStatus: string): CompetitionContentStatus {
  switch (provenanceStatus) {
    case "real_verified":
    case "real_unverified":
      return "published-record";
    case "fictional_sample":
      return "fictional-prototype";
    default:
      return "not-official";
  }
}

function dateParts(isoDate: string): { dateDisplay: string; monthCode: string; day: string; year: string } {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { dateDisplay: isoDate, monthCode: "", day: "", year: "" };
  }
  const monthCode = parsed.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const year = String(parsed.getUTCFullYear());
  const dateDisplay = parsed.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return { dateDisplay, monthCode, day, year };
}

export type SupabaseCompetitionRow = {
  readonly id: string;
  readonly permanent_id: string;
  readonly slug: string;
  readonly name: string;
  readonly short_name: string | null;
  readonly status: string;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly country: string | null;
  readonly administrative_area: string | null;
  readonly city: string | null;
  readonly venue_name: string | null;
  readonly summary: string;
  readonly disciplines: readonly string[] | null;
  readonly provenance_status: string;
  readonly updated_at: string;
};

/**
 * Only ever called with rows the caller already restricted to
 * public_state = 'published' -- see the doc comment on
 * normalizeSupabaseAthlete for the same reasoning.
 */
export function normalizeSupabaseCompetition(
  row: SupabaseCompetitionRow,
  results?: readonly CompetitionResult[],
): Competition {
  const disciplines = filterKnown(row.disciplines, COMPETITION_DISCIPLINES);
  const status = normalizeCompetitionStatus(row.status);
  const startDate = row.start_date ?? "";
  const { dateDisplay, monthCode, day, year } = startDate ? dateParts(startDate) : { dateDisplay: "Date not yet confirmed", monthCode: "", day: "", year: "" };
  const resolvedResults = results ?? [];
  return {
    canonicalId: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name ?? row.name,
    eventNumber: "",
    status,
    contentStatus: normalizeContentStatus(row.provenance_status),
    startDate,
    ...(row.end_date ? { endDate: row.end_date } : {}),
    dateDisplay,
    monthCode,
    day,
    year,
    city: row.city ?? "",
    state: row.administrative_area ?? "",
    administrativeArea: row.administrative_area ?? "",
    country: row.country ?? "",
    region: "",
    venueName: row.venue_name ?? "",
    venueType: "",
    summary: row.summary,
    fullDescription: row.summary ? [row.summary] : [],
    disciplines,
    primaryDiscipline: disciplines[0] ?? DEFAULT_COMPETITION_DISCIPLINE,
    divisions: [],
    featured: false,
    registrationStatus: "not-open",
    scheduleStatus: status === "completed" ? "completed" : status === "upcoming" ? "published" : "pending",
    resultsStatus: resolvedResults.length > 0 ? "verified-results" : status === "completed" ? "pending" : "not-available",
    capacityLabel: "",
    organizerName: "",
    competitionFormat: "",
    visualVariant: "field",
    schedule: [],
    participants: [],
    results: resolvedResults,
    relatedStorySlugs: [],
    relatedVideoSlugs: [],
    relatedAthleteSlugs: [],
    relatedCompetitionSlugs: [],
    timeline: [],
    notices: [],
  };
}

function verificationStatusFor(resultStatus: string): CompetitionResultVerificationStatus {
  switch (resultStatus) {
    case "official":
    case "corrected":
      return "verified";
    case "source-confirmed":
      return "source-reviewed";
    default:
      return "unverified";
  }
}

export function normalizeSupabaseCompetitionResult(row: {
  readonly id: string;
  readonly division: string | null;
  readonly event: string | null;
  readonly placement: number | null;
  readonly result_status: string;
  readonly athletes: unknown;
  readonly sporting_result_performances: readonly { movement: string; value: number; unit: string }[] | null;
}): CompetitionResult {
  const athlete = firstOf(row.athletes as { name?: string; slug?: string } | readonly { name?: string; slug?: string }[] | null);
  const performances = row.sporting_result_performances ?? [];
  const total = performances.find((entry) => entry.movement === "total");
  return {
    key: row.id,
    placement: row.placement ?? 0,
    athleteSlug: athlete?.slug,
    athleteName: athlete?.name ?? "Unlisted athlete",
    region: "",
    division: row.division ?? undefined,
    scoreDisplay: total ? `${total.value}${total.unit}` : "",
    resultLabel: row.event ?? "",
    movementNote: performances.map((entry) => `${entry.movement} ${entry.value}${entry.unit}`).join(" · "),
    verificationStatus: verificationStatusFor(row.result_status),
    sourceType: "official-event-results",
  };
}

type SupabaseRankingSnapshotRow = {
  readonly id: string;
  readonly ranking_date: string;
  readonly season: string | null;
  readonly methodology_version: string | null;
  readonly checked_at: string;
  readonly source_url: string | null;
  readonly ranking_systems: unknown;
  readonly ranking_entries: readonly {
    readonly rank: number | null;
    readonly points: number | null;
    readonly rating: number | null;
    readonly entry_status: string;
    readonly source_value: unknown;
    readonly provider_entry_id: string | null;
    readonly provider_athlete_id: string | null;
    readonly source_display_name: string | null;
    readonly athletes: unknown;
  }[] | null;
};

/**
 * Always an external, provider-attributed ranking -- never presented as a
 * Cali Central ranking (see docs discussion in app/(site)/rankings/page.tsx
 * and the Official Streetlifting Data Ops work). Only ever called with rows
 * already restricted to publication_status = 'published'.
 */
export function normalizeSupabaseRankingSnapshot(row: SupabaseRankingSnapshotRow): AthleteRankingSnapshot | null {
  const system = firstOf(row.ranking_systems as Record<string, unknown> | readonly Record<string, unknown>[] | null);
  if (!system) return null;
  const provider = firstOf(system.ranking_providers as Record<string, unknown> | readonly Record<string, unknown>[] | null);
  if (!provider) return null;

  const entries: AthleteRankingSnapshotEntry[] = (row.ranking_entries ?? []).flatMap((entry) => {
    const athlete = firstOf(entry.athletes as { id?: string; name?: string; slug?: string } | readonly { id?: string; name?: string; slug?: string }[] | null);
    const athleteName = athlete?.name ?? entry.source_display_name;
    if (!athleteName) return [];
    const sourceValue = isRecord(entry.source_value) ? entry.source_value : {};
    const totalKg = typeof sourceValue.totalKg === "number" ? sourceValue.totalKg : undefined;
    return [{
      canonicalId: `${row.id}:${entry.provider_entry_id ?? athlete?.id ?? entry.provider_athlete_id ?? athleteName}`,
      ...(athlete?.id ? { athleteId: athlete.id } : {}),
      ...(entry.provider_athlete_id ? { externalAthleteId: entry.provider_athlete_id } : {}),
      ...(athlete?.slug ? { athleteSlug: athlete.slug } : {}),
      athleteName,
      ...(entry.source_display_name ? { sourceDisplayName: entry.source_display_name } : {}),
      ...(totalKg !== undefined ? { sourceValue: `${totalKg} kg total` } : {}),
      ...(entry.rank !== null ? { position: entry.rank } : {}),
      ...(entry.points !== null ? { points: entry.points } : {}),
      ...(entry.rating !== null ? { rating: entry.rating } : {}),
      status: !athlete ? "unmatched" : entry.entry_status === "ranked" ? "ranked" : entry.entry_status === "provisional" ? "provisional" : entry.entry_status === "withdrawn" || entry.entry_status === "disqualified" ? "inactive" : "unmatched",
    } satisfies AthleteRankingSnapshotEntry];
  });

  return {
    canonicalId: row.id,
    provider: {
      canonicalId: String(provider.id ?? ""),
      slug: String(provider.slug ?? ""),
      name: String(provider.name ?? ""),
      ...(provider.website ? { website: String(provider.website) } : {}),
      description: "",
      status: provider.status === "active" ? "active" : provider.status === "inactive" ? "inactive" : "under-review",
      disciplines: [],
      geographicScope: String(system.geographic_scope ?? "world"),
      integrationMethod: (["manual", "editorial", "structured-import", "authorized-api", "licensed-feed"] as const).includes(provider.integration_method as never)
        ? (provider.integration_method as AthleteRankingSnapshot["provider"]["integrationMethod"])
        : "structured-import",
      attributionRequirement: String(provider.attribution_requirement ?? ""),
      ...(provider.last_reviewed_at ? { lastReviewedAt: String(provider.last_reviewed_at) } : {}),
    },
    systemName: String(system.name ?? ""),
    systemSlug: String(system.slug ?? ""),
    rankingKind: (["ordinal-position", "points", "rating", "season-standings", "qualification-ranking", "record-leaderboard", "relative-strength"] as const).includes(system.ranking_kind as never)
      ? (system.ranking_kind as AthleteRankingSnapshot["rankingKind"])
      : "ordinal-position",
    discipline: String(system.discipline ?? ""),
    ...(system.category ? { category: String(system.category) } : {}),
    ...(system.division ? { division: String(system.division) } : {}),
    ...(system.weight_class ? { weightClass: String(system.weight_class) } : {}),
    ...(system.sex_division ? { sexDivision: String(system.sex_division) } : {}),
    ...(system.age_group ? { ageGroup: String(system.age_group) } : {}),
    ...(system.lift_format ? { liftFormat: String(system.lift_format) } : {}),
    ...(system.equipment ? { equipment: String(system.equipment) } : {}),
    geographicScope: String(system.geographic_scope ?? "world"),
    ...(row.season ? { season: row.season } : {}),
    ...(row.methodology_version ? { methodologyVersion: row.methodology_version } : {}),
    rankingDate: row.ranking_date,
    checkedAt: row.checked_at,
    entries,
    provenance: {
      providerName: String(provider.name ?? ""),
      ...((row.source_url ?? provider.website) ? { url: String(row.source_url ?? provider.website) } : {}),
      title: `${String(provider.name ?? "External provider")} ranking snapshot`,
      type: "organization-ranking-page",
      checkedAt: row.checked_at,
      // Only published snapshots ever reach a public reader (RLS-gated);
      // "source-confirmed" is the accurate floor for that, not an
      // overstatement -- per-entry provenance detail (source_records) is
      // not anon-readable and is never fabricated here.
      verificationStatus: "source-confirmed",
    },
  };
}
