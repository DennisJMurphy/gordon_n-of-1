// src/db/migrations.ts
import * as SQLite from "expo-sqlite";

export type Migration = {
  id: number;          // incrementing integer
  name: string;        // human readable
  sql: string[];       // statements to run in order
};

export const migrations: Migration[] = [
  {
    id: 1,
    name: "init_schema",
    sql: [
      `
      CREATE TABLE IF NOT EXISTS baseline_context (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        sex TEXT,
        age_bracket TEXT,
        height_bracket_cm TEXT,
        weight_bracket_kg TEXT,
        relationship_status TEXT,
        typical_cardio_min_per_week INTEGER,
        health_notes TEXT,

        -- JSON string for routine items like supplements/habits with duration+regularity
        routine_json TEXT,

        -- JSON string mapping field -> boolean (include in export by default)
        share_defaults_json TEXT
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS episodes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL, -- YYYY-MM-DD
        end_date TEXT NOT NULL,   -- YYYY-MM-DD
        type TEXT NOT NULL CHECK (type IN ('observational','intervention')),
        status TEXT NOT NULL CHECK (status IN ('active','closed')),

        special_summary TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY NOT NULL,
        episode_id TEXT NOT NULL,
        compound TEXT NOT NULL, -- 'nmn','tmg', etc.

        dose REAL,
        unit TEXT,              -- 'mg','g','iu', etc.
        route TEXT,             -- 'oral','sublingual'
        form TEXT,              -- 'powder','capsule','liquid','food'
        timing_json TEXT,       -- e.g. ["upon_waking","midday"]
        with_food TEXT,         -- 'yes','no','mixed'
        brand TEXT,
        product TEXT,

        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS weekly_checkins (
        id TEXT PRIMARY KEY NOT NULL,
        episode_id TEXT NOT NULL,
        week_start_date TEXT NOT NULL, -- YYYY-MM-DD (e.g. Monday)

        adherence_json TEXT,  -- per compound frequency bins
        changes_json TEXT,    -- diet/exercise/sleep/illness/travel/stress flags
        events_json TEXT,     -- short notes list
        confidence TEXT CHECK (confidence IN ('sure','mostly','guessing')),

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS day_notes (
        id TEXT PRIMARY KEY NOT NULL,
        episode_id TEXT NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        note TEXT,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
        UNIQUE (episode_id, date)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY NOT NULL,
        episode_id TEXT NOT NULL,

        schema_version TEXT NOT NULL,
        generated_at TEXT NOT NULL,

        report_json TEXT NOT NULL,   -- share-safe
        private_json TEXT,           -- optional

        exported_to TEXT,
        exported_at TEXT,

        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      );
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_interventions_episode ON interventions(episode_id);
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_weekly_checkins_episode ON weekly_checkins(episode_id);
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_day_notes_episode_date ON day_notes(episode_id, date);
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_reports_episode ON reports(episode_id);
      `,
    ],
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  // Set WAL mode before anything else (must be outside transaction)
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // Create meta table first if needed (for very first run)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    ["db_version"]
  );
  const currentVersion = row ? Number(row.value) : 0;

  const pending = migrations.filter((m) => m.id > currentVersion).sort((a, b) => a.id - b.id);
  if (pending.length === 0) return;

  // Run each migration in a transaction
  for (const m of pending) {
    await db.execAsync("BEGIN");
    try {
      for (const stmt of m.sql) {
        await db.execAsync(stmt);
      }
      await db.runAsync(
        "INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)",
        ["db_version", String(m.id)]
      );
      await db.execAsync("COMMIT");
      // eslint-disable-next-line no-console
      console.log(`Migrated to v${m.id}: ${m.name}`);
    } catch (e) {
      await db.execAsync("ROLLBACK");
      // eslint-disable-next-line no-console
      console.error(`Migration failed at v${m.id}: ${m.name}`, e);
      throw e;
    }
  }
}
