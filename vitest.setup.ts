import mockFs from 'mock-fs';
import { afterEach } from 'vitest';

afterEach(() => {
  mockFs.restore();
});
