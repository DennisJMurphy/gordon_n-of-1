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

  it('creates all tables on a fresh database', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    // All expected tables should exist
    const tables = raw
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);

    expect(names).toContain('meta');
    expect(names).toContain('baseline_context');
    expect(names).toContain('episodes');
    expect(names).toContain('interventions');
    expect(names).toContain('weekly_checkins');
    expect(names).toContain('day_notes');
    expect(names).toContain('reports');
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
      'episodes',
      'interventions',
      'weekly_checkins',
      'day_notes',
      'reports',
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

    expect(names).toContain('idx_interventions_episode');
    expect(names).toContain('idx_weekly_checkins_episode');
    expect(names).toContain('idx_day_notes_episode_date');
    expect(names).toContain('idx_reports_episode');
  });

  it('key columns exist with correct types (spot check)', async () => {
    const { db, raw } = makeTestDb();
    await runMigrations(asSQLiteDb(db));

    const episodeCols = raw.prepare('PRAGMA table_info(episodes)').all() as {
      name: string;
      type: string;
      notnull: number;
    }[];
    const colMap = Object.fromEntries(episodeCols.map((c) => [c.name, c]));

    expect(colMap['id'].type).toBe('TEXT');
    expect(colMap['id'].notnull).toBe(1);
    expect(colMap['title'].type).toBe('TEXT');
    expect(colMap['start_date'].type).toBe('TEXT');
    expect(colMap['status'].type).toBe('TEXT');
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
