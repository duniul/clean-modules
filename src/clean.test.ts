import mockFs from 'mock-fs';
import fs from 'fs';
import { findFilesToRemove, removeEmptyDirs, removeFiles } from './clean';

const mockedFileStructure = {
  node_modules: {
    dep1: {
      __tests__: {
        // default dir
        'test1.js': '.',
        'test2.js': '.',
      },
      'a-dir': {
        'doc.md': '.', // default extension
      },
      '.npmrc': '.', // default file
    },
    dep2: {
      'tsconfig.json': '.', // default file
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

describe('findFilesToRemove', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('includes default dirs', async () => {
    const result = await findFilesToRemove('node_modules');

    expect(result.includedFiles).toEqual(
      expect.arrayContaining([
        'node_modules/dep1/__tests__/test1.js',
        'node_modules/dep1/__tests__/test2.js',
      ])
    );
  });
  it('includes default files', async () => {
    const result = await findFilesToRemove('node_modules');

    expect(result.includedFiles).toEqual(
      expect.arrayContaining(['node_modules/dep1/.npmrc', 'node_modules/dep2/tsconfig.json'])
    );
  });

  it('includes default extensions', async () => {
    const result = await findFilesToRemove('node_modules');

    expect(result.includedFiles).toEqual(
      expect.arrayContaining(['node_modules/dep1/a-dir/doc.md'])
    );
  });

  it('includes custom globs', async () => {
    const includedGlobs = ['**/deeply/nested/file.ext', '**/dep4/**'];
    const result = await findFilesToRemove('node_modules', includedGlobs);

    expect(result.includedFiles).toEqual(
      expect.arrayContaining([
        'node_modules/dep3/deeply/nested/file.ext',
        'node_modules/dep4/nonDefaultFile.ext',
      ])
    );
  });

  it('can exclude files and dirs by glob patterns', async () => {
    const excludedGlobs = ['**/__tests__/**', '**/*.md'];
    const result = await findFilesToRemove('node_modules', undefined, excludedGlobs);

    const expectedExclued = [
      'node_modules/dep1/__tests__/test1.js',
      'node_modules/dep1/__tests__/test2.js',
      'node_modules/dep1/a-dir/doc.md',
    ];

    expect(result.excludedFiles).toEqual(expectedExclued);
    expect(result.includedFiles).not.toEqual(expect.arrayContaining(expectedExclued));
  });
});

describe('removeFiles', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  afterEach(() => {
    mockFs.restore();
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

  it('returns total reduced size in bytes', async () => {
    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'];
    const reducedSize = await removeFiles(filePaths, true);
    expect(reducedSize).toBe(2);
  });

  it('does not remove files during dry runs', async () => {
    const filePaths = ['node_modules/dep1/__tests__/test1.js', 'node_modules/dep1/a-dir/doc.md'];

    await removeFiles(filePaths, true);

    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);
  });
});

describe('removeEmptyDirs', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('cleans up empty parent dirs for provided files', async () => {
    const filePaths = [
      'node_modules/dep1/__tests__/test1.js',
      'node_modules/dep1/a-dir/doc.md',
      'node_modules/dep2/tsconfig.json',
    ];

    // remove files before testing
    filePaths.forEach(filePath => fs.unlinkSync(filePath));

    await removeEmptyDirs(filePaths);

    expect(fs.existsSync('node_modules/dep1/__tests__')).toBe(true); // not empty and not removed
    expect(fs.existsSync('node_modules/dep1/a-dir')).toBe(false); // empty and removed
    expect(fs.existsSync('node_modules/dep2')).toBe(false); // empty and removed
  });
});
