import fs from 'fs';
import mockFs from 'mock-fs';
import {
  crawlDirFast,
  crawlDirWithChecks,
  isEmptyDir,
  readDirentsAsync,
  removeEmptyDirsUp,
} from './filesystem';

describe('readDirentsAsync', () => {
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
    await readDirentsAsync('testdir', action);

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

describe('isEmptyDir', () => {
  beforeEach(() => {
    mockFs({ 'parent/empty': {} });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('returns true if a directory is empty', async () => {
    expect(await isEmptyDir('parent/empty')).toEqual(true);
  });

  it('returns false if a directory is not empty', async () => {
    expect(await isEmptyDir('parent')).toEqual(false);
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
    let filePaths: string[] = [];
    await crawlDirFast(filePaths, 'a0');
    expect(filePaths).toEqual(['a0/b0/c1', 'a0/b0/c2', 'a0/b0/c0/d2', 'a0/b0/c0/d1/e0/f0']);
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
    let filePaths: string[] = [];
    const checkDir = jest.fn(() => false);
    const checkFile = jest.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);
    expect(checkDir).toHaveBeenCalledTimes(6);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });

  it('includes full dir without checking remaining items if checkDir returns true', async () => {
    let filePaths: string[] = [];
    const checkDir = jest.fn(() => true);
    const checkFile = jest.fn(() => true);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual(['a0/b0/c1', 'a0/b0/c2', 'a0/b0/c0/d2', 'a0/b0/c0/d1/e0/f0']);
    expect(checkDir).toHaveBeenCalledTimes(1);
    expect(checkFile).toHaveBeenCalledTimes(0);
  });

  it('skips file if checkFile function returns false', async () => {
    let filePaths: string[] = [];
    const checkDir = jest.fn(() => false);
    const checkFile = jest.fn(() => false);

    await crawlDirWithChecks(filePaths, 'a0', checkDir, checkFile);

    expect(filePaths).toEqual([]);
    expect(checkFile).toHaveBeenCalledTimes(4);
  });
});
