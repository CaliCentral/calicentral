import {
  OFFICIAL_STREETLIFTING_ORIGIN,
  OFFICIAL_STREETLIFTING_PARSER_VERSION,
  OFFICIAL_STREETLIFTING_PROVIDER,
  parseOfficialStreetliftingCompetitions,
  parseOfficialStreetliftingPagination,
} from "@/lib/data-ops/providers/official-streetlifting";
import type { CompetitionSourceProvider } from "@/lib/data-ops/competition-discovery";

export const competitionSourceProviders: readonly CompetitionSourceProvider[] = [{
  id: OFFICIAL_STREETLIFTING_PROVIDER,
  name: "Official Streetlifting",
  baseUrl: `${OFFICIAL_STREETLIFTING_ORIGIN}/`,
  allowedDomains: ["rankings.officialstreetlifting.com"],
  status: "paused",
  trustLevel: "official",
  parserVersion: OFFICIAL_STREETLIFTING_PARSER_VERSION,
  cadenceMinutes: 60,
  capabilities: ["competitions", "athletes", "results", "rankings"],
  identityStrategy: "provider + stable competition URL path identifier",
  maxPagesPerSurface: 250,
  surfaces: [
    { key: "upcoming", initialUrl: `${OFFICIAL_STREETLIFTING_ORIGIN}/competitions` },
    { key: "past", initialUrl: `${OFFICIAL_STREETLIFTING_ORIGIN}/competitions/past` },
  ],
  parseCompetitionList: parseOfficialStreetliftingCompetitions,
  parsePagination: parseOfficialStreetliftingPagination,
}];
