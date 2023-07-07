/* eslint-disable import/no-extraneous-dependencies */
import mockFs from 'mock-fs';
import { afterEach } from 'vitest';

afterEach(() => {
  mockFs.restore();
});
