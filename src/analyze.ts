import type { CleanFailure, SharedOptions } from './shared.js';
import { sharedDefaultOptions } from './shared.js';
import {
  findFilesByGlobLists,
  getGlobLists,
  makeGlobMatcher,
  mergeGlobLists,
  optimizeGlobLists,
  parseDefaultGlobsFile,
  toAbsoluteGlobLists,
  toPosixPath,
} from './utils/glob.js';

export type GlobVersions = {
  /** The original glob, as provided by the glob file or user. */
  original: string;
  /** The glob as it was derived by clean-modules and passed to picomatch. */
  derived: string;
};

export type AnalyzedFile = {
  /** The absolute path to the file. */
  filePath: string;
  /** Whether the file was included by clean-modules' default globs. */
  includedByDefault: boolean;
  /** List of globs that included the file. */
  includedByGlobs: GlobVersions[];
};

export type AnalyzeResult = {
  /** Files that would be cleaned up by the corresponding `clean` call. */
  files: AnalyzedFile[];
  /** Non-fatal failures encountered while crawling the directory tree. */
  failures: CleanFailure[];
};

export type AnalyzeOptions = SharedOptions;

/**
 * Helps determining why a file is included by the `clean` operation without removing any files. Extra globs can be passed as positional args.
 * @param options analyze options
 * @returns analyzed files alongside any crawl failures
 */
export async function analyze(options: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const mergedOptions = { ...sharedDefaultOptions, ...options };
  const { globs, noDefaults, globFile, directory } = mergedOptions;
  const nodeModulesPath = directory || sharedDefaultOptions.directory;

  const defaultGlobLists = await parseDefaultGlobsFile();
  const customGlobLists = await getGlobLists({ globs, noDefaults: true, globFile });
  const globLists = noDefaults ? customGlobLists : mergeGlobLists(defaultGlobLists, customGlobLists);

  const { files: includedFiles, failures } = await findFilesByGlobLists(nodeModulesPath, globLists);

  const defaultGlobs = toAbsoluteGlobLists(optimizeGlobLists(defaultGlobLists), nodeModulesPath);
  const includedByDefaultMatcher = makeGlobMatcher(defaultGlobs.included, {
    ignore: defaultGlobs.excluded,
  });

  const globMatchers = globLists.included.map((glob, index) => {
    const absoluteGlob = toPosixPath(nodeModulesPath) + '/' + glob;
    const matcher = makeGlobMatcher(absoluteGlob);
    return { original: globLists.originalIncluded[index], derived: absoluteGlob, matcher };
  });

  const analyzedFiles: AnalyzedFile[] = includedFiles.map(filePath => {
    const includedByDefault = includedByDefaultMatcher(filePath);
    const includedByGlobs: GlobVersions[] = [];

    for (const { original, derived, matcher } of globMatchers) {
      if (matcher(filePath)) {
        includedByGlobs.push({ original: original ?? '', derived });
      }
    }

    return { filePath, includedByDefault, includedByGlobs };
  });

  return { files: analyzedFiles, failures };
}
