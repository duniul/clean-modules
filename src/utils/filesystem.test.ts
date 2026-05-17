import fs from 'node:fs';
import path from 'node:path';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockedFileStructure } from '../__test__/getMockedFileStructure.js';
import {
  crawlDirFast,
  crawlDirWithChecks,
  fileExists,
  forEachDirentAsync,
  readDirectory,
  removeEmptyDirs,
  removeFiles,
  type CheckPathFunc,
  type CrawlErrorHandler,
  type DirentAction,
} from './filesystem.js';

type NodeError = Error & { code: string };

function makeNodeError(message: string, code: string): NodeError {
  const error = new Error(message) as NodeError;
  error.code = code;
  return error;
}

vi.setConfig({ testTimeout: 5000 });

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
    expect.hasAssertions();

    const result = await fileExists('testdir/foo');
    expect(result).toBe(true);
  });

  it('returns false if the file does not exist', async () => {
    expect.hasAssertions();

    const result = await fileExists('testdir/nonexistent');
    expect(result).toBe(false);
  });

  it("throws any error that isn't ENOENT", async () => {
    expect.hasAssertions();

    const statSpy = vi.spyOn(fs.promises, 'stat').mockImplementation(() => {
      throw new Error('not an ENOENT!');
    });

    await expect(fileExists('testdir/foo')).rejects.toThrow('not an ENOENT!');

    statSpy.mockRestore();
  });
});

describe(forEachDirentAsync, () => {
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
    expect.hasAssertions();

    const action = vi.fn<DirentAction>();
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

  it('does not call onError for ENOENT', async () => {
    expect.hasAssertions();

    const onError = vi.fn<CrawlErrorHandler>();
    await forEachDirentAsync('nonexistent', vi.fn(), onError);

    expect(onError).not.toHaveBeenCalled();
  });

  it('does not call onError for ENOTDIR', async () => {
    expect.hasAssertions();

    const readdirSpy = vi
      .spyOn(fs.promises, 'readdir')
      .mockRejectedValue(makeNodeError('not a directory', 'ENOTDIR'));
    const onError = vi.fn<CrawlErrorHandler>();

    await forEachDirentAsync('testdir', vi.fn(), onError);

    expect(onError).not.toHaveBeenCalled();
    readdirSpy.mockRestore();
  });

  it('calls onError with a failure when readdir fails with a non-ignored error', async () => {
    expect.hasAssertions();

    const readdirSpy = vi.spyOn(fs.promises, 'readdir').mockRejectedValue(makeNodeError('denied', 'EACCES'));
    const onError = vi.fn<CrawlErrorHandler>();

    await forEachDirentAsync('testdir', vi.fn(), onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({
      path: 'testdir',
      phase: 'readdir',
      code: 'EACCES',
      message: 'denied',
    });

    readdirSpy.mockRestore();
  });
});

describe(readDirectory, () => {
  beforeEach(() => {
    vol.fromNestedJSON({ 'parent/empty': { 'foo.txt': '', 'bar.txt': '' } });
  });

  it('returns list of files in directory', async () => {
    expect.hasAssertions();

    await expect(readDirectory('parent/empty')).resolves.toStrictEqual(
      expect.arrayContaining(['foo.txt', 'bar.txt'])
    );
  });

  it('returns empty array if directory does not exist', async () => {
    expect.hasAssertions();

    await expect(readDirectory('parent/invalid')).resolves.toStrictEqual([]);
  });
});

describe(removeEmptyDirs, () => {
  beforeEach(async () => {
    const fileStructure = await getMockedFileStructure();
    vol.fromNestedJSON(fileStructure);
  });

  it('cleans up empty parent dirs for provided files', async () => {
    expect.hasAssertions();

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
    expect.hasAssertions();

    const filePaths = ['invalid/path/2', 'invalid/path/2'];
    await expect(() => removeEmptyDirs(filePaths)).not.toThrow();
  });

  it('walks up the tree, removing every empty ancestor', async () => {
    expect.hasAssertions();

    vol.fromNestedJSON({
      a0: {
        b0: {
          c0: {
            d0: {
              e0: { 'leaf.js': '.' },
            },
          },
          c1: 'its a file',
        },
      },
    });

    fs.unlinkSync('a0/b0/c0/d0/e0/leaf.js');
    const removed = await removeEmptyDirs(['a0/b0/c0/d0/e0/leaf.js']);

    expect(removed).toBe(3);
    expect(fs.existsSync('a0/b0/c0/d0/e0')).toBe(false);
    expect(fs.existsSync('a0/b0/c0/d0')).toBe(false);
    expect(fs.existsSync('a0/b0/c0')).toBe(false);
    expect(fs.existsSync('a0/b0')).toBe(true); // contains the unrelated c1 file
    expect(fs.existsSync('a0')).toBe(true);
  });

  it('removes a parent that becomes empty only after multiple sibling cleanups', async () => {
    expect.hasAssertions();

    vol.fromNestedJSON({
      parent: {
        sub1: { 'a.js': '.' },
        sub2: { 'b.js': '.' },
      },
    });

    const filePaths = ['parent/sub1/a.js', 'parent/sub2/b.js'];
    for (const filePath of filePaths) {
      fs.unlinkSync(filePath);
    }

    const removed = await removeEmptyDirs(filePaths);

    // sub1, sub2 and the parent that became empty because of them
    expect(removed).toBe(3);
    expect(fs.existsSync('parent')).toBe(false);
  });
});

describe(crawlDirFast, () => {
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
    expect.hasAssertions();

    const filePaths: string[] = [];
    await crawlDirFast(filePaths, 'a0');
    expect(filePaths).toStrictEqual([
      path.join('a0', 'b0', 'c1'),
      path.join('a0', 'b0', 'c2'),
      path.join('a0', 'b0', 'c0', 'd2'),
      path.join('a0', 'b0', 'c0', 'd1', 'e0', 'f0'),
    ]);
  });

  it('does not throw if path is invalid', async () => {
    expect.hasAssertions();

    const filePaths: string[] = [];
    await expect(() => crawlDirFast(filePaths, 'invalid/path')).not.toThrow();
  });
});

