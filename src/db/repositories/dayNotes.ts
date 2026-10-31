// src/db/repositories/dayNotes.ts
import { db } from '../index';
import { DayNote } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface DayNoteRow {
  id: string;
  concern_id: string | null;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: DayNoteRow): DayNote {
  return {
    id: row.id,
    concern_id: row.concern_id ?? undefined,
    date: row.date,
    note: row.note ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<DayNote[]> {
  const rows = await db.getAllAsync<DayNoteRow>(
    'SELECT * FROM day_notes ORDER BY date DESC'
  );
  return rows.map(rowToNote);
}

/**
 * Get notes within a date range
 */
export async function getNotesByDateRange(
  startDate: string,
  endDate: string
): Promise<DayNote[]> {
  const rows = await db.getAllAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
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
 * Get a note for a specific date
 */
export async function getNoteByDate(date: string): Promise<DayNote | null> {
  const row = await db.getFirstAsync<DayNoteRow>(
    'SELECT * FROM day_notes WHERE date = ?',
    [date]
  );
  return row ? rowToNote(row) : null;
}

/**
 * Create or update a note for a specific date
 * Uses a unique date constraint to keep one note per day.
 */
export async function upsertNote(
  date: string,
  note: string,
  concernId?: string
): Promise<DayNote> {
  const existing = await getNoteByDate(date);
  const now = getISOTimestamp();

  if (existing) {
    // Update
    await db.runAsync(
      'UPDATE day_notes SET note = ?, concern_id = ?, updated_at = ? WHERE id = ?',
      [note, concernId ?? existing.concern_id ?? null, now, existing.id]
    );
    return (await getNoteById(existing.id))!;
  } else {
    // Create
    const id = generateId();
    await db.runAsync(
      `INSERT INTO day_notes (id, concern_id, date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, concernId ?? null, date, note, now, now]
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
  date: string
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM day_notes WHERE date = ?',
    [date]
  );
  return result.changes > 0;
}

/**
 * Get dates that have notes (for calendar markers)
 */
export async function getDatesWithNotes(): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM day_notes'
  );
  return new Set(rows.map((r) => r.date));
}
