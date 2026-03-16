// Mock for expo-crypto used by repository tests.
// Returns deterministic UUIDs for predictable test assertions.

let counter = 0;

export function randomUUID(): string {
  counter++;
  return `test-uuid-${counter}`;
}

// Reset counter between tests:
//   import { __resetUUID } from '../__mocks__/expo-crypto';
export function __resetUUID() {
  counter = 0;
}
