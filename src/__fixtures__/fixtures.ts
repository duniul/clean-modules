import fs from 'fs';
import { DEFAULT_GLOBS_FILE_PATH } from '../constants';
import { GlobLists } from '../types';

export const EMPTY_GLOB_LISTS: GlobLists = {
  included: [],
  includedDirs: [],
  excluded: [],
  originalIncluded: [],
};

export function getMockedFileStructure(nodeModulesPath: string): Record<string, any> {
  const stringifiedDefaultGlobs = fs.readFileSync(DEFAULT_GLOBS_FILE_PATH).toString();

  return {
    [DEFAULT_GLOBS_FILE_PATH]: stringifiedDefaultGlobs,
    [nodeModulesPath]: {
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
