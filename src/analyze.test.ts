import { fs, vol } from 'memfs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockedFileStructure } from './__test__/getMockedFileStructure.js';
import { analyzeIncluded } from './analyze.js';
import { EMPTY_GLOB_LISTS } from './__test__/fixtures.js';

const nodeModulesPath = 'node_modules';

beforeEach(async () => {
  const fileStructure = await getMockedFileStructure();
  vol.fromNestedJSON(fileStructure);
});

afterEach(() => {
  vol.reset();
});

describe('analyzeIncluded', () => {
  it('returns expected result', async () => {
    const results = await analyzeIncluded(nodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/__tests__/**', '**/dep3/**'],
      includedDirs: ['**/__tests__', '**/dep3'],
      originalIncluded: ['__tests__', 'dep3'],
    });

    expect(results).toEqual([
      {
        filePath: path.join('node_modules', 'dep1', '__tests__', 'test1.js'),
        includedByDefault: true,
        includedByGlobs: [{ derived: 'node_modules/**/__tests__/**', original: '__tests__' }],
      },
      {
        filePath: path.join('node_modules', 'dep1', '__tests__', 'test2.js'),
        includedByDefault: true,
        includedByGlobs: [{ derived: 'node_modules/**/__tests__/**', original: '__tests__' }],
      },
      {
        filePath: path.join('node_modules', 'dep3', 'deeply', 'nested', 'file.ext'),
        includedByDefault: false,
        includedByGlobs: [{ derived: 'node_modules/**/dep3/**', original: 'dep3' }],
      },
    ]);
  });

  it('says if a file was excluded or not', async () => {
    const results = await analyzeIncluded(nodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/CHANGELOG.md', '**/file.js'],
      originalIncluded: ['CHANGELOG.md', 'file.js'],
    });

    const fileResult = results.find((r) => r.filePath.endsWith('file.js'));
    const changelogResult = results.find((r) => r.filePath.endsWith('CHANGELOG.md'));

    expect(fileResult).toHaveProperty('includedByDefault', false);
    expect(changelogResult).toHaveProperty('includedByDefault', true);
  });

  it('lists what globs (original and derived version) included the file', async () => {
    const results = await analyzeIncluded(nodeModulesPath, {
      ...EMPTY_GLOB_LISTS,
      included: ['**/*.md', '**/CHANGELOG.md', '**/file.js'],
      originalIncluded: ['*.md', 'CHANGELOG.md', 'file.js'],
    });

    const fileResult = results.find((r) => r.filePath.endsWith('file.js'));
    const changelogResult = results.find((r) => r.filePath.endsWith('CHANGELOG.md'));

    expect(fileResult).toHaveProperty('includedByGlobs', [
      { derived: 'node_modules/**/file.js', original: 'file.js' },
    ]);

    expect(changelogResult).toHaveProperty('includedByGlobs', [
      { derived: 'node_modules/**/*.md', original: '*.md' },
      { derived: 'node_modules/**/CHANGELOG.md', original: 'CHANGELOG.md' },
    ]);
  });
});
