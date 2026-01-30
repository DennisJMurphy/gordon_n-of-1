// src/db/repositories/baselineContext.ts
import { db } from '../index';
import { BaselineContext, ShareDefaults, RoutineItem } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

export async function getBaselineContext(): Promise<BaselineContext | null> {
  const row = await db.getFirstAsync<{
    id: string;
    created_at: string;
    updated_at: string;
    sex: string | null;
    age_bracket: string | null;
    height_bracket_cm: string | null;
    weight_bracket_kg: string | null;
    relationship_status: string | null;
    typical_cardio_min_per_week: number | null;
    health_notes: string | null;
    routine_json: string | null;
    share_defaults_json: string | null;
  }>('SELECT * FROM baseline_context LIMIT 1');

  if (!row) return null;

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sex: row.sex as BaselineContext['sex'],
    age_bracket: row.age_bracket ?? undefined,
    height_bracket_cm: row.height_bracket_cm ?? undefined,
    weight_bracket_kg: row.weight_bracket_kg ?? undefined,
    relationship_status: row.relationship_status as BaselineContext['relationship_status'],
    typical_cardio_min_per_week: row.typical_cardio_min_per_week ?? undefined,
    health_notes: row.health_notes ?? undefined,
    routine: row.routine_json ? JSON.parse(row.routine_json) : [],
    share_defaults: row.share_defaults_json ? JSON.parse(row.share_defaults_json) : {},
  };
}

export async function saveBaselineContext(
  data: Partial<Omit<BaselineContext, 'id' | 'created_at' | 'updated_at'>>
): Promise<BaselineContext> {
  const existing = await getBaselineContext();
  const now = getISOTimestamp();

  if (existing) {
    // Update
    await db.runAsync(
      `UPDATE baseline_context SET
        updated_at = ?,
        sex = ?,
        age_bracket = ?,
        height_bracket_cm = ?,
        weight_bracket_kg = ?,
        relationship_status = ?,
        typical_cardio_min_per_week = ?,
        health_notes = ?,
        routine_json = ?,
        share_defaults_json = ?
      WHERE id = ?`,
      [
        now,
        data.sex ?? existing.sex ?? null,
        data.age_bracket ?? existing.age_bracket ?? null,
        data.height_bracket_cm ?? existing.height_bracket_cm ?? null,
        data.weight_bracket_kg ?? existing.weight_bracket_kg ?? null,
        data.relationship_status ?? existing.relationship_status ?? null,
        data.typical_cardio_min_per_week ?? existing.typical_cardio_min_per_week ?? null,
        data.health_notes ?? existing.health_notes ?? null,
        JSON.stringify(data.routine ?? existing.routine ?? []),
        JSON.stringify(data.share_defaults ?? existing.share_defaults ?? {}),
        existing.id,
      ]
    );

    return (await getBaselineContext())!;
  } else {
    // Insert
    const id = generateId();
    await db.runAsync(
      `INSERT INTO baseline_context (
        id, created_at, updated_at,
        sex, age_bracket, height_bracket_cm, weight_bracket_kg,
        relationship_status, typical_cardio_min_per_week, health_notes,
        routine_json, share_defaults_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        now,
        now,
        data.sex ?? null,
        data.age_bracket ?? null,
        data.height_bracket_cm ?? null,
        data.weight_bracket_kg ?? null,
        data.relationship_status ?? null,
        data.typical_cardio_min_per_week ?? null,
        data.health_notes ?? null,
        JSON.stringify(data.routine ?? []),
        JSON.stringify(data.share_defaults ?? {}),
      ]
    );

    return (await getBaselineContext())!;
  }
}
