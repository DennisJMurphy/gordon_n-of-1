import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getReportsByEpisode,
  getReportById,
  getLatestReport,
  createReport,
  markReportExported,
  deleteReport,
} from '../reports';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const sampleRow = {
  id: 'rpt-1',
  episode_id: 'ep-1',
  schema_version: '0.2.0',
  generated_at: '2026-01-15T12:00:00.000Z',
  report_json: '{"schema_version":"0.2.0"}',
  private_json: '{"full":true}',
  exported_to: null,
  exported_at: null,
};

// ── getReportsByEpisode ─────────────────────────────────

describe('getReportsByEpisode', () => {
  it('returns mapped reports', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    const result = await getReportsByEpisode('ep-1');
    expect(result).toHaveLength(1);
    expect(result[0].report_json).toBe('{"schema_version":"0.2.0"}');
    expect(result[0].exported_to).toBeUndefined(); // null → undefined
  });

  it('returns empty array when none exist', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    expect(await getReportsByEpisode('ep-1')).toEqual([]);
  });
});

// ── getReportById ───────────────────────────────────────

describe('getReportById', () => {
  it('returns report when found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getReportById('rpt-1');
    expect(result!.id).toBe('rpt-1');
    expect(result!.private_json).toBe('{"full":true}');
  });

  it('returns null when not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    expect(await getReportById('missing')).toBeNull();
  });

  it('maps null optional fields to undefined', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      private_json: null,
      exported_to: null,
      exported_at: null,
    });
    const result = await getReportById('rpt-1');
    expect(result!.private_json).toBeUndefined();
    expect(result!.exported_to).toBeUndefined();
    expect(result!.exported_at).toBeUndefined();
  });
});

// ── getLatestReport ─────────────────────────────────────

describe('getLatestReport', () => {
  it('returns latest report for episode', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getLatestReport('ep-1');
    expect(result!.id).toBe('rpt-1');
    expect(__mockDb.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY generated_at DESC LIMIT 1'),
      ['ep-1']
    );
  });

  it('returns null when no reports', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    expect(await getLatestReport('ep-1')).toBeNull();
  });
});

// ── createReport ────────────────────────────────────────

describe('createReport', () => {
  it('inserts with generated id and re-reads', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
    });

    const result = await createReport({
      episode_id: 'ep-1',
      schema_version: '0.2.0',
      generated_at: '2026-03-15T12:00:00.000Z',
      report_json: '{"schema_version":"0.2.0"}',
      private_json: '{"full":true}',
    });

    expect(result.id).toBe('test-uuid-1');

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('test-uuid-1');                  // id
    expect(params[1]).toBe('ep-1');                         // episode_id
    expect(params[4]).toBe('{"schema_version":"0.2.0"}');   // report_json
    expect(params[5]).toBe('{"full":true}');                 // private_json
  });

  it('passes null when private_json not provided', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      private_json: null,
    });

    await createReport({
      episode_id: 'ep-1',
      schema_version: '0.1.0',
      generated_at: '2026-03-15T12:00:00.000Z',
      report_json: '{}',
    });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[5]).toBeNull();
  });
});

// ── markReportExported ──────────────────────────────────

describe('markReportExported', () => {
  it('sets exported_to and exported_at timestamp', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      exported_to: 'clipboard',
      exported_at: '2026-03-15T12:00:00.000Z',
    });

    const result = await markReportExported('rpt-1', 'clipboard');
    expect(result!.exported_to).toBe('clipboard');
    expect(result!.exported_at).toBe('2026-03-15T12:00:00.000Z');

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('clipboard');                    // exported_to
    expect(params[1]).toBe('2026-03-15T12:00:00.000Z');    // exported_at (now)
    expect(params[2]).toBe('rpt-1');                        // WHERE id
  });
});

// ── deleteReport ────────────────────────────────────────

describe('deleteReport', () => {
  it('returns true when deleted', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    expect(await deleteReport('rpt-1')).toBe(true);
  });

  it('returns false when not found', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    expect(await deleteReport('missing')).toBe(false);
  });
});
