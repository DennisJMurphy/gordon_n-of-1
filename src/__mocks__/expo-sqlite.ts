// Mock for expo-sqlite used by repository tests.
// Provides jest.fn() stubs for the three db methods the app uses.

const db = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
};

export function openDatabaseSync(_name: string) {
  return db;
}

// Export the mock db so tests can set up return values:
//   import { __mockDb } from '../__mocks__/expo-sqlite';
//   __mockDb.getFirstAsync.mockResolvedValueOnce(row);
export const __mockDb = db;
