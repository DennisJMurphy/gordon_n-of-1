/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/src/__mocks__/expo-sqlite.ts',
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto.ts',
  },
};
