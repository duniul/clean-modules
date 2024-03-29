import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { getMockedFileStructure } from '../__test__/getMockedFileStructure.js';
import {
  crawlDirFast,
  crawlDirWithChecks,
  fileExists,
  forEachDirentAsync,
  readDirectory,
  removeEmptyDirs,
  removeEmptyDirsUp,
  removeFiles,
} from './filesystem.js';

describe('file exists', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      testdir: {
        foo: '.',
        bar: '.',
      },
    });
  });

  it('returns true if the file exists', async () => {
    const result = await fileExists('testdir/foo');
    expect(result).toBe(true);
  });

  it('returns false if the file does not exists', async () => {
    const result = await fileExists('testdir/foo');
    expect(result).toBe(true);
  });

  it("throws any error that isn't ENOENT", async () => {
    const statSpy = vi.spyOn(fs.promises, 'stat').mockImplementation(() => {
      throw new Error('not an ENOENT!');
    });

    await expect(fileExists('testdir/foo')).rejects.toThrow('not an ENOENT!');

    statSpy.mockRestore();
  });
});

describe('forEachDirentAsync', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      testdir: {
        foo: { 'foo-bar': '' },
        bar: '',
        baz: '',
      },
    });
  });

  it('runs action with dirents for each item in a directory', async () => {
    const action = vi.fn();
    await forEachDirentAsync('testdir', action);

    expect(action).toHaveBeenCalledTimes(3);
    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'foo' }),
      expect.anything(),
      expect.anything()
    );

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'bar' }),
      expect.anything(),
      expect.anything()
    );

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'baz' }),
      expect.anything(),
      expect.anything()
    );
  });
});

describe('readDirectory', () => {
  beforeEach(() => {
    vol.fromNestedJSON({ 'parent/empty': { 'foo.txt': '', 'bar.txt': '' } });
  });

  it('returns list of files in directory', async () => {
    expect(await readDirectory('parent/empty')).toEqual(
      expect.arrayContaining(['foo.txt', 'bar.txt'])
    );
  });

  it('returns empty array if directory does not exist', async () => {
    expect(await readDirectory('parent/invalid')).toEqual([]);
  });
});

describe('removeEmptyDirsUp', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      a0: {
        b0: {
          c0: {
            d0: {
              e0: {},
            },
          },
          c1: 'its a file',
        },
      },
    });
  });

  it('recursively removes empty directories up in the file tree', async () => {
    const checkedDirs = new Set<string>();
    await removeEmptyDirsUp(checkedDirs, 'a0/b0/c0/d0/e0');

    expect(Array.from(checkedDirs)).toEqual(['a0/b0/c0/d0/e0', 'a0/b0/c0/d0', 'a0/b0/c0', 'a0/b0']);

    // dirs no longer exist
    expect(fs.existsSync('a0/b0/c0/d0/e0')).toEqual(false);
    expect(fs.existsSync('a0/b0/c0/d0')).toEqual(false);
    expect(fs.existsSync('a0/b0/c0')).toEqual(false);
    expect(fs.existsSync('a0/b0')).toEqual(true);
    expect(fs.existsSync('a0')).toEqual(true);
  });

  it('does not throw if path is invalid', async () => {
    const checkedDirs = new Set<string>();
    expect(async () => await removeEmptyDirsUp(checkedDirs, 'invalid/path')).not.toThrow();
  });
});

