import { z } from "zod";

import type { D1DatabaseLike, D1PreparedStatementLike } from "@/lib/community/repository";
import { CommunityAuthorizationError, CommunityUnavailableError } from "@/lib/community/repository";
import { communityIdSchema } from "@/lib/community/validation";
import type {
  DailyAthleteSummary,
  MovementDefinition,
  MovementMeasurementType,
  PersonalRecord,
  SkillProgress,
  TrainingMovement,
  TrainingSession,
  TrainingSet,
} from "@/lib/training/types";
import {
  manualPersonalRecordSchema,
  skillProgressSchema,
  trainingSessionSchema,
} from "@/lib/training/validation";

function now(): string {
  return new Date().toISOString();
}

function jsonList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

type SessionRow = {
  session_id: string;
  session_date: string;
  title: string;
  session_notes: string;
  bodyweight_kg: number | null;
  session_duration_seconds: number | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  session_movement_id: string | null;
  movement_id: string | null;
  movement_name: string | null;
  custom_movement_name: string | null;
  movement_notes: string | null;
  training_set_id: string | null;
  set_order: number | null;
  reps: number | null;
  added_load_kg: number | null;
  total_weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  rpe: number | null;
  rir: number | null;
  completion: string | null;
  progression: string | null;
  score: number | null;
  set_notes: string | null;
};

