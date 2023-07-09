import { vol } from 'memfs';
import pm from 'picomatch';
import { describe, expect, it, Mock, vi } from 'vitest';
import { EMPTY_GLOB_LISTS } from '../__test__/fixtures.js';
import { DEFAULT_PICO_OPTIONS } from '../constants.js';
import { GlobLists } from '../types.js';
import {
  formatGlob,
  makeGlobMatcher,
  mergeGlobLists,
  optimizeGlobLists,
  optimizeGlobs,
  parseGlobsFile,
  processGlobs,
  toAbsoluteGlobLists,
  updateGlobLists,
  wrapGlobs,
} from './glob.js';

vi.mock('picomatch');

const mockedPm = pm as unknown as Mock<[], typeof pm>;

describe('makeGlobMatcher', () => {
  it('creates a picomatch globber with default options', () => {
    const globMock = 'globber';
    mockedPm.mockReturnValueOnce(globMock as unknown as typeof pm);
    const pattern = '**/**';

    const globber = makeGlobMatcher(pattern);

    expect(pm).toHaveBeenCalledWith(pattern, DEFAULT_PICO_OPTIONS);
    expect(globber).toBe(globMock);
  });
});

describe('updateGlobLists', () => {
  const mockGlobLists: GlobLists = {
    ...EMPTY_GLOB_LISTS,
    included: ['foo'],
    includedDirs: ['bar'],
    excluded: ['baz'],
  };

  it('runs passed function for correct files', () => {
    const mockFn = vi.fn();

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
      includedDirs: [...(mockGlobLists.includedDirs || []), 'includedDirs'],
      excluded: [...mockGlobLists.excluded, 'excluded'],
    };

    expect(result).toEqual(expectedResult);
  });
});

describe('mergeGlobLists', () => {
  it('merges glob lists', () => {
    const result = mergeGlobLists(
      {
        ...EMPTY_GLOB_LISTS,
        included: ['foo'],
        includedDirs: ['foo'],
        excluded: ['foo'],
      },
      {
        ...EMPTY_GLOB_LISTS,
        included: ['bar'],
        includedDirs: ['bar'],
        excluded: ['bar'],
      }
    );

    expect(result).toEqual({
      ...EMPTY_GLOB_LISTS,
      included: ['foo', 'bar'],
      includedDirs: ['foo', 'bar'],
      excluded: ['foo', 'bar'],
    });
  });
});

describe('toAbsoluteGlobLists', () => {
  it('prepends globs with absolute paths on all platforms', () => {
    const result = toAbsoluteGlobLists(
      {
        ...EMPTY_GLOB_LISTS,
        included: ['bar'],
        includedDirs: ['bar'],
        excluded: ['bar'],
      },
      '/foo'
    );

    expect(result).toEqual({
      ...EMPTY_GLOB_LISTS,
      included: ['/foo/bar'],
      includedDirs: ['/foo/bar'],
      excluded: ['/foo/bar'],
    });
  });
});

describe('wrapGlobs', () => {
  it('wraps globs into a single glob', () => {
    const result = wrapGlobs(['**/foo', '**/bar', '*/baz']);
    expect(result).toEqual('@((**/foo)|(**/bar)|(*/baz))');
  });

  it('prepends an optional prefix to the result', () => {
    const result = wrapGlobs(['**/foo', '**/bar', '*/baz'], 'hello');
    expect(result).toEqual('hello@((**/foo)|(**/bar)|(*/baz))');
  });
});

describe('optimizeGlobs', () => {
  it('splits globs by leading characters and merges into two globs', () => {
    const result = optimizeGlobs(['**/some', '*/where', 'over', '**/the', '/rainbow']);
    expect(result).toEqual(['**/@((some)|(the))', '@((*/where)|(over)|(/rainbow))']);
  });

  it('normalizes leading globstars', () => {
    const result = optimizeGlobs(['**/**/**/one', '**/**/two', '**/three', '/**/four']);
    expect(result).toEqual(['**/@((one)|(two)|(three)|(four))']);
  });
});

describe('optimizeGlobLists', () => {
  it('splits globs by leading characters and merges into two globs', () => {
    const result = optimizeGlobLists({
      ...EMPTY_GLOB_LISTS,
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

describe('formatGlob', () => {
  it('trims globs', () => {
    const result = formatGlob('   foo/**    ');
    expect(result).toEqual('**/foo/**');
  });

  it('adds globstars to globs not starting with a slash', () => {
    const result = formatGlob('test.ts');
    expect(result).toEqual('**/test.ts');
  });

  it('replaces escaped leading exclamation marks', () => {
    const result = formatGlob('\\!(*.d).ts');
    expect(result).toEqual('**/!(*.d).ts');
  });

  it('removes leading slashes', () => {
    const result = formatGlob('/path/to/file');
    expect(result).toEqual('path/to/file');
  });

  it('appends globstars to directory globs', () => {
    const result = formatGlob('/path/to/directory/');
    expect(result).toEqual('path/to/directory/**');
  });
});

describe('processGlobs', () => {
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

  it('allows passing predefined excluded globs', () => {
    const result = processGlobs(
      ['!**/not/this/either/', '!and/definitely/not/this'],
      ['**/notThis', 'orThat.js']
    );

    expect(result.excluded).toMatchInlineSnapshot(`
      [
        "**/**/notThis",
        "**/orThat.js",
        "**/**/not/this/either/**",
        "**/and/definitely/not/this",
      ]
    `);
  });

  it('removes trailing globstars from dir globs', () => {
    const result = processGlobs(['**/foo/**', '/bar/**']);
    expect(result.includedDirs).toEqual(['**/**/foo', 'bar']);
  });

  it('filters empty strings', () => {
    const result = processGlobs(['foo', '', '', '', 'bar']);
    expect(result.included).toEqual(['**/foo', '**/bar']);
  });

  it('keeps original inclusion globs', () => {
    const original = ['**/test', '**/path/to/directory/', '*.ext'];
    const result = processGlobs(original);
    expect(result.originalIncluded).toEqual(original);
  });
});

describe('parseGlobsFile', () => {
  const globFilePath = process.cwd() + '/.cleanmodules';

  it('loads globs from a glob file', async () => {
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
    const globFile = `
    # this is a comment
    # this too
    # and this
    path/to/something
    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toEqual(['**/path/to/something']);
    expect(result.excluded).toEqual([]);
  });

  it('removes empty lines', async () => {
    const globFile = `

    path/to/something

    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toEqual(['**/path/to/something']);
    expect(result.excluded).toEqual([]);
  });

  it('adds lines starting with an exclamation point to excluded globs', async () => {
    const globFile = `
    !excludeMe
    `;

    vol.fromNestedJSON({ [globFilePath]: globFile });
    const result = await parseGlobsFile(globFilePath);
    expect(result.included).toEqual([]);
    expect(result.excluded).toEqual(['**/excludeMe']);
  });
});
