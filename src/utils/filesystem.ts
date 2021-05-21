import { Dirent, promises as fsAsync } from 'fs';
import path from 'path';

export type DirentAction = (dirent: Dirent) => void;
export type CheckPathFunc = (nextPath: string) => boolean;

/**
 * Check if a file exists without throwing.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsAsync.stat(filePath);

    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
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
    dirFiles = await fsAsync.readdir(dirPath, { withFileTypes: true });
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
    const files = await fsAsync.readdir(dirPath);
    return files;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
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
        await fsAsync.rmdir(dirPath);
        count++;
      } catch (error) {
        // do nothing
      }

      const parentDir = path.dirname(dirPath);
      count = await removeEmptyDirsUp(checkedDirs, parentDir, count);
    }
  }

  return count;
}

/**
 * Find all files in a directory as fast as possible, without any extra checks or validations.
 */
export async function crawlDirFast(filePaths: string[], dirPath: string): Promise<void> {
  await forEachDirentAsync(dirPath, async dirent => {
    const nextPath = `${dirPath}/${dirent.name}`;

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
    const nextPath = `${dirPath}/${nextPathDirent.name}`;

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
