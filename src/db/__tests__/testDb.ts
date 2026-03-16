// Wraps better-sqlite3 (sync, Node.js) to match the expo-sqlite async interface
// used by runMigrations(). For use in tests only.
import Database from 'better-sqlite3';

export function createTestDb() {
  const raw = new Database(':memory:');

  const db = {
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
    getFirstAsync: async <T>(sql: string, params?: unknown[]): Promise<T | null> => {
      const stmt = raw.prepare(sql);
      return (stmt.get(...(params ?? [])) as T) ?? null;
    },
    getAllAsync: async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
      const stmt = raw.prepare(sql);
      return stmt.all(...(params ?? [])) as T[];
    },
    runAsync: async (sql: string, params?: unknown[]) => {
      const stmt = raw.prepare(sql);
      const result = stmt.run(...(params ?? []));
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
  };

  return { db, raw, close: () => raw.close() };
}
