import fs from 'node:fs';
import path from 'node:path';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockedFileStructure } from './__test__/getMockedFileStructure.js';
import { clean } from './clean.js';

vi.setConfig({ testTimeout: 5000 });

const fileStructure = await getMockedFileStructure();

describe(clean, () => {
  beforeEach(() => {
    vol.fromNestedJSON(fileStructure);
  });

  it('cleans up expected files by default', async () => {
    expect.hasAssertions();

    const result = await clean();
    expect(result).toMatchInlineSnapshot(`
      {
        "failures": [],
        "files": [
          "<CWD>/node_modules/dep1/.npmrc",
          "<CWD>/node_modules/dep2/CHANGELOG.md",
          "<CWD>/node_modules/dep1/__tests__/test1.js",
          "<CWD>/node_modules/dep1/__tests__/test2.js",
          "<CWD>/node_modules/dep1/a-dir/doc.md",
        ],
        "reducedSize": 5,
        "removedEmptyDirs": 3,
        "removedFilesCount": 5,
      }
    `);
  });

  it('accepts custom globs', async () => {
    expect.hasAssertions();

    const result = await clean({ globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      {
        "failures": [],
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
        "removedFilesCount": 6,
      }
    `);
  });

  it('allows skipping default globs', async () => {
    expect.hasAssertions();

    const result = await clean({ noDefaults: true, globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      {
        "failures": [],
        "files": [
          "<CWD>/node_modules/dep4/nonDefaultFile.ext",
        ],
        "reducedSize": 1,
        "removedEmptyDirs": 1,
        "removedFilesCount": 1,
      }
    `);
  });

  it('uses custom glob file if provided', async () => {
    expect.hasAssertions();

    const customGlobFile = '.custom-glob-file';
    vol.fromNestedJSON({ ...fileStructure, [customGlobFile]: '**.md\n**/nonDefaultFile.ext' });

    const result = await clean({ noDefaults: true, globFile: customGlobFile });
    expect(result).toMatchInlineSnapshot(`
      {
        "failures": [],
        "files": [
          "<CWD>/node_modules/dep2/CHANGELOG.md",
          "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "<CWD>/node_modules/dep1/a-dir/doc.md",
        ],
        "reducedSize": 3,
        "removedEmptyDirs": 2,
        "removedFilesCount": 3,
      }
    `);
  });

  it('keeps empty directories if specified', async () => {
    expect.hasAssertions();

    const result = await clean({ keepEmpty: true });
    expect(result.removedEmptyDirs).toBe(0);
  });
});

describe('symlink handling', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      ...fileStructure,
      node_modules: {
        '.pnpm': {
          'foo@1.0.0': {
            node_modules: {
              foo: {
                '__tests__': { 'a.js': '.' },
                'index.js': '.',
                'CHANGELOG.md': '.',
              },
            },
          },
        },
      },
    });

    vol.symlinkSync(
      path.resolve('node_modules/.pnpm/foo@1.0.0/node_modules/foo'),
      path.resolve('node_modules/foo')
    );
  });

  it('matches files exactly once via their real .pnpm path', async () => {
    expect.hasAssertions();

    const result = await clean();

    const realChangelog = path.resolve('node_modules/.pnpm/foo@1.0.0/node_modules/foo/CHANGELOG.md');
    const linkedChangelog = path.resolve('node_modules/foo/CHANGELOG.md');

    expect(result.files).toContain(realChangelog);
    expect(result.files).not.toContain(linkedChangelog);

    const realTest = path.resolve('node_modules/.pnpm/foo@1.0.0/node_modules/foo/__tests__/a.js');
    expect(result.files).toContain(realTest);

    // No duplicates — every matched path appears exactly once.
    expect(new Set(result.files).size).toBe(result.files.length);
    expect(result.failures).toStrictEqual([]);
  });

  it('leaves the symlink itself in place when its name does not match any glob', async () => {
    expect.hasAssertions();

    await clean();

    // The symlink at node_modules/foo doesn't match any default glob, so it survives cleanup.
    expect(fs.existsSync(path.resolve('node_modules/foo'))).toBe(true);
    expect(fs.lstatSync(path.resolve('node_modules/foo')).isSymbolicLink()).toBe(true);
  });
});