function optionalNumber(value: number | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function sessionsFromRows(rows: readonly SessionRow[]): TrainingSession[] {
  const sessions = new Map<string, { session: Omit<TrainingSession, "movements">; movements: Map<string, { movement: Omit<TrainingMovement, "sets">; sets: TrainingSet[] }> }>();
  for (const row of rows) {
    let grouped = sessions.get(row.session_id);
    if (!grouped) {
      grouped = {
        session: {
          id: row.session_id,
          sessionDate: row.session_date,
          title: row.title,
          notes: row.session_notes,
          bodyweightKg: optionalNumber(row.bodyweight_kg),
          durationSeconds: optionalNumber(row.session_duration_seconds),
          visibility: z.enum(["private", "followers", "public"]).parse(row.visibility),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        movements: new Map(),
      };
      sessions.set(row.session_id, grouped);
    }
    if (!row.session_movement_id) continue;
    let movement = grouped.movements.get(row.session_movement_id);
    if (!movement) {
      movement = {
        movement: {
          id: row.session_movement_id,
          movementId: row.movement_id ?? undefined,
          name: row.movement_name ?? row.custom_movement_name ?? "Custom movement",
          notes: row.movement_notes ?? "",
        },
        sets: [],
      };
      grouped.movements.set(row.session_movement_id, movement);
    }
    if (row.training_set_id && row.set_order !== null) {
      movement.sets.push({
        id: row.training_set_id,
        setOrder: row.set_order,
        reps: optionalNumber(row.reps),
        addedLoadKg: optionalNumber(row.added_load_kg),
        totalWeightKg: optionalNumber(row.total_weight_kg),
        durationSeconds: optionalNumber(row.duration_seconds),
        distanceMeters: optionalNumber(row.distance_meters),
        rpe: optionalNumber(row.rpe),
        rir: optionalNumber(row.rir),
        completion: row.completion
          ? z.enum(["attempted", "completed", "failed"]).parse(row.completion)
          : undefined,
        progression: row.progression ?? undefined,
        score: optionalNumber(row.score),
        notes: row.set_notes ?? undefined,
      });
    }
  }
  return [...sessions.values()].map(({ session, movements }) => ({
    ...session,
    movements: [...movements.values()].map(({ movement, sets }) => ({
      ...movement,
      sets,
    })),
  }));
}

type RecordRow = {
  id: string;
  movement_id: string | null;
  movement_name: string | null;
  custom_movement_name: string | null;
  record_type: string;
  value: number;
  unit: string;
  repetitions: number | null;
  achieved_on: string;
  source_type: string;
  verification_status: string;
  notes: string;
  public_visible: number;
};

function recordFromRow(row: RecordRow): PersonalRecord {
  return {
    id: row.id,
    movementId: row.movement_id ?? undefined,
    movementName: row.movement_name ?? row.custom_movement_name ?? "Custom movement",
    recordType: z.enum([
      "maximum-added-weight", "total-system-weight", "repetition-maximum",
      "max-repetitions", "hold-duration", "skill-achievement",
      "competition-total", "competition-score",
    ]).parse(row.record_type),
    value: Number(row.value),
    unit: z.enum(["kg", "lb", "reps", "seconds", "points", "completion"]).parse(row.unit),
    repetitions: optionalNumber(row.repetitions),
    achievedOn: row.achieved_on,
    sourceType: z.enum([
      "self-reported", "training-recorded", "competition-linked",
      "source-confirmed", "editorially-verified",
    ]).parse(row.source_type),
    verificationStatus: z.enum([
      "unverified", "linked", "source-confirmed", "editorially-verified", "disputed",
    ]).parse(row.verification_status),
    notes: row.notes,
    publicVisible: row.public_visible === 1,
  };
}

type SkillRow = {
  id: string;
  movement_id: string;
  movement_name: string;
  progress_status: string;
  achieved_on: string | null;
  notes: string;
  proof_media_id: string | null;
  public_visible: number;
  updated_at: string;
};

function skillFromRow(row: SkillRow): SkillProgress {
  return {
    id: row.id,
    movementId: row.movement_id,
    movementName: row.movement_name,
    status: z.enum(["not-started", "working-on", "achieved"]).parse(row.progress_status),
    achievedOn: row.achieved_on ?? undefined,
    notes: row.notes,
    proofMediaId: row.proof_media_id ?? undefined,
    publicVisible: row.public_visible === 1,
    updatedAt: row.updated_at,
  };
}

export class TrainingRepository {
  constructor(private readonly db: D1DatabaseLike | undefined) {}

  get available(): boolean {
    return Boolean(this.db);
  }

  private requireDb(): D1DatabaseLike {
    if (!this.db) throw new CommunityUnavailableError();
    return this.db;
  }

  async listMovements(): Promise<readonly MovementDefinition[]> {
    if (!this.db) return [];
    const result = await this.db.prepare(
      `SELECT id, slug, name, category, measurement_types_json
       FROM movement_definitions WHERE status = 'active'
       ORDER BY category, name LIMIT 200`,
    ).all<{ id: string; slug: string; name: string; category: MovementDefinition["category"]; measurement_types_json: string }>();
    return result.results.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      measurementTypes: jsonList(row.measurement_types_json) as MovementMeasurementType[],
    }));
  }

  async createSession(input: z.input<typeof trainingSessionSchema>): Promise<string> {
    const parsed = trainingSessionSchema.parse(input);
    const db = this.requireDb();
    const sessionId = crypto.randomUUID();
    const timestamp = now();
    const statements: D1PreparedStatementLike[] = [
      db.prepare(
        `INSERT INTO training_sessions (
          id, owner_member_id, session_date, title, notes, bodyweight_kg,
          duration_seconds, visibility, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      ).bind(
        sessionId, parsed.memberId, parsed.sessionDate, parsed.title ?? "",
        parsed.notes ?? "", parsed.bodyweightKg ?? null,
        parsed.durationSeconds ?? null, parsed.visibility, timestamp, timestamp,
      ),
    ];
    parsed.movements.forEach((movement, movementIndex) => {
      const sessionMovementId = crypto.randomUUID();
      statements.push(
        db.prepare(
          `INSERT INTO training_session_movements (
            id, session_id, movement_id, custom_movement_name, display_order, notes
          ) VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(
          sessionMovementId, sessionId, movement.movementId ?? null,
          movement.customMovementName ?? null, movementIndex, movement.notes ?? "",
        ),
      );
      movement.sets.forEach((set, setIndex) => {
        statements.push(
          db.prepare(
            `INSERT INTO training_sets (
              id, session_movement_id, set_order, reps, added_load_kg,
              total_weight_kg, duration_seconds, distance_meters, rpe, rir,
              completion, progression, score, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            crypto.randomUUID(), sessionMovementId, setIndex + 1,
            set.reps ?? null, set.addedLoadKg ?? null, set.totalWeightKg ?? null,
            set.durationSeconds ?? null, set.distanceMeters ?? null,
            set.rpe ?? null, set.rir ?? null, set.completion ?? null,
            set.progression ?? null, set.score ?? null, set.notes ?? "", timestamp,
          ),
        );
      });
    });
    await db.batch(statements);
    return sessionId;
  }

  async listSessions(memberId: string, limit = 20, offset = 0): Promise<readonly TrainingSession[]> {
    if (!this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const size = z.number().int().min(1).max(50).parse(limit);
    const start = z.number().int().min(0).max(10_000).parse(offset);
    const result = await this.db.prepare(
      `WITH selected AS (
        SELECT id FROM training_sessions
        WHERE owner_member_id = ? AND status = 'active'
        ORDER BY session_date DESC, id DESC LIMIT ? OFFSET ?
      )
      SELECT session.id AS session_id, session.session_date, session.title,
        session.notes AS session_notes, session.bodyweight_kg,
        session.duration_seconds AS session_duration_seconds, session.visibility,
        session.created_at, session.updated_at,
        session_movement.id AS session_movement_id, session_movement.movement_id,
        movement.name AS movement_name, session_movement.custom_movement_name,
        session_movement.notes AS movement_notes,
        training_set.id AS training_set_id, training_set.set_order,
        training_set.reps, training_set.added_load_kg, training_set.total_weight_kg,
        training_set.duration_seconds, training_set.distance_meters,
        training_set.rpe, training_set.rir, training_set.completion,
        training_set.progression, training_set.score, training_set.notes AS set_notes
      FROM selected
      JOIN training_sessions session ON session.id = selected.id
      LEFT JOIN training_session_movements session_movement ON session_movement.session_id = session.id
      LEFT JOIN movement_definitions movement ON movement.id = session_movement.movement_id
      LEFT JOIN training_sets training_set ON training_set.session_movement_id = session_movement.id
      ORDER BY session.session_date DESC, session.id DESC,
        session_movement.display_order, training_set.set_order`,
    ).bind(member, size, start).all<SessionRow>();
    return sessionsFromRows(result.results);
  }

  async createManualRecord(input: z.input<typeof manualPersonalRecordSchema> & {
    readonly sourceType?: "self-reported" | "competition-linked";
    readonly canonicalCompetitionId?: string;
  }): Promise<string> {
    const base = manualPersonalRecordSchema.parse({
      memberId: input.memberId,
      movementId: input.movementId,
      customMovementName: input.customMovementName,
      recordType: input.recordType,
      value: input.value,
      unit: input.unit,
      repetitions: input.repetitions,
      achievedOn: input.achievedOn,
      notes: input.notes,
      publicVisible: input.publicVisible,
    });
    const sourceType = input.sourceType ?? "self-reported";
    const competitionId = input.canonicalCompetitionId
      ? communityIdSchema.parse(input.canonicalCompetitionId)
      : undefined;
    if (sourceType === "competition-linked" && !competitionId) {
      throw new CommunityAuthorizationError("Choose a public competition for a competition-linked PR.");
    }
    const id = crypto.randomUUID();
    await this.requireDb().prepare(
      `INSERT INTO personal_records (
        id, member_id, movement_id, custom_movement_name, record_type, value,
        unit, repetitions, achieved_on, source_type, canonical_competition_id,
        verification_status, notes, public_visible, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    ).bind(
      id, base.memberId, base.movementId ?? null, base.customMovementName ?? null,
      base.recordType, base.value, base.unit, base.repetitions ?? null,
      base.achievedOn, sourceType, competitionId ?? null,
      sourceType === "competition-linked" ? "linked" : "unverified",
      base.notes ?? "", Number(base.publicVisible), now(),
    ).run();
    return id;
  }

  async createTrainingRecord(memberId: string, trainingSetId: string): Promise<string> {
    const member = communityIdSchema.parse(memberId);
    const setId = communityIdSchema.parse(trainingSetId);
    const row = await this.requireDb().prepare(
      `SELECT training_set.id, training_set.reps, training_set.added_load_kg,
        training_set.total_weight_kg, training_set.duration_seconds,
        training_set.score, session.session_date, session_movement.movement_id,
        session_movement.custom_movement_name
       FROM training_sets training_set
       JOIN training_session_movements session_movement
         ON session_movement.id = training_set.session_movement_id
       JOIN training_sessions session ON session.id = session_movement.session_id
       WHERE training_set.id = ? AND session.owner_member_id = ?
         AND session.status = 'active' LIMIT 1`,
    ).bind(setId, member).first<{
      id: string; reps: number | null; added_load_kg: number | null;
      total_weight_kg: number | null; duration_seconds: number | null;
      score: number | null; session_date: string; movement_id: string | null;
      custom_movement_name: string | null;
    }>();
    if (!row) throw new CommunityAuthorizationError("Training set ownership check failed.");
    const selected = row.added_load_kg !== null
      ? { type: "maximum-added-weight", value: row.added_load_kg, unit: "kg" }
      : row.total_weight_kg !== null
        ? { type: "total-system-weight", value: row.total_weight_kg, unit: "kg" }
        : row.duration_seconds !== null
          ? { type: "hold-duration", value: row.duration_seconds, unit: "seconds" }
          : row.reps !== null
            ? { type: "max-repetitions", value: row.reps, unit: "reps" }
            : row.score !== null
              ? { type: "competition-score", value: row.score, unit: "points" }
              : null;
    if (!selected) throw new CommunityAuthorizationError("This set has no supported PR measurement.");
    const id = crypto.randomUUID();
    await this.requireDb().prepare(
      `INSERT INTO personal_records (
        id, member_id, movement_id, custom_movement_name, record_type, value,
        unit, achieved_on, source_type, training_set_id, verification_status,
        public_visible, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'training-recorded', ?, 'linked', 0, 'active', ?)`,
    ).bind(
      id, member, row.movement_id, row.custom_movement_name, selected.type,
      selected.value, selected.unit, row.session_date, row.id, now(),
    ).run();
    return id;
  }

  async listRecords(memberId: string, input: { readonly publicOnly?: boolean; readonly currentOnly?: boolean; readonly limit?: number } = {}): Promise<readonly PersonalRecord[]> {
    if (!this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const size = z.number().int().min(1).max(100).parse(input.limit ?? 50);
    const where = ["record.member_id = ?", "record.status = 'active'"];
    if (input.publicOnly) where.push("record.public_visible = 1");
    const rank = input.currentOnly
      ? "AND ranked.history_rank = 1"
      : "";
    const result = await this.db.prepare(
      `WITH ranked AS (
        SELECT record.*, row_number() OVER (
          PARTITION BY coalesce(record.movement_id, record.custom_movement_name), record.record_type
          ORDER BY record.value DESC, record.achieved_on DESC, record.created_at DESC, record.id DESC
        ) AS history_rank
        FROM personal_records record WHERE ${where.join(" AND ")}
      )
      SELECT ranked.id, ranked.movement_id, movement.name AS movement_name,
        ranked.custom_movement_name, ranked.record_type, ranked.value, ranked.unit,
        ranked.repetitions, ranked.achieved_on, ranked.source_type,
        ranked.verification_status, ranked.notes, ranked.public_visible
      FROM ranked LEFT JOIN movement_definitions movement ON movement.id = ranked.movement_id
      WHERE 1 = 1 ${rank}
      ORDER BY ranked.achieved_on DESC, ranked.id DESC LIMIT ?`,
    ).bind(member, size).all<RecordRow>();
    return result.results.map(recordFromRow);
  }

  async upsertSkill(input: z.input<typeof skillProgressSchema>): Promise<string> {
    const parsed = skillProgressSchema.parse(input);
    const db = this.requireDb();
    const movement = await db.prepare(
      `SELECT id FROM movement_definitions
       WHERE id = ? AND status = 'active' AND category IN ('skill', 'hold', 'freestyle') LIMIT 1`,
    ).bind(parsed.movementId).first<{ id: string }>();
    if (!movement) throw new CommunityAuthorizationError("Choose a skill movement from the catalog.");
    if (parsed.proofMediaId) {
      const proof = await db.prepare(
        `SELECT id FROM community_media_assets
         WHERE id = ? AND owner_member_id = ? AND purpose = 'skill-proof'
           AND upload_status = 'uploaded' AND moderation_status = 'approved'
           AND visibility = 'public' LIMIT 1`,
      ).bind(parsed.proofMediaId, parsed.memberId).first<{ id: string }>();
      if (!proof) {
        throw new CommunityAuthorizationError(
          "Choose one of your approved public skill-proof media uploads.",
        );
      }
    }
    const timestamp = now();
    const id = `skill:${parsed.memberId}:${parsed.movementId}`;
    await db.prepare(
      `INSERT INTO skill_progress (
        id, member_id, movement_id, progress_status, achieved_on, notes,
        proof_media_id, public_visible, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(member_id, movement_id) DO UPDATE SET
        progress_status = excluded.progress_status,
        achieved_on = excluded.achieved_on,
        notes = excluded.notes,
        proof_media_id = excluded.proof_media_id,
        public_visible = excluded.public_visible,
        updated_at = excluded.updated_at`,
    ).bind(
      id, parsed.memberId, parsed.movementId, parsed.status,
      parsed.achievedOn ?? null, parsed.notes ?? "", parsed.proofMediaId ?? null,
      Number(parsed.publicVisible), timestamp, timestamp,
    ).run();
    return id;
  }

  async listSkills(memberId: string, publicOnly = false): Promise<readonly SkillProgress[]> {
    if (!this.db) return [];
    const member = communityIdSchema.parse(memberId);
    const result = await this.db.prepare(
      `SELECT skill.id, skill.movement_id, movement.name AS movement_name,
        skill.progress_status, skill.achieved_on, skill.notes,
        skill.proof_media_id, skill.public_visible, skill.updated_at
       FROM skill_progress skill
       JOIN movement_definitions movement ON movement.id = skill.movement_id
       WHERE skill.member_id = ? ${publicOnly ? "AND skill.public_visible = 1" : ""}
       ORDER BY CASE skill.progress_status WHEN 'working-on' THEN 0 WHEN 'achieved' THEN 1 ELSE 2 END,
         skill.updated_at DESC LIMIT 100`,
    ).bind(member).all<SkillRow>();
    return result.results.map(skillFromRow);
  }

  async getDailySummary(memberId: string): Promise<DailyAthleteSummary> {
    const [recentSessions, currentRecords, skills] = await Promise.all([
      this.listSessions(memberId, 3),
      this.listRecords(memberId, { currentOnly: true, limit: 6 }),
      this.listSkills(memberId),
    ]);
    return { recentSessions, currentRecords, skills: skills.slice(0, 6) };
  }
}
