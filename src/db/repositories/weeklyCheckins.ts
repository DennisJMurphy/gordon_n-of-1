// src/db/repositories/weeklyCheckins.ts
import { db } from '../index';
import { WeeklyCheckin, AdherenceBin, Confidence } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface WeeklyCheckinRow {
  id: string;
  episode_id: string;
  week_start_date: string;
  adherence_json: string | null;
  changes_json: string | null;
  events_json: string | null;
  confidence: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCheckin(row: WeeklyCheckinRow): WeeklyCheckin {
  return {
    id: row.id,
    episode_id: row.episode_id,
    week_start_date: row.week_start_date,
    adherence: row.adherence_json ? JSON.parse(row.adherence_json) : {},
    changes: row.changes_json ? JSON.parse(row.changes_json) : {},
    events: row.events_json ? JSON.parse(row.events_json) : [],
    confidence: row.confidence as Confidence | undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getCheckinsByEpisode(episodeId: string): Promise<WeeklyCheckin[]> {
  const rows = await db.getAllAsync<WeeklyCheckinRow>(
    'SELECT * FROM weekly_checkins WHERE episode_id = ? ORDER BY week_start_date DESC',
    [episodeId]
  );
  return rows.map(rowToCheckin);
}

export async function getCheckinById(id: string): Promise<WeeklyCheckin | null> {
  const row = await db.getFirstAsync<WeeklyCheckinRow>(
    'SELECT * FROM weekly_checkins WHERE id = ?',
    [id]
  );
  return row ? rowToCheckin(row) : null;
}

export async function getCheckinByWeek(
  episodeId: string,
  weekStartDate: string
): Promise<WeeklyCheckin | null> {
  const row = await db.getFirstAsync<WeeklyCheckinRow>(
    'SELECT * FROM weekly_checkins WHERE episode_id = ? AND week_start_date = ?',
    [episodeId, weekStartDate]
  );
  return row ? rowToCheckin(row) : null;
}

export async function createCheckin(
  data: Omit<WeeklyCheckin, 'id' | 'created_at' | 'updated_at'>
): Promise<WeeklyCheckin> {
  const id = generateId();
  const now = getISOTimestamp();

  await db.runAsync(
    `INSERT INTO weekly_checkins (
      id, episode_id, week_start_date, adherence_json, changes_json, 
      events_json, confidence, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.episode_id,
      data.week_start_date,
      JSON.stringify(data.adherence ?? {}),
      JSON.stringify(data.changes ?? {}),
      JSON.stringify(data.events ?? []),
      data.confidence ?? null,
      now,
      now,
    ]
  );

  return (await getCheckinById(id))!;
}

export async function updateCheckin(
  id: string,
  data: Partial<Omit<WeeklyCheckin, 'id' | 'episode_id' | 'created_at' | 'updated_at'>>
): Promise<WeeklyCheckin | null> {
  const existing = await getCheckinById(id);
  if (!existing) return null;

  const now = getISOTimestamp();

  await db.runAsync(
    `UPDATE weekly_checkins SET
      week_start_date = ?,
      adherence_json = ?,
      changes_json = ?,
      events_json = ?,
      confidence = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      data.week_start_date ?? existing.week_start_date,
      JSON.stringify(data.adherence ?? existing.adherence ?? {}),
      JSON.stringify(data.changes ?? existing.changes ?? {}),
      JSON.stringify(data.events ?? existing.events ?? []),
      data.confidence ?? existing.confidence ?? null,
      now,
      id,
    ]
  );

  return getCheckinById(id);
}

export async function deleteCheckin(id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM weekly_checkins WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * Get the start of the current week (Monday)
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get the most recent check-in for an episode
 */
export async function getLatestCheckin(episodeId: string): Promise<WeeklyCheckin | null> {
  const row = await db.getFirstAsync<WeeklyCheckinRow>(
    'SELECT * FROM weekly_checkins WHERE episode_id = ? ORDER BY week_start_date DESC LIMIT 1',
    [episodeId]
  );
  return row ? rowToCheckin(row) : null;
}
