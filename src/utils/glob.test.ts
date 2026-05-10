import path from 'node:path';
import { vol, type NestedDirectoryJSON } from 'memfs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockedFileStructure } from '../__test__/getMockedFileStructure.js';
import {
  findFilesByGlobLists,
  formatGlob,
  initGlobLists,
  makeGlobMatcher,
  mergeGlobLists,
  optimizeGlobLists,
  optimizeGlobs,
  parseGlobsFile,
  processGlobs,
  toAbsoluteGlobLists,
  updateGlobLists,
  wrapGlobs,
  type GlobLists,
} from './glob.js';

vi.setConfig({ testTimeout: 5000 });

describe(makeGlobMatcher, () => {
  it('creates a picomatch globber with default options', () => {
    const pattern = '**/**';

    const globber = makeGlobMatcher(pattern);

    expect(globber).toBeInstanceOf(Function);
    expect(globber).toHaveProperty('name', 'matcher');
  });
});

describe(updateGlobLists, () => {
  const mockGlobLists: GlobLists = {
    ...initGlobLists(),
    included: ['foo'],
    includedDirs: ['bar'],
    excluded: ['baz'],
  };

  it('runs passed function for correct files', () => {
    const mockFn = vi.fn<(globs: string[], key: keyof GlobLists) => string[]>();

    updateGlobLists(mockGlobLists, mockFn);

    expect(mockFn).toHaveBeenCalledWith(mockGlobLists.included, 'included');
    expect(mockFn).toHaveBeenCalledWith(mockGlobLists.includedDirs, 'includedDirs');
    expect(mockFn).toHaveBeenCalledWith(mockGlobLists.excluded, 'excluded');
  });

  it('applies result of passed function to each field', () => {
    const result = updateGlobLists(mockGlobLists, (globs, key) => [...globs, key]);
    const expectedResult: GlobLists = {
      ...mockGlobLists,
      included: [...mockGlobLists.included, 'included'],
      includedDirs: [...mockGlobLists.includedDirs, 'includedDirs'],
      excluded: [...mockGlobLists.excluded, 'excluded'],
    };

    expect(result).toStrictEqual(expectedResult);
  });
});

describe(mergeGlobLists, () => {
  it('merges glob lists', () => {
    const result = mergeGlobLists(
      {
        ...initGlobLists(),
        included: ['foo'],
        includedDirs: ['foo'],
        excluded: ['foo'],
      },
      {
        ...initGlobLists(),
        included: ['bar'],
        includedDirs: ['bar'],
        excluded: ['bar'],
      }
    );

    expect(result).toStrictEqual({
      ...initGlobLists(),
      included: ['foo', 'bar'],
      includedDirs: ['foo', 'bar'],
      excluded: ['foo', 'bar'],
    });
  });
});

describe(toAbsoluteGlobLists, () => {
  it('prepends globs with absolute paths on all platforms', () => {
    const result = toAbsoluteGlobLists(
      {
        ...initGlobLists(),
        included: ['bar'],
        includedDirs: ['bar'],
        excluded: ['bar'],
      },
      '/foo'
    );

    expect(result).toStrictEqual({
      ...initGlobLists(),
      included: ['/foo/bar'],
      includedDirs: ['/foo/bar'],
      excluded: ['/foo/bar'],
    });
  });
});

describe(wrapGlobs, () => {
  it('wraps globs into a single glob', () => {
    const result = wrapGlobs(['**/foo', '**/bar', '*/baz']);
    expect(result).toBe('@((**/foo)|(**/bar)|(*/baz))');
  });

  it('prepends an optional prefix to the result', () => {
    const result = wrapGlobs(['**/foo', '**/bar', '*/baz'], 'hello');
    expect(result).toBe('hello@((**/foo)|(**/bar)|(*/baz))');
  });
});

describe(optimizeGlobs, () => {
  it('splits globs by leading characters and merges into two globs', () => {
    const result = optimizeGlobs(['**/some', '*/where', 'over', '**/the', '/rainbow']);
    expect(result).toStrictEqual(['**/@((some)|(the))', '@((*/where)|(over)|(/rainbow))']);
  });

  it('normalizes leading globstars', () => {
    const result = optimizeGlobs(['**/**/**/one', '**/**/two', '**/three', '/**/four']);
    expect(result).toStrictEqual(['**/@((one)|(two)|(three)|(four))']);
  });
});

