import { __mockDb } from '../../../__mocks__/expo-sqlite';
import { __resetUUID } from '../../../__mocks__/expo-crypto';
import {
  addConcernUpdate,
  createConcern,
  getConcernUpdates,
} from '../concerns';

beforeEach(() => {
  jest.clearAllMocks();
  __resetUUID();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-31T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

describe('concerns repository', () => {
  it('creates a concern with an approximate onset and original note', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'test-uuid-1',
      title: 'Scratchy throat',
      onset_date: '2026-10',
      initial_note: 'Cause unknown',
      status: 'open',
      created_at: '2026-10-31T12:00:00.000Z',
      updated_at: '2026-10-31T12:00:00.000Z',
    });

    const concern = await createConcern({
      title: ' Scratchy throat ',
      onset_date: '2026-10',
      initial_note: ' Cause unknown ',
    });

    expect(concern.onset_date).toBe('2026-10');
    const [sql, params] = __mockDb.runAsync.mock.calls[0];
    expect(sql).toContain("VALUES (?, ?, ?, ?, 'open', ?, ?)");
    expect(params).toEqual([
      'test-uuid-1',
      'Scratchy throat',
      '2026-10',
      'Cause unknown',
      '2026-10-31T12:00:00.000Z',
      '2026-10-31T12:00:00.000Z',
    ]);
  });

  it('orders backdated updates by event date and preserves recorded time', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 'update-1', concern_id: 'concern-1', event_date: '2026-10-03',
        event_type: 'interpretation', label: 'Flu', certainty: 'suspected',
        note: null, recorded_at: '2026-10-31T12:00:00.000Z',
      },
    ]);

    const updates = await getConcernUpdates('concern-1');

    expect(updates[0].event_date).toBe('2026-10-03');
    expect(updates[0].recorded_at).toBe('2026-10-31T12:00:00.000Z');
    expect(__mockDb.getAllAsync.mock.calls[0][0]).toContain('ORDER BY event_date IS NULL, event_date, recorded_at');
  });

  it('appends a backdated interpretation without replacing the initial concern', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'test-uuid-1', concern_id: 'concern-1', event_date: '2026-10-03',
      event_type: 'interpretation', label: 'Flu', certainty: 'suspected',
      note: 'Fever and fatigue', recorded_at: '2026-10-31T12:00:00.000Z',
    });

    const update = await addConcernUpdate({
      concern_id: 'concern-1',
      event_date: '2026-10-03',
      event_type: 'interpretation',
      label: 'Flu',
      certainty: 'suspected',
      note: 'Fever and fatigue',
    });

    expect(update.label).toBe('Flu');
    expect(__mockDb.execAsync.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'COMMIT']);
    expect(__mockDb.runAsync.mock.calls[0][0]).toContain('INSERT INTO concern_updates');
    expect(__mockDb.runAsync.mock.calls[1][0]).toContain('UPDATE concerns SET status');
    expect(__mockDb.runAsync.mock.calls[1][1][0]).toBeNull();
  });

  it.each([
    ['resolved', 'resolved'],
    ['reopened', 'open'],
  ] as const)('records %s as a timeline event and updates current status', async (eventType, status) => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'test-uuid-1', concern_id: 'concern-1', event_date: '2026-10-09',
      event_type: eventType, label: null, certainty: null,
      note: null, recorded_at: '2026-10-31T12:00:00.000Z',
    });

    await addConcernUpdate({ concern_id: 'concern-1', event_type: eventType, event_date: '2026-10-09' });

    expect(__mockDb.runAsync.mock.calls[1][1][0]).toBe(status);
    expect(__mockDb.runAsync.mock.calls[0][1][3]).toBe(eventType);
  });
});