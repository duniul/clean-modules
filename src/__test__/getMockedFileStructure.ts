import fs from 'fs';
import { vi } from 'vitest';
import { DEFAULT_GLOBS_FILE_PATH } from '../constants';

export async function getMockedFileStructure(): Promise<Record<string, any>> {
  const actualFs = await vi.importActual<typeof fs.promises>('fs/promises');
  const defaultGlobs = (await actualFs.readFile(DEFAULT_GLOBS_FILE_PATH)).toString();

  return {
    [DEFAULT_GLOBS_FILE_PATH]: defaultGlobs,
    node_modules: {
      dep1: {
        __tests__: {
          'test1.js': '.',
          'test2.js': '.',
        },
        'a-dir': {
          'doc.md': '.',
        },
        '.npmrc': '.',
      },
      dep2: {
        'tsconfig.json': '.',
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
