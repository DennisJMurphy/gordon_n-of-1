// src/services/dataManagement.ts
import { db } from '../db';
import { shareAsync } from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { getISOTimestamp } from '../utils/dates';

interface ExportData {
  export_version: string;
  exported_at: string;
  baseline_context: any[];
  concerns: any[];
  concern_updates: any[];
  interventions: any[];
  intervention_events: any[];
  weekly_checkins: any[];
  day_notes: any[];
}

/**
 * Export all data to JSON
 */
export async function exportAllData(): Promise<string> {
  try {
    // Query all tables
    const [
      baseline,
      concerns,
      concernUpdates,
      interventions,
      interventionEvents,
      checkins,
      dayNotes,
    ] = await Promise.all([
      db.getAllAsync('SELECT * FROM baseline_context'),
      db.getAllAsync('SELECT * FROM concerns ORDER BY updated_at DESC'),
      db.getAllAsync('SELECT * FROM concern_updates ORDER BY event_date, recorded_at'),
      db.getAllAsync('SELECT * FROM interventions ORDER BY created_at DESC'),
      db.getAllAsync('SELECT * FROM intervention_events ORDER BY event_date, recorded_at'),
      db.getAllAsync('SELECT * FROM weekly_checkins ORDER BY week_start_date DESC'),
      db.getAllAsync('SELECT * FROM day_notes ORDER BY date DESC'),
    ]);

    const exportData: ExportData = {
      export_version: '1.0.0',
      exported_at: getISOTimestamp(),
      baseline_context: baseline,
      concerns,
      concern_updates: concernUpdates,
      interventions,
      intervention_events: interventionEvents,
      weekly_checkins: checkins,
      day_notes: dayNotes,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Share exported data via share sheet
 */
export async function shareExportedData(): Promise<void> {
  try {
    const data = await exportAllData();
    const filename = `gordon-data-${getISOTimestamp().slice(0, 10)}.json`;
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(data);

    await shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: filename,
    });
  } catch (error) {
    console.error('Failed to share data:', error);
    throw new Error('Failed to share data');
  }
}

/**
 * Wipe all local data
 * WARNING: This is irreversible!
 */
export async function wipeAllData(): Promise<void> {
  try {
    await db.execAsync('BEGIN');
    try {
      await db.execAsync(`
        DELETE FROM intervention_events;
        DELETE FROM concern_updates;
        DELETE FROM concerns;
        DELETE FROM day_notes;
        DELETE FROM weekly_checkins;
        DELETE FROM interventions;
        DELETE FROM baseline_context;
      `);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to wipe data:', error);
    throw new Error('Failed to wipe data');
  }
}

/**
 * Get data statistics for display
 */
export async function getDataStats(): Promise<{
  concerns: number;
  interventions: number;
  checkins: number;
  dayNotes: number;
}> {
  try {
    const [concerns, interventions, checkins, dayNotes] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM concerns'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM interventions'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM weekly_checkins'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM day_notes'),
    ]);

    return {
      concerns: concerns?.count ?? 0,
      interventions: interventions?.count ?? 0,
      checkins: checkins?.count ?? 0,
      dayNotes: dayNotes?.count ?? 0,
    };
  } catch (error) {
    console.error('Failed to get data stats:', error);
    return { concerns: 0, interventions: 0, checkins: 0, dayNotes: 0 };
  }
}
