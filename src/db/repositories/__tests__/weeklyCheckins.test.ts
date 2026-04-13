import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getCurrentWeekStart,
  getCheckinsByEpisode,
  getCheckinByWeek,
  createCheckin,
  updateCheckin,
  deleteCheckin,
} from '../weeklyCheckins';

// ── getCurrentWeekStart (pure function) ─────────────────

describe('getCurrentWeekStart', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns Monday for a Wednesday', () => {
    jest.setSystemTime(new Date(2026, 2, 18)); // Wed Mar 18
    expect(getCurrentWeekStart()).toBe('2026-03-16'); // Mon Mar 16
  });

  it('returns Monday for a Monday', () => {
    jest.setSystemTime(new Date(2026, 2, 16)); // Mon Mar 16
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('returns previous Monday for a Sunday', () => {
    jest.setSystemTime(new Date(2026, 2, 22)); // Sun Mar 22
    expect(getCurrentWeekStart()).toBe('2026-03-16'); // Mon Mar 16
  });

  it('returns Monday for a Saturday', () => {
    jest.setSystemTime(new Date(2026, 2, 21)); // Sat Mar 21
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('returns Monday for a Friday', () => {
    jest.setSystemTime(new Date(2026, 2, 20)); // Fri Mar 20
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('handles month boundary (Sunday in new month)', () => {
    jest.setSystemTime(new Date(2026, 3, 5)); // Sun Apr 5
    expect(getCurrentWeekStart()).toBe('2026-03-30'); // Mon Mar 30
  });
});

// ── CRUD tests (mock DB) ───────────────────────────────

const sampleRow = {
  id: 'chk-1',
  episode_id: 'ep-1',
  week_start_date: '2026-01-06',
  adherence_json: '{"nmn":"every_day"}',
  changes_json: '{"diet":true}',
  events_json: '["headache"]',
  confidence: 'sure',
  created_at: '2026-01-06T00:00:00.000Z',
  updated_at: '2026-01-06T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

describe('getCheckinsByEpisode', () => {
  it('returns mapped checkins with parsed JSON fields', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    const result = await getCheckinsByEpisode('ep-1');
    expect(result).toHaveLength(1);
    expect(result[0].adherence).toEqual({ nmn: 'every_day' });
    expect(result[0].changes).toEqual({ diet: true });
    expect(result[0].events).toEqual(['headache']);
    expect(result[0].confidence).toBe('sure');
  });

  it('handles null JSON fields as defaults', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([{
      ...sampleRow,
      adherence_json: null,
      changes_json: null,
      events_json: null,
      confidence: null,
    }]);
    const result = await getCheckinsByEpisode('ep-1');
    expect(result[0].adherence).toEqual({});
    expect(result[0].changes).toEqual({});
    expect(result[0].events).toEqual([]);
    expect(result[0].confidence).toBeUndefined();
  });

  it('returns empty array when none exist', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await getCheckinsByEpisode('ep-1');
    expect(result).toEqual([]);
  });
});

describe('getCheckinByWeek', () => {
  it('returns checkin when found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getCheckinByWeek('ep-1', '2026-01-06');
    expect(result).not.toBeNull();
    expect(result!.week_start_date).toBe('2026-01-06');
  });

  it('returns null when not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await getCheckinByWeek('ep-1', '2026-02-01');
    expect(result).toBeNull();
  });
});

describe('createCheckin', () => {
  it('serializes adherence, changes, and events to JSON', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
    });

    const result = await createCheckin({
      episode_id: 'ep-1',
      week_start_date: '2026-01-06',
      adherence: { nmn: 'every_day' },
      changes: { diet: true },
      events: ['headache'],
      confidence: 'sure',
    });

    expect(result.id).toBe('test-uuid-1');

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[3]).toBe('{"nmn":"every_day"}');  // adherence_json
    expect(params[4]).toBe('{"diet":true}');         // changes_json
    expect(params[5]).toBe('["headache"]');           // events_json
    expect(params[6]).toBe('sure');                   // confidence
  });

  it('handles empty/missing optional fields', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      confidence: null,
    });

    await createCheckin({
      episode_id: 'ep-1',
      week_start_date: '2026-01-06',
      adherence: {},
      changes: {},
      events: [],
    });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[3]).toBe('{}');   // adherence_json
    expect(params[4]).toBe('{}');   // changes_json
    expect(params[5]).toBe('[]');   // events_json
    expect(params[6]).toBeNull();   // confidence
  });
});

describe('updateCheckin', () => {
  it('returns null when not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await updateCheckin('missing', { confidence: 'guessing' });
    expect(result).toBeNull();
  });

  it('merges partial update with existing JSON fields', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)      // existing
      .mockResolvedValueOnce(sampleRow);     // re-read
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    await updateCheckin('chk-1', { confidence: 'mostly' });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('2026-01-06');            // week_start_date (existing)
    expect(params[1]).toBe('{"nmn":"every_day"}');   // adherence (existing)
    expect(params[2]).toBe('{"diet":true}');          // changes (existing)
    expect(params[3]).toBe('["headache"]');            // events (existing)
    expect(params[4]).toBe('mostly');                  // confidence (updated)
  });
});

describe('deleteCheckin', () => {
  it('returns true when deleted', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    expect(await deleteCheckin('chk-1')).toBe(true);
  });

  it('returns false when not found', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    expect(await deleteCheckin('missing')).toBe(false);
  });
});
