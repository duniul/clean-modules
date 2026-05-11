import { promises as fsAsync } from 'node:fs';
import path from 'node:path';
import pm, { type PicomatchOptions } from 'picomatch';
import type { CleanFailure } from '../shared.js';
import { DEFAULT_GLOBS_FILE_PATH } from '../shared.js';
import { type CrawlErrorHandler, crawlDirWithChecks, fileExists } from './filesystem.js';

export function initGlobLists(): GlobLists {
  return { excluded: [], included: [], includedDirs: [], originalIncluded: [] };
}

export const DEFAULT_PICO_OPTIONS: Partial<PicomatchOptions> = {
  dot: true,
  nocase: true,
  strictSlashes: true,
};

export type GlobberPicoOptions = {
  dot?: boolean;
  regex?: boolean;
  nocase?: boolean;
  ignore?: string | string[];
  cwd?: string;
};

export type GlobFunc = (filePath: string, test?: false | undefined) => boolean;

/**
 * Creates a picomatch matcher from a set of globs.
 */
export function makeGlobMatcher(globs: string | string[], picoOptions?: GlobberPicoOptions): GlobFunc {
  return pm(globs, { ...DEFAULT_PICO_OPTIONS, ...picoOptions });
}

export type GlobLists = {
  excluded: string[];
  included: string[];
  includedDirs: string[];
  originalIncluded: string[];
};

/**
 * Runs an action on all editable lists in a GlobLists object, and returns the updated object.
 */
export function updateGlobLists(
  globLists: GlobLists,
  updateFunc: (globs: string[], key: keyof GlobLists) => string[]
): GlobLists {
  const { included, includedDirs, excluded } = globLists;

  return {
    ...globLists,
    included: updateFunc(included, 'included'),
    includedDirs: includedDirs ? updateFunc(includedDirs, 'includedDirs') : includedDirs,
    excluded: updateFunc(excluded, 'excluded'),
  };
}

/**
 * Merges all arrays of two GlobLists objects.
 */
export function mergeGlobLists(globListsA: GlobLists, globListsB: GlobLists): GlobLists {
  return {
    ...updateGlobLists(globListsA, (globs, key) => [...globs, ...(globListsB[key] || [])]),
    originalIncluded: [...globListsA.originalIncluded, ...globListsB.originalIncluded],
  };
}

/**
 * Replaces path with forward slashes as separators if necessary. Globs should always have POSIX separators, even on Windows.
 */
export function toPosixPath(pathStr: string): string {
  return path.sep === '/' ? pathStr : pathStr.replaceAll('\\', '/');
}

/**
 * Prepends an absolute path to all editable lists in a GlobLists object.
 */
export function toAbsoluteGlobLists(globLists: GlobLists, absoluteNodeModulesPath: string): GlobLists {
  const absolutePathWithPosixSeparator = toPosixPath(absoluteNodeModulesPath);

  return updateGlobLists(globLists, globs => globs.map(glob => absolutePathWithPosixSeparator + '/' + glob));
}

/**
 * Wraps globs into one conditional glob (like `@((one/glob/path)|(another/glob/path))`).
 */
export function wrapGlobs(globs: string[], prefix?: string): string {
  return `${prefix || ''}@(${globs.map(glob => '(' + glob + ')').join('|')})`;
}

const GLOBSTAR_START_REGEX = /^(\/?\*\*\/)+/;

/**
 * Optimizes globs by merging them into groups and removing unnecessary globstars.
 */
export function optimizeGlobs(globs: string[]): string[] {
  const globstarStartGlobs: string[] = [];
  const fixedPathGlobs: string[] = [];

  for (const glob of globs) {
    if (GLOBSTAR_START_REGEX.test(glob)) {
      globstarStartGlobs.push(glob);
    } else {
      fixedPathGlobs.push(glob);
    }
  }

  const result: string[] = [];

  if (globstarStartGlobs.length) {
    const withoutGlobstar = globstarStartGlobs.map(glob => glob.replace(GLOBSTAR_START_REGEX, ''));
    result.push(wrapGlobs(withoutGlobstar, '**/'));
  }

  if (fixedPathGlobs.length) {
    result.push(wrapGlobs(fixedPathGlobs));
  }

  return result;
}

/**
 * Runs optimizeGlobs() on all editable lists in a GlobLists object.
 */
export function optimizeGlobLists(globLists: GlobLists): GlobLists {
  return updateGlobLists(globLists, optimizeGlobs);
}

const EXCLAMATION_START = /^\s*!/; // Globs starting with !
const DIR_GLOB_REGEX = /\/\**$/; // Globs ending with /, /* or /**
const EXCLUDED_GLOB_REGEX = /^!/; // Globs starting with !
const ESCAPED_NEGATIVE_GLOB_REGEX = /^\\!/; // Globs starting with \!
const NOT_FIXED_START_GLOB_REGEX = /^([^/])/; // Globs not starting with /
const FIXED_START_GLOB_REGEX = /^\//; // Globs starting with /

