// src/services/dataManagement.ts
import { db } from '../db';
import { Share } from 'react-native';
import { getISOTimestamp } from '../utils/dates';

interface ExportData {
  export_version: string;
  exported_at: string;
  baseline_context: any[];
  episodes: any[];
  interventions: any[];
  weekly_checkins: any[];
  day_notes: any[];
  reports: any[];
}

/**
 * Export all data to JSON
 */
export async function exportAllData(): Promise<string> {
  try {
    // Query all tables
    const [
      baseline,
      episodes,
      interventions,
      checkins,
      dayNotes,
      reports,
    ] = await Promise.all([
      db.getAllAsync('SELECT * FROM baseline_context'),
      db.getAllAsync('SELECT * FROM episodes ORDER BY created_at DESC'),
      db.getAllAsync('SELECT * FROM interventions ORDER BY created_at DESC'),
      db.getAllAsync('SELECT * FROM weekly_checkins ORDER BY week_start_date DESC'),
      db.getAllAsync('SELECT * FROM day_notes ORDER BY date DESC'),
      db.getAllAsync('SELECT * FROM reports ORDER BY generated_at DESC'),
    ]);

    const exportData: ExportData = {
      export_version: '1.0.0',
      exported_at: getISOTimestamp(),
      baseline_context: baseline,
      episodes,
      interventions,
      weekly_checkins: checkins,
      day_notes: dayNotes,
      reports,
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
export async function shareExportedData(): Promise<boolean> {
  try {
    const data = await exportAllData();

    const result = await Share.share({
      message: data,
      title: 'Gordon Data Backup',
    });

    return result.action === Share.sharedAction;
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
    await db.execAsync(`
      DELETE FROM reports;
      DELETE FROM day_notes;
      DELETE FROM weekly_checkins;
      DELETE FROM interventions;
      DELETE FROM episodes;
      DELETE FROM baseline_context;
    `);
  } catch (error) {
    console.error('Failed to wipe data:', error);
    throw new Error('Failed to wipe data');
  }
}

/**
 * Get data statistics for display
 */
export async function getDataStats(): Promise<{
  episodes: number;
  checkins: number;
  dayNotes: number;
  reports: number;
}> {
  try {
    const [episodes, checkins, dayNotes, reports] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM episodes'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM weekly_checkins'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM day_notes'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM reports'),
    ]);

    return {
      episodes: episodes?.count ?? 0,
      checkins: checkins?.count ?? 0,
      dayNotes: dayNotes?.count ?? 0,
      reports: reports?.count ?? 0,
    };
  } catch (error) {
    console.error('Failed to get data stats:', error);
    return { episodes: 0, checkins: 0, dayNotes: 0, reports: 0 };
  }
}
