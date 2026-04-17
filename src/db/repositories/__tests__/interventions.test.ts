import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getInterventionsByEpisode,
  getInterventionById,
  createIntervention,
  updateIntervention,
  deleteIntervention,
} from '../interventions';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const sampleRow = {
  id: 'int-1',
  episode_id: 'ep-1',
  compound: 'nmn',
  custom_name: null,
  dose: 500,
  unit: 'mg',
  route: 'oral',
  form: 'capsule',
  timing_json: '["morning"]',
  frequency: 'daily',
  with_food: 'yes',
  brand: 'BrandX',
  product: 'NMN Pro',
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

// ── getInterventionsByEpisode ───────────────────────────

describe('getInterventionsByEpisode', () => {
  it('returns empty array when none exist', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await getInterventionsByEpisode('ep-1');
    expect(result).toEqual([]);
  });

  it('returns mapped interventions with parsed timing JSON', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    const result = await getInterventionsByEpisode('ep-1');
    expect(result).toHaveLength(1);
    expect(result[0].timing).toEqual(['morning']);
    expect(result[0].notes).toBeUndefined(); // null → undefined
    expect(result[0].brand).toBe('BrandX');
  });

  it('handles null timing_json as empty array', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([{ ...sampleRow, timing_json: null }]);
    const result = await getInterventionsByEpisode('ep-1');
    expect(result[0].timing).toEqual([]);
  });
});

// ── createIntervention ──────────────────────────────────

describe('createIntervention', () => {
  it('serializes timing array to JSON', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      timing_json: '["morning","evening"]',
    });

    const result = await createIntervention({
      episode_id: 'ep-1',
      compound: 'nmn',
      dose: 500,
      unit: 'mg',
      route: 'oral',
      form: 'capsule',
      timing: ['morning', 'evening'],
      with_food: 'yes',
    });

    expect(result.id).toBe('test-uuid-1');
    expect(result.timing).toEqual(['morning', 'evening']);

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('test-uuid-1');             // id
    expect(params[8]).toBe('["morning","evening"]');    // timing_json
  });

  it('passes null for optional fields when not provided', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      id: 'test-uuid-1',
      dose: null,
      unit: null,
      brand: null,
    });

    await createIntervention({
      episode_id: 'ep-1',
      compound: 'nmn',
      timing: [],
    });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[4]).toBeNull();  // dose
    expect(params[5]).toBeNull();  // unit
    expect(params[11]).toBeNull(); // brand
    expect(params[12]).toBeNull(); // product
  });
});

// ── updateIntervention ──────────────────────────────────

describe('updateIntervention', () => {
  it('returns null when not found', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await updateIntervention('missing', { dose: 1000 });
    expect(result).toBeNull();
    expect(__mockDb.runAsync).not.toHaveBeenCalled();
  });

  it('merges partial update with existing timing', async () => {
    const existingMapped = {
      ...sampleRow,
      timing_json: '["morning"]',
    };
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(existingMapped)         // existing fetch
      .mockResolvedValueOnce({                        // re-read after update
        ...existingMapped,
        dose: 1000,
        updated_at: '2026-03-15T12:00:00.000Z',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await updateIntervention('int-1', { dose: 1000 });
    expect(result!.dose).toBe(1000);

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[0]).toBe('nmn');          // compound (existing)
    expect(params[2]).toBe(1000);           // dose (updated)
    expect(params[6]).toBe('["morning"]');  // timing (existing, serialized)
  });

  it('replaces timing when provided', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)
      .mockResolvedValueOnce({ ...sampleRow, timing_json: '["evening"]' });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    await updateIntervention('int-1', { timing: ['evening'] });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[6]).toBe('["evening"]');
  });
});

// ── deleteIntervention ──────────────────────────────────

describe('deleteIntervention', () => {
  it('returns true when deleted', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
    const result = await deleteIntervention('int-1');
    expect(result).toBe(true);
  });

  it('returns false when not found', async () => {
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    const result = await deleteIntervention('missing');
    expect(result).toBe(false);
  });
});
