import { stegaClean } from "next-sanity";

import type {
  AdminCompetitionList,
  AdminCompetitionSource,
  AdminCompetitionSummary,
} from "@/types/admin-competition";
import type {
  CompetitionContentStatus,
  CompetitionDiscipline,
  CompetitionStatus,
  OrganizerVerificationStatus,
} from "@/types/competition";
import type {
  ProvenanceSourceType,
  ProvenanceVerificationStatus,
} from "@/types/provenance";

type JsonRecord = Record<string, unknown>;

const competitionStatuses = [
  "upcoming",
  "completed",
  "postponed",
  "cancelled",
  "preview",
] as const satisfies readonly CompetitionStatus[];
const contentStatuses = [
  "published-record",
  "fictional-prototype",
  "sample-record",
  "not-official",
] as const satisfies readonly CompetitionContentStatus[];
const disciplines = [
  "freestyle",
  "streetlifting",
  "weighted-calisthenics",
  "static-strength",
  "dynamic",
  "endurance",
  "skills",
  "team",
  "mixed",
] as const satisfies readonly CompetitionDiscipline[];
const organizerStatuses = [
  "unverified",
  "reviewed",
  "verified",
  "sample",
] as const satisfies readonly OrganizerVerificationStatus[];
const sourceTypes = [
  "official-results-page",
  "organization-ranking-page",
  "official-result-sheet",
  "organizer-source",
  "athlete-submitted",
  "editor-confirmed",
  "other",
] as const satisfies readonly ProvenanceSourceType[];
const verificationStatuses = [
  "unverified",
  "submitted",
  "source-confirmed",
  "official",
  "disputed",
  "superseded",
] as const satisfies readonly ProvenanceVerificationStatus[];

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown): string {
  return typeof value === "string" ? stegaClean(value).trim() : "";
}

function optionalString(value: unknown): string | undefined {
  return string(value) || undefined;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function exact<T extends string>(
  value: unknown,
  values: readonly T[],
): T | undefined {
  const candidate = string(value);
  return values.includes(candidate as T) ? (candidate as T) : undefined;
}

function safeUrl(value: unknown): string | undefined {
  try {
    const url = new URL(string(value));
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeSource(value: unknown): AdminCompetitionSource | undefined {
  const source = record(value);
  const providerValue = record(source.provider);
  const providerId = string(providerValue.canonicalId ?? providerValue._id);
  const providerName = string(providerValue.name);
  const provider =
    providerId && providerName
      ? {
          canonicalId: providerId,
          name: providerName,
          status: exact(
            providerValue.status,
            ["active", "inactive", "under-review"] as const,
          ),
        }
      : undefined;
  const normalized: AdminCompetitionSource = {
    title: optionalString(source.title ?? source.sourceTitle),
    type: exact(source.type ?? source.sourceType, sourceTypes),
    url: safeUrl(source.url),
    externalRecordId: optionalString(source.externalRecordId),
    checkedAt: optionalString(source.checkedAt),
    verificationStatus: exact(
      source.verificationStatus,
      verificationStatuses,
    ),
    provider,
  };

  return Object.values(normalized).some((item) => item !== undefined)
    ? normalized
    : undefined;
}

function normalizeCompetition(value: unknown): AdminCompetitionSummary | undefined {
  const source = record(value);
  const canonicalId = string(source.canonicalId ?? source._id);
  const name = string(source.name);

  if (!canonicalId || !name) {
    return undefined;
  }

  const organizationValue = record(source.organization);
  const organizationId = string(
    organizationValue.canonicalId ?? organizationValue._id,
  );
  const organizationName = string(organizationValue.name);

  return {
    canonicalId,
    slug: optionalString(source.slug),
    name,
    eventSeries: optionalString(source.eventSeries),
    editorialPriority: exact(source.editorialPriority, [
      "world-championship",
      "continental-championship",
      "national-championship",
      "major-open",
      "qualifier",
      "major-event",
      "standard",
    ] as const),
    featured: source.featured === true,
    status: exact(source.status, competitionStatuses),
    publicStatus: exact(
      source.publicStatus,
      ["draft", "published", "archived"] as const,
    ),
    legacyPublic: source.legacyPublic === true,
    contentStatus: exact(source.contentStatus, contentStatuses),
    startDate: optionalString(source.startDate),
    endDate: optionalString(source.endDate),
    city: optionalString(source.city),
    administrativeArea: optionalString(
      source.administrativeArea ?? source.state,
    ),
    country: optionalString(source.country),
    venueName: optionalString(source.venueName),
    organizerName: optionalString(source.organizerName),
    organizerVerificationStatus: exact(
      source.organizerVerificationStatus,
      organizerStatuses,
    ),
    disciplines: array(source.disciplines).flatMap((item) => {
      const discipline = exact(item, disciplines);
      return discipline ? [discipline] : [];
    }),
    primaryDiscipline: exact(source.primaryDiscipline, disciplines),
    competitionFormat: optionalString(source.competitionFormat),
    externalProviderId: optionalString(source.externalProviderId),
    externalProviderUrl: safeUrl(source.externalProviderUrl),
    organization:
      organizationId && organizationName
        ? {canonicalId: organizationId, name: organizationName}
        : undefined,
    source: normalizeSource(source.source),
    updatedAt: optionalString(source.updatedAt),
  };
}

export function normalizeAdminCompetitionList(
  value: unknown,
): AdminCompetitionList {
  const source = record(value);
  const counts = record(source.counts);

  return {
    counts: {
      total: count(counts.total),
      samples: count(counts.samples),
      real: count(counts.real),
      sourceConfirmed: count(counts.sourceConfirmed),
      upcoming: count(counts.upcoming),
      past: count(counts.past),
    },
    total: count(source.total),
    items: array(source.items).flatMap((item) => {
      const competition = normalizeCompetition(item);
      return competition ? [competition] : [];
    }),
  };
}