describe(crawlDirWithChecks, () => {
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
    expect.hasAssertions();

    const filePaths: string[] = [];
    const checkDir = vi.fn<CheckPathFunc>(() => false);
    const checkFile = vi.fn<CheckPathFunc>(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);
    expect(checkDir).toHaveBeenCalledTimes(6);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('includes full dir without checking remaining items if checkDir returns true', async () => {
    expect.hasAssertions();

    const filePaths: string[] = [];
    const checkDir = vi.fn<CheckPathFunc>(() => true);
    const checkFile = vi.fn<CheckPathFunc>(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toStrictEqual([
      path.join('a0', 'b0', 'c1'),
      path.join('a0', 'b0', 'c2'),
      path.join('a0', 'b0', 'c0', 'd2'),
      path.join('a0', 'b0', 'c0', 'd1', 'e0', 'f0'),
    ]);
    expect(checkDir).toHaveBeenCalledTimes(1);
    expect(checkFile).not.toHaveBeenCalled();
  });

  it('skips file if checkFile function returns false', async () => {
    expect.hasAssertions();

    const filePaths: string[] = [];
    const checkDir = vi.fn<CheckPathFunc>(() => false);
    const checkFile = vi.fn<CheckPathFunc>(() => false);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toStrictEqual([]);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('does not throw if path is invalid', async () => {
    expect.hasAssertions();

    const filePaths: string[] = [];
    const checkDir = vi.fn<CheckPathFunc>(() => false);
    const checkFile = vi.fn<CheckPathFunc>(() => false);

    await expect(() => crawlDirWithChecks(filePaths, 'invalid/path', checkDir, checkFile)).not.toThrow();
  });
});

describe(removeFiles, () => {
  beforeEach(async () => {
    const fileStructure = await getMockedFileStructure();
    vol.fromNestedJSON(fileStructure);
  });

  it('removes files at provided file paths', async () => {
    expect.hasAssertions();

    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'] as const;

    // files are initially there
    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);

    const result = await removeFiles(filePaths);

    // then they are not
    expect(fs.existsSync(filePaths[0])).toBe(false);
    expect(fs.existsSync(filePaths[1])).toBe(false);
    expect(result.failures).toStrictEqual([]);
    expect(result.reducedSize).toBeGreaterThan(0);
  });

  it('does not remove files during dry runs', async () => {
    expect.hasAssertions();

    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'] as const;

    const result = await removeFiles(filePaths, { dryRun: true });

    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);
    expect(result.failures).toStrictEqual([]);
    expect(result.reducedSize).toBeGreaterThan(0);
  });

  it('does not throw if path is invalid', async () => {
    expect.hasAssertions();

    const filePaths = ['/invalid/path/2', '/invalid/path/2'];
    await expect(() => removeFiles(filePaths)).not.toThrow();
  });

  it('does not record failures for files that are already gone (ENOENT)', async () => {
    expect.hasAssertions();

    const result = await removeFiles(['/invalid/path/2']);

    expect(result.failures).toStrictEqual([]);
    expect(result.reducedSize).toBe(0);
  });

  it('records failures when stat fails with a non-ENOENT error', async () => {
    expect.hasAssertions();

    const filePath = 'node_modules/dep1/__tests__/test1.js';
    const statSpy = vi.spyOn(fs.promises, 'stat').mockRejectedValue(makeNodeError('denied', 'EACCES'));

    const result = await removeFiles([filePath]);

    expect(result.failures).toStrictEqual([
      {
        path: filePath,
        phase: 'stat',
        code: 'EACCES',
        message: 'denied',
      },
    ]);
    expect(result.reducedSize).toBe(0);
    statSpy.mockRestore();
  });

  it('records failures when unlink fails with a non-ENOENT error', async () => {
    expect.hasAssertions();

    const filePath = 'node_modules/dep1/__tests__/test1.js';
    const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockRejectedValue(makeNodeError('busy', 'EBUSY'));

    const result = await removeFiles([filePath]);

    expect(result.failures).toStrictEqual([
      {
        path: filePath,
        phase: 'unlink',
        code: 'EBUSY',
        message: 'busy',
      },
    ]);
    // size should not be counted when unlink fails
    expect(result.reducedSize).toBe(0);
    unlinkSpy.mockRestore();
  });

  it('continues processing other files when one fails', async () => {
    expect.hasAssertions();

    const failing = 'node_modules/dep1/__tests__/test1.js';
    const succeeding = 'node_modules/dep1/__tests__/test2.js';

    // Capture the (memfs-backed) original before installing the spy so we can pass-through.
    const originalUnlink = fs.promises.unlink.bind(fs.promises);
    const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockImplementation(filePath =>
      // oxlint-disable-next-line vitest/no-conditional-in-test
      filePath === failing
        ? Promise.reject(makeNodeError('busy', 'EBUSY'))
        : originalUnlink(filePath as Parameters<typeof originalUnlink>[0])
    );

    const result = await removeFiles([failing, succeeding]);

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.path).toBe(failing);
    expect(fs.existsSync(failing)).toBe(true);
    expect(fs.existsSync(succeeding)).toBe(false);

    unlinkSpy.mockRestore();
  });
});

