import { z } from "zod";

import type { D1DatabaseLike } from "@/lib/community/repository";
import { CommunityAuthorizationError, CommunityUnavailableError } from "@/lib/community/repository";
import { communityIdSchema } from "@/lib/community/validation";

export type ClaimedAthletePresentation = {
  readonly canonicalAthleteId: string;
  readonly controllingMemberId: string;
  readonly preferredDisplayName?: string;
  readonly biography: string;
  readonly website?: string;
  readonly trainingLocation: string;
  readonly socialLinks: readonly string[];
  readonly specialties: readonly string[];
  readonly profileMediaId?: string;
  readonly coverMediaId?: string;
};

type Row = { canonical_athlete_id: string; controlling_member_id: string; preferred_display_name: string | null; biography: string; website: string | null; training_location: string; social_links_json: string; specialties_json: string; profile_media_id: string | null; cover_media_id: string | null };
function list(value: string): string[] { try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
function fromRow(row: Row): ClaimedAthletePresentation { return { canonicalAthleteId: row.canonical_athlete_id, controllingMemberId: row.controlling_member_id, preferredDisplayName: row.preferred_display_name ?? undefined, biography: row.biography, website: row.website ?? undefined, trainingLocation: row.training_location, socialLinks: list(row.social_links_json), specialties: list(row.specialties_json), profileMediaId: row.profile_media_id ?? undefined, coverMediaId: row.cover_media_id ?? undefined }; }

const inputSchema = z.object({
  memberId: communityIdSchema,
  canonicalAthleteId: communityIdSchema,
  preferredDisplayName: z.string().trim().max(100).optional(),
  biography: z.string().trim().max(1200),
  website: z.url({ protocol: /^https$/ }).optional(),
  trainingLocation: z.string().trim().max(160),
  socialLinks: z.array(z.url({ protocol: /^https$/ })).max(12),
  specialties: z.array(z.string().trim().min(1).max(80)).max(20),
  profileMediaId: communityIdSchema.optional(),
  coverMediaId: communityIdSchema.optional(),
}).strict();

export class AthletePresentationRepository {
  constructor(private readonly db?: D1DatabaseLike) {}
  get available(): boolean { return Boolean(this.db); }
  private requireDb(): D1DatabaseLike { if (!this.db) throw new CommunityUnavailableError(); return this.db; }

  async getForAthlete(athleteId: string): Promise<ClaimedAthletePresentation | null> {
    if (!this.db) return null;
    const row = await this.db.prepare(`SELECT presentation.canonical_athlete_id, presentation.controlling_member_id, presentation.preferred_display_name, presentation.biography, presentation.website, presentation.training_location, presentation.social_links_json, presentation.specialties_json, presentation.profile_media_id, presentation.cover_media_id FROM claimed_athlete_presentations presentation JOIN athlete_profile_controls control ON control.canonical_athlete_id = presentation.canonical_athlete_id AND control.member_id = presentation.controlling_member_id AND control.status = 'active' WHERE presentation.canonical_athlete_id = ? AND presentation.status = 'active' LIMIT 1`).bind(communityIdSchema.parse(athleteId)).first<Row>();
    return row ? fromRow(row) : null;
  }

  async getForMember(memberId: string): Promise<ClaimedAthletePresentation | null> {
    if (!this.db) return null;
    const row = await this.db.prepare(`SELECT presentation.canonical_athlete_id, presentation.controlling_member_id, presentation.preferred_display_name, presentation.biography, presentation.website, presentation.training_location, presentation.social_links_json, presentation.specialties_json, presentation.profile_media_id, presentation.cover_media_id FROM claimed_athlete_presentations presentation JOIN athlete_profile_controls control ON control.canonical_athlete_id = presentation.canonical_athlete_id AND control.member_id = presentation.controlling_member_id AND control.status = 'active' WHERE presentation.controlling_member_id = ? AND presentation.status = 'active' LIMIT 1`).bind(communityIdSchema.parse(memberId)).first<Row>();
    return row ? fromRow(row) : null;
  }

  async upsert(input: z.input<typeof inputSchema>): Promise<void> {
    const parsed = inputSchema.parse(input);
    const db = this.requireDb();
    const control = await db.prepare(`SELECT id FROM athlete_profile_controls WHERE member_id = ? AND canonical_athlete_id = ? AND status = 'active' LIMIT 1`).bind(parsed.memberId, parsed.canonicalAthleteId).first<{ id: string }>();
    if (!control) throw new CommunityAuthorizationError("Active approved athlete control is required.");
    for (const [assetId, purpose, label] of [
      [parsed.profileMediaId, "athlete-avatar", "avatar"],
      [parsed.coverMediaId, "athlete-cover", "cover"],
    ] as const) {
      if (!assetId) continue;
      const media = await db.prepare(`SELECT id FROM community_media_assets WHERE id = ? AND owner_member_id = ? AND purpose = ? AND upload_status = 'uploaded' AND moderation_status = 'approved' AND visibility = 'public' LIMIT 1`).bind(assetId, parsed.memberId, purpose).first<{ id: string }>();
      if (!media) throw new CommunityAuthorizationError(`Choose only your approved public athlete ${label} media.`);
    }
    const timestamp = new Date().toISOString();
    await db.prepare(`INSERT INTO claimed_athlete_presentations (canonical_athlete_id, controlling_member_id, preferred_display_name, biography, website, training_location, social_links_json, specialties_json, profile_media_id, cover_media_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?) ON CONFLICT(canonical_athlete_id) DO UPDATE SET preferred_display_name = excluded.preferred_display_name, biography = excluded.biography, website = excluded.website, training_location = excluded.training_location, social_links_json = excluded.social_links_json, specialties_json = excluded.specialties_json, profile_media_id = excluded.profile_media_id, cover_media_id = excluded.cover_media_id, status = 'active', updated_at = excluded.updated_at WHERE controlling_member_id = excluded.controlling_member_id`).bind(parsed.canonicalAthleteId, parsed.memberId, parsed.preferredDisplayName ?? null, parsed.biography, parsed.website ?? null, parsed.trainingLocation, JSON.stringify(parsed.socialLinks), JSON.stringify(parsed.specialties), parsed.profileMediaId ?? null, parsed.coverMediaId ?? null, timestamp, timestamp).run();
  }
}
