import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getNotesByEpisode,
  getNotesByDateRange,
  getNoteByDate,
  upsertNote,
  deleteNote,
  deleteNoteByDate,
  getDatesWithNotes,
} from '../dayNotes';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const sampleRow = {
  id: 'dn-1',
  episode_id: 'ep-1',
  date: '2026-01-15',
  note: 'Felt great today',
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
};

// ── getNotesByEpisode ───────────────────────────────────

describe('getNotesByEpisode', () => {
  it('returns mapped notes', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    const result = await getNotesByEpisode('ep-1');
    expect(result).toHaveLength(1);
    expect(result[0].note).toBe('Felt great today');
  });

  it('maps null note to undefined', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([{ ...sampleRow, note: null }]);
    const result = await getNotesByEpisode('ep-1');
    expect(result[0].note).toBeUndefined();
  });

  it('returns empty array when none exist', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    expect(await getNotesByEpisode('ep-1')).toEqual([]);
  });
});

// ── getNotesByDateRange ─────────────────────────────────

describe('getNotesByDateRange', () => {
  it('passes boundary dates to query', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    await getNotesByDateRange('ep-1', '2026-01-01', '2026-01-31');
    expect(__mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('date >= ? AND date <= ?'),
      ['ep-1', '2026-01-01', '2026-01-31']
    );
  });
});

// ── upsertNote ──────────────────────────────────────────

describe('upsertNote', () => {
  it('creates new note when none exists for that date', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(null)           // getNoteByDate → not found
      .mockResolvedValueOnce({               // re-read after INSERT
        ...sampleRow,
        id: 'test-uuid-1',
        note: 'New note',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await upsertNote('ep-1', '2026-01-15', 'New note');
    expect(result.id).toBe('test-uuid-1');

    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO day_notes');
    expect(params[0]).toBe('test-uuid-1');  // id
    expect(params[1]).toBe('ep-1');         // episode_id
    expect(params[2]).toBe('2026-01-15');   // date
    expect(params[3]).toBe('New note');     // note
  });

  it('updates existing note for that date', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)    // getNoteByDate → found
      .mockResolvedValueOnce({             // re-read after UPDATE
        ...sampleRow,
        note: 'Updated note',
        updated_at: '2026-03-15T12:00:00.000Z',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await upsertNote('ep-1', '2026-01-15', 'Updated note');
    expect(result.note).toBe('Updated note');

    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain('UPDATE day_notes');
    expect(params[0]).toBe('Updated note');
    expect(params[2]).toBe('dn-1');  // WHERE id
  });
});

// ── deleteNote ──────────────────────────────────────────

describe('deleteNote', () => {
  it('returns true when deleted', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    expect(await deleteNote('dn-1')).toBe(true);
  });

  it('returns false when not found', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    expect(await deleteNote('missing')).toBe(false);
  });
});

// ── deleteNoteByDate ────────────────────────────────────

describe('deleteNoteByDate', () => {
  it('returns true when deleted', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    expect(await deleteNoteByDate('ep-1', '2026-01-15')).toBe(true);
  });

  it('returns false when not found', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    expect(await deleteNoteByDate('ep-1', '2099-01-01')).toBe(false);
  });
});

// ── getDatesWithNotes ───────────────────────────────────

describe('getDatesWithNotes', () => {
  it('returns Set of date strings', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([
      { date: '2026-01-15' },
      { date: '2026-01-20' },
    ]);
    const result = await getDatesWithNotes('ep-1');
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has('2026-01-15')).toBe(true);
    expect(result.has('2026-01-20')).toBe(true);
  });

  it('returns empty Set when no notes', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await getDatesWithNotes('ep-1');
    expect(result.size).toBe(0);
  });
});
