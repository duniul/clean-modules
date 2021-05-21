import path from 'path';
import { findFilesToRemove } from './clean';
import { GlobLists } from './types';
import {
  makeGlobMatcher,
  optimizeGlobLists,
  parseDefaultGlobsFile,
  toAbsoluteGlobLists,
} from './utils/glob';

interface GlobVersions {
  original: string;
  derived: string;
}

interface AnalyzeIncludedResult {
  filePath: string;
  includedByDefault: boolean;
  includedByGlobs: GlobVersions[];
}

export async function analyzeIncluded(
  nodeModulesPath: string,
  globLists: GlobLists
): Promise<AnalyzeIncludedResult[]> {
  const includedFiles = await findFilesToRemove(nodeModulesPath, globLists);
  const defaultGlobs = toAbsoluteGlobLists(
    optimizeGlobLists(await parseDefaultGlobsFile()),
    nodeModulesPath
  );

  const includedByDefaultMatcher = makeGlobMatcher(defaultGlobs.included, {
    ignore: defaultGlobs.excluded,
  });

  const globMatchers = globLists.included.map((glob, index) => {
    const absoluteGlob = path.resolve(nodeModulesPath, glob);
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
