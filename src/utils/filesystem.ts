import fs, { Dirent } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type DirentAction = (dirent: Dirent) => void;
export type CheckPathFunc = (nextPath: string) => boolean;

function hasErrorCode(error: any, code: string): boolean {
  return error?.code === code;
}

/**
 * Check if a file exists without throwing.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.stat(filePath);

    return true;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT')) {
      return false;
    }

    throw error;
  }
}

/**
 * Asynchronously loop through each file in a directory, passing the dirents for each file to the provided action.
 */
export async function forEachDirentAsync(dirPath: string, action: DirentAction): Promise<void> {
  let dirFiles: Dirent[] = [];

  try {
    dirFiles = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    // do nothing
  }

  await Promise.all(dirFiles.map(action));
}

/**
 * Get the file paths inside a directory without throwing.
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.promises.readdir(dirPath);
    return files;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) {
      return [];
    }

    throw error;
  }
}

/**
 * Remove empty directories, recursively travelling up in the file until the first non-empty directory is reached.
 */
export async function removeEmptyDirsUp(
  checkedDirs: Set<string>,
  dirPath: string,
  count = 0
): Promise<number> {
  if (!checkedDirs.has(dirPath)) {
    const files = await readDirectory(dirPath);
    const emptyDir = files.length === 0;
    checkedDirs.add(dirPath);

    if (emptyDir) {
      try {
        await fs.promises.rmdir(dirPath);
        // biome-ignore lint/style/noParameterAssign: recursive function
        count++;
      } catch (error) {
        // do nothing
      }

      const parentDir = path.dirname(dirPath);
      // biome-ignore lint/style/noParameterAssign: recursive function
      count = await removeEmptyDirsUp(checkedDirs, parentDir, count);
    }
  }

  return count;
}

/**
 * Deeply removes empty directories for each file path.
 * @param filePaths the file paths to remove empty directories for
 * @returns the number of empty directories removed
 */
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


/**
 * Find all files in a directory as fast as possible, without any extra checks or validations.
 */
export async function crawlDirFast(filePaths: string[], dirPath: string): Promise<void> {
  await forEachDirentAsync(dirPath, async dirent => {
    const nextPath = dirPath + path.sep + dirent.name;

    if (dirent.isDirectory()) {
      await crawlDirFast(filePaths, nextPath);
    } else {
      filePaths.push(nextPath);
    }
  });
}

/**
 * Crawl files and validate them against glob patterns.
 */
export async function crawlDirWithChecks(
  filePaths: string[], // Mutate array to avoid losing speed on spreading
  dirPath: string,
  checkDir: CheckPathFunc,
  checkFile: CheckPathFunc
): Promise<string[]> {
  await forEachDirentAsync(dirPath, async nextPathDirent => {
    const nextPath = dirPath + path.sep + nextPathDirent.name;

    if (nextPathDirent.isDirectory()) {
      if (checkDir(nextPath)) {
        // If a full directory matches, include all of it.
        await crawlDirFast(filePaths, nextPath);
      } else {
        // Keep recursively checking each directory
        await crawlDirWithChecks(filePaths, nextPath, checkDir, checkFile);
      }
    } else if (checkFile(nextPath)) {
      filePaths.push(nextPath);
    }
  });

  return filePaths;
}

export type RemoveFilesOptions = {
  dryRun?: boolean;
}

/**
 * Removes files and returns the total size of the removed files.
 * @param filePaths the file paths to remove
 * @param options dryRun: if true, don't actually remove the files
 * @returns the total size of the removed files
 */
export async function removeFiles(
  filePaths: string[],
  options: RemoveFilesOptions = {}
): Promise<number> {
  let reducedSize = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      try {
        const fileStats = await fs.promises.stat(filePath);

        if (!options.dryRun) {
          await fs.promises.unlink(filePath);
        }

        reducedSize += fileStats.size;
      } catch (error) {
        // do nothing
      }
    })
  );

  return reducedSize;
}

/**
 * Get directory of the file directory, like CommonJS `__dirname`.
 * @example const thisFilesDir = fileDir(import.meta.url);
 */
export function fileDir(importMetaUrl: string) {
  return path.dirname(fileURLToPath(importMetaUrl));
}
