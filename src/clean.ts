import { promises as fsPromise } from 'fs';
import path from 'path';
import { isDefaultDir, isDefaultFile } from './defaultGlobs';
import { CleanResult } from './types';
import { crawlDirWithChecks, removeEmptyDirsUp } from './utils/filesystem';
import { getCustomGlobbers } from './utils/glob';

export async function findFilesToRemove(
  nodeModulesDir: string,
  includedGlobs?: string[],
  excludedGlobs?: string[]
) {
  const { customInclude, customExclude } = getCustomGlobbers(includedGlobs, excludedGlobs);
  const result: CleanResult = { allFiles: [], includedFiles: [], excludedFiles: [] };
  let checkDir = isDefaultDir;
  let checkFile = isDefaultFile;

  if (customInclude) {
    checkDir = (nextPath: string) => customInclude(nextPath) || isDefaultDir(nextPath);
    checkFile = (nextPath: string) => customInclude(nextPath) || isDefaultFile(nextPath);
  }

  result.allFiles = await crawlDirWithChecks([], nodeModulesDir, checkDir, checkFile);

  // Remove excluded matches after crawling to avoid running on every file.
  if (customExclude) {
    result.allFiles.forEach(filePath => {
      if (customExclude(filePath)) {
        result.excludedFiles.push(filePath);
      } else {
        result.includedFiles.push(filePath);
      }
    });
  } else {
    result.includedFiles = result.allFiles;
  }

  return result;
}

export async function removeFiles(filePaths: string[], dryRun: boolean = false) {
  let reducedSize = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      const fileStats = await fsPromise.stat(filePath);
      reducedSize += fileStats.size;

      if (!dryRun) {
        await fsPromise.unlink(filePath);
      }
    })
  );

  return reducedSize;
}

export async function removeEmptyDirs(filePaths: string[]) {
  let removedEmptyDirs = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      const removedParentDirs = await removeEmptyDirsUp(new Set<string>(), path.dirname(filePath));
      removedEmptyDirs += removedParentDirs;
    })
  );

  return removedEmptyDirs;
}