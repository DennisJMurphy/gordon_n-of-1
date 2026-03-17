// Minimal mock for expo-file-system
export class File {
  uri = '';
  constructor(_dir: unknown, _name: string) {}
  create() { return Promise.resolve(); }
  write(_content: string) { return Promise.resolve(); }
}

export const Paths = {
  cache: '/mock-cache',
};