/**
 * Formats and standardizes globs to make them suitable for picomatch.
 */
export function formatGlob(glob: string): string {
  return glob
    .trim()
    .replace(EXCLUDED_GLOB_REGEX, '') // remove leading exclamation marks
    .replace(ESCAPED_NEGATIVE_GLOB_REGEX, '!') // replace escaped leading exclamation mark with real one
    .replace(DIR_GLOB_REGEX, '/**') // normalize dir globs to all end with /**
    .replace(NOT_FIXED_START_GLOB_REGEX, '**/$1') // add globstars to globs not starting with /
    .replace(FIXED_START_GLOB_REGEX, ''); // remove fixed path indicators
}

/**
 * Parses clean-modules/gitignore-like globs and converts them into picomatch compatible globs.
 */
export function processGlobs(globs: string[]): GlobLists {
  const globLists = initGlobLists();

  for (const glob of globs) {
    const isExcluded = !!EXCLAMATION_START.test(glob);
    const formattedGlob = formatGlob(glob);

    if (!formattedGlob) {
      continue;
    }

    if (isExcluded) {
      globLists.excluded.push(formattedGlob);
    } else {
      if (formattedGlob.endsWith('/**')) {
        globLists.includedDirs.push(formattedGlob.replace(DIR_GLOB_REGEX, ''));
      }

      globLists.included.push(formattedGlob);
      globLists.originalIncluded.push(glob.trim());
    }
  }

  return globLists;
}

const COMMENT_OR_EMPTY_REGEX = /^\s*(#|$)/;

/**
 * Parses a clean-modules glob file, filtering comments and separating globs that should be included or excluded.
 */
export async function parseGlobsFile(filePath: string): Promise<GlobLists> {
  let fileContents: string;

  try {
    fileContents = await fsAsync.readFile(filePath, { encoding: 'utf8' });
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error(`Failed to read glob file (${filePath})`);
    throw error;
  }

  const fileGlobs = fileContents.split(/\r?\n/).filter(line => !COMMENT_OR_EMPTY_REGEX.test(line)) || [];

  return processGlobs(fileGlobs);
}

/**
 * Parses clean-modules' default glob file.
 */
export function parseDefaultGlobsFile(): Promise<GlobLists> {
  return parseGlobsFile(DEFAULT_GLOBS_FILE_PATH);
}

export type GetGlobListsOptions = {
  noDefaults?: boolean | undefined;
  globFile?: string | undefined;
  globs?: string[] | undefined;
};

/**
 * Parses and combines globs from all possible sources.
 */
export async function getGlobLists({ noDefaults, globFile, globs }: GetGlobListsOptions): Promise<GlobLists> {
  const globListsToMerge: GlobLists[] = [];

  if (!noDefaults) {
    const defaultGlobLists = await parseDefaultGlobsFile();
    globListsToMerge.push(defaultGlobLists);
  }

  if (globFile && (await fileExists(globFile))) {
    const userFileGlobLists = await parseGlobsFile(globFile);
    globListsToMerge.push(userFileGlobLists);
  }

  if (globs?.length) {
    const argGlobsLists = processGlobs(globs);
    globListsToMerge.push(argGlobsLists);
  }

  let mergedGlobLists = initGlobLists();

  for (const globLists of globListsToMerge) {
    mergedGlobLists = mergeGlobLists(mergedGlobLists, globLists);
  }

  return mergedGlobLists;
}

export type FindFilesResult = {
  /** File paths that matched the include rules. */
  files: string[];
  /** Non-fatal failures encountered while crawling the directory tree. */
  failures: CleanFailure[];
};

/**
 * Finds all files matching the given glob lists in the given directory.
 *
 * Crawl errors (e.g. permission failures on a subdirectory) are collected as `failures` so the
 * walk can continue and partial results are still returned.
 *
 * @param directory the directory to search in
 * @param globLists the glob lists to match against
 */
export async function findFilesByGlobLists(
  directory: string,
  globLists: GlobLists
): Promise<FindFilesResult> {
  const { included, includedDirs, excluded } = toAbsoluteGlobLists(optimizeGlobLists(globLists), directory);

  const picoOptions = { ignore: excluded };
  const checkDir = includedDirs?.length ? makeGlobMatcher(includedDirs, picoOptions) : (): boolean => false;
  const checkFile = makeGlobMatcher(included, picoOptions);

  const failures: CleanFailure[] = [];
  const onError: CrawlErrorHandler = failure => {
    failures.push(failure);
  };

  let files = await crawlDirWithChecks([], directory, checkDir, checkFile, onError);

  if (excluded.length) {
    // make another pass to ensure that files included by dir globs are
    // matched with excluded globs too
    files = files.filter(file => checkFile(file));
  }

  return { files, failures };
}
