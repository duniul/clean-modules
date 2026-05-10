import type fs from 'node:fs';
import type { NestedDirectoryJSON } from 'memfs';
import { vi } from 'vitest';
import { DEFAULT_GLOBS_FILE_PATH } from '../shared.js';

export async function getMockedFileStructure(): Promise<NestedDirectoryJSON> {
  const actualFs = await vi.importActual<typeof fs.promises>('fs/promises');
  const defaultGlobs = await actualFs.readFile(DEFAULT_GLOBS_FILE_PATH, { encoding: 'utf8' });

  return {
    [DEFAULT_GLOBS_FILE_PATH]: defaultGlobs,
    node_modules: {
      dep1: {
        '__tests__': {
          'test1.js': '.',
          'test2.js': '.',
        },
        'a-dir': {
          'doc.md': '.',
        },
        '.npmrc': '.',
      },
      dep2: {
        'CHANGELOG.md': '.',
        'file.js': '.',
      },
      dep3: {
        deeply: {
          nested: {
            'file.ext': '.',
          },
        },
      },
      dep4: {
        'nonDefaultFile.ext': '.',
      },
    },
  };
}
