import fs from 'fs';
import mockFs from 'mock-fs';
import {
  crawlDirFast,
  crawlDirWithChecks,
  fileExists,
  forEachDirentAsync,
  readDirectory,
  removeEmptyDirsUp,
} from './filesystem';

describe('file exists', () => {
  beforeEach(() => {
    mockFs({
      testdir: {
        foo: '.',
        bar: '.',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
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
    fs.promises.stat = jest.fn(() => {
      throw new Error('not an ENOENT!');
    });

    await expect(fileExists('testdir/foo')).rejects.toThrow('not an ENOENT!');

    const mockAsyncStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
    mockAsyncStat.mockRestore();
  });
});

describe('forEachDirentAsync', () => {
  beforeEach(() => {
    mockFs({
      testdir: {
        foo: { 'foo-bar': '' },
        bar: '',
        baz: '',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('runs action with dirents for each item in a directory', async () => {
    const action = jest.fn();
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
    mockFs({ 'parent/empty': { 'foo.txt': '', 'bar.txt': '' } });
  });

  afterEach(() => {
    mockFs.restore();
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
    mockFs({
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

  afterEach(() => {
    mockFs.restore();
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

describe('crawlDirFast', () => {
  beforeEach(() => {
    mockFs({
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

  afterEach(() => {
    mockFs.restore();
  });

  it('appends all nested file paths to the provided array', async () => {
    const filePaths: string[] = [];
    await crawlDirFast(filePaths, 'a0');
    expect(filePaths).toEqual(['a0/b0/c1', 'a0/b0/c2', 'a0/b0/c0/d2', 'a0/b0/c0/d1/e0/f0']);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths: string[] = [];
    expect(async () => await crawlDirFast(filePaths, 'invalid/path')).not.toThrow();
  });
});

describe('crawlDirWithChecks', () => {
  beforeEach(() => {
    mockFs({
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

  afterEach(() => {
    mockFs.restore();
  });

  it('runs check functions on each nested item', async () => {
    const filePaths: string[] = [];
    const checkDir = jest.fn(() => false);
    const checkFile = jest.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);
    expect(checkDir).toHaveBeenCalledTimes(6);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('includes full dir without checking remaining items if checkDir returns true', async () => {
    const filePaths: string[] = [];
    const checkDir = jest.fn(() => true);
    const checkFile = jest.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual(['a0/b0/c1', 'a0/b0/c2', 'a0/b0/c0/d2', 'a0/b0/c0/d1/e0/f0']);
    expect(checkDir).toHaveBeenCalledTimes(1);
    expect(checkFile).toHaveBeenCalledTimes(0);
  });

  it('skips file if checkFile function returns false', async () => {
    const filePaths: string[] = [];
    const checkDir = jest.fn(() => false);
    const checkFile = jest.fn(() => false);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual([]);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths: string[] = [];
    const checkDir = jest.fn(() => false);
    const checkFile = jest.fn(() => false);

    expect(
      async () => await crawlDirWithChecks(filePaths, 'invalid/path', checkDir, checkFile)
    ).not.toThrow();
  });
});
