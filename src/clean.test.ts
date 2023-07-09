import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMockedFileStructure } from './__test__/getMockedFileStructure.js';
import { clean } from './clean.js';

const fileStructure = await getMockedFileStructure();

beforeEach(async () => {
  vol.fromNestedJSON(fileStructure);
});

describe(clean.name, () => {
  it('cleans up expected files by default', async () => {
    const result = await clean();
    expect(result).toMatchInlineSnapshot(`
      {
        "files": [
          "<CWD>/node_modules/dep1/.npmrc",
          "<CWD>/node_modules/dep2/CHANGELOG.md",
          "<CWD>/node_modules/dep1/__tests__/test1.js",
          "<CWD>/node_modules/dep1/__tests__/test2.js",
          "<CWD>/node_modules/dep1/a-dir/doc.md",
        ],
        "reducedSize": 5,
        "removedEmptyDirs": 3,
      }
    `);
  });

  it('accepts custom globs', async () => {
    const result = await clean({ globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      {
        "files": [
          "<CWD>/node_modules/dep1/.npmrc",
          "<CWD>/node_modules/dep2/CHANGELOG.md",
          "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "<CWD>/node_modules/dep1/__tests__/test1.js",
          "<CWD>/node_modules/dep1/__tests__/test2.js",
          "<CWD>/node_modules/dep1/a-dir/doc.md",
        ],
        "reducedSize": 6,
        "removedEmptyDirs": 4,
      }
    `);
  });

  it('allows skipping default globs', async () => {
    const result = await clean({ noDefaults: true, globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      {
        "files": [
          "<CWD>/node_modules/dep4/nonDefaultFile.ext",
        ],
        "reducedSize": 1,
        "removedEmptyDirs": 1,
      }
    `);
  });

  it('uses custom glob file if provided', async () => {
    const customGlobFile = '.custom-glob-file';
    vol.fromNestedJSON({ ...fileStructure, [customGlobFile]: '**.md\n**/nonDefaultFile.ext' });

    const result = await clean({ noDefaults: true, globFile: customGlobFile });
    expect(result).toMatchInlineSnapshot(`
      {
        "files": [
          "<CWD>/node_modules/dep2/CHANGELOG.md",
          "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "<CWD>/node_modules/dep1/a-dir/doc.md",
        ],
        "reducedSize": 3,
        "removedEmptyDirs": 2,
      }
    `);
  });

  it('keeps empty directories if specified', async () => {
    const result = await clean({ keepEmpty: true });
    expect(result.removedEmptyDirs).toBe(0);
  });
});
