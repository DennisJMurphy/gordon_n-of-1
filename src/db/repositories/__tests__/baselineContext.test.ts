import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  getBaselineContext,
  saveBaselineContext,
} from '../baselineContext';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const sampleRow = {
  id: 'bl-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  sex: 'male',
  age_bracket: '30-39',
  height_bracket_cm: '170-179',
  weight_bracket_kg: '70-79',
  relationship_status: 'single',
  typical_cardio_min_per_week: 150,
  health_notes: 'None',
  routine_json: '[{"name":"Vitamin D","duration":"months","regularity":"daily"}]',
  share_defaults_json: '{"sex":true,"age_bracket":true}',
};

// ── getBaselineContext ──────────────────────────────────

describe('getBaselineContext', () => {
  it('returns null when no baseline exists', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await getBaselineContext();
    expect(result).toBeNull();
  });

  it('returns mapped baseline with parsed JSON fields', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const result = await getBaselineContext();
    expect(result).not.toBeNull();
    expect(result!.sex).toBe('male');
    expect(result!.routine).toEqual([{ name: 'Vitamin D', duration: 'months', regularity: 'daily' }]);
    expect(result!.share_defaults).toEqual({ sex: true, age_bracket: true });
  });

  it('handles null JSON fields as defaults', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      routine_json: null,
      share_defaults_json: null,
    });
    const result = await getBaselineContext();
    expect(result!.routine).toEqual([]);
    expect(result!.share_defaults).toEqual({});
  });

  it('maps null optional fields to undefined', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      ...sampleRow,
      age_bracket: null,
      health_notes: null,
      typical_cardio_min_per_week: null,
    });
    const result = await getBaselineContext();
    expect(result!.age_bracket).toBeUndefined();
    expect(result!.health_notes).toBeUndefined();
    expect(result!.typical_cardio_min_per_week).toBeUndefined();
  });
});

// ── saveBaselineContext ─────────────────────────────────

describe('saveBaselineContext', () => {
  it('inserts when no existing baseline', async () => {
    // First call: getBaselineContext → null (no existing)
    // Second call: getBaselineContext → re-read after insert
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(null)         // existing check
      .mockResolvedValueOnce({             // re-read after INSERT
        ...sampleRow,
        id: 'test-uuid-1',
        created_at: '2026-03-15T12:00:00.000Z',
        updated_at: '2026-03-15T12:00:00.000Z',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await saveBaselineContext({
      sex: 'male',
      age_bracket: '30-39',
      routine: [{ name: 'Vitamin D', duration: 'months', regularity: 'daily' }],
    });

    expect(result.id).toBe('test-uuid-1');

    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO baseline_context');
    expect(params[0]).toBe('test-uuid-1');  // id
    expect(params[3]).toBe('male');          // sex
    expect(params[4]).toBe('30-39');         // age_bracket
    // routine_json
    expect(params[10]).toBe('[{"name":"Vitamin D","duration":"months","regularity":"daily"}]');
    // share_defaults_json
    expect(params[11]).toBe('{}');
  });

  it('updates when existing baseline found', async () => {
    // First call: getBaselineContext → existing row
    // After UPDATE: getBaselineContext → re-read
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)    // existing
      .mockResolvedValueOnce({             // re-read after UPDATE
        ...sampleRow,
        sex: 'female',
        updated_at: '2026-03-15T12:00:00.000Z',
      });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    const result = await saveBaselineContext({ sex: 'female' });
    expect(result.sex).toBe('female');

    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain('UPDATE baseline_context');
    expect(params[1]).toBe('female');        // sex (updated)
    expect(params[2]).toBe('30-39');         // age_bracket (existing)
    expect(params[10]).toBe('bl-1');         // WHERE id
  });

  it('merges with existing values using ?? fallback', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(sampleRow)
      .mockResolvedValueOnce(sampleRow);
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    // Only update age_bracket — everything else should keep existing values
    await saveBaselineContext({ age_bracket: '40-49' });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[1]).toBe('male');           // sex (existing)
    expect(params[2]).toBe('40-49');          // age_bracket (updated)
    expect(params[3]).toBe('170-179');        // height (existing)
    expect(params[7]).toBe('None');           // health_notes (existing)
  });

  it('passes null for missing fields on insert', async () => {
    __mockDb.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...sampleRow, id: 'test-uuid-1' });
    __mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });

    await saveBaselineContext({ sex: 'male' });

    const params = __mockDb.runAsync.mock.calls[0][1];
    expect(params[4]).toBeNull();   // age_bracket
    expect(params[5]).toBeNull();   // height_bracket_cm
    expect(params[8]).toBeNull();   // typical_cardio_min_per_week
  });
});
