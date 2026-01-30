// src/db/repositories/dayNotes.ts
import { db } from '../index';
import { DayNote } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface DayNoteRow {
  id: string;
  episode_id: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: DayNoteRow): DayNote {
  return {
    id: row.id,
    episode_id: row.episode_id,
    date: row.date,
    note: row.note ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Get all notes for an episode
 */
export async function getNotesByEpisode(episodeId: string): Promise<DayNote[]> {
  const rows = await db.getAllAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE episode_id = ? ORDER BY date DESC',
    [episodeId]
  );
  return rows.map(rowToNote);
}

/**
 * Get notes for an episode within a date range
 */
export async function getNotesByDateRange(
  episodeId: string,
  startDate: string,
  endDate: string
): Promise<DayNote[]> {
  const rows = await db.getAllAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE episode_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
    [episodeId, startDate, endDate]
  );
  return rows.map(rowToNote);
}

/**
 * Get a note by ID
 */
export async function getNoteById(id: string): Promise<DayNote | null> {
  const row = await db.getFirstAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE id = ?',
    [id]
  );
  return row ? rowToNote(row) : null;
}

/**
 * Get a note for a specific date (unique per episode+date)
 */
export async function getNoteByDate(
  episodeId: string,
  date: string
): Promise<DayNote | null> {
  const row = await db.getFirstAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE episode_id = ? AND date = ?',
    [episodeId, date]
  );
  return row ? rowToNote(row) : null;
}

/**
 * Create or update a note for a specific date
 * Uses UPSERT since there's a unique constraint on (episode_id, date)
 */
export async function upsertNote(
  episodeId: string,
  date: string,
  note: string
): Promise<DayNote> {
  const existing = await getNoteByDate(episodeId, date);
  const now = getISOTimestamp();

  if (existing) {
    // Update
    await db.runAsync(
      'UPDATE day_notes SET note = ?, updated_at = ? WHERE id = ?',
      [note, now, existing.id]
    );
    return (await getNoteById(existing.id))!;
  } else {
    // Create
    const id = generateId();
    await db.runAsync(
      `INSERT INTO day_notes (id, episode_id, date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, episodeId, date, note, now, now]
    );
    return (await getNoteById(id))!;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM day_notes WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * Delete a note by date
 */
export async function deleteNoteByDate(
  episodeId: string,
  date: string
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM day_notes WHERE episode_id = ? AND date = ?',
    [episodeId, date]
  );
  return result.changes > 0;
}

/**
 * Get dates that have notes for an episode (for calendar markers)
 */
export async function getDatesWithNotes(episodeId: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM day_notes WHERE episode_id = ?',
    [episodeId]
  );
  return new Set(rows.map((r) => r.date));
}