describe('symlink handling', () => {
  describe(crawlDirFast, () => {
    beforeEach(() => {
      vol.fromNestedJSON({
        root: {
          realdir: {
            'file.txt': 'real',
          },
        },
      });
      vol.symlinkSync(path.resolve('root/realdir'), path.resolve('root/linkdir'));
    });

    it('does not recurse into symlinks to directories', async () => {
      expect.hasAssertions();

      const filePaths: string[] = [];
      await crawlDirFast(filePaths, 'root');

      expect(filePaths).toContain(path.join('root', 'realdir', 'file.txt'));
      expect(filePaths).toContain(path.join('root', 'linkdir'));
      expect(filePaths).not.toContain(path.join('root', 'linkdir', 'file.txt'));
    });
  });

  describe(crawlDirWithChecks, () => {
    beforeEach(() => {
      vol.fromNestedJSON({
        root: {
          realdir: {
            'file.txt': 'real',
          },
        },
      });
      vol.symlinkSync(path.resolve('root/realdir'), path.resolve('root/linkdir'));
    });

    it('does not recurse into symlinks to directories', async () => {
      expect.hasAssertions();

      const filePaths: string[] = [];
      const checkDir = vi.fn<CheckPathFunc>(() => false);
      const checkFile = vi.fn<CheckPathFunc>(() => true);

      await crawlDirWithChecks(filePaths, 'root', checkDir, checkFile);

      expect(filePaths).toContain(path.join('root', 'realdir', 'file.txt'));
      expect(filePaths).toContain(path.join('root', 'linkdir'));
      expect(filePaths).not.toContain(path.join('root', 'linkdir', 'file.txt'));
      // The symlink itself is offered to checkFile (not checkDir), so it can be matched
      // by file globs but is never descended into.
      expect(checkDir).toHaveBeenCalledWith(path.join('root', 'realdir'));
      expect(checkDir).not.toHaveBeenCalledWith(path.join('root', 'linkdir'));
      expect(checkFile).toHaveBeenCalledWith(path.join('root', 'linkdir'));
    });
  });

  describe(removeFiles, () => {
    it('unlinks the symlink itself rather than its target', async () => {
      expect.hasAssertions();

      vol.fromNestedJSON({ 'target.md': 'content' });
      vol.symlinkSync(path.resolve('target.md'), path.resolve('link.md'));

      const result = await removeFiles(['link.md']);

      expect(result.failures).toStrictEqual([]);
      expect(fs.existsSync('link.md')).toBe(false);
      expect(fs.existsSync('target.md')).toBe(true);
    });
  });
});
