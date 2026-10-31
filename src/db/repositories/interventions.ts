// src/db/repositories/interventions.ts
import { db } from '../index';
import { Intervention, InterventionEvent, InterventionEventType, Compound, Route, Form, WithFood, Timing, Frequency } from '../../types';
import { generateId } from '../../utils/uuid';
import { formatDateISO, getISOTimestamp } from '../../utils/dates';

interface InterventionRow {
  id: string;
  compound: string;
  custom_name: string | null;
  dose: number | null;
  unit: string | null;
  route: string | null;
  form: string | null;
  timing_json: string | null;
  frequency: string | null;
  with_food: string | null;
  brand: string | null;
  product: string | null;
  notes: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIntervention(row: InterventionRow): Intervention {
  return {
    id: row.id,
    compound: row.compound as Compound,
    custom_name: row.custom_name ?? undefined,
    dose: row.dose ?? undefined,
    unit: row.unit ?? undefined,
    route: row.route as Route | undefined,
    form: row.form as Form | undefined,
    timing: row.timing_json ? JSON.parse(row.timing_json) : [],
    frequency: (row.frequency as Frequency) ?? undefined,
    with_food: row.with_food as WithFood | undefined,
    brand: row.brand ?? undefined,
    product: row.product ?? undefined,
    notes: row.notes ?? undefined,
    start_date: row.start_date,
    end_date: row.end_date ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getAllInterventions(): Promise<Intervention[]> {
  const rows = await db.getAllAsync<InterventionRow>(
    'SELECT * FROM interventions ORDER BY end_date IS NOT NULL, start_date DESC, created_at DESC'
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
      id, compound, custom_name, dose, unit, route, form,
      timing_json, frequency, with_food, brand, product, notes,
      start_date, end_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.compound,
      data.custom_name ?? null,
      data.dose ?? null,
      data.unit ?? null,
      data.route ?? null,
      data.form ?? null,
      JSON.stringify(data.timing ?? []),
      data.frequency ?? null,
      data.with_food ?? null,
      data.brand ?? null,
      data.product ?? null,
      data.notes ?? null,
      data.start_date,
      data.end_date ?? null,
      now,
      now,
    ]
  );

  const intervention = (await getInterventionById(id))!;
  await addInterventionEvent(id, intervention.start_date, 'started', intervention);
  return intervention;
}

export async function updateIntervention(
  id: string,
  data: Partial<Omit<Intervention, 'id' | 'created_at' | 'updated_at'>>
): Promise<Intervention | null> {
  const existing = await getInterventionById(id);
  if (!existing) return null;

  const now = getISOTimestamp();

  await db.runAsync(
    `UPDATE interventions SET
      compound = ?,
      custom_name = ?,
      dose = ?,
      unit = ?,
      route = ?,
      form = ?,
      timing_json = ?,
      frequency = ?,
      with_food = ?,
      brand = ?,
      product = ?,
      notes = ?,
      start_date = ?,
      end_date = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      data.compound ?? existing.compound,
      data.custom_name ?? existing.custom_name ?? null,
      data.dose ?? existing.dose ?? null,
      data.unit ?? existing.unit ?? null,
      data.route ?? existing.route ?? null,
      data.form ?? existing.form ?? null,
      JSON.stringify(data.timing ?? existing.timing ?? []),
      data.frequency ?? existing.frequency ?? null,
      data.with_food ?? existing.with_food ?? null,
      data.brand ?? existing.brand ?? null,
      data.product ?? existing.product ?? null,
      data.notes ?? existing.notes ?? null,
      data.start_date ?? existing.start_date,
      data.end_date ?? existing.end_date ?? null,
      now,
      id,
    ]
  );

  const updated = await getInterventionById(id);
  if (updated) {
    await addInterventionEvent(id, formatDateISO(new Date()), 'updated', updated);
  }
  return updated;
}

export async function stopIntervention(id: string, endDate: string): Promise<Intervention | null> {
  const existing = await getInterventionById(id);
  if (!existing) return null;
  await db.runAsync(
    'UPDATE interventions SET end_date = ?, updated_at = ? WHERE id = ?',
    [endDate, getISOTimestamp(), id]
  );
  const stopped = await getInterventionById(id);
  if (stopped) await addInterventionEvent(id, endDate, 'stopped', stopped);
  return stopped;
}

async function addInterventionEvent(
  interventionId: string,
  eventDate: string,
  eventType: InterventionEventType,
  details: Partial<Intervention>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO intervention_events (
      id, intervention_id, event_date, event_type, details_json, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), interventionId, eventDate, eventType, JSON.stringify(details), getISOTimestamp()]
  );
}

interface InterventionEventRow {
  id: string;
  intervention_id: string;
  event_date: string;
  event_type: string;
  details_json: string;
  recorded_at: string;
}

export async function getInterventionEvents(interventionId: string): Promise<InterventionEvent[]> {
  const rows = await db.getAllAsync<InterventionEventRow>(
    `SELECT * FROM intervention_events WHERE intervention_id = ?
     ORDER BY event_date, recorded_at`,
    [interventionId]
  );
  return rows.map((row) => ({
    id: row.id,
    intervention_id: row.intervention_id,
    event_date: row.event_date,
    event_type: row.event_type as InterventionEventType,
    details: JSON.parse(row.details_json),
    recorded_at: row.recorded_at,
  }));
}

export async function deleteIntervention(id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM interventions WHERE id = ?', [id]);
  return result.changes > 0;
}
