import { SharedOptions, sharedDefaultOptions } from './shared.js';
import {
  findFilesByGlobLists,
  getGlobLists,
  makeGlobMatcher,
  optimizeGlobLists,
  parseDefaultGlobsFile,
  toAbsoluteGlobLists,
  toPosixPath,
} from './utils/glob.js';

export interface GlobVersions {
  /** The original glob, as provided by the glob file or user. */
  original: string;
  /** The glob as it was derived by clean-modules and passed to picomatch. */
  derived: string;
}

export interface AnalyzeResult {
  /** The absolute path to the file. */
  filePath: string;
  /** Whether the file was included by clean-modules' default globs. */
  includedByDefault: boolean;
  /** List of globs that included the file. */
  includedByGlobs: GlobVersions[];
}

export type AnalyzeOptions = SharedOptions;

/**
 * Helps determining why a file is included by the `clean` operation without removing any files. Extra globs can be passed as positional args.
 * @param options analyze options
 * @returns list of files that were included by the clean operation and what globs they were included by
 */
export async function analyze(options: AnalyzeOptions = {}): Promise<AnalyzeResult[]> {
  const mergedOptions = { ...sharedDefaultOptions, ...options };
  const { globs, noDefaults, globFile, directory } = mergedOptions;
  const nodeModulesPath = directory || sharedDefaultOptions.directory;

  const globLists = await getGlobLists({ globs, noDefaults, globFile });
  const includedFiles = await findFilesByGlobLists(nodeModulesPath, globLists);

  const defaultGlobs = toAbsoluteGlobLists(
    optimizeGlobLists(await parseDefaultGlobsFile()),
    nodeModulesPath
  );

  const includedByDefaultMatcher = makeGlobMatcher(defaultGlobs.included, {
    ignore: defaultGlobs.excluded,
  });

  const globMatchers = globLists.included.map((glob, index) => {
    const absoluteGlob = toPosixPath(nodeModulesPath) + '/' + glob;
    const matcher = makeGlobMatcher(absoluteGlob);
    return { original: globLists.originalIncluded[index], derived: absoluteGlob, matcher };
  });

  const analyzedResults = includedFiles.map(filePath => {
    const includedByDefault = includedByDefaultMatcher(filePath);
    const includedByGlobs: { original: string; derived: string }[] = [];

    globMatchers.forEach(({ original, derived, matcher }) => {
      if (matcher(filePath)) {
        includedByGlobs.push({ original, derived });
      }
    });

    return { filePath, includedByDefault, includedByGlobs };
  });

  return analyzedResults;
}
