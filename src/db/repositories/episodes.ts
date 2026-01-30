// src/db/repositories/episodes.ts
import { db } from '../index';
import { Episode, EpisodeType, EpisodeStatus } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface EpisodeRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  special_summary: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    title: row.title,
    start_date: row.start_date,
    end_date: row.end_date,
    type: row.type as EpisodeType,
    status: row.status as EpisodeStatus,
    special_summary: row.special_summary ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getActiveEpisode(): Promise<Episode | null> {
  const row = await db.getFirstAsync<EpisodeRow>(
    `SELECT * FROM episodes WHERE status = 'active' ORDER BY start_date DESC LIMIT 1`
  );
  return row ? rowToEpisode(row) : null;
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  const row = await db.getFirstAsync<EpisodeRow>(
    'SELECT * FROM episodes WHERE id = ?',
    [id]
  );
  return row ? rowToEpisode(row) : null;
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const rows = await db.getAllAsync<EpisodeRow>(
    'SELECT * FROM episodes ORDER BY start_date DESC'
  );
  return rows.map(rowToEpisode);
}

export async function createEpisode(
  data: Omit<Episode, 'id' | 'created_at' | 'updated_at'>
): Promise<Episode> {
  const id = generateId();
  const now = getISOTimestamp();

  await db.runAsync(
    `INSERT INTO episodes (
      id, title, start_date, end_date, type, status, special_summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.start_date,
      data.end_date,
      data.type,
      data.status,
      data.special_summary ?? null,
      now,
      now,
    ]
  );

  return (await getEpisodeById(id))!;
}

export async function updateEpisode(
  id: string,
  data: Partial<Omit<Episode, 'id' | 'created_at' | 'updated_at'>>
): Promise<Episode | null> {
  const existing = await getEpisodeById(id);
  if (!existing) return null;

  const now = getISOTimestamp();

  await db.runAsync(
    `UPDATE episodes SET
      title = ?,
      start_date = ?,
      end_date = ?,
      type = ?,
      status = ?,
      special_summary = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      data.title ?? existing.title,
      data.start_date ?? existing.start_date,
      data.end_date ?? existing.end_date,
      data.type ?? existing.type,
      data.status ?? existing.status,
      data.special_summary ?? existing.special_summary ?? null,
      now,
      id,
    ]
  );

  return getEpisodeById(id);
}

export async function closeEpisode(id: string): Promise<Episode | null> {
  return updateEpisode(id, { status: 'closed' });
}
