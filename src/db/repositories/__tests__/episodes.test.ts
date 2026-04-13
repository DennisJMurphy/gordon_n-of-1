import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getEpisodeById,
  getAllEpisodes,
  getActiveEpisode,
  createEpisode,
  updateEpisode,
  closeEpisode,
} from '../episodes';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const sampleRow = {
  id: 'ep-1',
  title: 'Q1 2026',
  start_date: '2026-01-01',
  end_date: '2026-03-31',
  type: 'intervention',
  status: 'active',
  special_summary: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

// ── getEpisodeById ──────────────────────────────────────

describe('getEpisodeById', () => {
  it('returns mapped episode when found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getEpisodeById('ep-1');
    expect(result).toEqual({
      ...sampleRow,
      special_summary: undefined, // null → undefined
    });
    expect(__mockDb.getFirstAsync).toHaveBeenCalledWith(
      'SELECT * FROM episodes WHERE id = ?',
      ['ep-1']
    );
  });

  it('returns null when not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await getEpisodeById('missing');
    expect(result).toBeNull();
  });

  it('maps special_summary from non-null value', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      special_summary: 'Testing NMN',
    });
    const result = await getEpisodeById('ep-1');
    expect(result!.special_summary).toBe('Testing NMN');
  });
});

// ── getAllEpisodes ───────────────────────────────────────

describe('getAllEpisodes', () => {
  it('returns empty array when no episodes', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await getAllEpisodes();
    expect(result).toEqual([]);
  });

  it('returns mapped episodes', async () => {
    const row2 = { ...sampleRow, id: 'ep-2', title: 'Q2 2026', status: 'closed' };
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow, row2]);
    const result = await getAllEpisodes();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ep-1');
    expect(result[1].status).toBe('closed');
  });
});

// ── getActiveEpisode ────────────────────────────────────

describe('getActiveEpisode', () => {
  it('returns active episode when found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getActiveEpisode();
    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
  });

  it('returns null when no active episode', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await getActiveEpisode();
    expect(result).toBeNull();
  });
});

// ── createEpisode ───────────────────────────────────────

describe('createEpisode', () => {
  it('inserts with generated id and timestamp, then re-reads', async () => {
    // runAsync for INSERT, then getFirstAsync for the re-read
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      created_at: '2026-03-15T12:00:00.000Z',
      updated_at: '2026-03-15T12:00:00.000Z',
    });

    const result = await createEpisode({
      title: 'Q1 2026',
      start_date: '2026-01-01',
      end_date: '2026-03-31',
      type: 'intervention',
      status: 'active',
    });

    expect(result.id).toBe('test-uuid-1');

    // Verify INSERT params
    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO episodes');
    expect(params[0]).toBe('test-uuid-1'); // id
    expect(params[1]).toBe('Q1 2026');     // title
    expect(params[6]).toBeNull();          // special_summary ?? null
    expect(params[7]).toBe('2026-03-15T12:00:00.000Z'); // created_at
  });

  it('passes special_summary when provided', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      special_summary: 'Energy test',
    });

    await createEpisode({
      title: 'Q1 2026',
      start_date: '2026-01-01',
      end_date: '2026-03-31',
      type: 'intervention',
      status: 'active',
      special_summary: 'Energy test',
    });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[6]).toBe('Energy test');
  });
});

// ── updateEpisode ───────────────────────────────────────

describe('updateEpisode', () => {
  it('returns null when episode not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await updateEpisode('missing', { title: 'New' });
    expect(result).toBeNull();
    expect(__mockDb.runAsync).not.toHaveBeenCalled();
  });

  it('merges partial update with existing values', async () => {
    // First getFirstAsync = fetch existing, second = re-read after update
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)         // existing
      .mockResolvedValueOnce({                   // re-read after UPDATE
        ...sampleRow,
        title: 'Updated Title',
        updated_at: '2026-03-15T12:00:00.000Z',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await updateEpisode('ep-1', { title: 'Updated Title' });

    expect(result!.title).toBe('Updated Title');

    // Verify fallback: unchanged fields use existing values
    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('Updated Title');    // title (updated)
    expect(params[1]).toBe('2026-01-01');       // start_date (existing)
    expect(params[2]).toBe('2026-03-31');       // end_date (existing)
    expect(params[3]).toBe('intervention');     // type (existing)
    expect(params[4]).toBe('active');           // status (existing)
  });
});

// ── closeEpisode ────────────────────────────────────────

describe('closeEpisode', () => {
  it('delegates to updateEpisode with status closed', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)
      .mockResolvedValueOnce({ ...sampleRow, status: 'closed' });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await closeEpisode('ep-1');
    expect(result!.status).toBe('closed');

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[4]).toBe('closed');
  });
});
