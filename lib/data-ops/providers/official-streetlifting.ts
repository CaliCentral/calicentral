import { createHash } from "node:crypto";

import type {
  OfficialStreetliftingCompetition,
  OfficialStreetliftingRanking,
  OfficialStreetliftingResult,
  RawSourceSnapshot,
  SourceEntityType,
} from "@/lib/data-ops/providers/types";

export const OFFICIAL_STREETLIFTING_PROVIDER = "official-streetlifting";
export const OFFICIAL_STREETLIFTING_ORIGIN = "https://rankings.officialstreetlifting.com";
export const OFFICIAL_STREETLIFTING_PARSER_VERSION = "osl-html-v1";

const MAX_RESPONSE_BYTES = 5_000_000;
const ALLOWED_PATH = /^\/(?:$|athletes(?:\/[^/?#]+)?|competitions(?:\/(?:past|[^/?#]+))?|results(?:\/\d+)?\/?|rankings(?:\/classic)?|records(?:\/[^?#]+)?|competition_styles(?:\/[^/?#]+)?)$/;

function decodeHtml(value: string): string {
  const entities: Readonly<Record<string, string>> = {
    amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entities[entity.toLowerCase()] ?? match;
  });
}

function text(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function capture(value: string, expression: RegExp): string | undefined {
  const result = expression.exec(value)?.[1];
  return result ? decodeHtml(result).trim() : undefined;
}

function numeric(value: string | undefined): number | undefined {
  if (!value || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return undefined;
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

function absolute(path: string): string {
  return new URL(path, OFFICIAL_STREETLIFTING_ORIGIN).toString();
}

function table(html: string): { headers: string[]; rows: string[][]; rawRows: string[] } {
  const tableHtml = capture(html, /<table\b[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableHtml) throw new Error("Official Streetlifting parser: expected one result table.");
  const headers = [...tableHtml.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => text(match[1]));
  const rawRows = [...tableHtml.matchAll(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/gi)]
    .flatMap((body) => [...body[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => row[1]));
  const rows = rawRows.map((row) => [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => text(cell[1])));
  if (!headers.length || !rows.length) throw new Error("Official Streetlifting parser: table has no headers or rows.");
  if (rows.some((row) => row.length !== headers.length)) throw new Error("Official Streetlifting parser: malformed row width.");
  return { headers, rows, rawRows };
}

function resultFromRow(headers: string[], cells: string[], rawRow: string): OfficialStreetliftingResult {
  const values = new Map(headers.map((header, index) => [header.toLowerCase(), cells[index]]));
  const athletePath = capture(rawRow, /href="(\/athletes\/[^"?#]+)"/i);
  const resultPath = capture(rawRow, /href="(\/results\/(\d+))(?:["?#])/i);
  const externalResultId = capture(rawRow, /href="\/results\/(\d+)(?:["?#])/i);
  if (!athletePath || !resultPath || !externalResultId) {
    throw new Error("Official Streetlifting parser: row lacks stable athlete or result identity.");
  }
  const athleteExternalId = athletePath.split("/").filter(Boolean).at(-1);
  if (!athleteExternalId) throw new Error("Official Streetlifting parser: invalid athlete URL.");
  const competitionPath = capture(rawRow, /href="(\/competitions\/[^"?#]+)"/i);
  const resultDate = capture(rawRow, /<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})/i);
  const lifts: Record<string, number> = {};
  for (const [header, value] of values) {
    const match = /^(muscle up|pull|dip|squat) \(kg\)$/.exec(header);
    const amount = numeric(value);
    if (match && amount !== undefined) lifts[match[1].replace(/ /g, "-")] = amount;
  }
  const firstCell = cells[0] ?? "";
  const position = numeric(firstCell.match(/^\d+/)?.[0]);
  const athleteName = capture(rawRow, /href="\/athletes\/[^"?#]+"[^>]*>([^<]+)<\/a>/i);
  if (!athleteName) throw new Error("Official Streetlifting parser: athlete name is missing.");
  const competitionName = competitionPath
    ? capture(rawRow, /href="\/competitions\/[^"?#]+"[^>]*>([^<]+)<\/a>/i)
    : undefined;
  return {
    externalResultId,
    sourceUrl: absolute(resultPath),
    athleteExternalId,
    athleteSourceUrl: absolute(athletePath),
    athleteName,
    ...(competitionPath ? {
      competitionExternalId: competitionPath.split("/").filter(Boolean).at(-1),
      competitionSourceUrl: absolute(competitionPath),
    } : {}),
    ...(competitionName ? { competitionName } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(values.get("gender") ? { gender: values.get("gender") } : {}),
    ...(values.get("class") ? { weightClass: values.get("class") } : {}),
    ...(numeric(values.get("body weight (kg)")) !== undefined ? { bodyweightKg: numeric(values.get("body weight (kg)")) } : {}),
    ...(values.get("style") ? { style: values.get("style") } : {}),
    ...(numeric(values.get("total (kg)")) !== undefined ? { totalKg: numeric(values.get("total (kg)")) } : {}),
    ...(numeric(values.get("ris score")) !== undefined ? { score: numeric(values.get("ris score")) } : {}),
    ...(resultDate ? { resultDate } : {}),
    liftsKg: lifts,
  };
}

export function parseOfficialStreetliftingResults(html: string): readonly OfficialStreetliftingResult[] {
  const parsed = table(html);
  return parsed.rows.map((row, index) => resultFromRow(parsed.headers, row, parsed.rawRows[index]));
}

export function parseOfficialStreetliftingRanking(html: string, sourceUrl: string): OfficialStreetliftingRanking {
  const title = capture(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!title) throw new Error("Official Streetlifting parser: ranking title is missing.");
  const entries = parseOfficialStreetliftingResults(html);
  const normalizedTitle = text(title);
  const gender = /\b(male|female)\b/i.exec(normalizedTitle)?.[1];
  const weightClass = /(?:^|\s)([+-]\d+kg)(?:\s|$)/i.exec(normalizedTitle)?.[1];
  const division = /\b(division\s*\d+|premier)\b/i.exec(normalizedTitle)?.[1];
  return {
    sourceUrl,
    title: normalizedTitle,
    category: normalizedTitle.replace(/\s+rankings?$/i, ""),
    ...(gender ? { gender: gender.toLowerCase() } : {}),
    ...(weightClass ? { weightClass } : {}),
    ...(division ? { division } : {}),
    entries,
  };
}

const COMPETITION_BLOCK_MARKER = '<div class="group relative flex flex-col';

/**
 * The live directory page renders no per-card status badge at all for
 * upcoming competitions (only "Completed" cards carry one) -- confirmed
 * against a real fetch, not assumed. Rather than leaving those as
 * "Unknown" (a missing-data guess masquerading as evidence) or inferring a
 * status from absence, this uses the page's own explicit section
 * boundaries: everything between the literal "Upcoming Competitions"
 * heading and the next section is structurally, deterministically upcoming
 * -- the same kind of positive page evidence a "Completed" badge is, not
 * an inference from what's missing. A card outside any recognized section
 * with no badge still falls back to "Unknown".
 */
function upcomingSectionBounds(html: string): { readonly start: number; readonly end: number } | null {
  const start = html.search(/upcoming\s+competitions/i);
  if (start === -1) return null;
  const afterHeading = html.slice(start);
  const nextSection = afterHeading.search(/past\s+competitions/i);
  const end = nextSection === -1 ? html.length : start + nextSection;
  return { start, end };
}

export function parseOfficialStreetliftingCompetitions(html: string): readonly OfficialStreetliftingCompetition[] {
  const upcomingBounds = upcomingSectionBounds(html);
  const blockStarts: number[] = [];
  for (let cursor = html.indexOf(COMPETITION_BLOCK_MARKER); cursor !== -1; cursor = html.indexOf(COMPETITION_BLOCK_MARKER, cursor + 1)) {
    blockStarts.push(cursor);
  }
  const records = blockStarts.flatMap((blockStart, index) => {
    const block = html.slice(blockStart, blockStarts[index + 1] ?? html.length);
    const path = capture(block, /href="(\/competitions\/[^"?#]+)"/i);
    const name = capture(block, /href="\/competitions\/[^"?#]+"[^>]*>([^<]+)<\/a>/i);
    if (!path || !name) return [];
    const externalId = path.split("/").filter(Boolean).at(-1);
    if (!externalId) return [];
    const badgeStatus = capture(block, /<span\b[^>]*>(Upcoming|Completed|Cancelled|Postponed)<\/span>/i);
    const isInUpcomingSection = Boolean(upcomingBounds) && blockStart >= upcomingBounds!.start && blockStart < upcomingBounds!.end;
    const sourceStatus = badgeStatus ?? (isInUpcomingSection ? "Upcoming" : "Unknown");
    const startDate = capture(block, /<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})/i);
    const location = capture(block, /<time\b[^>]*>[\s\S]*?<\/time>[\s\S]*?<\/div>[\s\S]*?<div\b[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
    const style = capture(block, /<span\b[^>]*>(OSL|All4|Classic|Endurance)<\/span>/i);
    return [{
      externalId,
      sourceUrl: absolute(path),
      name,
      sourceStatus,
      ...(startDate ? { startDate } : {}),
      ...(location ? { location } : {}),
      ...(style ? { style } : {}),
    }];
  });
  return [...new Map(records.map((record) => [record.externalId, record])).values()];
}

export function buildOfficialStreetliftingSnapshot(input: {
  readonly sourceUrl: string;
  readonly fetchedAt: string;
  readonly httpStatus: number;
  readonly contentType: string;
  readonly body: string;
  readonly sourceEntityType: SourceEntityType;
  readonly sourceEntityIdentifier?: string;
  readonly sourceRevisionMarker?: string;
}): RawSourceSnapshot {
  return {
    provider: OFFICIAL_STREETLIFTING_PROVIDER,
    ...input,
    contentHash: createHash("sha256").update(input.body).digest("hex"),
    parserVersion: OFFICIAL_STREETLIFTING_PARSER_VERSION,
  };
}

export async function fetchOfficialStreetliftingPage(input: {
  readonly url: string;
  readonly sourceEntityType: SourceEntityType;
  readonly sourceEntityIdentifier?: string;
}): Promise<RawSourceSnapshot> {
  const url = new URL(input.url, OFFICIAL_STREETLIFTING_ORIGIN);
  if (url.origin !== OFFICIAL_STREETLIFTING_ORIGIN || !ALLOWED_PATH.test(url.pathname)) {
    throw new Error("Official Streetlifting fetch refused: URL is outside the reviewed public route boundary.");
  }
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "user-agent": "CaliCentral-SourceReview/0.1 (+https://calicentral.com/verification)",
    },
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Official Streetlifting fetch failed with HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("text/html")) throw new Error("Official Streetlifting fetch refused a non-HTML response.");
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_RESPONSE_BYTES) throw new Error("Official Streetlifting response exceeds the size limit.");
  const body = await response.text();
  if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) throw new Error("Official Streetlifting response exceeds the size limit.");
  return buildOfficialStreetliftingSnapshot({
    sourceUrl: url.toString(),
    fetchedAt: new Date().toISOString(),
    httpStatus: response.status,
    contentType,
    body,
    sourceEntityType: input.sourceEntityType,
    ...(input.sourceEntityIdentifier ? { sourceEntityIdentifier: input.sourceEntityIdentifier } : {}),
    ...(response.headers.get("etag") ? { sourceRevisionMarker: response.headers.get("etag")! } : {}),
  });
}