describe('removeEmptyDirs', () => {
  beforeEach(async () => {
    const fileStructure = await getMockedFileStructure();
    vol.fromNestedJSON(fileStructure);
  });

  it('cleans up empty parent dirs for provided files', async () => {
    const filePaths = [
      'node_modules/dep1/__tests__/test1.js',
      'node_modules/dep1/a-dir/doc.md',
      'node_modules/dep2/CHANGELOG.md',
      'node_modules/dep2/file.js',
    ];

    // remove files before testing
    for (const filePath of filePaths) {
      fs.unlinkSync(filePath);
    }

    await removeEmptyDirs(filePaths);

    expect(fs.existsSync('node_modules/dep1/__tests__')).toBe(true); // not empty and not removed
    expect(fs.existsSync('node_modules/dep1/a-dir')).toBe(false); // empty and removed
    expect(fs.existsSync('node_modules/dep2')).toBe(false); // empty and removed
  });

  it('does not throw if path is invalid', async () => {
    const filePaths = ['invalid/path/2', 'invalid/path/2'];
    expect(async () => await removeEmptyDirs(filePaths)).not.toThrow();
  });
});

describe('crawlDirFast', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      a0: {
        b0: {
          c0: {
            d0: {
              e0: {},
            },
            d1: {
              e0: {
                f0: 'f0',
              },
            },
            d2: 'd2',
          },
          c1: 'c1',
          c2: 'c2',
        },
      },
      a1: 'a1',
      a2: 'a2',
    });
  });

  it('appends all nested file paths to the provided array', async () => {
    const filePaths: string[] = [];
    await crawlDirFast(filePaths, 'a0');
    expect(filePaths).toEqual([
      path.join('a0', 'b0', 'c1'),
      path.join('a0', 'b0', 'c2'),
      path.join('a0', 'b0', 'c0', 'd2'),
      path.join('a0', 'b0', 'c0', 'd1', 'e0', 'f0'),
    ]);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths: string[] = [];
    expect(async () => await crawlDirFast(filePaths, 'invalid/path')).not.toThrow();
  });
});

describe('crawlDirWithChecks', () => {
  beforeEach(() => {
    vol.fromNestedJSON({
      a0: {
        b0: {
          c0: {
            d0: {
              e0: {},
            },
            d1: {
              e0: {
                f0: 'f0',
              },
            },
            d2: 'd2',
          },
          c1: 'c1',
          c2: 'c2',
        },
      },
      a1: 'a1',
      a2: 'a2',
    });
  });

  it('runs check functions on each nested item', async () => {
    const filePaths: string[] = [];
    const checkDir = vi.fn(() => false);
    const checkFile = vi.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);
    expect(checkDir).toHaveBeenCalledTimes(6);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('includes full dir without checking remaining items if checkDir returns true', async () => {
    const filePaths: string[] = [];
    const checkDir = vi.fn(() => true);
    const checkFile = vi.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual([
      path.join('a0', 'b0', 'c1'),
      path.join('a0', 'b0', 'c2'),
      path.join('a0', 'b0', 'c0', 'd2'),
      path.join('a0', 'b0', 'c0', 'd1', 'e0', 'f0'),
    ]);
    expect(checkDir).toHaveBeenCalledTimes(1);
    expect(checkFile).toHaveBeenCalledTimes(0);
  });

  it('skips file if checkFile function returns false', async () => {
    const filePaths: string[] = [];
    const checkDir = vi.fn(() => false);
    const checkFile = vi.fn(() => false);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual([]);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths: string[] = [];
    const checkDir = vi.fn(() => false);
    const checkFile = vi.fn(() => false);

    expect(
      async () => await crawlDirWithChecks(filePaths, 'invalid/path', checkDir, checkFile)
    ).not.toThrow();
  });
});

describe('removeFiles', () => {
  beforeEach(async () => {
    const fileStructure = await getMockedFileStructure();
    vol.fromNestedJSON(fileStructure);
  });

  it('removes files at provided file paths', async () => {
    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'];

    // files are initially there
    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);

    await removeFiles(filePaths);

    // then they are not
    expect(fs.existsSync(filePaths[0])).toBe(false);
    expect(fs.existsSync(filePaths[1])).toBe(false);
  });

  it('does not remove files during dry runs', async () => {
    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'];

    await removeFiles(filePaths, { dryRun: true });

    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths = ['/invalid/path/2', '/invalid/path/2'];
    expect(async () => await removeFiles(filePaths)).not.toThrow();
  });
});
