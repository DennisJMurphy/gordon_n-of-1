import { createTestDb } from './testDb';
import { runMigrations, migrations } from '../migrations';

// Cast the test db adapter to satisfy the expo-sqlite type expected by runMigrations
function asSQLiteDb(db: ReturnType<typeof createTestDb>['db']) {
  return db as unknown as Parameters<typeof runMigrations>[0];
}

describe('runMigrations', () => {
  let cleanup: (() => void)[] = [];

  function makeTestDb() {
    const testDb = createTestDb();
    cleanup.push(testDb.close);
    return testDb;
  }

  afterEach(() => {
    cleanup.forEach((fn) => fn());
    cleanup = [];
  });

  it('creates continuous-history tables on a fresh database', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    // All expected tables should exist
    const tables = raw
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);

    expect(names).toContain('meta');
    expect(names).toContain('baseline_context');
    expect(names).toContain('concerns');
    expect(names).toContain('concern_updates');
    expect(names).toContain('interventions');
    expect(names).toContain('intervention_events');
    expect(names).toContain('weekly_checkins');
    expect(names).toContain('day_notes');
    expect(names).not.toContain('episodes');
    expect(names).not.toContain('reports');
  });

  it('sets meta version to the latest migration id', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    const latestId = migrations[migrations.length - 1].id;
    const row = raw
      .prepare("SELECT value FROM meta WHERE key = 'db_version'")
      .get() as { value: string };

    expect(Number(row.value)).toBe(latestId);
  });

  it('is idempotent — running twice causes no errors', async () => {
    const { db } = makeTestDb();
    await runMigrations(asSQLiteDb(db));
    await runMigrations(asSQLiteDb(db));
  });

  it('does not duplicate data when run twice', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));
    await runMigrations(asSQLiteDb(db));

    const rows = raw
      .prepare("SELECT * FROM meta WHERE key = 'db_version'")
      .all();
    expect(rows).toHaveLength(1);
  });

  it('tables are queryable after migration', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    // Each table should accept a SELECT without error
    const tables = [
      'baseline_context',
      'concerns',
      'concern_updates',
      'interventions',
      'intervention_events',
      'weekly_checkins',
      'day_notes',
    ];
    for (const table of tables) {
      expect(() => raw.prepare(`SELECT * FROM ${table}`).all()).not.toThrow();
    }
  });

  it('creates expected indexes', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    const indexes = raw
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all() as { name: string }[];
    const names = indexes.map((i) => i.name);

    expect(names).toContain('idx_concern_updates_concern_date');
    expect(names).toContain('idx_intervention_events_intervention_date');
    expect(names).toContain('idx_weekly_checkins_week');
    expect(names).toContain('idx_day_notes_date');
  });

  it('concern columns support status and approximate dates', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    const concernCols = raw.prepare('PRAGMA table_info(concerns)').all() as {
      name: string;
      type: string;
      notnull: number;
    }[];
    const colMap = Object.fromEntries(concernCols.map((c) => [c.name, c]));

    expect(colMap['id'].type).toBe('TEXT');
    expect(colMap['id'].notnull).toBe(1);
    expect(colMap['title'].type).toBe('TEXT');
    expect(colMap['onset_date'].type).toBe('TEXT');
    expect(colMap['status'].type).toBe('TEXT');
  });

  it('upgrades the existing database without deleting baseline context', async () => {
    const { db, raw } = makeTestDb();
    const laterMigrations = migrations.splice(2);

    try {
      await runMigrations(asSQLiteDb(db));
      raw.prepare(
        `INSERT INTO baseline_context (id, created_at, updated_at, health_notes)
         VALUES ('baseline-1', 'created', 'updated', 'preserve me')`
      ).run();
      await runMigrations(asSQLiteDb(db));

      const baseline = raw.prepare('SELECT health_notes FROM baseline_context WHERE id = ?')
        .get('baseline-1') as { health_notes: string };
      expect(baseline.health_notes).toBe('preserve me');
      expect(raw.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='episodes'").all()).toHaveLength(0);
      expect(raw.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='concerns'").all()).toHaveLength(1);
    } finally {
      migrations.push(...laterMigrations);
    }
  });

  it('persists concerns and backdated updates in SQLite', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    raw.prepare(
      `INSERT INTO concerns (id, title, onset_date, initial_note, status, created_at, updated_at)
       VALUES ('concern-1', 'Scratchy throat', '2026-10', 'Cause unknown', 'open', 'created', 'updated')`
    ).run();
    raw.prepare(
      `INSERT INTO concern_updates (
        id, concern_id, event_date, event_type, label, certainty, note, recorded_at
      ) VALUES ('update-1', 'concern-1', '2026-10-03', 'interpretation', 'Flu', 'suspected', NULL, '2026-10-31T12:00:00Z')`
    ).run();

    await runMigrations(asSQLiteDb(db));

    const concern = raw.prepare('SELECT * FROM concerns WHERE id = ?').get('concern-1') as {
      onset_date: string;
      initial_note: string;
    };
    const update = raw.prepare('SELECT * FROM concern_updates WHERE id = ?').get('update-1') as {
      event_date: string;
      label: string;
      certainty: string;
      recorded_at: string;
    };
    expect(concern).toMatchObject({ onset_date: '2026-10', initial_note: 'Cause unknown' });
    expect(update).toMatchObject({
      event_date: '2026-10-03',
      label: 'Flu',
      certainty: 'suspected',
      recorded_at: '2026-10-31T12:00:00Z',
    });
  });

  it('JSON columns accept text values', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    // Insert a row with JSON in a text column — should not error
    raw.prepare(
      `INSERT INTO baseline_context (id, created_at, updated_at, routine_json, share_defaults_json)
       VALUES ('test-id', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '[]', '{}')`
    ).run();

    const row = raw.prepare('SELECT routine_json, share_defaults_json FROM baseline_context').get() as {
      routine_json: string;
      share_defaults_json: string;
    };
    expect(JSON.parse(row.routine_json)).toEqual([]);
    expect(JSON.parse(row.share_defaults_json)).toEqual({});
  });

  it('a bad migration fails loudly and does not advance version', async () => {
    const { db, raw } = makeTestDb();

    // Run legit migrations first
    await runMigrations(asSQLiteDb(db));
    const versionBefore = (
      raw.prepare("SELECT value FROM meta WHERE key = 'db_version'").get() as { value: string }
    ).value;

    // Monkey-patch migrations to add a broken one
    const originalLength = migrations.length;
    const badMigration = {
      id: migrations[migrations.length - 1].id + 1,
      name: 'bad_migration',
      sql: ['CREATE TABLE this_is_fine (id TEXT);', 'INVALID SQL THAT WILL FAIL;'],
    };
    migrations.push(badMigration);

    try {
      await expect(runMigrations(asSQLiteDb(db))).rejects.toThrow();

      // Version should NOT have advanced
      const versionAfter = (
        raw.prepare("SELECT value FROM meta WHERE key = 'db_version'").get() as { value: string }
      ).value;
      expect(versionAfter).toBe(versionBefore);

      // The table from the bad migration's first statement should be rolled back
      const tables = raw
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='this_is_fine'")
        .all();
      expect(tables).toHaveLength(0);
    } finally {
      // Clean up — remove the bad migration so other tests aren't affected
      migrations.length = originalLength;
    }
  });
});
