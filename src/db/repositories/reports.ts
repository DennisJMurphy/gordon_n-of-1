// src/db/repositories/reports.ts
import { db } from '../index';
import { Report } from '../../types';
import { generateId } from '../../utils/uuid';
import { getISOTimestamp } from '../../utils/dates';

interface ReportRow {
  id: string;
  episode_id: string;
  schema_version: string;
  generated_at: string;
  report_json: string;
  private_json: string | null;
  exported_to: string | null;
  exported_at: string | null;
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    episode_id: row.episode_id,
    schema_version: row.schema_version,
    generated_at: row.generated_at,
    report_json: row.report_json,
    private_json: row.private_json ?? undefined,
    exported_to: row.exported_to ?? undefined,
    exported_at: row.exported_at ?? undefined,
  };
}

/**
 * Get all reports for an episode
 */
export async function getReportsByEpisode(episodeId: string): Promise<Report[]> {
  const rows = await db.getAllAsync<ReportRow>(
    'SELECT * FROM reports WHERE episode_id = ? ORDER BY generated_at DESC',
    [episodeId]
  );
  return rows.map(rowToReport);
}

/**
 * Get a report by ID
 */
export async function getReportById(id: string): Promise<Report | null> {
  const row = await db.getFirstAsync<ReportRow>(
    'SELECT * FROM reports WHERE id = ?',
    [id]
  );
  return row ? rowToReport(row) : null;
}

/**
 * Get the latest report for an episode
 */
export async function getLatestReport(episodeId: string): Promise<Report | null> {
  const row = await db.getFirstAsync<ReportRow>(
    'SELECT * FROM reports WHERE episode_id = ? ORDER BY generated_at DESC LIMIT 1',
    [episodeId]
  );
  return row ? rowToReport(row) : null;
}

/**
 * Create a new report
 */
export async function createReport(
  data: Omit<Report, 'id' | 'exported_to' | 'exported_at'>
): Promise<Report> {
  const id = generateId();

  await db.runAsync(
    `INSERT INTO reports (
      id, episode_id, schema_version, generated_at, report_json, private_json
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.episode_id,
      data.schema_version,
      data.generated_at,
      data.report_json,
      data.private_json ?? null,
    ]
  );

  return (await getReportById(id))!;
}

/**
 * Mark report as exported
 */
export async function markReportExported(
  id: string,
  exportedTo: string
): Promise<Report | null> {
  const now = getISOTimestamp();

  await db.runAsync(
    'UPDATE reports SET exported_to = ?, exported_at = ? WHERE id = ?',
    [exportedTo, now, id]
  );

  return getReportById(id);
}

/**
 * Delete a report
 */
export async function deleteReport(id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  return result.changes > 0;
}
