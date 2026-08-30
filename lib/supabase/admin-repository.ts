import "server-only";

import { requireData, SupabaseRepositoryError } from "@/lib/supabase/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * RLS-aware admin data layer for the Supabase-backed editorial/sport admin
 * UI. Every method uses the caller's own Supabase session (no service-role
 * bypass) -- the capability checks that decide who can see drafts or write
 * source truth (editorial.review, editorial.publish, sport.write_source_truth,
 * ranking.write) live entirely in Postgres RLS (see
 * supabase/migrations/202608290004_rls.sql and .../0005_...sql). This class
 * never re-implements those checks; a caller without the right capability
 * simply gets fewer rows back (SELECT) or a Postgres error (write), which
 * lib/supabase/admin-actions.ts turns into a readable message.
 *
 * There is intentionally no "find athlete by name" or "merge athletes"
 * operation anywhere in this file. Athlete identity must never be merged by
 * name alone (see docs/data-provenance.md) -- canonical athletes are created
 * once with a permanent_id and only ever linked to additional evidence via
 * external_athlete_identities/athlete_claims, both of which carry their own
 * verification_state independent of the canonical record.
 */
export class SupabaseAdminRepository {
  // ---------------------------------------------------------------- athletes

  async listAthletes() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("athletes")
      .select("id, permanent_id, slug, name, display_name, country, identity_state, editorial_state, updated_at")
      .order("updated_at", { ascending: false });
    return requireData(data, error);
  }

  async getAthlete(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("athletes").select("*").eq("id", id).maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async listExternalIdentitiesForAthlete(athleteId: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("external_athlete_identities")
      .select("id, provider, external_id, external_url, verification_state, source_record_id, created_at")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });
    return requireData(data, error);
  }

  async createAthlete(input: {
    readonly permanentId: string;
    readonly slug: string;
    readonly name: string;
    readonly displayName?: string;
    readonly biography?: string;
    readonly country?: string;
    readonly administrativeArea?: string;
    readonly city?: string;
    readonly disciplines?: readonly string[];
    readonly specialties?: readonly string[];
    readonly identityState?: string;
    readonly editorialState?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("athletes")
      .insert({
        permanent_id: input.permanentId,
        slug: input.slug,
        name: input.name,
        display_name: input.displayName ?? null,
        biography: input.biography ?? "",
        country: input.country ?? null,
        administrative_area: input.administrativeArea ?? null,
        city: input.city ?? null,
        disciplines: input.disciplines ?? [],
        specialties: input.specialties ?? [],
        identity_state: input.identityState ?? "unconfirmed",
        editorial_state: input.editorialState ?? "draft",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateAthlete(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      displayName: string | null;
      biography: string;
      country: string | null;
      administrativeArea: string | null;
      city: string | null;
      disciplines: readonly string[];
      specialties: readonly string[];
      identityState: string;
      editorialState: string;
    }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("athletes")
      .update({
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
        ...(input.biography !== undefined ? { biography: input.biography } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.administrativeArea !== undefined ? { administrative_area: input.administrativeArea } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.disciplines !== undefined ? { disciplines: input.disciplines } : {}),
        ...(input.specialties !== undefined ? { specialties: input.specialties } : {}),
        ...(input.identityState !== undefined ? { identity_state: input.identityState } : {}),
        ...(input.editorialState !== undefined ? { editorial_state: input.editorialState } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // ----------------------------------------------------------- organizations

  async listOrganizations() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("organizations")
      .select("id, slug, name, organization_type, country, review_state, updated_at")
      .order("updated_at", { ascending: false });
    return requireData(data, error);
  }

  async getOrganization(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("organizations").select("*").eq("id", id).maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async createOrganization(input: {
    readonly slug: string;
    readonly name: string;
    readonly organizationType?: string;
    readonly website?: string;
    readonly country?: string;
    readonly description?: string;
    readonly reviewState?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("organizations")
      .insert({
        slug: input.slug,
        name: input.name,
        organization_type: input.organizationType ?? null,
        website: input.website ?? null,
        country: input.country ?? null,
        description: input.description ?? "",
        review_state: input.reviewState ?? "draft",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateOrganization(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      organizationType: string | null;
      website: string | null;
      country: string | null;
      description: string;
      reviewState: string;
    }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("organizations")
      .update({
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.organizationType !== undefined ? { organization_type: input.organizationType } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.reviewState !== undefined ? { review_state: input.reviewState } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // ------------------------------------------------------------ competitions

  async listCompetitions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("competitions")
      .select("id, slug, name, status, public_state, start_date, end_date, country, updated_at")
      .order("updated_at", { ascending: false });
    return requireData(data, error);
  }

  async getCompetition(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("competitions").select("*").eq("id", id).maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async listOrganizationOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("organizations").select("id, name").order("name");
    return requireData(data, error);
  }

  async listRulesetOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("rulesets").select("id, name, status").order("name");
    return requireData(data, error);
  }

  async createCompetition(input: {
    readonly permanentId: string;
    readonly slug: string;
    readonly name: string;
    readonly shortName?: string;
    readonly status: string;
    readonly organizationId?: string | null;
    readonly rulesetId?: string | null;
    readonly startDate?: string | null;
    readonly endDate?: string | null;
    readonly country?: string;
    readonly city?: string;
    readonly summary?: string;
    readonly disciplines?: readonly string[];
    readonly publicState?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("competitions")
      .insert({
        permanent_id: input.permanentId,
        slug: input.slug,
        name: input.name,
        short_name: input.shortName ?? null,
        status: input.status,
        organization_id: input.organizationId ?? null,
        ruleset_id: input.rulesetId ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        country: input.country ?? null,
        city: input.city ?? null,
        summary: input.summary ?? "",
        disciplines: input.disciplines ?? [],
        public_state: input.publicState ?? "draft",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateCompetition(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      shortName: string | null;
      status: string;
      organizationId: string | null;
      rulesetId: string | null;
      startDate: string | null;
      endDate: string | null;
      country: string | null;
      city: string | null;
      summary: string;
      disciplines: readonly string[];
      publicState: string;
    }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("competitions")
      .update({
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.shortName !== undefined ? { short_name: input.shortName } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
        ...(input.rulesetId !== undefined ? { ruleset_id: input.rulesetId } : {}),
        ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
        ...(input.endDate !== undefined ? { end_date: input.endDate } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.disciplines !== undefined ? { disciplines: input.disciplines } : {}),
        ...(input.publicState !== undefined ? { public_state: input.publicState } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // ---------------------------------------------------------------- rankings

  async listRankingProviders() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_providers")
      .select("id, slug, name, status, integration_method, last_reviewed_at")
      .order("name");
    return requireData(data, error);
  }

  async createRankingProvider(input: {
    readonly slug: string;
    readonly name: string;
    readonly organizationId?: string | null;
    readonly website?: string;
    readonly status?: string;
    readonly integrationMethod: string;
    readonly attributionRequirement: string;
    readonly sourcePolicyNotes?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_providers")
      .insert({
        slug: input.slug,
        name: input.name,
        organization_id: input.organizationId ?? null,
        website: input.website ?? null,
        status: input.status ?? "under-review",
        integration_method: input.integrationMethod,
        attribution_requirement: input.attributionRequirement,
        source_policy_notes: input.sourcePolicyNotes ?? "",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateRankingProvider(
    id: string,
    input: Partial<{ status: string; sourcePolicyNotes: string; website: string | null; lastReviewedAt: string }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("ranking_providers")
      .update({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sourcePolicyNotes !== undefined ? { source_policy_notes: input.sourcePolicyNotes } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
        ...(input.lastReviewedAt !== undefined ? { last_reviewed_at: input.lastReviewedAt } : {}),
      })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async listRankingSystems() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_systems")
      .select("id, slug, name, ranking_kind, discipline, status, ranking_providers(name)")
      .order("name");
    return requireData(data, error);
  }

  async createRankingSystem(input: {
    readonly providerId: string;
    readonly slug: string;
    readonly name: string;
    readonly rankingKind: string;
    readonly discipline: string;
    readonly geographicScope: string;
    readonly movement?: string;
    readonly division?: string;
    readonly weightClass?: string;
    readonly sexDivision?: string;
    readonly ageGroup?: string;
    readonly methodologyNotes?: string;
    readonly status?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_systems")
      .insert({
        provider_id: input.providerId,
        slug: input.slug,
        name: input.name,
        ranking_kind: input.rankingKind,
        discipline: input.discipline,
        geographic_scope: input.geographicScope,
        movement: input.movement ?? null,
        division: input.division ?? null,
        weight_class: input.weightClass ?? null,
        sex_division: input.sexDivision ?? null,
        age_group: input.ageGroup ?? null,
        methodology_notes: input.methodologyNotes ?? "",
        status: input.status ?? "draft",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateRankingSystemStatus(id: string, status: string) {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("ranking_systems").update({ status }).eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async listRankingSystemOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("ranking_systems").select("id, name").order("name");
    return requireData(data, error);
  }

  async listRankingSnapshots() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_snapshots")
      .select("id, ranking_date, season, publication_status, ranking_systems(name)")
      .order("ranking_date", { ascending: false });
    return requireData(data, error);
  }

  async getRankingSnapshot(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_snapshots")
      .select("*, ranking_systems(name), ranking_entries(id, athlete_id, rank, points, rating, entry_status, athletes(name, permanent_id))")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async createRankingSnapshot(input: {
    readonly rankingSystemId: string;
    readonly rankingDate: string;
    readonly sourceRecordId: string;
    readonly checkedAt: string;
    readonly season?: string;
    readonly methodologyVersion?: string;
    readonly publicationStatus?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("ranking_snapshots")
      .insert({
        ranking_system_id: input.rankingSystemId,
        ranking_date: input.rankingDate,
        source_record_id: input.sourceRecordId,
        checked_at: input.checkedAt,
        season: input.season ?? null,
        methodology_version: input.methodologyVersion ?? null,
        publication_status: input.publicationStatus ?? "draft",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  async updateRankingSnapshotStatus(id: string, publicationStatus: string) {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("ranking_snapshots").update({ publication_status: publicationStatus }).eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async addRankingEntry(input: {
    readonly rankingSnapshotId: string;
    readonly athleteId: string;
    readonly rank?: number;
    readonly points?: number;
    readonly rating?: number;
    readonly entryStatus?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("ranking_entries").insert({
      ranking_snapshot_id: input.rankingSnapshotId,
      athlete_id: input.athleteId,
      rank: input.rank ?? null,
      points: input.points ?? null,
      rating: input.rating ?? null,
      entry_status: input.entryStatus ?? "ranked",
    });
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // ----------------------------------------------------------- sport results

  async listSportingResults(filter?: { readonly resultStatus?: string }) {
    const client = await createSupabaseServerClient();
    let query = client
      .from("sporting_results")
      .select("id, division, event, placement, result_status, competitions(name), athletes(name), teams(name), updated_at")
      .order("updated_at", { ascending: false });
    if (filter?.resultStatus) query = query.eq("result_status", filter.resultStatus);
    const { data, error } = await query;
    return requireData(data, error);
  }

  async getSportingResult(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("sporting_results")
      .select("*, competitions(name), athletes(name, permanent_id), teams(name), sporting_result_performances(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async listCompetitionOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("competitions").select("id, name").order("name");
    return requireData(data, error);
  }

  async listAthleteOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("athletes").select("id, name, permanent_id").order("name");
    return requireData(data, error);
  }

  async listTeamOptions() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("teams").select("id, name, short_name").order("name");
    return requireData(data, error);
  }

  async createSportingResult(input: {
    readonly competitionId: string;
    readonly athleteId?: string | null;
    readonly teamId?: string | null;
    readonly division: string;
    readonly event: string;
    readonly placement?: number | null;
    readonly resultStatus: string;
    readonly sourceRecordId: string;
    readonly rulesetId?: string | null;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("sporting_results")
      .insert({
        competition_id: input.competitionId,
        athlete_id: input.athleteId ?? null,
        team_id: input.teamId ?? null,
        division: input.division,
        event: input.event,
        placement: input.placement ?? null,
        result_status: input.resultStatus,
        source_record_id: input.sourceRecordId,
        ruleset_id: input.rulesetId ?? null,
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  /**
   * The sporting_results_result_status_check CHECK constraint only enforces
   * enum membership -- it does NOT restrict transition direction. Nothing in
   * this repository, the Server Action, or the schema currently prevents an
   * arbitrary backward move (e.g. official -> imported); the only gate is
   * the sport.write_source_truth RLS capability. This is intentional for
   * now (a capability holder may legitimately need to revert/correct a
   * result), not an oversight, but it means this endpoint trusts the
   * capability holder's judgment on transition direction entirely -- add an
   * explicit transition-order guard here if that trust ever needs to
   * narrow.
   */
  async updateSportingResultStatus(id: string, resultStatus: string) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("sporting_results")
      .update({ result_status: resultStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // -------------------------------------------------------- editorial admin

  async listEditorialForAdmin(contentType?: "story" | "video") {
    const client = await createSupabaseServerClient();
    let query = client
      .from("editorial_content")
      .select("id, content_type, slug, title, updated_at, editorial_publication_state!inner(state, changed_at, is_current)")
      .eq("editorial_publication_state.is_current", true)
      .order("updated_at", { ascending: false });
    if (contentType) query = query.eq("content_type", contentType);
    const { data, error } = await query;
    return requireData(data, error);
  }

  async getEditorialForAdmin(id: string) {
    const client = await createSupabaseServerClient();
    const [{ data: content, error: contentError }, { data: history, error: historyError }, { data: story }, { data: video }] =
      await Promise.all([
        client.from("editorial_content").select("*").eq("id", id).maybeSingle(),
        client
          .from("editorial_publication_state")
          .select("id, state, changed_at, changed_by, reason, is_current")
          .eq("editorial_content_id", id)
          .order("changed_at", { ascending: false }),
        client.from("stories").select("*").eq("editorial_content_id", id).maybeSingle(),
        client.from("videos").select("*").eq("editorial_content_id", id).maybeSingle(),
      ]);
    if (contentError) throw new SupabaseRepositoryError(contentError.message);
    if (historyError) throw new SupabaseRepositoryError(historyError.message);
    if (!content) return null;
    return { content, history: history ?? [], story: story ?? null, video: video ?? null };
  }

  async updateEditorialCore(id: string, input: Partial<{ title: string; excerpt: string; slug: string; body: unknown }>) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("editorial_content")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async createVideoFields(editorialContentId: string, input: { readonly ownershipStatus: string }) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("videos")
      .insert({ editorial_content_id: editorialContentId, ownership_status: input.ownershipStatus });
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async updateStoryFields(
    id: string,
    input: Partial<{ category: string | null; eyebrow: string | null; featured: boolean; readTimeMinutes: number | null }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("stories")
      .update({
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.eyebrow !== undefined ? { eyebrow: input.eyebrow } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.readTimeMinutes !== undefined ? { read_time_minutes: input.readTimeMinutes } : {}),
      })
      .eq("editorial_content_id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  async updateVideoFields(
    id: string,
    input: Partial<{ ownershipStatus: string; sourcePlatform: string | null; sourceAccount: string | null; originalPostUrl: string | null; durationSeconds: number | null }>,
  ) {
    const client = await createSupabaseServerClient();
    const { error } = await client
      .from("videos")
      .update({
        ...(input.ownershipStatus !== undefined ? { ownership_status: input.ownershipStatus } : {}),
        ...(input.sourcePlatform !== undefined ? { source_platform: input.sourcePlatform } : {}),
        ...(input.sourceAccount !== undefined ? { source_account: input.sourceAccount } : {}),
        ...(input.originalPostUrl !== undefined ? { original_post_url: input.originalPostUrl } : {}),
        ...(input.durationSeconds !== undefined ? { duration_seconds: input.durationSeconds } : {}),
      })
      .eq("editorial_content_id", id);
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  // -------------------------------------------------- provenance / source truth

  async listSourceRecords() {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("source_records")
      .select("id, provider, source_type, title, verification_state, publication_date")
      .order("created_at", { ascending: false })
      .limit(200);
    return requireData(data, error);
  }

  async getSourceRecord(id: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.from("source_records").select("*").eq("id", id).maybeSingle();
    if (error) throw new SupabaseRepositoryError(error.message);
    return data;
  }

  async createSourceRecord(input: {
    readonly provider: string;
    readonly sourceType: string;
    readonly publicUrl?: string;
    readonly title?: string;
    readonly externalRecordId?: string;
    readonly publicationDate?: string;
    readonly verificationState?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("source_records")
      .insert({
        provider: input.provider,
        source_type: input.sourceType,
        public_url: input.publicUrl ?? null,
        title: input.title ?? null,
        external_record_id: input.externalRecordId ?? null,
        publication_date: input.publicationDate ?? null,
        verification_state: input.verificationState ?? "unverified",
      })
      .select("id")
      .single();
    return requireData(data, error).id as string;
  }

  /**
   * target_type/target_id are always the resource being reviewed, resolved
   * server-side from an id the caller already has (e.g. an athlete or
   * competition's own primary key) -- never a free-text identity claim, so
   * this cannot be used to attach provenance to the wrong record by typo.
   */
  async listProvenanceForTarget(targetType: string, targetId: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("provenance")
      .select("id, field_path, trust_class, assertion_status, reviewed_at, source_records(id, provider, title, public_url, verification_state)")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });
    return requireData(data, error);
  }

  async createProvenance(input: {
    readonly targetType: string;
    readonly targetId: string;
    readonly sourceRecordId: string;
    readonly trustClass: string;
    readonly fieldPath?: string;
  }) {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("provenance").insert({
      target_type: input.targetType,
      target_id: input.targetId,
      source_record_id: input.sourceRecordId,
      trust_class: input.trustClass,
      field_path: input.fieldPath ?? null,
    });
    if (error) throw new SupabaseRepositoryError(error.message);
  }

  /**
   * audit_events only has an admin-only SELECT policy -- a caller without
   * the admin role will simply get an empty list back here, not an error.
   */
  async listAuditEventsForTarget(targetType: string, targetId: string) {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from("audit_events")
      .select("id, event_type, actor_principal, summary, created_at")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false })
      .limit(50);
    return requireData(data, error);
  }
}
