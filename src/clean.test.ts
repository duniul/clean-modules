import fs from 'fs';
import mockFs from 'mock-fs';
import { findFilesToRemove, removeEmptyDirs, removeFiles } from './clean';
import { EMPTY_GLOB_LISTS, getMockedFileStructure } from './__fixtures__/fixtures';

const mockCwd = '/';
const mockNodeModulesPath = mockCwd + 'node_modules';
const mockedFileStructure = getMockedFileStructure(mockNodeModulesPath);

let cwdSpy: jest.SpyInstance<string, []>;

beforeEach(() => {
  cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
  mockFs(mockedFileStructure);
});

afterEach(() => {
  cwdSpy.mockRestore();
  mockFs.restore();
});

describe('findFilesToRemove', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  it('includes dirs', async () => {
    const result = await findFilesToRemove(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      includedDirs: ['**/__tests__', '**/dep3'],
    });

    expect(result).toMatchInlineSnapshot(`
      Array [
        "/node_modules/dep1/__tests__/test1.js",
        "/node_modules/dep1/__tests__/test2.js",
        "/node_modules/dep3/deeply/nested/file.ext",
      ]
    `);
  });

  it('includes files', async () => {
    const result = await findFilesToRemove(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/deeply/nested/file.ext', '**/dep4/**'],
    });

    expect(result).toMatchInlineSnapshot(`
      Array [
        "/node_modules/dep4/nonDefaultFile.ext",
        "/node_modules/dep3/deeply/nested/file.ext",
      ]
    `);
  });

  it('can exclude files and dirs by glob patterns', async () => {
    const result = await findFilesToRemove(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/*.js'],
      excluded: ['**/test*.js'],
    });

    expect(result).toMatchInlineSnapshot(`
      Array [
        "/node_modules/dep2/file.js",
      ]
    `);
  });
});

describe('removeFiles', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  it('removes files at provided file paths', async () => {
    const filePaths = ['/node_modules/dep1/__tests__/test1.js', '/node_modules/dep1/a-dir/doc.md'];

    // files are initially there
    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);

    await removeFiles(filePaths);

    // then they are not
    expect(fs.existsSync(filePaths[0])).toBe(false);
    expect(fs.existsSync(filePaths[1])).toBe(false);
  });

  it('does not remove files during dry runs', async () => {
    const filePaths = ['/node_modules/dep1/__tests__/test1.js', '/node_modules/dep1/a-dir/doc.md'];

    await removeFiles(filePaths, { dryRun: true });

    expect(fs.existsSync(filePaths[0])).toBe(true);
    expect(fs.existsSync(filePaths[1])).toBe(true);
  });

  it('does not throw if path is invalid', async () => {
    const filePaths = ['/invalid/path/2', '/invalid/path/2'];
    expect(async () => await removeFiles(filePaths)).not.toThrow();
  });
});

describe('removeEmptyDirs', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  it('cleans up empty parent dirs for provided files', async () => {
    const filePaths = [
      '/node_modules/dep1/__tests__/test1.js',
      '/node_modules/dep1/a-dir/doc.md',
      '/node_modules/dep2/tsconfig.json',
      '/node_modules/dep2/file.js',
    ];

    // remove files before testing
    filePaths.forEach(filePath => fs.unlinkSync(filePath));

    await removeEmptyDirs(filePaths);

    expect(fs.existsSync('/node_modules/dep1/__tests__')).toBe(true); // not empty and not removed
    expect(fs.existsSync('/node_modules/dep1/a-dir')).toBe(false); // empty and removed
    expect(fs.existsSync('/node_modules/dep2')).toBe(false); // empty and removed
  });

  it('does not throw if path is invalid', async () => {
    const filePaths = ['invalid/path/2', 'invalid/path/2'];
    expect(async () => await removeEmptyDirs(filePaths)).not.toThrow();
  });
});
