import { promises as fsAsync } from 'fs';
import path from 'path';
import { GlobLists } from './types.js';
import { crawlDirWithChecks, removeEmptyDirsUp } from './utils/filesystem.js';
import { makeGlobMatcher, optimizeGlobLists, toAbsoluteGlobLists } from './utils/glob.js';

export async function findFilesToRemove(
  nodeModulesPath: string,
  globLists: GlobLists
): Promise<string[]> {
  const { included, includedDirs, excluded } = toAbsoluteGlobLists(
    optimizeGlobLists(globLists),
    nodeModulesPath
  );

  const picoOptions = { ignore: excluded };
  const checkDir = includedDirs ? makeGlobMatcher(includedDirs, picoOptions) : () => false;
  const checkFile = makeGlobMatcher(included, picoOptions);

  let filesToRemove = await crawlDirWithChecks([], nodeModulesPath, checkDir, checkFile);

  if (excluded.length) {
    // make another pass to ensure that files included by dir globs are
    // matched with excluded globs too
    filesToRemove = filesToRemove.filter(file => checkFile(file));
  }

  return filesToRemove;
}

export async function removeFiles(
  filePaths: string[],
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<number> {
  let reducedSize = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      try {
        const fileStats = await fsAsync.stat(filePath);

        if (!dryRun) {
          await fsAsync.unlink(filePath);
        }

        reducedSize += fileStats.size;
      } catch (error) {
        // do nothing
      }
    })
  );

  return reducedSize;
}

export async function removeEmptyDirs(filePaths: string[]): Promise<number> {
  let removedEmptyDirs = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      const removedParentDirs = await removeEmptyDirsUp(new Set<string>(), path.dirname(filePath));
      removedEmptyDirs += removedParentDirs;
    })
  );

  return removedEmptyDirs;
}
