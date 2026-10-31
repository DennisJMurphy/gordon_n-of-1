import { db } from '../index';
import { Concern, ConcernEventType, ConcernStatus, ConcernUpdate, ConcernCertainty } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface ConcernRow {
  id: string;
  title: string;
  onset_date: string | null;
  initial_note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ConcernUpdateRow {
  id: string;
  concern_id: string;
  event_date: string | null;
  event_type: string;
  label: string | null;
  certainty: string | null;
  note: string | null;
  recorded_at: string;
}

function rowToConcern(row: ConcernRow): Concern {
  return {
    id: row.id,
    title: row.title,
    onset_date: row.onset_date ?? undefined,
    initial_note: row.initial_note ?? undefined,
    status: row.status as ConcernStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToUpdate(row: ConcernUpdateRow): ConcernUpdate {
  return {
    id: row.id,
    concern_id: row.concern_id,
    event_date: row.event_date ?? undefined,
    event_type: row.event_type as ConcernEventType,
    label: row.label ?? undefined,
    certainty: (row.certainty as ConcernCertainty) ?? undefined,
    note: row.note ?? undefined,
    recorded_at: row.recorded_at,
  };
}

export async function getAllConcerns(): Promise<Concern[]> {
  const rows = await db.getAllAsync<ConcernRow>(
    "SELECT * FROM concerns ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, updated_at DESC"
  );
  return rows.map(rowToConcern);
}

export async function getConcernById(id: string): Promise<Concern | null> {
  const row = await db.getFirstAsync<ConcernRow>(
    'SELECT * FROM concerns WHERE id = ?',
    [id]
  );
  return row ? rowToConcern(row) : null;
}

export async function getConcernUpdates(concernId: string): Promise<ConcernUpdate[]> {
  const rows = await db.getAllAsync<ConcernUpdateRow>(
    `SELECT * FROM concern_updates WHERE concern_id = ?
     ORDER BY event_date IS NULL, event_date, recorded_at`,
    [concernId]
  );
  return rows.map(rowToUpdate);
}

export async function createConcern(
  data: Pick<Concern, 'title' | 'onset_date' | 'initial_note'>
): Promise<Concern> {
  const id = generateId();
  const now = getISOTimestamp();
  await db.runAsync(
    `INSERT INTO concerns (id, title, onset_date, initial_note, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?)`,
    [id, data.title.trim(), data.onset_date ?? null, data.initial_note?.trim() || null, now, now]
  );
  return (await getConcernById(id))!;
}

export async function addConcernUpdate(data: {
  concern_id: string;
  event_date?: string;
  event_type: ConcernEventType;
  label?: string;
  certainty?: ConcernCertainty;
  note?: string;
}): Promise<ConcernUpdate> {
  const id = generateId();
  const now = getISOTimestamp();

  await db.execAsync('BEGIN');
  try {
    await db.runAsync(
      `INSERT INTO concern_updates (
        id, concern_id, event_date, event_type, label, certainty, note, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.concern_id,
        data.event_date ?? null,
        data.event_type,
        data.label?.trim() || null,
        data.certainty ?? null,
        data.note?.trim() || null,
        now,
      ]
    );

    const status = data.event_type === 'resolved'
      ? 'resolved'
      : data.event_type === 'reopened'
        ? 'open'
        : null;
    await db.runAsync(
      'UPDATE concerns SET status = COALESCE(?, status), updated_at = ? WHERE id = ?',
      [status, now, data.concern_id]
    );
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }

  const row = await db.getFirstAsync<ConcernUpdateRow>(
    'SELECT * FROM concern_updates WHERE id = ?',
    [id]
  );
  if (!row) throw new Error('Concern update was not saved');
  return rowToUpdate(row);
}