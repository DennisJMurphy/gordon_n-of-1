// src/db/repositories/interventions.ts
import { db } from '../index';
import { Intervention, Compound, Route, Form, WithFood, Timing } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface InterventionRow {
  id: string;
  episode_id: string;
  compound: string;
  dose: number | null;
  unit: string | null;
  route: string | null;
  form: string | null;
  timing_json: string | null;
  with_food: string | null;
  brand: string | null;
  product: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIntervention(row: InterventionRow): Intervention {
  return {
    id: row.id,
    episode_id: row.episode_id,
    compound: row.compound as Compound,
    dose: row.dose ?? undefined,
    unit: row.unit ?? undefined,
    route: row.route as Route | undefined,
    form: row.form as Form | undefined,
    timing: row.timing_json ? JSON.parse(row.timing_json) : [],
    with_food: row.with_food as WithFood | undefined,
    brand: row.brand ?? undefined,
    product: row.product ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getInterventionsByEpisode(episodeId: string): Promise<Intervention[]> {
  const rows = await db.getAllAsync<InterventionRow>(
    'SELECT * FROM interventions WHERE episode_id = ? ORDER BY created_at',
    [episodeId]
  );
  return rows.map(rowToIntervention);
}

export async function getInterventionById(id: string): Promise<Intervention | null> {
  const row = await db.getFirstAsync<InterventionRow>(
    'SELECT * FROM interventions WHERE id = ?',
    [id]
  );
  return row ? rowToIntervention(row) : null;
}

export async function createIntervention(
  data: Omit<Intervention, 'id' | 'created_at' | 'updated_at'>
): Promise<Intervention> {
  const id = generateId();
  const now = getISOTimestamp();

  await db.runAsync(
    `INSERT INTO interventions (
      id, episode_id, compound, dose, unit, route, form,
      timing_json, with_food, brand, product, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.episode_id,
      data.compound,
      data.dose ?? null,
      data.unit ?? null,
      data.route ?? null,
      data.form ?? null,
      JSON.stringify(data.timing ?? []),
      data.with_food ?? null,
      data.brand ?? null,
      data.product ?? null,
      data.notes ?? null,
      now,
      now,
    ]
  );

  return (await getInterventionById(id))!;
}

export async function updateIntervention(
  id: string,
  data: Partial<Omit<Intervention, 'id' | 'episode_id' | 'created_at' | 'updated_at'>>
): Promise<Intervention | null> {
  const existing = await getInterventionById(id);
  if (!existing) return null;

  const now = getISOTimestamp();

  await db.runAsync(
    `UPDATE interventions SET
      compound = ?,
      dose = ?,
      unit = ?,
      route = ?,
      form = ?,
      timing_json = ?,
      with_food = ?,
      brand = ?,
      product = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      data.compound ?? existing.compound,
      data.dose ?? existing.dose ?? null,
      data.unit ?? existing.unit ?? null,
      data.route ?? existing.route ?? null,
      data.form ?? existing.form ?? null,
      JSON.stringify(data.timing ?? existing.timing ?? []),
      data.with_food ?? existing.with_food ?? null,
      data.brand ?? existing.brand ?? null,
      data.product ?? existing.product ?? null,
      data.notes ?? existing.notes ?? null,
      now,
      id,
    ]
  );

  return getInterventionById(id);
}

export async function deleteIntervention(id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM interventions WHERE id = ?', [id]);
  return result.changes > 0;
}
