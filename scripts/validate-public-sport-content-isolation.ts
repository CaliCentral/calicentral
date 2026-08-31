import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression coverage for the public Supabase-backed sport pages
// (/athletes, /competitions, /rankings, the homepage sport modules):
// every entity getter must check useSupabaseAuth before falling through to
// the legacy isSanityConfigured/fallback branch, and the Supabase-side
// implementation must never reference a specific sample/fictional record
// by id or slug -- once hosted preview's sample data is deleted and real
// records are published, this code must keep working unchanged.
const contentIndex = readFileSync("lib/content/index.ts", "utf8");
const supabaseSource = readFileSync("lib/content/supabase-source.ts", "utf8");
const supabaseNormalize = readFileSync("lib/content/supabase-normalize.ts", "utf8");
const repository = readFileSync("lib/supabase/repository.ts", "utf8");

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} must remain exported`);
  const next = source.indexOf("\nexport ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

for (const name of [
  "getAthletes",
  "getAthletePage",
  "getAthleteSlugs",
  "getCompetitions",
  "getCompetitionPage",
  "getCompetitionSlugs",
  "getAthleteRankingSnapshots",
  "getHomepageContent",
] as const) {
  const body = functionBody(contentIndex, name);
  const providerBranch = body.indexOf("useSupabaseAuth");
  const sanityCheck = body.indexOf("isSanityConfigured");
  assert(providerBranch >= 0, `${name} must branch on useSupabaseAuth`);
  assert(
    sanityCheck === -1 || providerBranch < sanityCheck,
    `${name} must check useSupabaseAuth before falling through to the legacy isSanityConfigured/fallback path`,
  );
}

// A UUID literal, or a slug compared/filtered against a specific known
// value (.eq("slug", "...") / === "some-slug"), embedded in the Supabase-
// side sport content code would mean it only works for today's known
// sample or rehearsal records -- exactly what this catches before hosted
// sample data is ever deleted and replaced with real imports. This is
// deliberately narrower than a blanket word search: provenance_status/
// contentStatus enum values like "fictional_sample" and
// "fictional-prototype" are real, generic domain vocabulary that applies to
// ANY record carrying that status, not a hardcoded reference to one -- a
// broader search would incorrectly flag that legitimate, generic handling.
const UUID_LITERAL_PATTERN = /["'][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}["']/i;
const SPECIFIC_SLUG_COMPARISON_PATTERN = /(===|\.eq\(\s*["'](?:slug|external_id)["'],\s*)["'](?:rls-|osl-athlete-|osl-competition-|rehearsal|sample-)[a-z0-9-]*["']/i;
for (const [name, source] of [
  ["lib/content/supabase-source.ts", supabaseSource],
  ["lib/content/supabase-normalize.ts", supabaseNormalize],
] as const) {
  assert.doesNotMatch(source, UUID_LITERAL_PATTERN, `${name} must not hardcode a specific record's UUID`);
  assert.doesNotMatch(
    source,
    SPECIFIC_SLUG_COMPARISON_PATTERN,
    `${name} must not filter or compare against one specific sample/rehearsal slug -- public Supabase content must work for any published record`,
  );
}

// The repository's public read methods must all filter by publication
// state (never return every row unconditionally) -- a quick structural
// check that the gate is present in source, not just relied upon via RLS
// alone (defense in depth: RLS is authoritative, but an app-level filter
// that silently vanished would still be a regression worth catching here).
for (const [method, column, value] of [
  ["listPublishedAthletes", "editorial_state", "approved"],
  ["getPublishedAthleteBySlug", "editorial_state", "approved"],
  ["listPublishedAthleteSlugs", "editorial_state", "approved"],
  ["listPublishedCompetitions", "public_state", "published"],
  ["getPublishedCompetitionBySlug", "public_state", "published"],
  ["listPublishedCompetitionSlugs", "public_state", "published"],
  ["listPublishedRankingSnapshots", "publication_status", "published"],
] as const) {
  const start = repository.indexOf(`async ${method}(`);
  assert.notEqual(start, -1, `${method} must remain exported on SupabaseContentRepository`);
  const next = repository.indexOf("\n  async ", start + 1);
  const body = repository.slice(start, next === -1 ? undefined : next);
  assert(
    body.includes(`eq("${column}", "${value}")`),
    `${method} must filter on ${column} = "${value}" -- app-level publication gate, in addition to RLS`,
  );
}

console.log(
  "Public sport content isolation validation passed: provider branching, no hardcoded sample references, and app-level publication gates present on every public read.",
);
