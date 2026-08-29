import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class SupabaseRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseRepositoryError";
  }
}

export function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new SupabaseRepositoryError(error.message);
  if (data === null) throw new SupabaseRepositoryError("Supabase returned no data.");
  return data;
}

/**
 * RLS-aware migration repository. Public reads and protected editorial writes
 * use the caller's Supabase session; no service-role bypass is used here.
 */
export class SupabaseContentRepository {
  async listPublishedAthletes() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("athletes").select("id, permanent_id, slug, name, display_name, biography, country, administrative_area, city, disciplines, specialties").eq("editorial_state", "approved").order("name");
    return requireData(data, error);
  }

  async listPublishedCompetitions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("competitions").select("id, permanent_id, slug, name, short_name, status, start_date, end_date, country, administrative_area, city, venue_name, summary, disciplines, organization_id, ruleset_id").eq("public_state", "published").order("start_date");
    return requireData(data, error);
  }

  async listPublishedEditorial(contentType?: "story" | "video") {
    const client = await createSupabaseServerClient();
    let query = client.from("editorial_content").select("id, content_type, slug, title, excerpt, body, author_id, seo, updated_at, editorial_publication_state!inner(state, changed_at)").eq("editorial_publication_state.is_current", true).eq("editorial_publication_state.state", "published").order("updated_at", { ascending: false });
    if (contentType) query = query.eq("content_type", contentType);
    const { data, error } = await query;
    return requireData(data, error);
  }

  async listPublishedRankingSnapshots() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("ranking_snapshots").select("id, ranking_date, season, methodology_version, source_record_id, ranking_systems(name, ranking_kind, discipline, provider_id), ranking_entries(rank, points, rating, entry_status, athletes(id, permanent_id, name, slug))").eq("publication_status", "published").order("ranking_date", { ascending: false });
    return requireData(data, error);
  }

  async createEditorialDraft(input: { readonly contentType: "story" | "video" | "page"; readonly slug: string; readonly title: string; readonly excerpt?: string }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("editorial_content").insert({
      content_type: input.contentType, slug: input.slug, title: input.title, excerpt: input.excerpt ?? "", body: [],
    }).select("id").single();
    const content = requireData(data, error);
    const state = await client.from("editorial_publication_state").insert({ editorial_content_id: content.id, state: "draft", is_current: true });
    if (state.error) throw new SupabaseRepositoryError(state.error.message);
    return content.id;
  }

  async saveEditorialRevision(input: { readonly contentId: string; readonly revisionNumber: number; readonly snapshot: Readonly<Record<string, unknown>> }) {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("editorial_revisions").insert({
      editorial_content_id: input.contentId, revision_number: input.revisionNumber, snapshot: input.snapshot,
    });
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async setPublicationState(input: { readonly contentId: string; readonly state: "draft" | "in-review" | "approved" | "published" | "unpublished" | "archived"; readonly reason?: string }) {
    const client = await createSupabaseServerClient();
    const result = await client.rpc("transition_editorial_publication", {
      content_id: input.contentId,
      next_state: input.state,
      transition_reason: input.reason ?? null,
    });
    if (result.error) throw new SupabaseRepositoryError(result.error.message);
  }
}