describe(optimizeGlobLists, () => {
  it('splits globs by leading characters and merges into two globs', () => {
    const result = optimizeGlobLists({
      ...initGlobLists(),
      included: ['**/wrapMe/**', '**/andMe/**', 'notMe/**', '*/andNotMe.js', '/andNotMeEither.ts'],
      includedDirs: ['**/wrapMe', '**/andMe', 'notMe'],
      excluded: ['**/wrapMe/**', '**/andMe/**', 'notMe/**'],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "excluded": [
          "**/@((wrapMe/**)|(andMe/**))",
          "@((notMe/**))",
        ],
        "included": [
          "**/@((wrapMe/**)|(andMe/**))",
          "@((notMe/**)|(*/andNotMe.js)|(/andNotMeEither.ts))",
        ],
        "includedDirs": [
          "**/@((wrapMe)|(andMe))",
          "@((notMe))",
        ],
        "originalIncluded": [],
      }
    `);
  });
});

describe(formatGlob, () => {
  it('trims globs', () => {
    const result = formatGlob('   foo/**    ');
    expect(result).toBe('**/foo/**');
  });

  it('adds globstars to globs not starting with a slash', () => {
    const result = formatGlob('test.ts');
    expect(result).toBe('**/test.ts');
  });

  it('replaces escaped leading exclamation marks', () => {
    const result = formatGlob(String.raw`\!(*.d).ts`);
    expect(result).toBe('**/!(*.d).ts');
  });

  it('removes leading slashes', () => {
    const result = formatGlob('/path/to/file');
    expect(result).toBe('path/to/file');
  });

  it('appends globstars to directory globs', () => {
    const result = formatGlob('/path/to/directory/');
    expect(result).toBe('path/to/directory/**');
  });
});

describe(processGlobs, () => {
  it('formats globs and splits them into include/exclude glob lists', () => {
    const result = processGlobs(['**/test', '!test.js', '**/path/to/directory/', '*.ext']);
    expect(result).toMatchInlineSnapshot(`
      {
        "excluded": [
          "**/test.js",
        ],
        "included": [
          "**/**/test",
          "**/**/path/to/directory/**",
          "**/*.ext",
        ],
        "includedDirs": [
          "**/**/path/to/directory",
        ],
        "originalIncluded": [
          "**/test",
          "**/path/to/directory/",
          "*.ext",
        ],
      }
    `);
  });

  it('removes trailing globstars from dir globs', () => {
    const result = processGlobs(['**/foo/**', '/bar/**']);
    expect(result.includedDirs).toStrictEqual(['**/**/foo', 'bar']);
  });

  it('filters empty strings', () => {
    const result = processGlobs(['foo', '', '', '', 'bar']);
    expect(result.included).toStrictEqual(['**/foo', '**/bar']);
  });

  it('keeps original inclusion globs', () => {
    const original = ['**/test', '**/path/to/directory/', '*.ext'];
    const result = processGlobs(original);
    expect(result.originalIncluded).toStrictEqual(original);
  });
});

describe(parseGlobsFile, () => {
  const globFilePath = process.cwd() + '/.cleanmodules';

  it('loads globs from a glob file', async () => {
    expect.hasAssertions();

    const globFile = `
    # this is a comment
    __test__/
    !goodstuff/

    */dep/Makefile

    *.ts
    !*.d.ts
    *.ext
    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);

    expect(result).toMatchInlineSnapshot(`
      {
        "excluded": [
          "**/goodstuff/**",
          "**/*.d.ts",
        ],
        "included": [
          "**/__test__/**",
          "**/*/dep/Makefile",
          "**/*.ts",
          "**/*.ext",
        ],
        "includedDirs": [
          "**/__test__",
        ],
        "originalIncluded": [
          "__test__/",
          "*/dep/Makefile",
          "*.ts",
          "*.ext",
        ],
      }
    `);
  });

  it('removes comments', async () => {
    expect.hasAssertions();

    const globFile = `
    # this is a comment
    # this too
    # and this
    path/to/something
    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toStrictEqual(['**/path/to/something']);
    expect(result.excluded).toStrictEqual([]);
  });

  it('removes empty lines', async () => {
    expect.hasAssertions();

    const globFile = `

    path/to/something

    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toStrictEqual(['**/path/to/something']);
    expect(result.excluded).toStrictEqual([]);
  });

  it('adds lines starting with an exclamation point to excluded globs', async () => {
    expect.hasAssertions();

    const globFile = `
    !excludeMe
    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toStrictEqual([]);
    expect(result.excluded).toStrictEqual(['**/excludeMe']);
  });
});

describe(findFilesByGlobLists, () => {
  let fileStructure: NestedDirectoryJSON;
  const nodeModulesPath = 'node_modules';

  beforeAll(async () => {
    fileStructure = await getMockedFileStructure();
  });

  beforeEach(() => {
    vol.fromNestedJSON(fileStructure);
  });

  it('includes dirs', async () => {
    expect.hasAssertions();

    const result = await findFilesByGlobLists(nodeModulesPath, {
      ...initGlobLists(),
      includedDirs: ['**/__tests__', '**/dep3'],
    });

    expect(result).toStrictEqual([
      path.join('node_modules', 'dep1', '__tests__', 'test1.js'),
      path.join('node_modules', 'dep1', '__tests__', 'test2.js'),
      path.join('node_modules', 'dep3', 'deeply', 'nested', 'file.ext'),
    ]);
  });

  it('includes files', async () => {
    expect.hasAssertions();

    const result = await findFilesByGlobLists(nodeModulesPath, {
      ...initGlobLists(),
      included: ['**/deeply/nested/file.ext', '**/dep4/**'],
    });

    expect(result).toStrictEqual([
      path.join('node_modules', 'dep4', 'nonDefaultFile.ext'),
      path.join('node_modules', 'dep3', 'deeply', 'nested', 'file.ext'),
    ]);
  });

  it('can exclude files and dirs by glob patterns', async () => {
    expect.hasAssertions();

    const result = await findFilesByGlobLists(nodeModulesPath, {
      ...initGlobLists(),
      included: ['**/*.js'],
      excluded: ['**/test*.js'],
    });

    expect(result).toStrictEqual([path.join('node_modules', 'dep2', 'file.js')]);
  });
});
