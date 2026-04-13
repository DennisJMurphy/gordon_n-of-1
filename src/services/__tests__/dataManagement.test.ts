// Phase 5: Test dataManagement service orchestrators
// Uses the expo-sqlite mock (db) directly since these functions use raw SQL

import { __mockDb } from '../../__mocks__/expo-sqlite';
import {
  exportAllData,
  wipeAllData,
  getDataStats,
} from '../dataManagement';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

// ── exportAllData ───────────────────────────────────────

describe('exportAllData', () => {
  it('queries all 6 tables and returns structured JSON', async () => {
    __mockDb.getAllAsync
      .mockResolvedValueOnce([{ id: 'bl-1' }])    // baseline_context
      .mockResolvedValueOnce([{ id: 'ep-1' }])    // episodes
      .mockResolvedValueOnce([{ id: 'int-1' }])   // interventions
      .mockResolvedValueOnce([{ id: 'chk-1' }])   // weekly_checkins
      .mockResolvedValueOnce([{ id: 'dn-1' }])    // day_notes
      .mockResolvedValueOnce([{ id: 'rpt-1' }]);  // reports

    const result = await exportAllData();
    const parsed = JSON.parse(result);

    expect(parsed.export_version).toBe('1.0.0');
    expect(parsed.exported_at).toBe('2026-03-15T12:00:00.000Z');
    expect(parsed.baseline_context).toEqual([{ id: 'bl-1' }]);
    expect(parsed.episodes).toEqual([{ id: 'ep-1' }]);
    expect(parsed.interventions).toEqual([{ id: 'int-1' }]);
    expect(parsed.weekly_checkins).toEqual([{ id: 'chk-1' }]);
    expect(parsed.day_notes).toEqual([{ id: 'dn-1' }]);
    expect(parsed.reports).toEqual([{ id: 'rpt-1' }]);

    expect(__mockDb.getAllAsync).toHaveBeenCalledTimes(6);
  });

  it('handles empty tables', async () => {
    __mockDb.getAllAsync.mockResolvedValue([]);

    const result = await exportAllData();
    const parsed = JSON.parse(result);

    expect(parsed.episodes).toEqual([]);
    expect(parsed.weekly_checkins).toEqual([]);
  });

  it('throws on DB error', async () => {
    __mockDb.getAllAsync.mockRejectedValue(new Error('DB error'));
    await expect(exportAllData()).rejects.toThrow('Failed to export data');
  });
});

// ── wipeAllData ─────────────────────────────────────────

describe('wipeAllData', () => {
  it('executes DELETE statements for all tables', async () => {
    __mockDb.execAsync.mockResolvedValueOnce(undefined);

    await wipeAllData();

    expect(__mockDb.execAsync).toHaveBeenCalledTimes(1);
    const sql = __mockDb.execAsync.mock.calls[0][0];
    expect(sql).toContain('DELETE FROM reports');
    expect(sql).toContain('DELETE FROM day_notes');
    expect(sql).toContain('DELETE FROM weekly_checkins');
    expect(sql).toContain('DELETE FROM interventions');
    expect(sql).toContain('DELETE FROM episodes');
    expect(sql).toContain('DELETE FROM baseline_context');
  });

  it('throws on DB error', async () => {
    __mockDb.execAsync.mockRejectedValue(new Error('DB error'));
    await expect(wipeAllData()).rejects.toThrow('Failed to wipe data');
  });
});

// ── getDataStats ────────────────────────────────────────

describe('getDataStats', () => {
  it('returns counts from all tables', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce({ count: 3 })   // episodes
      .mockResolvedValueOnce({ count: 12 })  // weekly_checkins
      .mockResolvedValueOnce({ count: 5 })   // day_notes
      .mockResolvedValueOnce({ count: 2 });  // reports

    const stats = await getDataStats();

    expect(stats).toEqual({
      episodes: 3,
      checkins: 12,
      dayNotes: 5,
      reports: 2,
    });
    expect(__mockDb.getFirstAsync).toHaveBeenCalledTimes(4);
  });

  it('returns zeros when queries return null', async () => {
    __mockDb.getFirstAsync.mockResolvedValue(null);

    const stats = await getDataStats();

    expect(stats).toEqual({
      episodes: 0,
      checkins: 0,
      dayNotes: 0,
      reports: 0,
    });
  });

  it('returns zeros on DB error (graceful fallback)', async () => {
    __mockDb.getFirstAsync.mockRejectedValue(new Error('DB error'));

    const stats = await getDataStats();

    expect(stats).toEqual({
      episodes: 0,
      checkins: 0,
      dayNotes: 0,
      reports: 0,
    });
  });
});
