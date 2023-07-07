import mockFs from 'mock-fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest';
import { analyzeIncluded } from './analyze';
import { EMPTY_GLOB_LISTS, getMockedFileStructure } from './__fixtures__/fixtures';

const mockCwd = '/';
const mockNodeModulesPath = mockCwd + 'node_modules';
const mockedFileStructure = getMockedFileStructure(mockNodeModulesPath);

let cwdSpy: SpyInstance<[], string>;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);
  mockFs(mockedFileStructure);
});

afterEach(() => {
  cwdSpy.mockRestore();
  mockFs.restore();
});

describe('analyzeIncluded', () => {
  beforeEach(() => {
    mockFs(mockedFileStructure);
  });

  it('returns expected result', async () => {
    const results = await analyzeIncluded(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/__tests__/**', '**/dep3/**'],
      includedDirs: ['**/__tests__', '**/dep3'],
      originalIncluded: ['__tests__', 'dep3'],
    });

    expect(results).toEqual([
      {
        filePath: mockCwd + path.join('node_modules', 'dep1', '__tests__', 'test1.js'),
        includedByDefault: true,
        includedByGlobs: [
          { derived: mockCwd + 'node_modules/**/__tests__/**', original: '__tests__' },
        ],
      },
      {
        filePath: mockCwd + path.join('node_modules', 'dep1', '__tests__', 'test2.js'),
        includedByDefault: true,
        includedByGlobs: [
          { derived: mockCwd + 'node_modules/**/__tests__/**', original: '__tests__' },
        ],
      },
      {
        filePath: mockCwd + path.join('node_modules', 'dep3', 'deeply', 'nested', 'file.ext'),
        includedByDefault: false,
        includedByGlobs: [{ derived: mockCwd + 'node_modules/**/dep3/**', original: 'dep3' }],
      },
    ]);
  });

  it('says if a file was excluded or not', async () => {
    const results = await analyzeIncluded(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/tsconfig.json', '**/file.js'],
      originalIncluded: ['tsconfig.json', 'file.js'],
    });

    expect(results[0]).toHaveProperty('includedByDefault', false);
    expect(results[1]).toHaveProperty('includedByDefault', true);
  });

  it('lists what globs (original and derived version) included the file', async () => {
    const results = await analyzeIncluded(mockNodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/*.json', '**/tsconfig.json', '**/file.js'],
      originalIncluded: ['*.json', 'tsconfig.json', 'file.js'],
    });

    expect(results[0]).toHaveProperty('includedByGlobs', [
      { derived: mockCwd + 'node_modules/**/file.js', original: 'file.js' },
    ]);

    expect(results[1]).toHaveProperty('includedByGlobs', [
      { derived: mockCwd + 'node_modules/**/*.json', original: '*.json' },
      { derived: mockCwd + 'node_modules/**/tsconfig.json', original: 'tsconfig.json' },
    ]);
  });
});
